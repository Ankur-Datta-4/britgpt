import { BRIT_DATA } from "@/lib/data";
import {
  generateBedrockFilm,
  generateBedrockImage,
} from "@/lib/bedrock";
import { checkBedrockConfigured } from "@/lib/api-status";
import { isLlmLiveEnabled } from "@/lib/llm-mode";
import { sleep } from "@/lib/film-job";
import { runActionWithLLM, buildHeroFilmPrompt } from "@/lib/llm";
import { getBedrockKey } from "@/lib/config-client";
import { resolveFilmPlaybackUrl } from "@/lib/film-url";

const imagePromptFor = (concept: { sku: string; lane: string; title?: string }, region: string) =>
  `Professional product photography, premium Indian FMCG biscuit snack pack on clean studio backdrop. ` +
  `Product: ${concept.title || concept.sku}. Flavor lane: ${concept.lane}. Market: ${region}. ` +
  `Britannia-style retail packaging, appetizing, sharp focus, soft shadow, no readable text or logos.`;

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
}) => {
  const script = ctx.script || {};
  const id = script.id || "default";
  const b = BRIT_DATA.biscoff?.extensions || [];
  const h = BRIT_DATA.honeyChilli?.extensions || [];
  const out: { name: string; lane: string }[] = [];
  if (id === "swicy" || id === "extension") {
    h.slice(0, 3).forEach((name) => out.push({ name, lane: "Swicy" }));
  } else if (id === "sentiment" || id === "biscoff") {
    b.slice(0, 3).forEach((name) => out.push({ name, lane: "Biscoff dessert" }));
  } else {
    out.push({ name: b[0] || "Biscoff Cream Biscuits", lane: "Sweet" });
    out.push({ name: h[0] || "Honey Chilli Chips", lane: "Savory" });
    const sweet = BRIT_DATA.sweetOpportunities?.[0];
    out.push({
      name: sweet?.extensions?.[0] || sweet?.flavor || "Gulkand bites",
      lane: "Sweet",
    });
  }
  while (out.length < 3) {
    out.push({ name: `Concept ${out.length + 1}`, lane: "Innovation" });
  }
  const region =
    ctx.params?.region || script.scopeDefaults?.region || "Pan-India";
  return out.slice(0, 3).map((c, i) => ({
    id: `concept-${i}`,
    title: String(c.name).replace(/^Biscoff /, "").slice(0, 42),
    sku: c.name,
    lane: c.lane,
    tagline: script.exec?.h2?.slice(0, 80) || "From Flavor Insights India",
    imagePrompt: imagePromptFor({ sku: c.name, lane: c.lane }, region),
    gradient: ["#c45c3e", "#8b2e1a", "#e8a87c", "#5c3d2e", "#d4a574", "#7a4a32"][
      i % 6
    ],
  }));
};

const mergeLlmConcepts = (
  base: ReturnType<typeof pickConceptSkus>,
  llm: { concepts?: Record<string, string>[]; videoPrompt?: string } | null,
  region: string
) =>
  (llm?.concepts?.length ? llm.concepts : base).slice(0, 3).map((c, i) => {
    const b = base[i] || {};
    const sku = (c as { sku?: string }).sku || b.sku || `Concept ${i + 1}`;
    const lane = (c as { lane?: string }).lane || b.lane || "";
    return {
      id: `concept-${i}`,
      title: (c as { title?: string }).title || b.title || sku.slice(0, 42),
      sku,
      lane,
      tagline: (c as { tagline?: string }).tagline || b.tagline || "",
      imagePrompt:
        (c as { imagePrompt?: string }).imagePrompt ||
        imagePromptFor({ sku, lane }, region),
      gradient: b.gradient || "#c45c3e",
    };
  });

export const generateHeroFilmMock = async (
  ctx: {
    script?: {
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
    "Rendering film… 12%",
    "Rendering film… 28%",
    "Rendering film… 43%",
    "Rendering film… 61%",
    "Rendering film… 84%",
    "Rendering film… 92%",
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
      { beat: "5", text: `End card: Britannia logo + SKU (2s)` },
    ],
  };
};

export const generateHeroFilm = async (
  ctx: {
    script?: {
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
    return {
      type: "create_film",
      mode: "failed",
      filmPrompt,
      error: msg,
      message: "Film could not be generated. Try again.",
    };
  }
};

export const generateConceptCards = async (
  ctx: {
    script?: {
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
  let concepts = pickConceptSkus(ctx);
  const bedrockKey = getBedrockKey();
  const bedrockReady = await checkBedrockConfigured();

  if (isLlmLiveEnabled() && bedrockReady) {
    onProgress?.("Writing concepts…");
    try {
      const llm = await runActionWithLLM("concept_cards", ctx);
      concepts = mergeLlmConcepts(concepts, llm, region);
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
        const { uri, generated } = await generateBedrockImage(
          {
            prompt: c.imagePrompt || imagePromptFor(c, region),
            title: c.title,
            sku: c.sku,
            lane: c.lane,
            gradient: c.gradient,
          },
          bedrockKey
        );
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
