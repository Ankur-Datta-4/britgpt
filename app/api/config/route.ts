import { NextResponse } from "next/server";
import { getMediaCapabilities } from "@/lib/bedrock-capabilities";

export const GET = () => {
  const caps = getMediaCapabilities();
  return NextResponse.json({
    bedrockConfigured: caps.bedrockConfigured,
    s3Configured: caps.s3Configured,
    s3OutputUri: caps.s3OutputUri,
    s3PublicUrl: caps.s3PublicUrl,
    llmModel: caps.llmModel,
    imageModel: caps.imageModel,
    videoModel: caps.videoModel,
    canGenerateImages: caps.canGenerateImages,
    canGenerateVideo: caps.canGenerateVideo,
    s3SignedAccess: caps.s3SignedAccess,
  });
};
