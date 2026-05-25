import {
  BEDROCK_IMAGE_FALLBACK_MODEL,
  BEDROCK_IMAGE_MODEL,
  BEDROCK_IMAGE_MODELS,
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
  if (!text) throw new Error("Empty response from language model");
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
    throw new Error("Could not parse model response");
  }
};

export type PackshotInput = {
  prompt: string;
  title?: string;
  sku?: string;
  lane?: string;
  gradient?: string;
};

/** Packshot: Stability Ultra → Core → SD3.5 → styled template. */
const isStabilityImageModel = (modelId: string) =>
  modelId.startsWith("stability.") || modelId.startsWith("us.stability.");

const invokeImageModel = async (
  modelId: string,
  prompt: string,
  clientKey?: string
) => {
  const trimmed = String(prompt).slice(0, 4000);
  const body = isStabilityImageModel(modelId)
    ? {
        prompt: trimmed,
        aspect_ratio: "1:1",
        output_format: "png",
        mode: "text-to-image",
        negative_prompt:
          "text, logos, watermark, blurry, honey pour, syrup, liquid drizzle, generic food, people, hands",
      }
    : {
        taskType: "TEXT_IMAGE",
        textToImageParams: { text: trimmed.slice(0, 1024) },
        imageGenerationConfig: {
          seed: Math.floor(Math.random() * 858993459),
          quality: "standard",
          width: 1024,
          height: 1024,
          numberOfImages: 1,
        },
      };

  const data = (await bedrockFetch(
    `/model/${encodeURIComponent(modelId)}/invoke`,
    body,
    clientKey
  )) as { images?: string[]; error?: string };

  const b64 = data.images?.[0];
  if (b64) return `data:image/png;base64,${b64}`;
  if (data.error) throw new Error(data.error);
  throw new Error("No image returned");
};

export const generateBedrockImage = async (
  input: PackshotInput | string,
  clientKey?: string
): Promise<{ uri: string; generated: boolean }> => {
  const opts = typeof input === "string" ? { prompt: input } : input;
  const fallback = () =>
    buildPackshotDataUrl({
      title: opts.title,
      sku: opts.sku,
      lane: opts.lane,
      gradient: opts.gradient,
    });

  const prompt =
    opts.prompt ||
    `Professional FMCG biscuit packshot on white studio backdrop, ${opts.sku || opts.title || "product"}, premium Indian snack packaging, appetizing, no readable text`;

  const models = [...BEDROCK_IMAGE_MODELS];
  if (!models.includes(BEDROCK_IMAGE_MODEL as (typeof BEDROCK_IMAGE_MODELS)[number])) {
    models.unshift(BEDROCK_IMAGE_MODEL);
  }
  if (
    BEDROCK_IMAGE_FALLBACK_MODEL &&
    !models.includes(BEDROCK_IMAGE_FALLBACK_MODEL as (typeof BEDROCK_IMAGE_MODELS)[number])
  ) {
    models.push(BEDROCK_IMAGE_FALLBACK_MODEL);
  }

  let lastError: unknown;
  for (const modelId of [...new Set(models)]) {
    try {
      const uri = await invokeImageModel(modelId, prompt, clientKey);
      return { uri, generated: true };
    } catch (e) {
      lastError = e;
    }
  }

  console.warn("All image models failed, using template:", lastError);

  try {
    const raw = await converse(
      `Describe a premium biscuit packshot color palette (2 hex colors, no text) for: ${prompt.slice(0, 400)}`,
      "Reply with only two hex colors separated by comma, e.g. #c45c3e,#8b2e1a",
      clientKey
    );
    const hexes = raw.match(/#[0-9a-fA-F]{3,8}/g);
    if (hexes?.length >= 2) {
      return {
        uri: buildPackshotDataUrl({
          title: opts.title,
          sku: opts.sku,
          lane: opts.lane,
          gradient: hexes[0],
          accent: hexes[1],
        }),
        generated: false,
      };
    }
  } catch {
    /* template fallback */
  }

  return { uri: fallback(), generated: false };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hero film: Nova Reel v1:1 only → S3 */
export const generateBedrockFilm = async (
  prompt: string,
  onProgress?: (t: string) => void,
  clientKey?: string
) => {
  const s3Uri = getBedrockS3OutputUri();

  onProgress?.("Creating hero film…");
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
  if (!arn) throw new Error("Video job did not start");

  const encodedArn = encodeURIComponent(arn);
  for (let i = 0; i < 60; i++) {
    onProgress?.(`Rendering film… ${Math.min(92, 10 + i * 3)}%`);
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
      throw new Error(status.failureMessage || "Video generation failed");
    }
    if (status.status === "Completed") {
      return status.outputDataConfig?.s3OutputDataConfig?.s3Uri || s3Uri;
    }
  }

  throw new Error("Video generation timed out (~8 min)");
};

export const hasBedrockAccess = () => !!resolveKey();
