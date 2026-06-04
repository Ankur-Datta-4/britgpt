/** Britannia portfolio — core positioning for flavor-card Reasoning. */
export const BRITANNIA_BRAND_POSITIONING: Record<string, string> = {
  "Good Day":
    "Everyday premium indulgence built around generosity, richness, and loaded ingredients (cashews, butter, choco chips, etc.).",
  "Marie Gold":
    'Light, wholesome tea-time biscuit positioned around simplicity, daily consumption, and "smart snacking."',
  Tiger:
    "Affordable nutrition-led biscuit for mass consumers, especially children and families seeking value plus energy.",
  "Milk Bikis":
    "Milk-powered nourishment and taste for growing children, combining nutrition cues with fun.",
  NutriChoice:
    "Health-conscious snacking platform focused on digestive, high-fibre, millet, diabetic-friendly, and wellness propositions.",
  "50-50":
    "Playful sweet-and-salty cracker brand built around taste contrast and snack-time fun.",
  "Treat Wafers":
    "Fun-filled indulgence through wafers targeted at younger consumers.",
  "Jim Jam":
    "Nostalgic jam-and-cream biscuit positioned as playful, colorful, and kid-friendly indulgence.",
  Bourbon:
    "Chocolate indulgence brand that delivers a richer, more grown-up chocolate biscuit experience.",
  "Pure Magic":
    "Premium indulgence platform offering richer textures, chocolate, cookies, and gifting-worthy experiences.",
  "Little Hearts":
    "Light-hearted, youthful sweet snack associated with romance, sharing, and emotional expression.",
  "Nice Time":
    "Affordable coconut-flavoured indulgence delivering a familiar comfort-snacking experience.",
  "Milk Rusk / Toastea":
    "Tea companion brand built around crunch, comfort, and habitual tea-time consumption.",
  "Britannia Cakes":
    "Affordable bakery indulgence for everyday celebrations, lunchboxes, and snacking occasions.",
  "Treat Croissant":
    "Accessible European-style bakery indulgence bringing café-like experiences into mass retail.",
  Gobbles:
    "Convenient on-the-go filled cake snack designed for impulse and school-break occasions.",
};

const BRAND_ALIASES: Record<string, string> = {
  "50-50": "50-50",
  Treat: "Treat Wafers",
  "Treat Cakes": "Britannia Cakes",
  Cake: "Britannia Cakes",
  Toastea: "Milk Rusk / Toastea",
  "Milk Rusk": "Milk Rusk / Toastea",
  "Good Day Harmony": "Good Day",
};

export const resolveBrandKey = (brandFit?: string) => {
  const raw = String(brandFit || "").split(",")[0]?.trim();
  if (!raw) return null;
  if (BRITANNIA_BRAND_POSITIONING[raw]) return raw;
  if (BRAND_ALIASES[raw]) return BRAND_ALIASES[raw];
  const hit = Object.keys(BRITANNIA_BRAND_POSITIONING).find(
    (k) => k.toLowerCase() === raw.toLowerCase()
  );
  return hit || raw;
};

export const getBrandPositioning = (brandFit?: string) => {
  const key = resolveBrandKey(brandFit);
  if (!key) return null;
  return BRITANNIA_BRAND_POSITIONING[key] || null;
};

export const FLAVOR_INDEX_TOOLTIPS: Record<string, string> = {
  "DIY Index":
    "How often consumers experiment with this flavour at home (recipes, mixes, hacks) — higher = more kitchen-led buzz.",
  Shareability:
    "Social spread potential: posts, shares, and UGC velocity for this flavour across monitored channels.",
  "Consumption Intent":
    "Craving and repeat-snack intent signals — willingness to seek out and consume again soon.",
  Comfort:
    "Nostalgia and everyday ritual strength — tea-time, family, and habitual snacking association.",
  Curiosity:
    "Novelty and trial interest — how much the flavour drives discovery and first-time tries.",
};

export const BRANDS_COUNT_TOOLTIP =
  "Count of distinct Britannia brands currently associated with this flavour in competitive mapping (from Flavor Insights brand rows).";

export type BritanniaFitReasoning = {
  brand: string;
  positioning: string;
  summary: string;
  bullets: string[];
};

export const buildBritanniaFitReasoning = (flavor: {
  name: string;
  brandFit?: string;
  whyPopular?: string;
  extensions?: string;
  trendType?: string;
  engGrowth?: string;
  states?: string;
}): BritanniaFitReasoning | null => {
  const brand = resolveBrandKey(flavor.brandFit);
  const positioning = brand ? getBrandPositioning(brand) : null;
  if (!brand || !positioning) return null;

  const bullets = [
    `${flavor.name} scores ${flavor.engGrowth || "—"} engagement growth with ${flavor.trendType || "—"} trend status — ${positioning.split(".")[0]}.`,
    flavor.whyPopular
      ? `Consumer pull: ${flavor.whyPopular} — aligns with the brand's occasion and taste territory.`
      : null,
    flavor.extensions
      ? `Extension runway (${flavor.extensions}) fits formats this brand already plays in.`
      : null,
    flavor.states
      ? `State concentration (${flavor.states}) informs pack architecture and go-to-market sequencing.`
      : null,
  ].filter(Boolean) as string[];

  return {
    brand,
    positioning,
    summary: `We recommend ${brand} because ${flavor.name}'s demand profile, occasion cues, and format stretch map cleanly to this brand's core positioning.`,
    bullets,
  };
};
