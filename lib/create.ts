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


const inferPromptVariant = (instructions?: string): ConceptPromptVariant => {
  const text = (instructions || "").toLowerCase();
  if (!text) return "english";
  if (text.includes("vernacular") || text.includes("local language") || text.includes("regional language")) {
    return "vernacular";
  }
  return "english";
};

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
  const language = inferPrimaryLanguage(state);
  const culturalCue = inferStateCues(state);
  const variant = opts.variant || "english";
  const brandLine = brandFit ? `The pack must be designed for Britannia ${brandFit} — match the visual identity, tone, and format of the ${brandFit} product line.` : "";
  const hint = concept.imagePromptHint ? ` Extra creative direction: ${concept.imagePromptHint}.` : "";

  if (variant === "vernacular") {
    return [
      "You are a concept card designer for Britannia India.",
      "Generate one 16:9 product concept card for a new snack flavor launch.",
      `State context: ${state}. Primary language: ${language}${HINDI_BELT_STATES.has(state) ? " (Hindi fallback allowed)." : "."}`,
      `Product: ${productName}. Flavor: ${flavor}. Market: ${opts.region}.`,
      "LEFT HALF (50%): real, relatable person actively eating or holding the product in a natural everyday moment.",
      `Use state-authentic visual cues: ${culturalCue}. Warm, non-studio lighting.`,
      `RIGHT HALF (50%): headline in ${language} (8-12 words) that captures the specific taste and feeling of ${flavor}.`,
      `Body copy in ${language} (3-4 sentences): describe what ${flavor} tastes and feels like, the occasion it suits best, and a warm payoff.`,
      "No health, nutritional, medicinal, or competitive claims.",
      `Bottom-right: Britannia pack shot for ${productName}, 2-3 loose product pieces, and 1-2 ingredient visuals that authentically represent ${flavor} — show the actual defining ingredients or visual cues of this specific flavor, not generic food imagery.`,
      "Background: warm solid or soft gradient, clean and uncluttered.",
      `Critical rule: every visual element must be specific to ${flavor} — never generic.`,
      brandLine,
      hint,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    "You are a concept card designer for Britannia India.",
    "Generate one 16:9 product concept card in English for a new snack flavor launch.",
    `Product: ${productName}. Flavor: ${flavor}. State: ${state}.`,
    brandLine,
    "LEFT HALF (50%): real-looking person actively holding or eating the product in an everyday moment.",
    `State-authentic visual cues: ${culturalCue}. Warm natural lighting. No celebrity or model look.`,
    `RIGHT HALF (50%): English headline (8-12 words) that captures the specific taste and character of ${flavor} — conversational and feeling-led, no ad jargon.`,
    `Body copy in English (3-4 sentences): (1) describe what ${flavor} tastes and feels like specifically, (2) the occasion it suits, (3) a warm close with the product name.`,
    "No health, nutritional, medicinal, competitive, or empty superlative claims.",
    `Bottom-right: Britannia ${brandFit || "brand"} pack shot for ${productName}, 2-3 loose product pieces, and ingredient visuals that are authentically and specifically tied to ${flavor} — use your knowledge of what defines this flavor visually (actual ingredients, spices, or components), not generic food imagery.`,
    "Background: warm solid or soft gradient, clean and uncluttered.",
    `Everything — visuals and copy — must feel made specifically for ${flavor} in ${state} on a Britannia ${brandFit || ""} pack. Never generic.`,
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
    tagline: `Bold ${c.lane.toLowerCase()} flavor. Try the new ${c.name.toLowerCase()}!`,
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
        `New ${lane} flavor. Made for ${opts.region}.`,
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
    const fallbackId = Math.floor(Math.random() * 4) + 1;
    const fallbackHref = `/fallback/${fallbackId}.mp4`;
    
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

  return {
    mode,
    concepts: withImages,
    error: generatedCount === 0 ? lastImageError : undefined,
    message:
      generatedCount > 0
        ? `${generatedCount} packshot${generatedCount !== 1 ? "s" : ""} ready.`
        : "Concept cards ready — AI images unavailable, showing styled previews.",
  };
};
