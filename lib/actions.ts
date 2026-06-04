import { BRIT_DATA } from "@/lib/data";
import {
  generateConceptCards,
  generateHeroFilm,
  buildStoryboardScenes,
  buildStoryboardFilmPreview,
  buildMessagingCards,
} from "@/lib/create";
import { checkBedrockConfigured } from "@/lib/api-status";
import { isLlmLiveEnabled } from "@/lib/llm-mode";
import { runActionWithLLM, type ActionContext } from "@/lib/llm";

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
    sub: "6s hero film",
    icon: "▶",
    film: true,
  },
  {
    id: "content_engine",
    label: "Campaign messaging",
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

const maharashtra = BRIT_DATA.states?.find((s) => s.state === "Maharashtra");
const delhi = BRIT_DATA.states?.find((s) => s.state === "Delhi NCR");

const fallback: Record<
  string,
  {
    type: string;
    title: string;
    body: string;
    bullets: string[];
    scenes?: Array<{ beat: number; timing: string; title: string; shot: string; vo: string; onScreen: string; frameStyle: string; }>;
    messaging?: string[];
    positioning?: string[];
    recommendations: string[];
    nextSteps: string[];
    status: string;
    eta: string;
  }
> = {
  content_engine: {
    type: "content_engine",
    title: "Campaign messaging pack",
    body: "Turning Honey Chilli and Gunpowder Podi angles into shoot-ready scripts from 1.53L India conversations.",
    bullets: [
      "Hero: Honey Chilli — 48.7% conversation growth nationally",
      "South anchor: Gunpowder Podi — 46.2% growth in TN, Karnataka, AP, Telangana",
      "State reels: Maharashtra Schezwan + Delhi NCR Honey Chilli street-food cues",
      "Sweet opps: Mishti Doi Caramel (Bengal), Nolen Gur Toffee (East), Tamarind (South)",
      "Packshot storyboard: 3 hero flavors tied to exec recommendation",
    ],
    recommendations: [
      "Lead with Honey Chilli sweet-heat for national snack content",
      "Run Gunpowder Podi reels for South India with podi authenticity cues",
      "Localize copy with Maharashtra Thecha and Delhi chaat verbatims",
    ],
    nextSteps: [
      "Approve 3× Reels scripts and packshot storyboard",
      "Share scripts with your creative team with region tags",
    ],
    status: "queued",
    eta: "~4 min export",
  },
  fpd_scout: {
    type: "fpd_scout",
    title: "FPD scout brief",
    body: `Field discovery plan grounded in Flavor Insights (${BRIT_DATA.meta?.date}). Prioritize Maharashtra and Delhi, then expand to South podi cluster.`,
    bullets: [
      `Maharashtra sweet: ${maharashtra?.sweet.slice(0, 2).join(", ")} · savory: ${maharashtra?.savory.slice(0, 2).join(", ")}`,
      `Delhi NCR savory top-5 includes Honey Chilli — validate NCR sweet-heat pack tests`,
      "Gunpowder Podi cluster (APT, Karnataka, Tamil Nadu): layered spice beyond masala",
      "Thecha (Maharashtra): 55% global spice interest — scout modern snack adjacency",
      "Field brief: pack audit + trade interviews in 2 states, May–Jun 2026",
    ],
    recommendations: [
      "Start Maharashtra + Delhi — highest flavor contrast in dataset",
      "Validate Honey Chilli platform in Delhi NCR trade before national scale",
      "Map Thecha heat cues to Britannia savory innovation opportunities",
    ],
    nextSteps: [
      "Issue field rep brief with state flavor cheat-sheet",
      "Schedule 12-store pack audit in Maharashtra and Delhi",
    ],
    status: "running",
    eta: "~12 min brief · ~2 week field cycle",
  },
  storyboard: {
    type: "storyboard",
    title: "Video ad storyboard",
    body: "30-second scene-by-scene storyboard for the selected flavor-state pair.",
    bullets: [],
    scenes: [
      {
        beat: 1,
        timing: "0–3s",
        title: "Hero shelf",
        shot: "Slow push-in on pack at eye level in a bright kirana shelf",
        vo: "When the craving hits…",
        onScreen: "Kaju Katli",
        frameStyle: "retail",
      },
      {
        beat: 2,
        timing: "3–8s",
        title: "Ingredient cue",
        shot: "Macro chilli flakes and honey glaze on biscuit surface",
        vo: "…you want layers, not just heat.",
        onScreen: "Sweet · heat · crunch",
        frameStyle: "macro",
      },
      {
        beat: 3,
        timing: "8–18s",
        title: "Snacking moment",
        shot: "Friends sharing biscuits at tea-time, natural laughter",
        vo: "The kind of flavour everyone reaches for again.",
        onScreen: "",
        frameStyle: "lifestyle",
      },
      {
        beat: 4,
        timing: "18–24s",
        title: "Product crunch",
        shot: "Close-up bite with audible crunch emphasis",
        vo: "",
        onScreen: "Try the crunch",
        frameStyle: "product",
      },
      {
        beat: 5,
        timing: "24–30s",
        title: "Brand lock-up",
        shot: "Pack hero on warm background with Britannia end frame",
        vo: "Britannia. Taste the buzz.",
        onScreen: "New · in stores",
        frameStyle: "brand",
      },
    ],
    recommendations: [
      "Lead with sweet-heat crunch for urban audiences",
      "Use regional visual cues from the selected state",
      "End with Britannia brand lock-up",
    ],
    nextSteps: ["Approve storyboard", "Route to Hogarth for asset production"],
    status: "ready",
    eta: "~6 min",
  },
  creative_brief: {
    type: "creative_brief",
    title: "Creative brief",
    body: "Unified messaging and positioning for agency-ready production.",
    messaging: [
      "Tone: warm, confident, everyday premium — not health-coded",
      "Hero hook: sweet-heat crunch that feels familiar, not experimental",
      "Reels / Shorts: 15s taste reaction + pack reveal; regional language supers where relevant",
      "Amazon / Flipkart PDP: lead with ingredient callouts and chai-time occasion",
      "Festive stretch: giftable multi-pack with state-localized flavor story",
    ],
    positioning: [
      "Primary frame: regional authenticity in a modern snack format",
      "Secondary: Britannia trust, distribution, and everyday premium",
      "Shelf story: place beside chai biscuits, not dessert aisle",
      "Competitive frame: Indo-Chinese snacks without generic “fusion” language",
      "RTB: named ingredients and double-roast / layered spice depth",
    ],
    bullets: [],
    recommendations: [
      "Single master brief for Hogarth asset production",
      "Lock messaging territory before visual exploration",
      "Pilot in 2 metros before national rollout",
    ],
    nextSteps: ["Sign off brief", "Route to Hogarth for asset production"],
    status: "ready",
    eta: "~5 min",
  },
  positioning: {
    type: "positioning",
    title: "Positioning recommendations",
    body: "Shelf story and competitive frame for the flavor-state launch.",
    bullets: [
      "Primary frame: regional authenticity + modern format",
      "Secondary: Britannia trust and distribution",
      "Avoid generic South/North labeling",
      "Anchor RTB to named ingredients",
      "Pack architecture: premium cue without health claims",
    ],
    recommendations: [
      "Position as regional hero flavor platform",
      "Bundle with existing 50-50 or NutriChoice line",
      "Trial packs for metro lead markets",
    ],
    nextSteps: ["Sign off positioning territory", "Brief design team"],
    status: "ready",
    eta: "~4 min",
  },
  triangulate_1ds: {
    type: "triangulate_1ds",
    title: "1DS triangulation",
    body: "Linking social flavor themes from 1.53L conversations to 1DS sell-out velocity by state.",
    bullets: [
      "Overlay Honey Chilli (48.7% conv. growth) and Gunpowder Podi (46.2%) vs regional sell-out",
      "Maharashtra: Thecha + Schezwan buzz vs savory velocity",
      "Delhi NCR: Honey Chilli in savory top-5 vs Indo-Chinese snack sell-through",
      "South podi cluster: Gunpowder Podi social heat in AP, Karnataka, TN, Telangana",
      "Confidence uplift: cross-check Mishti Doi / Nolen Gur East sentiment with dessert sell-through",
    ],
    recommendations: [
      "Prioritize Honey Chilli states where social buzz leads sell-out",
      "Flag Maharashtra Thecha as innovation signal if velocity lags buzz",
      "Use regional sweet sentiment to validate premium East India price architecture",
    ],
    nextSteps: [
      "Pull 1DS state-level sell-out for top 5 savory flavors",
      "Build buzz-vs-velocity matrix for exec readout",
    ],
    status: "running",
    eta: "~2 min overlay",
  },
};

const withDeliverableContext = (
  actionId: string,
  ctx: ActionContext,
  data: any
) => {
  const flavor = ctx.flavor || "Honey Chilli";
  const state = ctx.state || ctx.params?.region || "Pan-India";
  const base = { ...data, flavor, state };

  if (actionId === "storyboard") {
    if (!base.scenes?.length) {
      base.scenes = buildStoryboardScenes({ flavor, state });
    }
    base.title = base.title || `Video ad storyboard · ${flavor}`;
    base.body =
      base.body ||
      `30-second Britannia spot for ${flavor} in ${state} — grounded in regional snack occasions and pack-forward framing.`;
    base.bullets =
      base.bullets?.length > 0
        ? base.bullets
        : base.scenes.map((s) => `Scene ${s.beat}: ${s.title} — ${s.timing}`);
  }

  if (actionId === "creative_brief" || actionId === "content_engine" || actionId === "positioning") {
    const cards = buildMessagingCards({ flavor, state, brandFit: ctx.brandFit });
    if (!base.messagingCards?.length) {
      base.messagingCards = cards;
    }
    if (!base.messaging?.length) {
      base.messaging = cards.map((c) => `${c.headline} — ${c.body}`);
    }
    if (!base.positioning?.length) {
      base.positioning = fallback.creative_brief.positioning;
    }
    base.title = base.title || `Messaging · ${flavor} · ${state}`;
    base.body =
      base.body ||
      `Comms recommendations for launching ${flavor} in ${state} — tone, hooks, and shelf story for Britannia stakeholders.`;
  }

  return base;
};

const runWithLlm = async (
  actionId: string,
  ctx: ActionContext,
  onProgress?: (t: string) => void
) => {
  const fb = fallback[actionId] || fallback.creative_brief;
  const base = {
    ...fb,
    body: `${fb.body} (${ctx.script?.title || "research"} · ${ctx.params?.region || "Pan-India"}).`,
  };
  if (!isLlmLiveEnabled()) {
    return withDeliverableContext(actionId, ctx, {
      type: actionId,
      ...base,
      message: "Demo brief from Flavor Insights dataset.",
    });
  }

  const ready = await checkBedrockConfigured();
  if (!ready) {
    return withDeliverableContext(actionId, ctx, {
      ...base,
      message: "Preview brief — add your API key in settings to enrich.",
    });
  }

  onProgress?.("Reading Flavor Insights dataset…");
  try {
    onProgress?.("Drafting brief…");
    const data = await runActionWithLLM(actionId, ctx);
    onProgress?.("Finalising recommendations…");
    return withDeliverableContext(actionId, ctx, {
      type: actionId,
      ...data,
      llm: true,
      message: ctx.completedActions?.length
        ? "Follow-up brief — grounded in prior actions and live dataset."
        : "Live brief from Flavor Insights India.",
    });
  } catch (err) {
    return withDeliverableContext(actionId, ctx, {
      ...base,
      error: err instanceof Error ? err.message : String(err),
      message: "LLM unavailable — showing dataset-grounded preview.",
    });
  }
};

export const runAction = async (
  actionId: string,
  ctx: ActionContext & {
    script?: {
      title?: string;
      id?: string;
      exec?: { h2?: string; p?: string };
      scopeDefaults?: { region?: string };
    };
    params?: { region?: string };
  } = {},
  onProgress?: (t: string) => void
) => {
  if (actionId === "concept_cards") {
    return {
      type: "concept_cards",
      flavor: ctx.flavor,
      state: ctx.state || ctx.params?.region,
      ...(await generateConceptCards(ctx, onProgress)),
    };
  }
  if (actionId === "create_film") {
    return generateHeroFilm(ctx, onProgress);
  }
  if (actionId === "content_engine") return runWithLlm("creative_brief", ctx, onProgress);
  if (actionId === "storyboard") {
    const result = await runWithLlm("storyboard", ctx, onProgress);
    onProgress?.("Preparing hero spot preview…");
    const film = await buildStoryboardFilmPreview(ctx);
    return withDeliverableContext(actionId, ctx, {
      type: "storyboard",
      ...result,
      ...film,
      message:
        result.message ||
        "Storyboard ready — scene clips generate with Google Veo when GEMINI_API_KEY is set (about 2–4 min per scene).",
    });
  }
  if (actionId === "positioning") return runWithLlm("creative_brief", ctx, onProgress);
  if (actionId === "creative_brief") return runWithLlm("creative_brief", ctx, onProgress);
  if (actionId === "fpd_scout") return runWithLlm("fpd_scout", ctx, onProgress);
  if (actionId === "triangulate_1ds") return runWithLlm("triangulate_1ds", ctx, onProgress);
  throw new Error(`Unknown action: ${actionId}`);
};
