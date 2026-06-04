import { BRIT_DATA } from "@/lib/data";
import {
  generateBedrockContent,
  generateBedrockJSON,
  hasBedrockAccess,
} from "@/lib/bedrock";
import { checkBedrockConfigured } from "@/lib/api-status";
import { getBedrockKey, hasBedrockKey } from "@/lib/config-client";
import { isLlmLiveEnabled } from "@/lib/llm-mode";
import {
  getConceptCardLlmSystem,
  getConceptCardLlmUserPrompt,
  inferConceptCardVariant,
} from "@/lib/concept-card-prompts";

export type ActionContext = {
  script?: { title?: string; exec?: { h2?: string; p?: string } };
  params?: { region?: string; obj?: string; objective?: string };
  state?: string;
  flavor?: string;
  brandFit?: string;
  instructions?: string;
  completedActions?: string[];
  priorResults?: Array<{
    actionId: string;
    title?: string;
    bullets?: string[];
    recommendations?: string[];
  }>;
};

const ACTION_IDS = [
  "concept_cards",
  "create_film",
  "content_engine",
  "fpd_scout",
  "triangulate_1ds",
] as const;

export const hasLlmKey = () => hasBedrockKey() || hasBedrockAccess();

export const canUseLiveLlm = async () => {
  if (!isLlmLiveEnabled()) return false;
  return checkBedrockConfigured();
};

export const hasLlmKeyAsync = canUseLiveLlm;

export const generateContent = async (
  userPrompt: string,
  systemPrompt = ""
) => {
  return generateBedrockContent(userPrompt, systemPrompt, getBedrockKey());
};

export const generateJSON = async (userPrompt: string, systemPrompt: string) => {
  return generateBedrockJSON(userPrompt, systemPrompt, getBedrockKey());
};

const formatStateFlavors = () =>
  (BRIT_DATA.states || [])
    .map(
      (s) =>
        `${s.state}: sweet [${s.sweet.slice(0, 3).join(", ")}]; savory [${s.savory.slice(0, 3).join(", ")}]`
    )
    .join("\n");

const formatOpportunities = () => {
  const sweet = (BRIT_DATA.sweetOpportunities || [])
    .map((o) => `${o.flavor} (${o.anchor}) — ${o.proof?.slice(0, 80)}`)
    .join("\n");
  const savory = (BRIT_DATA.savoryOpportunities || [])
    .map((o) => `${o.flavor} (${o.anchor}) — ${o.proof?.slice(0, 80)}`)
    .join("\n");
  return `Sweet opportunities:\n${sweet}\n\nSavory opportunities:\n${savory}`;
};

const researchContext = (ctx: ActionContext) => {
  const script = ctx.script || {};
  const params = ctx.params || {};
  const ex = script.exec || {};
  const savoryShares = (BRIT_DATA.favoriteSavoryShares || [])
    .slice(0, 6)
    .map((f) => `${f.flavor} ${f.pct}%`)
    .join(", ");

  return [
    `Research title: ${script.title || "Flavor Insights"}`,
    `Region focus: ${params.region || "Pan-India"}`,
    `Objective: ${params.obj || params.objective || "Product extension"}`,
    `Executive recommendation: ${ex.h2 || ""}`,
    `Detail: ${ex.p || ""}`,
    `Report date: ${BRIT_DATA.meta?.date || "May 2026"} — all timelines must be May 2026 onward; never cite 2023, 2024, or Q4 2023.`,
    `Dataset: ${BRIT_DATA.meta?.totalSample?.toLocaleString("en-IN")} conversations across ${BRIT_DATA.meta?.channels?.length || 9} channels, India, last 12 months.`,
    `Honey Chilli: ${BRIT_DATA.honeyChilli?.convGrowthPct}% conversation growth, ${BRIT_DATA.honeyChilli?.engGrowthPct}% engagement growth.`,
    `Gunpowder Podi: ${BRIT_DATA.gunpowderPodi?.convGrowthPct}% conversation growth, ${BRIT_DATA.gunpowderPodi?.engGrowthPct}% engagement growth.`,
    `Favorite savory shares: ${savoryShares}.`,
    `State flavor profiles (top 3 sweet + savory each):\n${formatStateFlavors()}`,
    formatOpportunities(),
    ctx.completedActions?.length
      ? `Actions already completed this session: ${ctx.completedActions.join(", ")}.`
      : "",
    ctx.priorResults?.length
      ? `Prior action outputs this session:\n${ctx.priorResults
          .map(
            (r) =>
              `- ${r.actionId}: ${r.title || "done"} — ${(r.bullets || []).slice(0, 3).join("; ")}`
          )
          .join("\n")}`
      : "",
    ctx.state ? `Selected state: ${ctx.state}` : "",
    ctx.flavor ? `Selected flavor: ${ctx.flavor}` : "",
    ctx.instructions ? `User instructions: ${ctx.instructions}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const ACTION_OUTPUT_SCHEMA = `Output JSON only with these fields:
- title (max 6 words)
- body (max 2 sentences — must cite specific state names, flavor names, and percentages from the dataset)
- bullets (exactly 5 short findings grounded in Flavor Insights data)
- recommendations (exactly 3 strategic recommendations for the brand/innovation team)
- nextSteps (exactly 2 immediate tasks for this week)
- status ("running" or "queued")
- eta (time estimate only, e.g. "~15 min" or "~2 week field cycle" — never calendar quarters or years before 2026)`;

const STORYBOARD_OUTPUT_SCHEMA = `Output JSON only with these fields:
- title (max 6 words)
- body (max 2 sentences for the 30s ad)
- scenes (exactly 5 objects: beat 1–5, timing e.g. "0–3s", title, shot, vo, onScreen, frameStyle one of retail|macro|lifestyle|product|brand)
- bullets (exactly 5 one-line scene summaries)
- recommendations (exactly 3 creative hooks)
- nextSteps (exactly 2)
- status ("ready")
- eta (e.g. "~6 min")`;

const CREATIVE_BRIEF_OUTPUT_SCHEMA = `Output JSON only with these fields:
- title (max 6 words, include "Creative brief")
- body (max 2 sentences)
- messaging (exactly 5 bullets: tone, hooks, platform copy directions)
- positioning (exactly 5 bullets: shelf story, competitive frame, RTB, portfolio fit)
- recommendations (exactly 3)
- status ("ready")
- eta (e.g. "~5 min")`;

const followUpNote = (ctx: ActionContext) => {
  if (!ctx.completedActions?.length && !ctx.priorResults?.length) return "";
  return [
    "",
    "IMPORTANT: This is a follow-up after prior actions in this session.",
    `Completed: ${(ctx.completedActions || []).join(", ") || "none yet"}.`,
    "Go deeper — add NEW insights from the dataset. Do not repeat generic advice or prior bullets.",
    "Cross-link states, opportunities, and what is still missing from prior outputs.",
  ].join("\n");
};

export const buildHeroFilmPrompt = async (
  ctx: {
    script?: { title?: string; exec?: { h2?: string; p?: string } };
    params?: { region?: string };
  },
  hero: { sku: string; title?: string; lane: string }
) => {
  const script = ctx.script || {};
  const ex = script.exec || {};
  const region = ctx.params?.region || "Pan-India";
  const fallback = [
    `6-second hero shot: packaged ${hero.title || hero.sku} on Indian retail shelf.`,
    `${hero.lane} · ${region}.`,
    ex.h2 || script.title || "",
    "Slow dolly-in, warm lighting, product pack only — no liquid pours or generic food.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 512);

  if (!(await hasLlmKeyAsync())) return fallback;

  try {
    const text = await generateContent(
      [
        researchContext(ctx),
        "",
        `Hero product: ${hero.sku}`,
        `Display name: ${hero.title || hero.sku}`,
        `Lane: ${hero.lane}`,
        "",
        "Write ONE video prompt (max 480 characters) for a 6-second product hero film.",
        "Must show the exact packaged biscuit/snack product on an Indian supermarket shelf.",
        "Do NOT include honey pours, syrup drizzle, liquid close-ups, cooking, or people.",
        "Output only the prompt text — no quotes, labels, or JSON.",
      ].join("\n"),
      "You write precise FMCG product film prompts for Nova Reel. The video must match the named product and research insight."
    );
    const cleaned = text?.trim().replace(/^["']|["']$/g, "") || "";
    return cleaned.length > 40 ? cleaned.slice(0, 512) : fallback;
  } catch {
    return fallback;
  }
};

export const runActionWithLLM = async (
  actionId: string,
  ctx: ActionContext = {}
) => {
  const context = researchContext(ctx);
  const extra = followUpNote(ctx);

  const systems: Record<string, string> = {
    concept_cards: getConceptCardLlmSystem(inferConceptCardVariant(ctx.instructions)),
    fpd_scout: `You are an FMCG field product discovery lead for Britannia India. ${ACTION_OUTPUT_SCHEMA} For FPD, prioritize 2–3 states from the dataset with concrete flavor white-space and field validation plans.`,
    triangulate_1ds: `You are a data triangulation analyst linking social flavor insights to 1DS sales for Britannia India. ${ACTION_OUTPUT_SCHEMA} Link social buzz metrics to sell-out hypotheses by state.`,
    storyboard: `You are a video creative director for Britannia India. ${STORYBOARD_OUTPUT_SCHEMA}`,
    creative_brief: `You are a brand and content strategist for Britannia India. ${CREATIVE_BRIEF_OUTPUT_SCHEMA} Merge messaging and positioning into one agency-ready brief.`,
    positioning: `You are a brand strategist for Britannia India. ${CREATIVE_BRIEF_OUTPUT_SCHEMA}`,
    content_engine: `You are a content strategist for Britannia India. ${CREATIVE_BRIEF_OUTPUT_SCHEMA}`,
  };

  const prompts: Record<string, string> = {
    concept_cards: getConceptCardLlmUserPrompt({
      flavor: ctx.flavor,
      state: ctx.state,
      brandFit: ctx.brandFit,
      params: ctx.params,
      instructions: ctx.instructions,
      researchContext: [context, extra].filter(Boolean).join("\n\n"),
    }),
    content_engine: `Draft a unified creative brief: messaging, tone, hooks, and positioning for the selected flavor-state pair.\n\n${context}${extra}`,
    creative_brief: `Draft messaging and comms recommendations for Britannia ${ctx.flavor || "flavour"} in ${ctx.state || "India"}. Write like an agency brief for Indian consumers — specific taste language, channel hooks (Reels, kirana, tea-time), no empty superlatives.\n\n${context}${extra}`,
    fpd_scout: `Draft an FPD (field product discovery) scout brief. Name specific states, sweet/savory flavors from the dataset, and what field reps should validate in trade.\n\n${context}${extra}`,
    triangulate_1ds: `Draft a 1DS triangulation plan linking social flavor themes to sell-out velocity by state.\n\n${context}${extra}`,
    storyboard: `Draft a 30-second Britannia video ad storyboard for ${ctx.flavor || "the flavour"} in ${ctx.state || "India"}. Scenes must feel like real Indian FMCG advertising — kirana shelf, tea-time table, product crunch — product-forward shots with no visible faces or people in frame. Full scene objects with shot, VO, on-screen text, and timing.\n\n${context}${extra}`,
    positioning: `Draft a unified creative brief (messaging + positioning) for the selected flavor-state pair.\n\n${context}${extra}`,
  };

  return generateJSON(prompts[actionId] || prompts.concept_cards, systems[actionId]);
};

export const generateFollowUpRecommendations = async (ctx: ActionContext) => {
  if (!(await hasLlmKeyAsync())) return null;

  const completed = ctx.completedActions || [];
  const remaining = ACTION_IDS.filter((id) => !completed.includes(id));
  if (remaining.length === 0) return null;

  try {
    const data = await generateJSON(
      [
        researchContext(ctx),
        "",
        `User completed actions: ${completed.join(", ") || "none"}.`,
        `Suggest the best next 2–3 actions from ONLY this list: ${remaining.join(", ")}.`,
        "Prioritize what creates the most downstream value given what's already done.",
        "If they ran FPD scout, suggest triangulation or content engine. If they created concepts, suggest film or FPD.",
      ].join("\n"),
      `Output JSON only:
- intro (1 sentence — why these next steps, grounded in the research)
- suggestions (array of 2–3 objects: actionId must be one of [${remaining.join(", ")}], reason max 20 words, priority 1–3 where 1 is highest)`
    );
    if (!data?.suggestions || !Array.isArray(data.suggestions) || data.suggestions.length === 0) return null;
    return {
      intro: data.intro || "Based on what you've done, here's what to run next.",
      suggestions: data.suggestions.filter((s: any) =>
        remaining.includes(s.actionId)
      ),
      llm: true,
    };
  } catch {
    return null;
  }
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
