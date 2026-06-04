import { NextRequest, NextResponse } from "next/server";
import {
  buildSceneVeoPrompt,
  generateVeoSceneClip,
  getVeoApiKey,
  isVeoConfigured,
} from "@/lib/veo-video";

export const runtime = "nodejs";
export const maxDuration = 360;

export const GET = async () => {
  return NextResponse.json({
    configured: isVeoConfigured(),
    hasKey: Boolean(getVeoApiKey()),
  });
};

export const POST = async (req: NextRequest) => {
  try {
    if (!isVeoConfigured()) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in server environment (.env)." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const scene = body.scene || {};
    const flavor = body.flavor || "";
    const state = body.state || "";
    const beat = scene.beat ?? body.beat ?? 1;
    const prompt =
      String(body.prompt || "").trim() ||
      buildSceneVeoPrompt(scene, flavor, state);

    if (!prompt) {
      return NextResponse.json({ error: "Empty Veo prompt" }, { status: 400 });
    }

    const cacheKey = `${flavor}|${state}|${beat}|${prompt.slice(0, 120)}`;
    const result = await generateVeoSceneClip(prompt, cacheKey);

    return NextResponse.json({
      videoUrl: result.publicUrl,
      beat,
      model: result.model,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[veo]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
