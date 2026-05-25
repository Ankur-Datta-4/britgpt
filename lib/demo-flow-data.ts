import statesJson from "@/lib/demo-states-parsed.json";
import nationalJson from "@/lib/demo-national-parsed.json";

export const DEFAULT_RESEARCH_PROMPT =
  "Map India's top traditional sweet and savory flavors state-by-state, uncover trending opportunities, and identify product extensions for Britannia's portfolio.";

export const DEMO_SOURCES = [
  "Amazon Reviews",
  "Flipkart Reviews",
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
  { id: "context", title: "Setting context", desc: "Parsing brief · mapping Britannia portfolio scope", dur: 1600 },
  { id: "aggregate", title: "Source aggregation", desc: "Instagram · Reddit · X · YouTube · Amazon · Flipkart · LinkedIn", dur: 1900 },
  { id: "collect", title: "Collecting data", desc: "Pulling 1.53L+ conversations across India", dur: 2100 },
  { id: "clean", title: "Cleaning data", desc: "Deduping · language · spam · entity resolution", dur: 1800 },
  { id: "analyse", title: "Analysing data", desc: "State flavors · growth · engagement · extensions", dur: 2200 },
  { id: "report", title: "Report generation", desc: "Synthesising narrative · matrices · actionables", dur: 2000 },
];

export const HERO_THESIS = {
  title: "Honey Chilli & Gunpowder Podi Are Redefining Indian Snacking",
  body: "Honey Chilli and Gunpowder Podi lead India's trending snack flavors. Sweet-heat and regional spice profiles are gaining rapid traction across states, pointing to growing consumer appetite for layered, bold flavors.",
};

export const DEMO_STATES = statesJson as Array<{
  state: string;
  sweet: string[];
  savory: string[];
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

export const parsePct = (s: string) => parseFloat(String(s).replace("%", "")) || 0;

export const buildFlavorMetrics = (
  state: string,
  flavors: string[],
  type: "Sweet" | "Savory"
) =>
  flavors.map((flavor, i) => {
    const seed = state.length + flavor.length + i + (type === "Savory" ? 40 : 0);
    const conv = (8 + seed * 0.35).toFixed(1);
    const eng = (55 + seed * 1.8).toFixed(1);
    return { flavor, type, conv: `${conv}K`, eng: `${eng}K` };
  });

export const STATE_STRATEGIC_INSIGHT: Record<string, string> = {
  "Maharashtra":
    "Maharashtra overindexes on aggressive spice systems and crunchy formats — Thecha and Schezwan lead savory; Honey Chilli bridges sweet-heat.",
  "Delhi NCR":
    "North India's urban snacking culture is shifting toward swicy and fusion-led flavors with Indo-Chinese cues.",
  "Tamil Nadu":
    "Podi is evolving beyond accompaniment into a scalable modern snacking language with layered spice depth.",
  "Karnataka":
    "Gunpowder Podi and filter-coffee caramel cues anchor premium South Indian snack identity.",
  "West Bengal":
    "Dairy dessert culture creates whitespace for premium dessert-snacking hybrids — Mishti Doi and Nolen Gur lead.",
  "Bihar":
    "Tilkut and Sattu strongholds — heritage formats win; Honey Chilli adoption is rising in urban pockets.",
};

export const STATE_WINNING_CLUSTERS = [
  {
    id: "south-podi",
    label: "Tamil Nadu + Karnataka",
    insight:
      "Podi is evolving beyond accompaniment culture into a scalable modern snacking language. Consumers associate podi flavors with authenticity, layered spice depth, and regional pride.",
    rows: [
      { flavor: "Gunpowder Podi", conv: "22.1K", eng: "166.8K" },
      { flavor: "Gunpowder Butter", conv: "18.7K", eng: "139.2K" },
      { flavor: "Gunpowder Cheese", conv: "16.2K", eng: "121.8K" },
      { flavor: "Jigarthanda", conv: "9.8K", eng: "68.5K" },
      { flavor: "Lemon Masala", conv: "12.4K", eng: "82.7K" },
    ],
  },
  {
    id: "delhi-ncr",
    label: "Delhi + NCR",
    insight:
      "North India's urban snacking culture is shifting toward swicy and fusion-led flavors that feel globally inspired yet culturally familiar through Indo-Chinese food cues.",
    rows: [
      { flavor: "Honey Chilli", conv: "24.8K", eng: "181.3K" },
      { flavor: "Korean Gochujang", conv: "17.9K", eng: "142.6K" },
      { flavor: "Chaat Masala", conv: "15.6K", eng: "104.4K" },
      { flavor: "Peri Peri", conv: "14.1K", eng: "93.8K" },
      { flavor: "Smoky BBQ", conv: "11.4K", eng: "76.1K" },
    ],
  },
  {
    id: "maharashtra",
    label: "Maharashtra",
    insight:
      "Maharashtra overindexes on aggressive spice systems and crunchy formats, making it one of the strongest launchpads for bold savory experimentation.",
    rows: [
      { flavor: "Thecha", conv: "18.4K", eng: "132.7K" },
      { flavor: "Bhakarwadi", conv: "15.7K", eng: "104.2K" },
      { flavor: "Saoji Spice", conv: "11.2K", eng: "79.6K" },
      { flavor: "Honey Chilli", conv: "10.6K", eng: "74.8K" },
      { flavor: "Caramel Chikki", conv: "9.6K", eng: "68.3K" },
    ],
  },
  {
    id: "up-raj",
    label: "Uttar Pradesh + Rajasthan",
    insight:
      "Festive indulgence remains a major emotional entry point in North India, especially when traditional dessert flavors are reframed through modern snacking formats.",
    rows: [
      { flavor: "Gulkand", conv: "19.6K", eng: "145.8K" },
      { flavor: "Thandai", conv: "16.3K", eng: "121.4K" },
      { flavor: "Banarasi Paan", conv: "14.7K", eng: "108.9K" },
      { flavor: "Jalebi Rabri", conv: "13.2K", eng: "98.5K" },
      { flavor: "Ghevar Cream", conv: "10.1K", eng: "73.7K" },
    ],
  },
  {
    id: "east",
    label: "West Bengal + Odisha",
    insight:
      "Eastern India's dairy dessert culture creates whitespace for premium dessert-snacking hybrids with café-style visual and indulgence appeal.",
    rows: [
      { flavor: "Burnt Caramel", conv: "16.1K", eng: "118.4K" },
      { flavor: "Mishti Doi", conv: "15.3K", eng: "109.6K" },
      { flavor: "Chhena Poda", conv: "14.8K", eng: "103.2K" },
      { flavor: "Rasgulla Cream", conv: "10.7K", eng: "74.3K" },
      { flavor: "Kosha Spice", conv: "8.9K", eng: "62.8K" },
    ],
  },
];

export const CROSS_STATE_INSIGHTS = {
  zone: [
    {
      id: "north",
      label: "North India",
      insight:
        "The North is India's flavor-maximalist zone — Honey Chilli is the undisputed sweet leader. Schezwan Masala and Chaat Masala Blast dominate savory. Delhi NCR acts as the trend-setter.",
      keyFlavors: "Honey Chilli, Schezwan Masala, Chaat Masala Blast, Tandoori BBQ, Rose Paan Candy",
      signal: "High — fastest adoption of new flavors, highest willingness to trial limited-edition SKUs.",
    },
    {
      id: "south",
      label: "South India",
      insight:
        "Podi-first, authenticity-led market. Gunpowder Podi holds #1 savory in Karnataka, Tamil Nadu, Andhra Pradesh, and Telangana. Generic 'South Indian' labeling is penalised.",
      keyFlavors: "Gunpowder Podi, Tamarind Candy, Chettinad Pepper, Filter Coffee Caramel",
      signal: "High but conditional — requires regional specificity in naming and packaging.",
    },
    {
      id: "west",
      label: "West India",
      insight:
        "Maharashtra leads as the most fusion-open market. Schezwan Masala is entrenched as a daily snack flavour. Gujarat adds sweet-savory duality with Sev Masala and Mohanthal.",
      keyFlavors: "Honey Chilli, Schezwan Masala, Vada Pav Masala, Caramel Corn, Sev Masala",
      signal: "High — strong test-and-learn market, especially Maharashtra and urban Gujarat.",
    },
    {
      id: "east",
      label: "East India",
      insight:
        "Most heritage-anchored zone. Mishti Doi Caramel and Nolen Gur Toffee outperform Honey Chilli in West Bengal. Nostalgia-led positioning outperforms novelty.",
      keyFlavors: "Mishti Doi Caramel, Nolen Gur Toffee, Chhena Poda Caramel, Tilkut Sesame Jaggery, Sattu Masala",
      signal: "Moderate — high loyalty once trust is earned; slow to trial.",
    },
    {
      id: "northeast",
      label: "Northeast India",
      insight:
        "Most distinctive palate — fermented, smoked, chilli-forward savory. Low volume, high brand-equity potential via collaborations and limited editions.",
      keyFlavors: "Bhut Jolokia Spice, Raja Mircha, Wild Honey Crunch, Bamboo Shoot Masala",
      signal: "Low volume, high cultural capital through authentic limited drops.",
    },
  ],
  weather: [
    {
      id: "summer",
      label: "Summer (Mar–Jun)",
      insight:
        "Tangy, acidic, and cooling profiles spike. Raw Mango Salt, Tamarind Candy, and Kokum Chaat peak. Gunpowder Podi and Schezwan dip ~15–20%.",
      peakFlavors: "Raw Mango Salt, Tamarind Candy, Kokum Chaat, Mango Aamchur Twist",
      implication: "Time-limited summer SKUs in tangy-sweet formats can capture outsized share.",
    },
    {
      id: "monsoon",
      label: "Monsoon (Jul–Sep)",
      insight:
        "Fried snack and chai companion moments drive peak engagement. Schezwan, Gunpowder Podi, Vada Pav Masala spike 30–40% over baseline.",
      peakFlavors: "Schezwan Masala, Gunpowder Podi, Vada Pav Masala, Mumbai Cutting Chai",
      implication: "Best window for savory launches and chai-time positioning.",
    },
    {
      id: "winter",
      label: "Winter (Nov–Feb)",
      insight:
        "Warm, rich sweets reach peak salience. Premium SKUs have strongest LTV window. Festive gifting creates secondary demand spike.",
      peakFlavors: "Nolen Gur Toffee, Jaggery Sesame, Filter Coffee Caramel, Dark Choc Sea Salt",
      implication: "Premium window — festive gift packs and regional assortment boxes perform best.",
    },
  ],
  age: [
    {
      id: "genz",
      label: "Gen Z (18–24)",
      insight:
        "Honey Chilli is Gen Z's signature flavor nationally. Discovery-driven, low loyalty, heavily influenced by short-form content.",
      topFlavors: "Honey Chilli, Schezwan Masala, Dark Choc Sea Salt, Rose Paan Candy",
      trial: "Very high trial. Retention requires ongoing cultural relevance.",
    },
    {
      id: "millennials",
      label: "Millennials (25–38)",
      insight:
        "Highest spend-per-occasion. Balance nostalgia with novelty — crossover SKUs strongest here.",
      topFlavors: "Honey Chilli, Filter Coffee Caramel, Jaggery Sesame, Gunpowder Podi",
      trial: "High trial. Strong retention in weekly rotation.",
    },
    {
      id: "families",
      label: "Parents & families (30–45)",
      insight:
        "Highest repeat-purchase segment. Mothers are primary buyers. Familiar, milk-based, jaggery flavors win.",
      topFlavors: "Elachi Milk Toffee, Coconut Jaggery, Nolen Gur Toffee, Mishti Doi Caramel",
      trial: "Moderate for new flavors. Highest lifetime value.",
    },
    {
      id: "45plus",
      label: "45 and above",
      insight:
        "Low adoption of experimental launches — core buyer for festive gifting and heritage SKUs.",
      topFlavors: "Tamarind Candy, Kasundi Mustard, Gunpowder Podi, Tilkut Sesame Jaggery",
      trial: "Low for new formats. High-value festive and heritage packs.",
    },
  ],
};

export const DELIVERABLE_TYPES = [
  { id: "create", label: "Create", sub: "Concept cards · packshots", actionId: "concept_cards", primary: true },
  { id: "create_film", label: "Create film", sub: "30s hero ad", actionId: "create_film" },
  { id: "messaging", label: "Content & messaging", sub: "Platform copy + hooks", actionId: "content_engine" },
  { id: "storyboard", label: "Video ad storyboard", sub: "30s scene-by-scene", actionId: "storyboard" },
  { id: "positioning", label: "Positioning", sub: "Brand + shelf story", actionId: "positioning" },
] as const;

export const getStateInsight = (state: string) =>
  STATE_STRATEGIC_INSIGHT[state] ||
  `${state}: Local sweet and savory top-5 flavors show distinct regional identity — anchor national SKUs to local heroes before scaling.`;
