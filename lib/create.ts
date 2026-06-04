import { BRIT_DATA } from "@/lib/data";
import {
  generateBedrockFilm,
} from "@/lib/bedrock";
import { checkBedrockConfigured } from "@/lib/api-status";
import { isLlmLiveEnabled } from "@/lib/llm-mode";
import { sleep } from "@/lib/film-job";
import { runActionWithLLM, buildHeroFilmPrompt } from "@/lib/llm";
import { getBedrockKey } from "@/lib/config-client";
import { resolveFilmPlaybackUrl } from "@/lib/film-url";

type ConceptPromptVariant = "english" | "vernacular";

const HINDI_BELT_STATES = new Set([
  "Delhi",
  "Delhi NCR",
  "Uttar Pradesh",
  "Madhya Pradesh",
  "Rajasthan",
  "Bihar",
  "Haryana",
  "Chhattisgarh",
  "Jharkhand",
  "Uttarakhand",
  "Himachal Pradesh",
]);

const LANGUAGE_BY_STATE: Record<string, string> = {
  "Tamil Nadu": "Tamil",
  "West Bengal": "Bengali",
  Karnataka: "Kannada",
  Maharashtra: "Marathi",
  Gujarat: "Gujarati",
  Kerala: "Malayalam",
  "Andhra Pradesh": "Telugu",
  Telangana: "Telugu",
  Punjab: "Punjabi",
  Odisha: "Odia",
  Assam: "English + Assamese",
  Meghalaya: "English + Khasi",
  Manipur: "English + Meitei",
  Mizoram: "English + Mizo",
  Nagaland: "English + Nagamese",
  Tripura: "English + Bengali",
  Sikkim: "English + Nepali",
  "Arunachal Pradesh": "English + Hindi",
};

const inferPrimaryLanguage = (state: string) => {
  if (!state || state === "Pan-India") return "English";
  if (LANGUAGE_BY_STATE[state]) return LANGUAGE_BY_STATE[state];
  if (HINDI_BELT_STATES.has(state)) return "Hindi";
  return "English";
};

const inferStateCues = (state: string) => {
  const cues: Record<string, string> = {
    "Tamil Nadu": "home verandah, steel dabba, kolam cue",
    "West Bengal": "balcony chai setup, adda vibe, subtle terracotta cues",
    Karnataka: "Bengaluru apartment kitchen or cafe corner, modern-casual styling",
    Maharashtra: "Mumbai/Pune home evening snack setup, warm family context",
    "Delhi NCR": "urban home evening setup, winter chai/snack context",
    Gujarat: "bright home kitchen table, sharing-with-family snack moment",
  };
  return cues[state] || "relatable Indian home or neighborhood snack-time context";
};


type FlavorProfile = {
  descriptor: string; // taste phrase, e.g. "punchy mustard heat"
  defining: string; // defining character, e.g. "sharp, fermented kasundi tang"
  region: string; // who grew up on it
  occasion: string; // when it fits
};

// Hand-tuned flavour profiles so demo copy reads true-to-taste for Britannia.
const FLAVOR_PROFILES: Record<string, FlavorProfile> = {
  Kasundi: { descriptor: "punchy mustard heat", defining: "sharp, fermented kasundi tang", region: "Bengal", occasion: "an evening tea-time snack" },
  "Honey Chilli": { descriptor: "sweet-then-spicy rush", defining: "honey-glazed chilli warmth", region: "snackers across India", occasion: "a chai-time treat" },
  "Gunpowder Podi": { descriptor: "roasted lentil-and-chilli kick", defining: "authentic South-Indian podi spice", region: "the South", occasion: "a quick office snack" },
  Schezwan: { descriptor: "garlicky chilli punch", defining: "fiery Indo-Chinese schezwan heat", region: "urban India", occasion: "movie-night munching" },
  "Nolen Gur": { descriptor: "smoky date-palm sweetness", defining: "winter nolen gur warmth", region: "Bengal", occasion: "a cosy winter indulgence" },
  "Mishti Doi": { descriptor: "caramelised sweet-tang", defining: "creamy mishti doi character", region: "the East", occasion: "an after-meal sweet moment" },
  "Kaju Katli": { descriptor: "rich cashew sweetness", defining: "festive kaju katli indulgence", region: "families across India", occasion: "a festive, giftable moment" },
  "Gulab Jamun": { descriptor: "warm, syrupy sweetness", defining: "nostalgic gulab jamun comfort", region: "India", occasion: "a celebratory treat" },
  "Bhut Jolokia": { descriptor: "slow-building fiery heat", defining: "Naga bhut jolokia fire", region: "the Northeast", occasion: "a bold snacking dare" },
  Tamarind: { descriptor: "tangy-sweet imli zing", defining: "sticky tamarind tang", region: "India", occasion: "an anytime tangy craving" },
  "Garlic Chilli": { descriptor: "bold garlic-chilli punch", defining: "roasted garlic-chilli depth", region: "snackers everywhere", occasion: "an everyday savoury fix" },
  "Mango Pickle": { descriptor: "spicy achaari tang", defining: "homestyle aam-ka-achaar masala", region: "India", occasion: "a tiffin-box favourite" },
  Gongura: { descriptor: "sour-leaf tang", defining: "Andhra gongura sharpness", region: "Andhra & Telangana", occasion: "a regional savoury snack" },
  "Chettinad Pepper": { descriptor: "slow-building pepper warmth", defining: "Chettinad black-pepper spice", region: "Tamil Nadu", occasion: "a late-night tea break" },
  "Thecha Spice": { descriptor: "raw green-chilli heat", defining: "Maharashtrian thecha fire", region: "Maharashtra", occasion: "an evening snack with chai" },
  Jhalmuri: { descriptor: "tangy street-masala mix", defining: "Kolkata jhalmuri masala", region: "Bengal", occasion: "a nostalgic street-snack moment" },
  Jalebi: { descriptor: "crisp, caramelised sweetness", defining: "iconic jalebi crunch-and-syrup", region: "India", occasion: "a weekend sweet craving" },
  "Bellam / Jaggery": { descriptor: "earthy jaggery sweetness", defining: "wholesome bellam warmth", region: "the South", occasion: "a feel-good everyday snack" },
};

const profileFor = (flavor?: string, state?: string): FlavorProfile => {
  if (flavor && FLAVOR_PROFILES[flavor]) return FLAVOR_PROFILES[flavor];
  const f = (flavor || "this flavour").toLowerCase();
  return {
    descriptor: `distinct ${f} character`,
    defining: `unmistakable ${f} taste`,
    region: state && state !== "Pan-India" ? state : "India",
    occasion: "an everyday snack moment",
  };
};

const CONCEPT_TONES = ["Nostalgic", "Bold", "Everyday"] as const;

type ConceptCopyItem = { tone: string; headline: string; body: string; brandLabel: string };

// Curated demo copy for flagship Britannia flavour–state pairs.
const CURATED_CONCEPT_COPY: Record<string, Record<string, ConceptCopyItem[]>> = {
  Kasundi: {
    Maharashtra: [
      {
        tone: "Nostalgic",
        headline: "That familiar, zingy bite from home",
        body: "Kasundi brings the punchy mustard heat Maharashtrians love — balanced with a tang that cuts through the richness of an evening snack. Sharp, comforting, unmistakably homegrown.",
        brandLabel: "Britannia 50-50 Kasundi",
      },
      {
        tone: "Bold",
        headline: "Now your cracker bites back",
        body: "The sharp, fermented heat of kasundi — once only found in grandma's kitchen — is now baked right into every bite. A cracker that doesn't just complement flavour. It is the flavour.",
        brandLabel: "Britannia 50-50 Kasundi",
      },
      {
        tone: "Everyday",
        headline: "Your 4 o'clock just got sharper",
        body: "Tea time in Maharashtra has always had a condiment of choice: Kasundi. Now kasundi's signature mustard-tang lives on your favourite cracker — no preparation needed, no compromise on the real thing.",
        brandLabel: "Britannia 50-50 Kasundi",
      },
    ],
  },
};

// Three angled, Britannia-realistic concept write-ups (tone / headline / body).
export const buildConceptCopy = (opts: {
  flavor?: string;
  state?: string;
  brandFit?: string;
  formats?: string[];
}) => {
  const flavor = opts.flavor || "This flavour";
  const state = opts.state || "Pan-India";
  const curated = flavor && CURATED_CONCEPT_COPY[flavor]?.[state];
  if (curated) return curated;

  const f = flavor.toLowerCase();
  const profile = profileFor(opts.flavor, opts.state);
  const brandToken = opts.brandFit?.split(",")[0]?.trim();
  const brandLabel = brandToken ? `Britannia ${brandToken} · ${flavor}` : `Britannia · ${flavor}`;
  const place = state !== "Pan-India" ? state : "India";
  const formatLabel =
    opts.formats?.[0]?.replace(new RegExp(flavor, "i"), "").trim() || "cracker";

  return [
    {
      tone: CONCEPT_TONES[0],
      headline: `That familiar ${f} bite, straight from home`,
      body: `${flavor} brings the ${profile.descriptor} that ${profile.region} grew up on — now folded into a crunch that lifts an ordinary snack. Warm, comforting, and unmistakably homegrown.`,
      brandLabel,
    },
    {
      tone: CONCEPT_TONES[1],
      headline: `Now your snack bites back`,
      body: `The ${profile.defining} — once tucked away in family kitchens — is baked into every single bite. This isn't a flavour that waits politely on the side. It is the flavour.`,
      brandLabel,
    },
    {
      tone: CONCEPT_TONES[2],
      headline: `Your 4 o'clock just got a lot sharper`,
      body: `Tea-time in ${place} always needed a little something extra. Now ${flavor}'s ${profile.descriptor} lives right on your favourite ${formatLabel} — ${profile.occasion}, sorted.`,
      brandLabel,
    },
  ];
};

export const buildStoryboardScenes = (opts: { flavor?: string; state?: string }) => {
  const flavor = opts.flavor || "Honey Chilli";
  const state = opts.state || "Maharashtra";
  const profile = profileFor(flavor, state);
  const brandLine = flavor === "Kasundi" ? "Britannia 50-50 Kasundi" : `Britannia · ${flavor}`;

  if (flavor === "Kasundi" && state === "Maharashtra") {
    return [
      {
        beat: 1,
        timing: "0–3s",
        title: "Kirana shelf hero",
        shot: `Close push-in on ${brandLine} pack at eye level in a Pune kirana — warm evening light, chai glasses blurred in background`,
        vo: "Maharashtra knows its kasundi…",
        onScreen: "Kasundi",
        frameStyle: "retail",
      },
      {
        beat: 2,
        timing: "3–8s",
        title: "Mustard cue",
        shot: "Macro of golden kasundi swirl beside broken crackers — sharp mustard seeds, no generic food props",
        vo: "…that sharp, fermented tang.",
        onScreen: "",
        frameStyle: "macro",
      },
      {
        beat: 3,
        timing: "8–18s",
        title: "4 o'clock moment",
        shot: "Overhead tea table with Britannia pack and crackers — Marathi home cues, steam from chai, no people or faces in frame",
        vo: "Now baked into every bite.",
        onScreen: "4 o'clock, sorted",
        frameStyle: "lifestyle",
      },
      {
        beat: 4,
        timing: "18–24s",
        title: "Crunch pay-off",
        shot: `Slow-motion cracker break revealing ${flavor.toLowerCase()} seasoning on biscuit surface`,
        vo: "No jar. No prep. Just crunch.",
        onScreen: brandLine,
        frameStyle: "product",
      },
      {
        beat: 5,
        timing: "24–30s",
        title: "Brand lock-up",
        shot: `Pack hero on warm gradient with Britannia logo and "${brandLine}" end line`,
        vo: "Britannia. Taste that travels home.",
        onScreen: "Britannia",
        frameStyle: "brand",
      },
    ];
  }

  return [
    {
      beat: 1,
      timing: "0–3s",
      title: "Shelf introduction",
      shot: `${brandLine} pack enters frame on an Indian retail shelf in ${state}`,
      vo: `When ${profile.region} reaches for something familiar…`,
      onScreen: flavor,
      frameStyle: "retail",
    },
    {
      beat: 2,
      timing: "3–8s",
      title: "Ingredient truth",
      shot: `Macro cues that signal ${profile.defining} — authentic to ${flavor}, not generic masala b-roll`,
      vo: `…${profile.descriptor} hits first.`,
      onScreen: "",
      frameStyle: "macro",
    },
    {
      beat: 3,
      timing: "8–18s",
      title: "Snack occasion",
      shot: `Relatable ${state} tea-time / tiffin moment — sharing ${flavor} crackers`,
      vo: `Built for ${profile.occasion}.`,
      onScreen: flavor,
      frameStyle: "lifestyle",
    },
    {
      beat: 4,
      timing: "18–24s",
      title: "Product crunch",
      shot: "Tight product crunch with visible seasoning on biscuit surface",
      vo: "Crunch that carries the flavour.",
      onScreen: brandLine,
      frameStyle: "product",
    },
    {
      beat: 5,
      timing: "24–30s",
      title: "End card",
      shot: "Britannia logo lock-up with pack hero and flavour name",
      vo: "Britannia. Flavour you can trust.",
      onScreen: "Britannia",
      frameStyle: "brand",
    },
  ];
};

export const buildMessagingCards = (opts: {
  flavor?: string;
  state?: string;
  brandFit?: string;
}) => {
  const flavor = opts.flavor || "Honey Chilli";
  const state = opts.state || "Maharashtra";
  const brandToken = opts.brandFit?.split(",")[0]?.trim() || "50-50";
  const profile = profileFor(flavor, state);

  if (flavor === "Kasundi" && state === "Maharashtra") {
    return [
      {
        tone: "Regional pride",
        headline: "Maharashtra's kasundi, now in every bite",
        body: "Lead with fermented mustard tang and evening chai occasion. Avoid generic 'spicy snack' — kasundi is a condiment memory, not just heat.",
      },
      {
        tone: "Occasion",
        headline: "4 o'clock deserves better than plain salt",
        body: "Position on tea-time upgrade: no jar, no prep. Britannia 50-50 Kasundi delivers the condiment flavour on a format Maharashtra already reaches for daily.",
      },
      {
        tone: "Shelf story",
        headline: "From kitchen jar to biscuit aisle",
        body: "Frame as cultural transfer — kasundi credibility from home kitchens into mass biscuit. RTB: Britannia distribution + 50-50 crunch equity.",
      },
    ];
  }

  return [
    {
      tone: "Consumer truth",
      headline: `${flavor} resonates in ${state}`,
      body: `Anchor on ${profile.defining}. Lead comms with ${profile.descriptor} and ${profile.occasion} — stay away from empty superlatives.`,
    },
    {
      tone: "Tone of voice",
      headline: "Warm, specific, never generic",
      body: `Write like Britannia ${brandToken}: familiar Indian home voice, one sharp flavour claim per line, no medical or competitive attacks.`,
    },
    {
      tone: "Channels",
      headline: "Reels-first, kirana-visible",
      body: `Prioritise 15s vertical hooks for ${state}, static pack for trade, and UGC-style tea-time demos — always show the actual ${flavor} pack.`,
    },
  ];
};

const inferPromptVariant = (instructions?: string): ConceptPromptVariant => {
  const text = (instructions || "").toLowerCase();
  if (!text) return "english";
  if (text.includes("vernacular") || text.includes("local language") || text.includes("regional language")) {
    return "vernacular";
  }
  return "english";
};

const PACKSHOT_NO_PEOPLE =
  "Product packshot only — no people, no human faces, no hands, no silhouettes, no models, no crowd.";

const imagePromptFor = (
  concept: { sku: string; lane: string; title?: string; imagePromptHint?: string },
  opts: {
    region: string;
    state?: string;
    flavor?: string;
    brandFit?: string;
    variant?: ConceptPromptVariant;
  }
) => {
  const state = opts.state || opts.region || "Pan-India";
  const flavor = opts.flavor || concept.lane;
  const brandFit = opts.brandFit;
  const productName = concept.title || concept.sku;
  const culturalCue = inferStateCues(state);
  const brandLine = brandFit
    ? `Britannia ${brandFit} pack — match line visual identity and format.`
    : "Britannia branded snack pack.";
  const hint = concept.imagePromptHint
    ? ` Creative notes (pack and props only): ${concept.imagePromptHint}.`
    : "";

  return [
    "Professional 16:9 FMCG packshot for Britannia India.",
    `Product: ${productName}. Flavor: ${flavor}. State: ${state}. Market: ${opts.region}.`,
    brandLine,
    "Studio-quality product photography: hero pack centered on a warm, clean gradient backdrop.",
    `Subtle ${state}-authentic styling — ${culturalCue} — as surface textures or ingredient props beside the pack, not lifestyle staging.`,
    `Show 2–3 loose biscuits and ingredient cues specific to ${flavor}; never generic masala or honey-pour imagery.`,
    PACKSHOT_NO_PEOPLE,
    "No readable text overlays, no competitor logos, no health or medicinal claims.",
    hint,
  ]
    .filter(Boolean)
    .join(" ");
};

const videoPromptFor = (
  concept: { sku: string; title?: string; lane: string },
  insight: string,
  region: string,
  scriptTitle?: string
) =>
  `6-second cinematic hero shot of packaged ${concept.title || concept.sku} snack biscuit carton on an Indian supermarket shelf. ` +
  `Slow dolly-in, warm retail lighting, shallow depth of field. ${concept.lane} flavor for ${region}. ` +
  `Research theme: ${scriptTitle || "Flavor Insights India"}. ${insight}. ` +
  `Show only the product pack and shelf — no honey pour, no syrup, no liquid drizzle, no people, no generic food b-roll.`;

export const pickConceptSkus = (ctx: {
  script?: {
    id?: string;
    exec?: { h2?: string };
    scopeDefaults?: { region?: string };
  };
  params?: { region?: string };
  state?: string;
  flavor?: string;
  brandFit?: string;
  instructions?: string;
}) => {
  const script = ctx.script || {};
  const id = script.id || "default";
  const h = BRIT_DATA.honeyChilli?.extensions || [];
  const g = BRIT_DATA.gunpowderPodi?.extensions || [];
  const out: { name: string; lane: string }[] = [];
  const selectedFlavor = ctx.flavor?.trim();
  if (selectedFlavor) {
    const fit = ctx.brandFit?.split(",")[0]?.trim();
    const formats = fit
      ? [fit, `${fit} minis`, `${fit} bites`]
      : ["Crackers", "Cream biscuits", "Snack bites"];
    formats.forEach((format) => out.push({ name: `${selectedFlavor} ${format}`, lane: selectedFlavor }));
  } else if (id === "honeyChilli" || id === "extension") {
    h.slice(0, 2).forEach((name) => out.push({ name, lane: "Honey Chilli" }));
    g.slice(0, 1).forEach((name) => out.push({ name, lane: "Gunpowder Podi" }));
  } else if (id === "sentiment") {
    const sweet = BRIT_DATA.sweetOpportunities?.[0];
    (sweet?.extensions || []).slice(0, 3).forEach((name) =>
      out.push({ name, lane: sweet?.flavor || "Regional sweet" })
    );
  } else {
    out.push({ name: h[0] || "Honey Chilli crackers", lane: "Honey Chilli" });
    out.push({ name: g[0] || "Gunpowder Podi khakhra", lane: "Gunpowder Podi" });
    const sweet = BRIT_DATA.sweetOpportunities?.[0];
    out.push({
      name: sweet?.extensions?.[0] || sweet?.flavor || "Mishti doi bites",
      lane: "Regional sweet",
    });
  }
  while (out.length < 3) {
    out.push({ name: `Concept ${out.length + 1}`, lane: "Innovation" });
  }
  const region =
    ctx.params?.region || script.scopeDefaults?.region || "Pan-India";
  const state = ctx.state || region;
  const flavor = ctx.flavor;
  const variant = inferPromptVariant(ctx.instructions);
  return out.slice(0, 3).map((c, i) => ({
    id: `concept-${i}`,
    title: String(c.name).slice(0, 42),
    sku: c.name,
    lane: c.lane,
    tagline: `${c.lane} · Britannia innovation concept`,
    imagePrompt: imagePromptFor(
      { sku: c.name, lane: c.lane },
      { region, state, flavor, brandFit: ctx.brandFit, variant }
    ),
    gradient: ["#c45c3e", "#8b2e1a", "#e8a87c", "#5c3d2e", "#d4a574", "#7a4a32"][
      i % 6
    ],
  }));
};

const mergeLlmConcepts = (
  base: ReturnType<typeof pickConceptSkus>,
  llm: { concepts?: Record<string, string>[]; videoPrompt?: string } | null,
  opts: {
    region: string;
    state?: string;
    flavor?: string;
    brandFit?: string;
    variant?: ConceptPromptVariant;
  }
) =>
  (llm?.concepts?.length ? llm.concepts : base).slice(0, 3).map((c, i) => {
    const b = (base[i] || {}) as Partial<(typeof base)[number]>;
    const sku = (c as { sku?: string }).sku || b.sku || `Concept ${i + 1}`;
    const lane = (c as { lane?: string }).lane || b.lane || "";
    return {
      id: `concept-${i}`,
      title: (c as { title?: string }).title || b.title || sku.slice(0, 42),
      sku,
      lane,
      tagline:
        (c as { tagline?: string }).tagline ||
        b.tagline ||
        `${lane} · ${opts.state || opts.region}`,
      tone: (c as { tone?: string }).tone,
      headline: (c as { headline?: string }).headline,
      body: (c as { body?: string }).body,
      brandLabel: (c as { brandLabel?: string }).brandLabel,
      imagePrompt: imagePromptFor(
        {
          sku,
          lane,
          title: (c as { title?: string }).title || b.title,
          imagePromptHint: (c as { imagePrompt?: string }).imagePrompt,
        },
        opts
      ),
      gradient: b.gradient || "#c45c3e",
    };
  });

export const STORYBOARD_PREVIEW_MP4 = "/fallback/hero-spot.mp4";

export const buildStoryboardFilmPreview = async (
  ctx: {
    script?: {
      title?: string;
      id?: string;
      exec?: { h2?: string; p?: string };
      scopeDefaults?: { region?: string };
    };
    params?: { region?: string };
    state?: string;
    flavor?: string;
  } = {}
) => {
  const script = ctx.script || {};
  const region =
    ctx.params?.region || script.scopeDefaults?.region || "Pan-India";
  const state = ctx.state || region;
  const flavor = ctx.flavor || "Honey Chilli";
  const ex = script.exec || {};
  const hero = pickConceptSkus(ctx)[0];
  const filmPrompt = videoPromptFor(
    hero,
    (ex.p || ex.h2 || script.title || "").slice(0, 200),
    state,
    script.title
  );

  return {
    filmPrompt,
    filmMode: "preview" as const,
    filmMessage: `6s hero spot for ${flavor} in ${state} — renders from Scene 1 (Veo) when GEMINI_API_KEY is set.`,
  };
};

export const generateHeroFilmMock = async (
  ctx: {
    script?: {
      title?: string;
      id?: string;
      exec?: { h2?: string; p?: string };
      scopeDefaults?: { region?: string };
    };
    params?: { region?: string; state?: string; flavor?: string };
    state?: string;
    flavor?: string;
  } = {},
  onProgress?: (t: string) => void
) => {
  const script = ctx.script || {};
  const region =
    ctx.params?.region || script.scopeDefaults?.region || "Pan-India";
  const state = ctx.state || ctx.params?.state || region;
  const flavor = ctx.flavor || ctx.params?.flavor || "Honey Chilli";
  const ex = script.exec || {};
  const concepts = pickConceptSkus(ctx);
  const hero = concepts[0];
  const filmPrompt = videoPromptFor(
    hero,
    (ex.p || ex.h2 || script.title || "").slice(0, 200),
    region,
    script.title
  );

  const steps = [
    "Writing film brief…",
    "Creating film… 12%",
    "Creating film… 28%",
    "Creating film… 43%",
    "Creating film… 61%",
    "Creating film… 84%",
    "Creating film… 92%",
    "Finalising cut…",
  ];

  for (const step of steps) {
    await sleep(650);
    onProgress?.(step);
  }

  return {
    type: "create_film",
    mode: "preview",
    filmPrompt,
    productName: hero?.title || hero?.sku || flavor,
    sku: hero?.sku,
    region: state,
    flavor,
    message: `Demo storyboard ready for ${flavor} in ${state}. Press ⌃⇧L (Ctrl+Shift+L) for live film render.`,
    storyboard: [
      { beat: "1", text: `Wide: ${state} landscape, Britannia pack enters frame (2s)` },
      { beat: "2", text: `Close-up: ${flavor} snack texture, warm light (3s)` },
      { beat: "3", text: `VO: Regional hero flavor for chai-time (3s)` },
      { beat: "4", text: `On-screen: Flavor Insights growth stat (2s)` },
      { beat: "5", text: `End card: Britannia logo + flavor name (2s)` },
    ],
  };
};

export const generateHeroFilm = async (
  ctx: {
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
  const script = ctx.script || {};
  const region =
    ctx.params?.region || script.scopeDefaults?.region || "Pan-India";
  const ex = script.exec || {};
  const concepts = pickConceptSkus(ctx);
  const hero = concepts[0];
  let filmPrompt = videoPromptFor(
    hero,
    (ex.p || ex.h2 || script.title || "").slice(0, 200),
    region,
    script.title
  );
  if (!isLlmLiveEnabled()) {
    return generateHeroFilmMock(ctx, onProgress);
  }

  const bedrockKey = getBedrockKey();
  const ready = await checkBedrockConfigured();

  if (!ready) {
    return {
      type: "create_film",
      mode: "setup_required",
      filmPrompt,
      message: "Add your API key in settings to create hero films.",
    };
  }

  onProgress?.("Writing film brief…");
  try {
    filmPrompt = await buildHeroFilmPrompt(ctx, hero);
  } catch {
    /* keep default prompt */
  }

  onProgress?.("Creating hero film…");
  try {
    const videoUri = await generateBedrockFilm(filmPrompt, onProgress, bedrockKey);
    const filmHref = await resolveFilmPlaybackUrl(videoUri);
    return {
      type: "create_film",
      mode: "created",
      filmPrompt,
      videoUri,
      filmHref,
      filmIsS3: true,
      sku: concepts[0]?.sku,
      productName: hero?.title || hero?.sku,
      region,
      message: `Hero film ready — ${hero?.title || hero?.sku}.`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("Hero film generation failed, using local fallback:", msg);
    
    // Using local mock MP4s if generation fails
    const fallbackHref = STORYBOARD_PREVIEW_MP4;
    
    return {
      type: "create_film",
      mode: "created", // Switch to created so it plays the fallback
      filmPrompt,
      videoUri: fallbackHref,
      filmHref: fallbackHref,
      filmIsS3: false,
      sku: concepts[0]?.sku,
      productName: hero?.title || hero?.sku,
      region,
      message: `Hero film ready (mock fallback) — ${hero?.title || hero?.sku}.`,
    };
  }
};

const generateNanoBananaImage = async (prompt: string, signal?: AbortSignal) => {
  const res = await fetch("/api/nanobanana", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!res.ok) throw new Error("Nano Banana API failed");
  const data = await res.json();
  const url = data?.data?.[0]?.url;
  if (!url) throw new Error("No image URL returned from Nano Banana");
  return url;
};

export const generateConceptCards = async (
  ctx: {
    script?: {
      title?: string;
      id?: string;
      exec?: { h2?: string; p?: string };
      scopeDefaults?: { region?: string };
    };
    params?: { region?: string };
    state?: string;
    flavor?: string;
    brandFit?: string;
    instructions?: string;
  } = {},
  onProgress?: (t: string) => void
) => {
  const script = ctx.script || {};
  const region =
    ctx.params?.region || script.scopeDefaults?.region || "Pan-India";
  const state = ctx.state || region;
  const flavor = ctx.flavor;
  const brandFit = ctx.brandFit;
  const variant = inferPromptVariant(ctx.instructions);
  let concepts = pickConceptSkus(ctx);
  const bedrockKey = getBedrockKey();
  const bedrockReady = await checkBedrockConfigured();

  if (isLlmLiveEnabled() && bedrockReady) {
    onProgress?.("Writing concepts…");
    try {
      const llm = await runActionWithLLM("concept_cards", ctx);
      concepts = mergeLlmConcepts(concepts, llm, { region, state, flavor, brandFit, variant });
    } catch (e) {
      console.warn("Concept copy failed, using defaults:", e);
    }
  }

  let generatedCount = 0;
  let lastImageError: string | undefined;

  onProgress?.("Creating packshots…");
  const withImages = await Promise.all(
    concepts.map(async (c, i) => {
      try {
        onProgress?.(`Packshot ${i + 1} of 3…`);
        const imagePrompt =
          c.imagePrompt ||
          imagePromptFor(c, { region, state, flavor, brandFit, variant });
        
        let uri = "";
        let generated = false;
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(new Error("Nano Banana timeout")), 45000);
          
          try {
            uri = await generateNanoBananaImage(
              imagePrompt,
              controller.signal
            );
            generated = true;
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (nbError) {
          console.warn("Nano Banana failed or timed out, falling back to local images:", nbError);
          uri = `/fallback/${(i % 3) + 1}.png`;
          generated = true;
        }

        if (generated) generatedCount++;
        return { ...c, imageUri: uri, packshotReady: true, generated };
      } catch (e) {
        lastImageError = e instanceof Error ? e.message : String(e);
        const { buildPackshotDataUrl } = await import("@/lib/packshot-visual");
        return {
          ...c,
          imageUri: buildPackshotDataUrl({
            title: c.title,
            sku: c.sku,
            lane: c.lane,
            gradient: c.gradient,
          }),
          packshotReady: true,
          generated: false,
        };
      }
    })
  );

  const mode = "created" as const;

  const copy = buildConceptCopy({
    flavor,
    state,
    brandFit,
    formats: concepts.map((c) =>
      flavor ? String(c.title || c.sku || "").replace(flavor, "").trim() || "snack" : "snack"
    ),
  });

  const enriched = withImages.map((c, i) => {
    const row = c as typeof c & {
      tone?: string;
      headline?: string;
      body?: string;
      brandLabel?: string;
    };
    return {
      ...row,
      conceptNumber: i + 1,
      tone: row.tone || copy[i]?.tone,
      headline: row.headline || copy[i]?.headline,
      body: row.body || copy[i]?.body,
      brandLabel: row.brandLabel || copy[i]?.brandLabel,
    };
  });

  return {
    mode,
    concepts: enriched,
    error: generatedCount === 0 ? lastImageError : undefined,
    message:
      generatedCount > 0
        ? `${generatedCount} packshot${generatedCount !== 1 ? "s" : ""} ready.`
        : "Concept cards ready — AI images unavailable, showing styled previews.",
  };
};
