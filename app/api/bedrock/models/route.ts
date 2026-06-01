import { NextResponse } from "next/server";
import {
  BEDROCK_IMAGE_MODEL,
  BEDROCK_LLM_MODEL,
  BEDROCK_VIDEO_MODEL,
  getBedrockKeyFromEnv,
} from "@/lib/config";

export const GET = () => {
  if (!getBedrockKeyFromEnv()) {
    return NextResponse.json({ error: "No BEDROCK_API_KEY in env" }, { status: 401 });
  }
  return NextResponse.json({
    models: [BEDROCK_LLM_MODEL, BEDROCK_IMAGE_MODEL, BEDROCK_VIDEO_MODEL],
    llm: BEDROCK_LLM_MODEL,
    image: BEDROCK_IMAGE_MODEL,
    video: BEDROCK_VIDEO_MODEL,
  });
};
