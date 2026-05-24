import {
  BEDROCK_LLM_MODEL,
  BEDROCK_REGION,
  BEDROCK_VIDEO_MODEL,
  getBedrockKeyFromEnv,
  getBedrockS3OutputUri,
} from "@/lib/config";
import { getBedrockKey } from "@/lib/config-client";
import { buildPackshotDataUrl } from "@/lib/packshot-visual";

const runtimeBase = () =>
  typeof window !== "undefined"
    ? "/api/bedrock"
    : `https://bedrock-runtime.${BEDROCK_REGION}.amazonaws.com`;

const resolveKey = (clientKey?: string) =>
  clientKey?.trim() || getBedrockKey() || getBedrockKeyFromEnv();

export const bedrockFetch = async (
  path: string,
  body?: unknown,
  clientKey?: string,
  method = "POST"
) => {
  const key = resolveKey(clientKey);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (method !== "GET") headers["Content-Type"] = "application/json";
  if (key) {
    headers.Authorization = `Bearer ${key}`;
    headers["X-Bedrock-Api-Key"] = key;
  }

  const res = await fetch(`${runtimeBase()}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data as { message?: string }).message ||
      (data as { error?: { message?: string } }).error?.message ||
      `Bedrock failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
};

const converse = async (
  userPrompt: string,
  systemPrompt: string,
  clientKey?: string
) => {
  const messages = [{ role: "user", content: [{ text: userPrompt }] }];
  const payload: Record<string, unknown> = {
    messages,
    inferenceConfig: { maxTokens: 4096, temperature: 0.65 },
  };
  if (systemPrompt) payload.system = [{ text: systemPrompt }];

  const data = await bedrockFetch(
    `/model/${encodeURIComponent(BEDROCK_LLM_MODEL)}/converse`,
    payload,
    clientKey
  );
  const blocks = (data as { output?: { message?: { content?: { text?: string }[] } } })
    ?.output?.message?.content || [];
  const text = blocks.map((b) => b.text).filter(Boolean).join("\n");
  if (!text) throw new Error("Empty response from Nova Pro");
  return text;
};

export const generateBedrockContent = (
  userPrompt: string,
  systemPrompt = "",
  clientKey?: string
) => converse(userPrompt, systemPrompt, clientKey);

export const generateBedrockJSON = async (
  userPrompt: string,
  systemPrompt: string,
  clientKey?: string
) => {
  const raw = await converse(
    userPrompt + "\n\nRespond with valid JSON only, no markdown fences.",
    systemPrompt,
    clientKey
  );
  const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as Record<string, unknown>;
    throw new Error("Nova Pro did not return parseable JSON");
  }
};

export type PackshotInput = {
  prompt: string;
  title?: string;
  sku?: string;
  lane?: string;
  gradient?: string;
};

/** Packshot: template visual always; Nova Pro SVG used when returned. */
export const generateBedrockImage = async (
  input: PackshotInput | string,
  clientKey?: string
) => {
  const opts =
    typeof input === "string"
      ? { prompt: input }
      : input;
  const fallback = () =>
    buildPackshotDataUrl({
      title: opts.title,
      sku: opts.sku,
      lane: opts.lane,
      gradient: opts.gradient,
    });

  try {
    const raw = await converse(
      `Describe a premium biscuit packshot color palette (2 hex colors, no text) for: ${opts.prompt.slice(0, 400)}`,
      "Reply with only two hex colors separated by comma, e.g. #c45c3e,#8b2e1a",
      clientKey
    );
    const hexes = raw.match(/#[0-9a-fA-F]{3,8}/g);
    if (hexes?.length >= 2) {
      return buildPackshotDataUrl({
        title: opts.title,
        sku: opts.sku,
        lane: opts.lane,
        gradient: hexes[0],
        accent: hexes[1],
      });
    }
  } catch {
    /* use default template */
  }

  return fallback();
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hero film: Nova Reel v1:1 only → S3 */
export const generateBedrockFilm = async (
  prompt: string,
  onProgress?: (t: string) => void,
  clientKey?: string
) => {
  const s3Uri = getBedrockS3OutputUri();

  onProgress?.("Starting amazon.nova-reel-v1:1…");
  const seed = Math.floor(Math.random() * 2147483646);
  const start = (await bedrockFetch(
    "/async-invoke",
    {
      modelId: BEDROCK_VIDEO_MODEL,
      modelInput: {
        taskType: "TEXT_VIDEO",
        textToVideoParams: { text: String(prompt).slice(0, 512) },
        videoGenerationConfig: {
          fps: 24,
          durationSeconds: 6,
          dimension: "1280x720",
          seed,
        },
      },
      outputDataConfig: { s3OutputDataConfig: { s3Uri } },
    },
    clientKey
  )) as { invocationArn?: string };

  const arn = start.invocationArn;
  if (!arn) throw new Error("Nova Reel did not return a job ARN");

  const encodedArn = encodeURIComponent(arn);
  for (let i = 0; i < 60; i++) {
    onProgress?.(`Nova Reel… ${Math.min(92, 10 + i * 3)}%`);
    await sleep(i < 3 ? 5000 : 8000);

    const status = (await bedrockFetch(
      `/async-invoke/${encodedArn}`,
      undefined,
      clientKey,
      "GET"
    )) as {
      status?: string;
      failureMessage?: string;
      outputDataConfig?: { s3OutputDataConfig?: { s3Uri?: string } };
    };

    if (status.status === "Failed") {
      throw new Error(status.failureMessage || "Nova Reel failed");
    }
    if (status.status === "Completed") {
      return status.outputDataConfig?.s3OutputDataConfig?.s3Uri || s3Uri;
    }
  }

  throw new Error("Nova Reel timed out (~8 min)");
};

export const hasBedrockAccess = () => !!resolveKey();
