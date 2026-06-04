import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_VEO_MODEL = "veo-3.1-fast-generate-preview";

export const getVeoApiKey = () => process.env.GEMINI_API_KEY?.trim() || "";

export const getVeoModel = () =>
  process.env.GEMINI_VIDEO_MODEL?.trim() || DEFAULT_VEO_MODEL;

export const buildSceneVeoPrompt = (scene: {
  shot?: string;
  title?: string;
  vo?: string;
  onScreen?: string;
}, flavor?: string, state?: string) => {
  const parts = [
    "4-second cinematic FMCG advertisement clip for Britannia India snack brand.",
    scene.shot || scene.title || "Product hero shot on shelf.",
    flavor ? `Flavor: ${flavor}.` : "",
    state ? `Market: ${state}.` : "",
    scene.onScreen ? `On-screen text: ${scene.onScreen}.` : "",
    "Warm retail lighting, shallow depth of field, no human faces or hands in frame, product-forward only.",
    scene.vo ? `Tone: ${scene.vo}` : "",
  ].filter(Boolean);

  return parts.join(" ").slice(0, 480);
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const extractVideoUri = (donePayload: Record<string, unknown>) => {
  const response = donePayload.response as Record<string, unknown> | undefined;
  if (!response) return null;

  const gen = response.generateVideoResponse as Record<string, unknown> | undefined;
  const samples = (gen?.generatedSamples || gen?.generated_samples) as
    | { video?: { uri?: string } }[]
    | undefined;
  if (samples?.[0]?.video?.uri) return samples[0].video.uri;

  const generated = (response.generatedVideos || response.generated_videos) as
    | { video?: { uri?: string } }[]
    | undefined;
  if (generated?.[0]?.video?.uri) return generated[0].video.uri;

  return null;
};

export const startVeoGeneration = async (prompt: string, apiKey: string, model: string) => {
  const res = await fetch(`${GEMINI_BASE}/models/${model}:predictLongRunning`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        aspectRatio: "16:9",
        durationSeconds: 4,
      },
    }),
  });

  const data = (await res.json()) as { name?: string; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(data.error?.message || `Veo start failed (${res.status})`);
  }
  if (!data.name) throw new Error("Veo did not return an operation name");
  return data.name;
};

export const pollVeoOperation = async (
  operationName: string,
  apiKey: string,
  opts?: { onProgress?: (t: string) => void; maxMs?: number }
) => {
  const maxMs = opts?.maxMs ?? 6 * 60 * 1000;
  const deadline = Date.now() + maxMs;
  let polls = 0;

  while (Date.now() < deadline) {
    polls += 1;
    opts?.onProgress?.(`Veo rendering… (${polls * 8}s)`);

    const res = await fetch(`${GEMINI_BASE}/${operationName}`, {
      headers: { "x-goog-api-key": apiKey },
      cache: "no-store",
    });
    const data = (await res.json()) as Record<string, unknown> & {
      done?: boolean;
      error?: { message?: string };
    };

    if (!res.ok) {
      throw new Error(
        (data.error as { message?: string })?.message || `Veo poll failed (${res.status})`
      );
    }

    if (data.error) {
      throw new Error((data.error as { message?: string }).message || "Veo operation failed");
    }

    if (data.done) {
      const uri = extractVideoUri(data);
      if (!uri) throw new Error("Veo finished but no video URI in response");
      return uri;
    }

    await sleep(8000);
  }

  throw new Error("Veo generation timed out (6 min)");
};

export const downloadVeoToPublic = async (
  videoUri: string,
  apiKey: string,
  cacheKey: string
) => {
  const hash = createHash("sha256").update(cacheKey).digest("hex").slice(0, 16);
  const dir = path.join(process.cwd(), "public", "generated", "veo");
  await mkdir(dir, { recursive: true });
  const fileName = `${hash}.mp4`;
  const filePath = path.join(dir, fileName);
  const publicUrl = `/generated/veo/${fileName}`;

  try {
    const { access } = await import("fs/promises");
    await access(filePath);
    return publicUrl;
  } catch {
    /* generate fresh */
  }

  const res = await fetch(videoUri, {
    headers: { "x-goog-api-key": apiKey },
    redirect: "follow",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Veo download failed (${res.status})`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(filePath, buf);
  return publicUrl;
};

export const generateVeoSceneClip = async (
  prompt: string,
  cacheKey: string,
  onProgress?: (t: string) => void
) => {
  const apiKey = getVeoApiKey();
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY — add it to .env for Veo storyboard clips.");
  }

  const model = getVeoModel();
  onProgress?.("Starting Veo…");
  const operationName = await startVeoGeneration(prompt, apiKey, model);
  onProgress?.("Rendering scene with Veo…");
  const videoUri = await pollVeoOperation(operationName, apiKey, { onProgress });
  onProgress?.("Saving clip…");
  const publicUrl = await downloadVeoToPublic(videoUri, apiKey, cacheKey);
  return { publicUrl, videoUri, model };
};

export const isVeoConfigured = () => Boolean(getVeoApiKey());
