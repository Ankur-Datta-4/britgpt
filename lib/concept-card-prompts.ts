/**
 * Britannia concept card prompts — English + Vernacular (BGPT / Yash spec).
 * Used for Bedrock copy (JSON) and Gemini image generation (Nano Banana).
 */

export type ConceptPromptVariant = "english" | "vernacular";

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
  "National",
  "Pan-India",
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

export const inferPrimaryLanguage = (state: string) => {
  if (!state || state === "Pan-India" || state === "National") return "Hindi";
  if (LANGUAGE_BY_STATE[state]) return LANGUAGE_BY_STATE[state];
  if (HINDI_BELT_STATES.has(state)) return "Hindi";
  return "English";
};

export const inferConceptCardVariant = (instructions?: string): ConceptPromptVariant => {
  const text = (instructions || "").toLowerCase();
  if (
    text.includes("vernacular") ||
    text.includes("local language") ||
    text.includes("regional language") ||
    text.includes("tamil") ||
    text.includes("bengali") ||
    text.includes("hindi card")
  ) {
    return "vernacular";
  }
  return "english";
};

const STATE_CUES: Record<string, string> = {
  "Tamil Nadu": "Tamil Nadu home verandah or tiffin moment, steel dabba, South Indian clothing cues",
  "West Bengal": "Kolkata-style balcony chai, adda vibe, Bengali household cues",
  Karnataka: "Bengaluru home or cafe corner, modern South Indian casual",
  Maharashtra: "Mumbai/Pune home evening snack, Marathi family context",
  "Delhi NCR": "Delhi NCR urban home evening, winter chai/snack context",
  Gujarat: "Gujarati home kitchen table, sharing snack moment",
  "Andhra Pradesh": "AP home tea-time, Telugu cultural cues",
  Telangana: "Hyderabad-style home snack moment",
  National: "pan-India urban home tea-time, broadly relatable Indian setting",
  "Pan-India": "pan-India urban home tea-time, broadly relatable Indian setting",
};

export const inferStateCues = (state: string) =>
  STATE_CUES[state] || "relatable Indian home or neighborhood snack-time context";

/** Vernacular concept card — system prompt for copy + image brief (LLM). */
export const CONCEPT_CARD_VERNACULAR_SYSTEM = `You are a concept card designer for Britannia India. You generate 16:9 product concept cards for new snack flavor launches.

Concept card has two halves:

LEFT HALF (50% of frame):
- A single person (or a pair like mother-child, friends) genuinely enjoying the product in a natural, relatable moment
- The setting should reflect the state and cultural context provided
- Warm, inviting lighting. Real-life moment, not a studio pose
- The person should be holding or eating the product

RIGHT HALF (50% of frame):
- Top: A catchy headline in the local language of the state (with Hindi as fallback for Hindi-belt states). 8-12 words max. Simple grammar, conversational tone, easy to read at a glance. The headline should connect the flavor to a feeling, moment, or identity — not just describe the product
- Middle: Body copy (3-4 sentences, also in local language with Hindi fallback). The copy must:
  - Lead with taste and texture ("crunchy", "milky", "tangy", "spicy kick", "melt-in-mouth")
  - Connect to a specific life moment (chai-time, school tiffin, evening snack, rain day, road trip)
  - Mention one clear RTB or USP (e.g., "made with real jaggery", "double-roasted podi spice", "1.5x more milk")
  - End with how the product makes snack time better
  - NEVER make health claims, medicinal claims, or nutritional superiority claims
  - NEVER use words like "healthy", "nutritious", "immunity", "protein-rich" as selling points
  - Focus ONLY on: taste, texture, crunch, flavour intensity, freshness, feeling, and the moment it fits into
- Bottom-right: Product pack shot (the Britannia brand packaging for the mapped brand), with 2-3 loose product pieces artfully arranged, and 1-2 key ingredient shots that visually reinforce the flavor

BACKGROUND: Warm, solid or softly gradient tone that complements the product packaging color. No busy patterns. Clean brand canvas — not a stock photo.

BOTTOM STRIP (optional): A one-line sign-off tagline tying the brand, flavor, and feeling together. 6-8 words. Conversational.

IMPORTANT RULES:
- The headline must be specific to the flavor AND the state — never generic
- The person on the left must look like they belong in that state (clothing, setting cues)
- The ingredient shots must match the actual flavor — don't show random garnishes
- All copy must be in the primary language of the state (Tamil for Tamil Nadu, Bengali for West Bengal, Kannada for Karnataka, Marathi for Maharashtra, Hindi for Hindi-belt states, English + local for Northeast states)
- Keep the tone never clinical

Output JSON only:
{
  "concepts": [
    {
      "title": "SKU-style product name",
      "sku": "full SKU string",
      "lane": "flavor name",
      "tone": "Nostalgic | Bold | Everyday",
      "headline": "8-12 words in local language",
      "body": "3-4 sentences in local language",
      "signOffTagline": "6-8 words optional",
      "brandLabel": "Britannia {brand} · {flavor}",
      "imagePrompt": "Optional extra visual notes for the illustrator — ingredients, setting details"
    }
  ]
}
Exactly 3 concepts with tones Nostalgic, Bold, and Everyday. Ground in Flavor Insights data only.`;

/** English concept card — system prompt for copy + image brief (LLM). */
export const CONCEPT_CARD_ENGLISH_SYSTEM = `You are a concept card designer for Britannia India. You generate 16:9 product concept cards for new snack flavor launches. Two cards are generated per brief — one in English (this prompt), and one in the state's local language (generated separately).

Every concept card has two halves:

LEFT HALF (50% of frame):
- A single person (or a natural pair like mother-child, two friends, siblings) genuinely enjoying the product in a relatable, everyday moment
- The setting, clothing, and cultural cues should reflect the specific state provided — not generic "Indian"
- Warm, inviting, natural lighting. A real-life moment, not a studio pose
- The person should be actively holding or eating the product
- No celebrities, no models. Real-looking people in real-looking settings

RIGHT HALF (50% of frame):

HEADLINE (top):
- 8–12 words in English
- Simple, conversational grammar — the kind of line someone would actually say out loud
- Connects the flavor to a feeling, moment, or identity — not a product description
- No puns that require explanation. No advertising jargon ("unleash", "elevate", "indulge")
- Should feel like something a friend would say, not something a brand would write

BODY COPY (middle, 3–4 sentences in English):
- Sentence 1: Lead with taste and texture. Use sensory words — crunchy, tangy, spicy kick, melt-in-mouth, smoky, roasted, crumbly, creamy, crisp. Describe what happens when you bite into it
- Sentence 2: Name the flavor's origin or signature trait as the RTB. e.g., "Made with real Chettinad pepper", "Slow-roasted gunpowder podi spice", "Real honey with a chilli finish". Specific and ingredient-led
- Sentence 3: Place the product in a life moment. When do you eat this? After school, with chai, on a rainy evening, during a road trip, while studying, sharing with friends
- Sentence 4: Close with the product name and a short line about how it makes that moment better. Warm, not salesy

COPY RESTRICTIONS — do NOT include:
- Health claims, nutritional claims, or medicinal language
- Superlatives without substance ("best ever", "like no other", "ultimate")
- Generic filler ("crafted with care", "made with love", "goodness in every bite")
- Competitive comparisons

COPY SHOULD ONLY reference: taste, texture, crunch, spice level, flavour intensity, aroma, freshness, the feeling of eating it, and the moment it fits into

PRODUCT SHOT (bottom-right):
- The Britannia brand pack (mapped brand) with brand name and flavor visible
- 2–3 loose product pieces arranged naturally
- 1–2 ingredient beauty shots accurate to the flavor

SIGN-OFF TAGLINE (bottom strip, optional):
- 6–8 words in English, conversational

BACKGROUND:
- Warm, solid or softly gradated tone complementing pack colour
- No busy patterns, no stock-photo backgrounds behind text
- Clean brand canvas

Output JSON only:
{
  "concepts": [
    {
      "title": "SKU-style product name",
      "sku": "full SKU string",
      "lane": "flavor name",
      "tone": "Nostalgic | Bold | Everyday",
      "headline": "8-12 words English",
      "body": "3-4 sentences English",
      "signOffTagline": "6-8 words optional",
      "brandLabel": "Britannia {brand} · {flavor}",
      "imagePrompt": "Optional extra visual notes"
    }
  ]
}
Exactly 3 concepts with tones Nostalgic, Bold, and Everyday. Ground in Flavor Insights data only.`;

export const getConceptCardLlmSystem = (variant: ConceptPromptVariant) =>
  variant === "vernacular" ? CONCEPT_CARD_VERNACULAR_SYSTEM : CONCEPT_CARD_ENGLISH_SYSTEM;

export const getConceptCardLlmUserPrompt = (ctx: {
  flavor?: string;
  state?: string;
  brandFit?: string;
  params?: { region?: string };
  instructions?: string;
  researchContext?: string;
}) => {
  const state = ctx.state || ctx.params?.region || "India";
  const flavor = ctx.flavor || "regional flavour";
  const brand = ctx.brandFit || "Britannia brand";
  const variant = inferConceptCardVariant(ctx.instructions);
  const lang =
    variant === "vernacular" ? inferPrimaryLanguage(state) : "English";
  const scope =
    state === "National" ? "national / pan-India rollout" : `state: ${state}`;

  return [
    `Create 3 Britannia concept cards for ${flavor} in ${state} (${scope}).`,
    `Britannia brand fit: ${brand}.`,
    `Card language: ${lang} (${variant} card).`,
    "Each concept: distinct tone (Nostalgic, Bold, Everyday), full headline + 3-4 sentence body + optional signOffTagline per the system rules.",
    "No competitor names. No health or nutrition claims.",
    ctx.instructions?.trim() ? `Creative notes: ${ctx.instructions.trim()}` : null,
    ctx.researchContext || null,
  ]
    .filter(Boolean)
    .join("\n\n");
};

/** Gemini / Nano Banana — full 16:9 card image with layout + legible copy. */
export const buildConceptCardGeminiPrompt = (opts: {
  variant?: ConceptPromptVariant;
  state: string;
  flavor: string;
  brandFit?: string;
  productTitle?: string;
  headline?: string;
  body?: string;
  signOffTagline?: string;
  tone?: string;
  imagePromptHint?: string;
}) => {
  const variant = opts.variant || "english";
  const state = opts.state || "Pan-India";
  const flavor = opts.flavor;
  const brand = opts.brandFit?.split(",")[0]?.trim() || "Britannia";
  const product = opts.productTitle || `${flavor} snack`;
  const lang = variant === "vernacular" ? inferPrimaryLanguage(state) : "English";
  const cues = inferStateCues(state);
  const headline =
    opts.headline ||
    (variant === "english"
      ? `That ${flavor.toLowerCase()} crunch hits different`
      : `[${lang} headline for ${flavor}]`);
  const body =
    opts.body ||
    `Crunchy, flavour-forward ${flavor} biscuit for chai-time in ${state}.`;
  const signOff = opts.signOffTagline || `${brand} · ${flavor}`;

  return [
    "Generate ONE finished 16:9 Britannia India FMCG concept card (single image, print-ready layout).",
    variant === "vernacular"
      ? "VERNACULAR CARD — all headline, body, and sign-off text must be in " +
        lang +
        " (Hindi fallback only for Hindi-belt states)."
      : "ENGLISH CARD — all headline, body, and sign-off text must be in English.",
    "",
    "LAYOUT (strict 50/50 split):",
    "LEFT HALF: One person or natural pair (mother-child / friends) genuinely eating/holding the product. Setting: " +
      cues +
      ". Warm natural light, real-life moment, not studio. No celebrities.",
    "RIGHT HALF — top: Headline (8-12 words, large readable type): \"" +
      headline +
      "\"",
    "RIGHT HALF — middle: Body copy (3-4 sentences, readable paragraph): " + body,
    "RIGHT HALF — bottom-right: Britannia " +
      brand +
      " pack for " +
      flavor +
      " (" +
      product +
      "), 2-3 loose biscuits/crackers/wafers, 1-2 ingredient props specific to " +
      flavor +
      " only.",
    "BOTTOM STRIP (if space): Sign-off \"" + signOff + "\"",
    "BACKGROUND: Warm solid/soft gradient brand canvas — no busy patterns.",
    "",
    "RULES: Flavor-specific ingredients only. No health/nutrition/medical claims in text. No competitor logos. Render all copy legibly in-frame.",
    opts.imagePromptHint ? "Extra visual notes: " + opts.imagePromptHint : null,
    `Tone: ${opts.tone || "Everyday"}. State: ${state}. Flavor: ${flavor}.`,
  ]
    .filter(Boolean)
    .join("\n");
};

/** Preamble prepended in /api/nanobanana for concept_card mode. */
export const getGeminiConceptCardPreamble = (variant: ConceptPromptVariant = "english") =>
  [
    variant === "vernacular"
      ? "You are a Britannia India concept card designer (VERNACULAR CARD)."
      : "You are a Britannia India concept card designer (ENGLISH CARD).",
    "Render a complete 16:9 concept card image with LEFT: person enjoying product, RIGHT: headline + body copy + packshot + ingredients, warm brand canvas.",
    "All marketing copy must appear legibly inside the image. Follow the brief below exactly.",
  ].join(" ");
