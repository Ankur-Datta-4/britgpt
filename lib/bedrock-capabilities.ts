import {
  BEDROCK_LLM_MODEL,
  BEDROCK_S3_OUTPUT_URI,
  BEDROCK_S3_PUBLIC_URL,
  BEDROCK_VIDEO_MODEL,
  getBedrockKeyFromEnv,
} from "@/lib/config";

export type MediaCapabilities = {
  bedrockConfigured: boolean;
  s3Configured: boolean;
  s3OutputUri: string | null;
  s3PublicUrl: string;
  llmModel: string;
  videoModel: string;
  canGenerateImages: boolean;
  canGenerateVideo: boolean;
  s3SignedAccess: boolean;
};

export const getMediaCapabilities = (): MediaCapabilities => {
  const bedrockConfigured = !!getBedrockKeyFromEnv();
  const s3SignedAccess = !!(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
    process.env.AWS_SECRET_ACCESS_KEY?.trim()
  );

  return {
    bedrockConfigured,
    s3Configured: true,
    s3OutputUri: BEDROCK_S3_OUTPUT_URI,
    s3PublicUrl: BEDROCK_S3_PUBLIC_URL,
    llmModel: BEDROCK_LLM_MODEL,
    videoModel: BEDROCK_VIDEO_MODEL,
    canGenerateImages: bedrockConfigured,
    canGenerateVideo: bedrockConfigured,
    s3SignedAccess,
  };
};
