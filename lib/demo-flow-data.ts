import statesJson from "@/lib/demo-states-parsed.json";
import nationalJson from "@/lib/demo-national-parsed.json";
import flavorMachineJson from "@/lib/demo-flavor-machine.json";
import stateClustersJson from "@/lib/demo-state-clusters.json";
import stateDetailsJson from "@/lib/demo-state-details-parsed.json";
import winningFlavorsJson from "@/lib/demo-winning-flavors-parsed.json";
import crossStateJson from "@/lib/demo-cross-state-parsed.json";

export const DEFAULT_RESEARCH_PROMPT =
  "Map India's top traditional sweet and savory flavors state-by-state, uncover trending opportunities, and identify product extensions for Britannia's portfolio.";

export const DEMO_SOURCES = [
  "Amazon Reviews",
  "Flipkart Reviews",
  "Zomato",
  "Swiggy",
  "Instagram",
  "YouTube",
  "X",
  "Reddit",
  "LinkedIn",
] as const;

export const DEMO_TIMEFRAMES = [
  "Last 6 Months",
  "Last 1 Year",
  "Custom Timeframe",
] as const;

export const DEMO_GENERATIONS = [
  "Gen Alpha",
  "Gen Z",
  "Millennials",
  "Gen Y",
] as const;

export const DEMO_AGE_CATEGORIES = ["18-24", "25-34", "35-44", "45+"] as const;

export const DEMO_LIFESTYLES = ["Urban", "Semi-Urban", "Rural"] as const;

export const DEMO_CITY_TIERS = ["Tier 1", "Tier 2", "Tier 3+"] as const;

export const FIXED_RUN_STATS = {
  credits: 2,
  tat: "45 Minutes",
  confidence: "92%",
};

export const RRP_TIMELINE_STAGES = [
  { id: "context", title: "Reading your brief", desc: "Understanding your question and Britannia portfolio scope", dur: 600 },
  { id: "aggregate", title: "Reviewing sources", desc: "Instagram · Reddit · X · YouTube · Amazon · Flipkart · Zomato · Swiggy · LinkedIn", dur: 700 },
  { id: "collect", title: "Gathering conversations", desc: "Pulling 1.53L+ conversations across India", dur: 800 },
  { id: "clean", title: "Filtering signals", desc: "Removing noise · checking language · keeping real consumer voices", dur: 700 },
  { id: "analyse", title: "Finding patterns", desc: "State flavors · growth · engagement · extension ideas", dur: 900 },
  { id: "report", title: "Building your report", desc: "Pulling together findings, charts, and next steps", dur: 1000 },
];

export const BRITANNIA_CONSUMER_QUOTES = [
  {
    text: "Good Day Butter still wins the tea-time slot in Mumbai kirana — Britannia needs a clearer premium story on new packs to justify ₹10 more.",
    att: "Mumbai · Amazon + Flipkart · Good Day",
  },
  {
    text: "Ordered the new 50-50 on Amazon for evening chai. Delivery was quick but the crunch could be better. ⭐★★★☆ (Rated by 430 folks)",
    att: "Bangalore · Amazon · 50-50",
  },
  {
    text: "Treat Jim Jam vs Oreo in school tiffin — parents switch to Britannia when the ₹10 promo hits; taste parity is there but brand trust tips it.",
    att: "Delhi NCR · social · Treat",
  },
  {
    text: "Got the NutriChoice digestives from Flipkart. Always my go-to healthy snack! ⭐⭐⭐⭐⭐ (Rated by 1,240 folks)",
    att: "Mumbai · Flipkart · NutriChoice",
  },
  {
    text: "Marie Gold + chai is non-negotiable in Bengal; low-sugar Marie threads are growing — Britannia should lead the health cue before local players.",
    att: "West Bengal · panel + social · Marie Gold",
  },
  {
    text: "Added Britannia cake to my Zomato food order as a dessert. Was surprisingly fresh! ⭐⭐⭐⭐☆ (Rated by 890 folks)",
    att: "Pune · Zomato · Cakes",
  },
];

export const HERO_THESIS = {
  title: "Honey Chilli & Gunpowder Podi Are Redefining Indian Snacking",
  headline: "Honey Chilli and Gunpowder Podi lead India's trending snack flavors",
  body: "Sweet-heat and regional spice profiles are gaining rapid traction across states, pointing to growing consumer appetite for layered, bold flavors.",
};

export const FLAVOR_MACHINE = flavorMachineJson as Array<{
  name: string;
  convGrowth: string;
  engGrowth: string;
  productCategory: string;
  brandFit: string;
}>;

export const STATE_FLAVOR_CLUSTERS = stateClustersJson as Array<{
  id: string;
  label: string;
  insight: string;
  rows: Array<{ flavor: string; convVolume: string; engVolume: string }>;
}>;

export const DEMO_STATES = statesJson as Array<{
  state: string;
  sweet: string[];
  savory: string[];
}>;

export const STATE_DETAILS = stateDetailsJson as Record<
  string,
  {
    insight: string;
    takeaway: string;
    metrics: Array<{
      flavor: string;
      type: "Sweet" | "Savory";
      convVolume: string;
      totalEngagement: string;
    }>;
  }
>;

export const STATE_WINNING_FLAVORS = winningFlavorsJson as Array<{
  state: string;
  flavorType: string;
  flavor: string;
  trendType: string;
  extensions: string;
  brandFit: string;
}>;

export const NATIONAL_FLAVORS = nationalJson as Array<{
  name: string;
  convGrowth: string;
  engGrowth: string;
  trendType: string;
  states: string;
  extensions: string;
  brandFit: string;
}>;

const CROSS_LABELS: Record<string, Record<string, string>> = {
  zone: {
    north: "North India",
    south: "South India",
    west: "West India",
    east: "East India",
    northeast: "Northeast India",
  },
  weather: {
    summer: "Summer (Mar–Jun)",
    monsoon: "Monsoon (Jul–Sep)",
    winter: "Winter (Nov–Feb)",
  },
  age: {
    genz: "Gen Z (18–24)",
    millennials: "Millennials (25–38)",
    families: "Parents & families (30–45)",
    "45plus": "45 and above",
  },
};

const withLabels = (dim: "zone" | "weather" | "age", items: typeof crossStateJson.zone) =>
  items.map((item) => ({
    ...item,
    label: CROSS_LABELS[dim][item.id] || item.label || item.id,
  }));

export const CROSS_STATE_INSIGHTS = {
  zone: withLabels("zone", crossStateJson.zone),
  weather: withLabels("weather", crossStateJson.weather),
  age: withLabels("age", crossStateJson.age),
};

export const DELIVERABLE_TYPES = [
  {
    id: "content_cards",
    label: "Concept Cards",
    configureTitle: "Concept cards",
    description:
      "Social-ready concept mock-ups with pack visuals, headline, and CTA — built for quick stakeholder review.",
    actionId: "concept_cards",
    iconClass: "deliverable-icon--cards",
    icon: "▤",
  },
  {
    id: "storyboard",
    label: "Video Ad Storyboard",
    configureTitle: "Video ad storyboard",
    description:
      "Visual 30s storyboard mock-up with framed scenes, VO, and on-screen text.",
    actionId: "storyboard",
    iconClass: "deliverable-icon--storyboard",
    icon: "🎬",
  },
  {
    id: "creative_brief",
    label: "Creative brief",
    configureTitle: "Creative brief",
    description:
      "Messaging, tone, hooks, and positioning in one brief — ready for agency production.",
    actionId: "creative_brief",
    iconClass: "deliverable-icon--brief",
    icon: "📋",
  },
] as const;

export const parsePct = (s: string) => parseFloat(String(s).replace("%", "")) || 0;

/** Matrix + legacy national table compatibility */
export const flavorMachineAsNational = () =>
  FLAVOR_MACHINE.map((f) => ({
    name: f.name,
    convGrowth: f.convGrowth,
    engGrowth: f.engGrowth,
    trendType: parsePct(f.convGrowth) >= 40 ? "Established" : parsePct(f.convGrowth) >= 30 ? "Emerging" : "Stable",
    states: "",
    extensions: f.productCategory,
    brandFit: f.brandFit,
  }));

export const getStateInsight = (state: string) =>
  STATE_DETAILS[state]?.insight ||
  `${state}: Local sweet and savory top-5 flavors show distinct regional identity — anchor national launches to local heroes before scaling.`;

export const getStateTakeaway = (state: string) =>
  STATE_DETAILS[state]?.takeaway ||
  `What this means: Lead with the top sweet and savory flavors in ${state} before scaling nationally.`;

export const getStateMetrics = (state: string) => STATE_DETAILS[state]?.metrics || [];

export const getWinningByState = (state: string) =>
  STATE_WINNING_FLAVORS.filter((r) => r.state === state);

export const NATIONAL_TREND_FILTERS = [
  "All trends",
  "Established",
  "Emerging",
  "Stable",
  "Seasonal",
  "Fad",
] as const;

const STATE_ABBR: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  Assam: "AS",
  Bihar: "BR",
  Chhattisgarh: "CG",
  "Delhi NCR": "DL",
  Goa: "GA",
  Gujarat: "GJ",
  Haryana: "HR",
  "Himachal Pradesh": "HP",
  Jharkhand: "JH",
  Karnataka: "KA",
  Kerala: "KL",
  "Madhya Pradesh": "MP",
  Maharashtra: "MH",
  Manipur: "MN",
  Meghalaya: "ML",
  Mizoram: "MZ",
  Nagaland: "NL",
  Odisha: "OD",
  Punjab: "PB",
  Rajasthan: "RJ",
  Sikkim: "SK",
  "Tamil Nadu": "TN",
  Telangana: "TS",
  Tripura: "TR",
  "Uttar Pradesh": "UP",
  Uttarakhand: "UK",
  "West Bengal": "WB",
  "North India": "NI",
};

export const parseNationalStatePills = (states: string) => {
  const parts = states.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 5) {
    return [{ abbr: "National", full: "Pan-India", isNational: true }];
  }
  return parts.map((full) => ({
    abbr: STATE_ABBR[full] || full.slice(0, 2).toUpperCase(),
    full,
    isNational: false,
  }));
};

export const parseNationalExtensions = (extensions: string) => {
  const items = extensions.split(",").map((s) => s.trim()).filter(Boolean);
  return { primary: items[0] || "", rest: items.slice(1) };
};

export const inferNationalCategory = (extensions: string) => {
  const e = extensions.toLowerCase();
  if (/cracker|chip|wafer|namkeen|khakhra|sticks|puff/i.test(e)) return "Crackers";
  if (/cookie|biscuit|cream|croissant/i.test(e)) return "Biscuits";
  if (/dessert|cheesecake|caramel|cake|bar/i.test(e)) return "Dessert snacks";
  if (/nuts|granola|protein/i.test(e)) return "Health snacks";
  return "Savory snacks";
};

export const filterNationalByTrend = (
  flavors: typeof NATIONAL_FLAVORS,
  trendFilter: string
) => {
  if (!trendFilter || trendFilter === "All trends") return flavors;
  return flavors.filter((f) => f.trendType === trendFilter);
};
