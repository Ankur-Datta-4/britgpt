import { BRIT_DATA } from "@/lib/data";
import {
  generateBedrockFilm,
  generateBedrockImage,
} from "@/lib/bedrock";
import { checkBedrockConfigured } from "@/lib/api-status";
import { runActionWithLLM } from "@/lib/llm";
import { getBedrockKey } from "@/lib/config-client";
import { resolveFilmPlaybackUrl } from "@/lib/film-url";

const imagePromptFor = (concept: { sku: string; lane: string }, region: string) =>
  `Premium FMCG product packshot, Britannia India snack biscuit aisle, studio lighting, shallow depth of field. ` +
  `Product: ${concept.sku}. Style: ${concept.lane}. Region: ${region}. ` +
  `Modern Indian premium packaging, appetizing, no readable text or logos.`;

const videoPromptFor = (
  concept: { sku: string },
  insight: string,
  region: string
) =>
  `6 second cinematic product film, slow pan, warm retail lighting. ${concept.sku}. ${insight}. ${region}. ` +
  `Premium FMCG, Britannia India, shallow depth of field.`;

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
  let filmPrompt = videoPromptFor(
    concepts[0],
    (ex.p || ex.h2 || "").slice(0, 160),
    region
  );
  const bedrockKey = getBedrockKey();
  const ready = await checkBedrockConfigured();

  if (!ready) {
    return {
      type: "create_film",
      mode: "setup_required",
      filmPrompt,
      message: "Add BEDROCK_API_KEY in .env.local.",
    };
  }

  onProgress?.("Writing film brief…");
  try {
    const llm = await runActionWithLLM("concept_cards", ctx);
    if (llm?.videoPrompt && typeof llm.videoPrompt === "string") {
      filmPrompt = llm.videoPrompt;
    }
  } catch {
    /* default prompt */
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
      region,
      message: "Hero film ready — play below (signed S3 link, 1h).",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      type: "create_film",
      mode: "failed",
      filmPrompt,
      error: msg,
      message: `Film failed: ${msg}`,
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
  const ex = script.exec || {};
  let concepts = pickConceptSkus(ctx);
  let filmPrompt = videoPromptFor(
    concepts[0],
    (ex.p || ex.h2 || "").slice(0, 160),
    region
  );
  const bedrockKey = getBedrockKey();
  const hasMediaKey = await checkBedrockConfigured();

  if (hasMediaKey) {
    onProgress?.("Writing concepts…");
    try {
      const llm = await runActionWithLLM("concept_cards", ctx);
      concepts = mergeLlmConcepts(concepts, llm, region);
      if (llm?.videoPrompt && typeof llm.videoPrompt === "string") {
        filmPrompt = llm.videoPrompt;
      }
    } catch (e) {
      console.warn("Concept copy failed, using defaults:", e);
    }
  }

  if (!hasMediaKey) {
    return {
      mode: "preview" as const,
      filmPrompt,
      concepts,
      message: "Preview ready. Add Bedrock API key to create images and film.",
    };
  }

  let imageCount = 0;
  let lastImageError: string | undefined;

  onProgress?.("Creating packshots…");
  const withImages = await Promise.all(
    concepts.map(async (c, i) => {
      try {
        onProgress?.(`Packshot ${i + 1} of 3…`);
        const imageUri = await generateBedrockImage(
          {
            prompt: c.imagePrompt || imagePromptFor(c, region),
            title: c.title,
            sku: c.sku,
            lane: c.lane,
            gradient: c.gradient,
          },
          bedrockKey
        );
        imageCount++;
        return { ...c, imageUri, packshotReady: true };
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
        };
      }
    })
  );

  let hero = withImages[0];
  let filmNote: string | undefined;
  if (typeof window !== "undefined") {
    try {
      onProgress?.("Hero film…");
      const videoUri = await generateBedrockFilm(filmPrompt, onProgress, bedrockKey);
      if (videoUri) {
        let filmHref = videoUri;
        try {
          filmHref = await resolveFilmPlaybackUrl(videoUri);
        } catch {
          /* folder link only */
        }
        hero = {
          ...hero,
          videoUri,
          filmHref,
          hasFilm: true,
          filmIsS3: true,
        };
      }
    } catch (e) {
      filmNote = e instanceof Error ? e.message : String(e);
      console.warn("Film failed:", e);
    }
  }

  const final = withImages.map((c, i) => (i === 0 ? hero : c));
  const hasFilm = !!(final[0] as { videoUri?: string })?.videoUri;
  const mode = imageCount > 0 || hasFilm ? ("created" as const) : ("preview" as const);

  return {
    mode,
    filmPrompt,
    concepts: final,
    error: imageCount === 0 && !hasFilm ? lastImageError : undefined,
    filmNote,
    message:
      mode === "created"
        ? `Created ${imageCount} packshot${imageCount !== 1 ? "s" : ""}${hasFilm ? " + hero film" : filmNote ? ` · ${filmNote}` : ""}.`
        : lastImageError || "Could not create packshots.",
  };
};
