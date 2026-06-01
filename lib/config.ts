export const BUILD = "20260524";

export const BEDROCK_STORAGE = "brit_bedrock_api_key";

export const isBedrockKey = (key: string) =>
  /BedrockAPIKey|^ABSK/i.test(String(key || "").trim());

export const BEDROCK_REGION = "us-east-1";

/** All text + packshot prompts */
export const BEDROCK_LLM_MODEL = "amazon.nova-pro-v1:0";

/** Hero film async invoke */
export const BEDROCK_VIDEO_MODEL = "amazon.nova-reel-v1:1";

/** Packshot images — Stability AI (active; Nova Canvas/Titan are legacy) */
export const BEDROCK_IMAGE_MODEL = "stability.stable-image-ultra-v1:1";
export const BEDROCK_IMAGE_FALLBACK_MODEL = "stability.stable-image-core-v1:1";
/** Try in order — geo IDs route from us-east-1 to us-west-2 when needed */
export const BEDROCK_IMAGE_MODELS = [
  "stability.stable-image-ultra-v1:1",
  "us.stability.stable-image-ultra-v1:1",
  "stability.stable-image-core-v1:1",
  "us.stability.stable-image-core-v1:1",
  "stability.sd3-5-large-v1:0",
] as const;

/** Nova Reel output — hardcoded (verified bucket) */
export const BEDROCK_S3_BUCKET = "brit-gpt";
export const BEDROCK_S3_PREFIX = "brit-videos/";
export const BEDROCK_S3_OUTPUT_URI = `s3://${BEDROCK_S3_BUCKET}/${BEDROCK_S3_PREFIX}`;
export const BEDROCK_S3_PUBLIC_URL = "https://brit-gpt.s3.amazonaws.com";

/** s3://brit-gpt/brit-videos/job-id → https://brit-gpt.s3.amazonaws.com/brit-videos/job-id/ */
export const s3UriToHttps = (uri: string) => {
  if (!uri) return BEDROCK_S3_PUBLIC_URL;
  if (uri.startsWith("http")) return uri;
  if (!uri.startsWith("s3://")) return `${BEDROCK_S3_PUBLIC_URL}/${uri.replace(/^\//, "")}`;
  const path = uri.replace(/^s3:\/\/[^/]+\//, "");
  return `${BEDROCK_S3_PUBLIC_URL}/${path.replace(/\/?$/, "/")}`;
};

export const getBedrockKeyFromEnv = () =>
  process.env.BEDROCK_API_KEY?.trim() ||
  process.env.AWS_BEARER_TOKEN_BEDROCK?.trim() ||
  "";

export const getBedrockS3OutputUri = () =>
  process.env.BEDROCK_S3_OUTPUT_URI?.trim() || BEDROCK_S3_OUTPUT_URI;
