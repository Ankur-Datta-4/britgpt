import { generateConceptCards, generateHeroFilm } from "@/lib/create";
import { checkBedrockConfigured } from "@/lib/api-status";
import { runActionWithLLM } from "@/lib/llm";

export const ACTIONS = [
  {
    id: "concept_cards",
    label: "Create",
    sub: "Concept cards",
    icon: "◆",
    primary: true,
  },
  {
    id: "create_film",
    label: "Create film",
    sub: "6s hero · Nova Reel",
    icon: "▶",
    film: true,
  },
  {
    id: "content_engine",
    label: "Shoot to content engine",
    sub: "Scripts & brief (no video)",
    icon: "↗",
  },
  {
    id: "fpd_scout",
    label: "Scout for FPD",
    sub: "Field discovery",
    icon: "◎",
  },
  {
    id: "triangulate_1ds",
    label: "Triangulate with 1DS",
    sub: "Sales + social",
    icon: "△",
  },
] as const;

const fallback: Record<
  string,
  {
    type: string;
    title: string;
    body: string;
    bullets: string[];
    status: string;
    eta: string;
  }
> = {
  content_engine: {
    type: "content_engine",
    title: "Queued for content engine",
    body: "Brief exported from research run.",
    bullets: ["Packshot storyboard", "3× Reels scripts", "Copy from verbatims"],
    status: "queued",
    eta: "~4 min",
  },
  fpd_scout: {
    type: "fpd_scout",
    title: "FPD scout initiated",
    body: "Scanning trade signals for flavor white-space.",
    bullets: ["SKU adjacency", "Pack audit", "Field rep brief"],
    status: "running",
    eta: "~8 min",
  },
  triangulate_1ds: {
    type: "triangulate_1ds",
    title: "1DS triangulation started",
    body: "Linking social flavor themes with sell-out.",
    bullets: ["State overlay", "Buzz vs velocity", "Confidence uplift"],
    status: "running",
    eta: "~2 min",
  },
};

const runWithLlm = async (
  actionId: string,
  ctx: {
    script?: { title?: string };
    params?: { region?: string };
  }
) => {
  const base = {
    ...fallback[actionId],
    body: `${fallback[actionId].body} (${ctx.script?.title || "research"} · ${ctx.params?.region || "Pan-India"}).`,
  };
    const ready = await checkBedrockConfigured();
    if (!ready) {
      return { ...base, message: "Preview brief — add Bedrock API key in .env.local or Settings." };
    }
    try {
    const data = await runActionWithLLM(actionId, ctx);
    return { type: actionId, ...data, llm: true };
  } catch (err) {
    return {
      ...base,
      error: err instanceof Error ? err.message : String(err),
      message: "LLM unavailable — showing preview brief.",
    };
  }
};

export const runAction = async (
  actionId: string,
  ctx: {
    script?: { title?: string; id?: string; exec?: { h2?: string; p?: string }; scopeDefaults?: { region?: string } };
    params?: { region?: string };
  } = {},
  onProgress?: (t: string) => void
) => {
  if (actionId === "concept_cards") {
    return {
      type: "concept_cards",
      ...(await generateConceptCards(ctx, onProgress)),
    };
  }
  if (actionId === "create_film") {
    return generateHeroFilm(ctx, onProgress);
  }
  if (actionId === "content_engine") return runWithLlm("content_engine", ctx);
  if (actionId === "fpd_scout") return runWithLlm("fpd_scout", ctx);
  if (actionId === "triangulate_1ds") return runWithLlm("triangulate_1ds", ctx);
  throw new Error(`Unknown action: ${actionId}`);
};
