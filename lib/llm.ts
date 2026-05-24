import { BRIT_DATA } from "@/lib/data";
import {
  generateBedrockContent,
  generateBedrockJSON,
  hasBedrockAccess,
} from "@/lib/bedrock";
import { checkBedrockConfigured } from "@/lib/api-status";
import { getBedrockKey, hasBedrockKey } from "@/lib/config-client";

export const hasLlmKey = () => hasBedrockKey() || hasBedrockAccess();

export const hasLlmKeyAsync = () => checkBedrockConfigured();

export const generateContent = async (
  userPrompt: string,
  systemPrompt = ""
) => {
  return generateBedrockContent(userPrompt, systemPrompt, getBedrockKey());
};

export const generateJSON = async (userPrompt: string, systemPrompt: string) => {
  return generateBedrockJSON(userPrompt, systemPrompt, getBedrockKey());
};

const researchContext = (ctx: {
  script?: { title?: string; exec?: { h2?: string; p?: string } };
  params?: { region?: string; obj?: string; objective?: string };
}) => {
  const script = ctx.script || {};
  const params = ctx.params || {};
  const ex = script.exec || {};
  return [
    `Research title: ${script.title || "Flavor Insights"}`,
    `Region: ${params.region || "Pan-India"}`,
    `Objective: ${params.obj || params.objective || "Product extension"}`,
    `Recommendation: ${ex.h2 || ""}`,
    `Detail: ${ex.p || ""}`,
    `Dataset: ${BRIT_DATA.meta?.totalSample?.toLocaleString("en-IN")} conversations, India, 12 months.`,
    `Biscoff: ${BRIT_DATA.biscoff?.positivePct}% positive, ${BRIT_DATA.biscoff?.conversations} convos.`,
    `Honey Chilli: ${BRIT_DATA.honeyChilli?.favSharePct}%+ favorite snack share.`,
  ].join("\n");
};

export const runActionWithLLM = async (
  actionId: string,
  ctx: {
    script?: { title?: string; exec?: { h2?: string; p?: string } };
    params?: { region?: string; obj?: string; objective?: string };
  } = {}
) => {
  const context = researchContext(ctx);
  const systems: Record<string, string> = {
    concept_cards:
      "You are a Britannia India innovation strategist. Output JSON: concepts (array of 3: title, sku, lane, tagline, imagePrompt for packshot photo), videoPrompt (string, 6s product film for hero SKU). Ground in Flavor Insights data only.",
    content_engine:
      "You are a content strategist for Britannia. Output JSON only: title (max 6 words), body (max 2 sentences), bullets (exactly 3 short strings, max 12 words each), status ('queued'), eta (string like '~4 min').",
    fpd_scout:
      "You are an FMCG field product discovery lead. Output JSON only: title (max 6 words), body (max 2 sentences), bullets (3 short strings), status ('running'), eta.",
    triangulate_1ds:
      "You are a data triangulation analyst linking social flavor insights to 1DS sales. Output JSON only: title (max 6 words), body (max 2 sentences), bullets (3 short strings), status ('running'), eta.",
  };

  const prompts: Record<string, string> = {
    concept_cards: `Create 3 product concept cards with image prompts and one short film prompt for the hero.\n\n${context}`,
    content_engine: `Draft a content engine handoff from this research run.\n\n${context}`,
    fpd_scout: `Draft an FPD (field product discovery) scout brief.\n\n${context}`,
    triangulate_1ds: `Draft a 1DS triangulation plan.\n\n${context}`,
  };

  return generateJSON(prompts[actionId] || prompts.concept_cards, systems[actionId]);
};

export const enrichQAAnswer = async (
  query: string,
  baseAnswer: { title: string; body: string; bullets?: string[] }
) => {
  if (!(await hasLlmKeyAsync())) return baseAnswer;
  try {
    const text = await generateContent(
      `User question: ${query}\n\nDataset answer (keep facts, improve clarity):\nTitle: ${baseAnswer.title}\n${baseAnswer.body}\n${(baseAnswer.bullets || []).join("\n")}`,
      "Rewrite as a clear analyst reply. Keep all numbers and facts exact. Max 120 words body, max 6 bullets. Plain text only — no JSON."
    );
    if (!text) return baseAnswer;
    return { ...baseAnswer, body: text, llm: true };
  } catch {
    return baseAnswer;
  }
};
