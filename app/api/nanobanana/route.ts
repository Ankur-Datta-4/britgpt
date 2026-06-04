import { NextResponse } from "next/server";
import {
  getGeminiConceptCardPreamble,
  type ConceptPromptVariant,
} from "@/lib/concept-card-prompts";

export const runtime = "nodejs";

const DEFAULT_MODEL_ID = "gemini-3.1-flash-image";
const GENERATE_CONTENT_API = "streamGenerateContent";

const parseGeminiResponse = (raw: string) => {
  const text = raw.trim();
  if (!text) return [];

  if (text.startsWith("data:")) {
    return text
      .split(/\n\n+/)
      .map((chunk) =>
        chunk
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.replace(/^data:\s*/, ""))
          .join("")
      )
      .filter((chunk) => chunk && chunk !== "[DONE]")
      .map((chunk) => JSON.parse(chunk));
  }

  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
};

const collectParts = (responses: any[]) =>
  responses.flatMap((item) =>
    (item?.candidates || []).flatMap((candidate: any) => candidate?.content?.parts || [])
  );

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = String(body.prompt || "").trim();
    const mode = body.mode === "concept_card" ? "concept_card" : "packshot";
    const variant = (body.variant === "vernacular" ? "vernacular" : "english") as ConceptPromptVariant;
    const variationId = crypto.randomUUID();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const modelId = process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL_ID;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelId
    )}:${GENERATE_CONTENT_API}?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  mode === "concept_card"
                    ? getGeminiConceptCardPreamble(variant)
                    : [
                        "Create a premium FMCG product packshot for Britannia India (16:9).",
                        "Product pack and props only — no people, no human faces, no hands, no models.",
                      ].join(" "),
                  "Use the supplied brief exactly. Avoid generic snack imagery.",
                  `Creative variation id: ${variationId}. Use this only to choose a fresh composition; do not render it as text.`,
                  prompt || "Create an image of a Britannia snack pack concept.",
                ].join("\n\n"),
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          thinkingConfig: { thinkingLevel: "MINIMAL" },
          imageConfig: {
            aspectRatio: body.aspectRatio || "16:9",
            imageSize: "1K",
          },
        },
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: raw || `Google image API failed with ${res.status}` },
        { status: res.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    const responses = parseGeminiResponse(raw);
    const parts = collectParts(responses);
    const imagePart = parts.find((part: any) => part?.inlineData?.data || part?.inline_data?.data);
    const textParts = parts
      .map((part: any) => part?.text)
      .filter(Boolean)
      .join("\n");

    const inlineData = imagePart?.inlineData || imagePart?.inline_data;
    if (!inlineData?.data) {
      return NextResponse.json(
        { error: "No image returned from Google image API", text: textParts },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const mimeType = inlineData.mimeType || inlineData.mime_type || "image/png";
    return NextResponse.json(
      {
        data: [{ url: `data:${mimeType};base64,${inlineData.data}` }],
        text: textParts,
        model: modelId,
        provider: "google-ai-studio",
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
