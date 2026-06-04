// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BRIT_DATA } from '@/lib/data';
import {
  DEMO_SOURCES,
  DEMO_STATES,
  FIXED_RUN_STATS,
  HERO_THESIS,
  RRP_TIMELINE_STAGES,
  BRITANNIA_CONSUMER_QUOTES,
} from '@/lib/demo-flow-data';
import { ACTIONS, runAction } from '@/lib/actions';
import { getApiKey, setApiKey, hasApiKey } from '@/lib/config-client';
import {
  RegionBarChart,
  SentimentDonutChart,
  TrendLineChart,
  FlavorGrowthChart,
} from '@/components/brit/brit-charts';

const D = () => BRIT_DATA;

/* ============================================================
   Shared data — Flavor Insights India (Consuma AI, 20 May 2026)
============================================================ */
const SUGGESTIONS = (D().predefinedQuestions || [
  { tag: "Flavour", q: "Top flavour trends by state across India" },
  { tag: "Sentiment", q: "Sentiment towards biscuits and sweets" },
  { tag: "Extension", q: "Extension opportunities for biscuits and sweets" },
]).map((p) => ({ tag: p.tag, q: p.q, hint: p.hint }));

const BOOT_LINES = [
  { t: "0.20s", text: "Starting your research…",                   marker: null,  done: false },
  { t: "0.60s", text: "Consumer discovery started",              marker: "✓",   done: true  },
  { t: "1.10s", text: "Gathering market signals…",               marker: null,  done: false },
  { t: "1.80s", text: "9 channels identified · 15M conversations", marker: "✓", done: true },
  { t: "2.40s", text: "Analyzing flavor patterns…",              marker: null,  done: false },
  { t: "3.10s", text: "Generating follow-up questions",          marker: "✓",   done: true  },
];

const REGIONS = ["Pan-India", "North", "South", "West", "East", "Metro"];
const TIMEFRAMES = ["90 days", "6 months", "12 months", "24 months"];
const OBJECTIVES = ["Product extension", "Regional launch", "Pricing strategy", "Channel mix", "Brand refresh"];
const FILTERS = ["Urban", "Rural", "Premium tier", "Mass tier", "Gen-Z", "Millennials", "Families"];

const SOURCE_NAMES = [...DEMO_SOURCES];

const REGIONS_DATA = (D().favoriteSavoryShares || []).slice(0, 6).map((f) => ({
  lbl: f.flavor,
  val: f.pct,
}));

const FLAVOURS = [
  { name: "Gulkand",            grow: "+31.62%", bars: [3,5,4,6,7,8,9], down: false },
  { name: "Caramel",            grow: "+62.43%", bars: [4,4,5,5,6,7,7], down: false },
  { name: "Thandai",            grow: "+29.32%", bars: [2,3,4,5,5,6,7], down: false },
  { name: "Pistachio Kesar",    grow: "+60%",    bars: [3,4,4,5,5,5,6], down: false },
  { name: "Date Jaggery Til",   grow: "+75%",    bars: [3,3,4,4,4,5,5], down: false },
  { name: "Gunpowder Podi",     grow: "+55%",    bars: [3,4,5,5,6,6,7], down: false },
];

const SENT_DATA = [
  { lbl: "Positive", v: 73.1, color: "oklch(0.55 0.13 155)" },
  { lbl: "Neutral",  v: 14.5, color: "oklch(0.60 0.01 50)" },
  { lbl: "Negative", v: 12.4, color: "oklch(0.54 0.205 25)" },
];

const TOTAL_CONVERSATIONS = FIXED_RUN_STATS.signalsProcessed || D().meta?.totalSample || 153496;
const KAJU_KATLI_GROWTH = 48.7;
const HONEY_CHILLI_GROWTH = D().honeyChilli?.convGrowthPct || 48.7;
const GUNPOWDER_GROWTH = D().gunpowderPodi?.convGrowthPct || 46.2;
const heroFlavorStats = () => [
  { k: "Kaju Katli Conv. Growth", v: String(KAJU_KATLI_GROWTH), suffix: "%" },
  { k: "Gunpowder Podi Conv. Growth", v: String(GUNPOWDER_GROWTH), suffix: "%" },
];
const REGIONAL_SWEET_POSITIVE = D().regionalSweetSentiment?.positivePct || 68.4;

const SAVORY_EXTENSIONS = D().savoryOpportunities?.flatMap((o) => o.extensions.slice(0, 2)) || [
  "Podi crackers", "Coated crackers", "Schezwan chips", "Chaat crackers",
];
const SWEET_EXTENSIONS = D().sweetOpportunities?.flatMap((o) => o.extensions.slice(0, 2)) || [
  "Jaggery biscuits", "Tamarind cookies", "Mishti doi bites", "Gur toffee bites",
];

const STATES_TABLE = [
  { state: "APT", sweet: ["Pootharekulu", "Bobbatlu", "Bandar Ladoo", "Madugula Halwa", "Kesar Pista"], savory: ["Gunpowder Podi", "Avakaya", "Karam Podi", "Kadapa Kaaram Dosa", "Sanna Karappusa"] },
  { state: "Bihar", sweet: ["Thekua", "Tilkut", "Date Jaggery Til", "Anarsa", "Khaja / Malpua"], savory: ["Sattu", "Litti Chokha", "Samosa Chaat", "Ghugni Churra", "Champaran Mutton"] },
  { state: "Delhi", sweet: ["Mithai", "Jalebi", "Malai Lassi", "Sweet Lassi", "Gulkand / Paan"], savory: ["Chhole Bhature", "Aloo Chaat", "Papdi Chaat", "Paratha", "Honey Chilli"] },
  { state: "Gujarat", sweet: ["Ghari", "Fafda-Jalebi", "Aamras", "Piyush", "Cold Coco"], savory: ["Dhokla", "Khaman", "Handvo", "Undhiyu", "Bhakarwadi"] },
  { state: "Karnataka", sweet: ["Mysore Pak", "Dharwad Peda", "Holige", "Badam Milk", "Bevu Bella"], savory: ["Gunpowder Podi", "Benne Dosa", "Thatte Idli-Vada", "Akki Rotti", "Masala Soda"] },
  { state: "Maharashtra", sweet: ["Puran Poli", "Modak", "Shrikhand", "Tilgul", "Caramel Chikki"], savory: ["Misal Pav", "Vada Pav", "Thecha", "Bhakarwadi", "Saoji Spice"] },
  { state: "Odisha", sweet: ["Chhena Poda", "Chhena Jhili", "Rasabali", "Khaja", "Caramel / Burnt Chhena"], savory: ["Bara Ghuguni", "Dahibara Aloodum", "Gupchup", "Papodi", "Egg Chop"] },
  { state: "Rajasthan", sweet: ["Ghevar", "Churma Laddu", "Thandai", "Gulkand", "Mawa Kachori / Malpua"], savory: ["Pyaaz Kachori", "Mirchi Vada", "Dal Baati Churma", "Laal Maas", "Lasan ke Kofte"] },
  { state: "Tamil Nadu", sweet: ["Adhirasam", "Thaen Mittai", "Sweet Pongal", "Jigarthanda", "Rose / Gulkand"], savory: ["Gunpowder Podi", "Idli", "Dosa", "Milagai Podi", "Lemon-Masala"] },
  { state: "Uttar Pradesh", sweet: ["Agra Petha", "Banarasi Paan / Gulkand", "Mathura Peda", "Thandai", "Jalebi"], savory: ["Aloo Dum", "Kachori", "Heeng Kachori", "Chaat", "Chaat Masala"] },
  { state: "West Bengal", sweet: ["Mishti Doi", "Sandesh", "Rasgulla", "Chhanar Jilipi", "Caramel / Burnt Dairy"], savory: ["Puchka", "Kachori", "Kathi Roll", "Ghugni", "Kosha Mangsho"] },
];

const FAVOUR_FLAVOR_SHARES = (D().favoriteSavoryShares || []).slice(0, 6).map((f) => ({
  lbl: f.flavor,
  val: f.pct,
}));

/* Per-question research scripts — real PDF data, deterministic demo paths */
const RESEARCH_SCRIPTS = {
  flavour: {
    id: "flavour",
    title: "Top flavours by state",
    scopeDefaults: { region: "Pan-India", obj: "Product extension" },
    muted: "State-level sweet & savory top-5 lists, flavor opportunity scores, and regional snack share.",
    cards: ["states", "flavour", "region", "quotes", "summary", "doc_states", "doc_winning", "doc_brands", "doc_verbatims", "doc_cross", "doc_national", "exec", "doc_actionables"],
    insight: {
      highlight: HERO_THESIS.headline,
      body: HERO_THESIS.body,
      stats: [
        ...heroFlavorStats(),
        { k: "Flavors Indexed", v: String(FIXED_RUN_STATS.flavorsIndexed) },
        { k: "Sample", v: "15M", suffix: "conversations" },
      ],
    },
    regionsData: [
      { lbl: "Maharashtra", val: 92 }, { lbl: "Tamil Nadu", val: 88 }, { lbl: "Karnataka", val: 85 },
      { lbl: "West Bengal", val: 81 }, { lbl: "Delhi", val: 78 }, { lbl: "Gujarat", val: 74 },
    ],
    regionTitle: "Regional flavor strength index",
    flavours: [
      { name: "Gulkand", grow: "+31.62%", bars: [3,5,4,6,7,8,9], down: false },
      { name: "Caramel", grow: "+62.43%", bars: [4,4,5,5,6,7,7], down: false },
      { name: "Thandai", grow: "+29.32%", bars: [2,3,4,5,5,6,7], down: false },
      { name: "Pistachio Kesar", grow: "+60%", bars: [3,4,4,5,5,5,6], down: false },
      { name: "Gunpowder Podi", grow: "+55%", bars: [3,4,5,5,6,6,7], down: false },
      { name: "Thecha", grow: "+55%", bars: [3,3,4,5,6,6,7], down: false },
    ],
    quotes: BRITANNIA_CONSUMER_QUOTES,
    exec: {
      h2: "Launch state-anchored flavor platforms — start with Maharashtra sweet + Thecha savory, and Delhi Honey Chilli.",
      p: "Index local top-5 flavors per state before nationalizing. Priority anchors: Caramel Chikki + Thecha (MH), Gunpowder Podi (South), Honey Chilli (Delhi/NCR).",
      meta: [{ k: "States", v: "29" }, { k: "Honey Chilli", v: "48.7%" }, { k: "Gunpowder Podi", v: "46.2%" }, { k: "Sample", v: "1.5L" }],
    },
  },
  sentiment: {
    id: "sentiment",
    title: "Regional sweet sentiment",
    scopeDefaults: { region: "East", obj: "Product extension" },
    muted: "Heritage sweets sentiment — Mishti Doi, Nolen Gur, and regional dessert trust across East India.",
    cards: ["sentiment", "trend", "quotes", "summary", "doc_states", "doc_winning", "doc_brands", "doc_verbatims", "doc_cross", "doc_national", "exec", "doc_actionables"],
    insight: {
      highlight: "Mishti Doi & Nolen Gur",
      body: "lead regional sweet conversations — heritage formats outperform novelty in West Bengal and Assam. Consumers reward authentic provenance over imported dessert cues.",
      stats: [
        { k: "Positive", v: "68.4", suffix: "%" },
        { k: "Mishti Doi growth", v: "35.4", suffix: "%" },
        { k: "Nolen Gur growth", v: "32.6", suffix: "%" },
        { k: "Sample", v: "1.5", suffix: "L" },
      ],
    },
    sentData: [
      { lbl: "Positive", v: 68.4, color: "oklch(0.55 0.13 155)" },
      { lbl: "Neutral", v: 19.2, color: "oklch(0.60 0.01 50)" },
      { lbl: "Negative", v: 12.4, color: "oklch(0.54 0.205 25)" },
    ],
    sentCenter: REGIONAL_SWEET_POSITIVE,
    sentMentions: D().regionalSweetSentiment?.conversations || 89420,
    trendLabel: "Regional sweets · positive sentiment",
    trendSolid: [62, 63, 64, 65, 65.5, 66, 66.5, 67, 67.5, 68, 68.2, 68.4],
    trendDashed: [72, 74, 76, 78, 80, 82, 84, 85, 86, 87, 88, 89],
    quotes: [
      { text: D().regionalSweetSentiment?.narrative || "Heritage sweets outperform novelty in the East.", att: "Regional sweets · Flavor Insights" },
      { text: "Mishti Doi Caramel and Nolen Gur Toffee show strongest repeat-conversation signals in Bengal and Assam.", att: "East India · last 12 months" },
      { text: "Nostalgia-led positioning beats novelty-led launches in West Bengal and Odisha.", att: "Cross-state synthesis" },
    ],
    exec: {
      h2: "Lead with Mishti Doi and Nolen Gur dessert-snack formats in East India before national scale.",
      p: "Yogurt-cream biscuits, jaggery caramel bites, and festival assortments align with 68.4% positive regional sweet sentiment.",
      meta: [{ k: "Positive", v: "68.4%" }, { k: "East anchor", v: "WB+AS" }, { k: "Format", v: "Dessert" }, { k: "Heritage", v: "High" }],
    },
  },
  extension: {
    id: "extension",
    title: "Extension opportunities",
    scopeDefaults: { region: "Pan-India", obj: "Product extension" },
    muted: "Indian sweet and savory extension ideas — Honey Chilli, Gunpowder Podi, and regional flavor platforms.",
    cards: ["extensions", "flavour", "region", "summary", "doc_states", "doc_winning", "doc_brands", "doc_verbatims", "doc_cross", "doc_national", "exec", "doc_actionables"],
    insight: {
      highlight: "Honey Chilli & Gunpowder Podi",
      body: "drive the clearest extension opportunities — national sweet-heat formats and South podi-led savory biscuits, backed by 48.7% and 46.2% conversation growth.",
      stats: [
        ...heroFlavorStats(),
        { k: "Savory ideas", v: "5", suffix: "" },
        { k: "Sweet ideas", v: "5", suffix: "" },
      ],
    },
    regionsData: FAVOUR_FLAVOR_SHARES,
    regionTitle: "Top savory flavor momentum (index)",
    flavours: [
      { name: "Honey Chilli", grow: "+48.7%", bars: [38,39,41,42,44,45,46,47,48,48.5,48.7,48.7], down: false },
      { name: "Gunpowder Podi", grow: "+46.2%", bars: [36,37,39,40,42,43,44,45,45.5,46,46.2,46.2], down: false },
      { name: "Schezwan Masala", grow: "+41.8%", bars: [32,33,35,36,38,39,40,40.5,41,41.5,41.8,41.8], down: false },
      { name: "Mishti Doi Caramel", grow: "+35.4%", bars: [28,29,30,31,32,33,34,34.5,35,35.2,35.4,35.4], down: false },
      { name: "Tamarind Candy", grow: "+30.8%", bars: [24,25,26,27,28,29,29.5,30,30.4,30.6,30.8,30.8], down: false },
      { name: "Sattu Masala", grow: "+34.5%", bars: [26,27,28,29,30,31,32,33,33.5,34,34.3,34.5], down: false },
    ],
    quotes: [
      { text: "Honey Chilli: coated crackers, baked chips, snack mix, cream biscuits — pan-India sweet-heat.", att: "Honey Chilli · national matrix" },
      { text: "Gunpowder Podi: podi crackers, khakhra, savory biscuits — TN, Karnataka, AP, Telangana.", att: "Gunpowder Podi · South" },
      { text: "Regional sweets: Mishti Doi caramel biscuits, Nolen Gur toffee bites, Tamarind chewy formats.", att: "Sweet opportunities · India" },
    ],
    exec: {
      h2: "Pilot Honey Chilli nationally and Gunpowder Podi in South — anchor packs to state top-5 flavors.",
      p: `Savory: ${SAVORY_EXTENSIONS.slice(0, 3).join(", ")}. Sweet: ${SWEET_EXTENSIONS.slice(0, 3).join(", ")}. Use state tables to localize naming before scale.`,
      meta: [{ k: "Honey Chilli", v: "48.7%" }, { k: "Gunpowder", v: "46.2%" }, { k: "States", v: "29" }, { k: "Confidence", v: "92%" }],
    },
  },
  honeyChilli: {
    id: "honeyChilli",
    title: "Honey Chilli trends",
    scopeDefaults: { region: "Pan-India", obj: "Product extension" },
    muted: "National sweet-heat growth, engagement, and extension formats.",
    cards: ["region", "extensions", "trend", "flavour", "summary", "exec"],
    insight: {
      highlight: "Honey Chilli",
      body: D().honeyChilli?.narrative || "Sweet-heat is the pan-India bridge flavor.",
      stats: [
        { k: "Conv. growth", v: "48.7", suffix: "%" },
        { k: "Eng. growth", v: "63.4", suffix: "%" },
        { k: "Trend", v: "Established", suffix: "" },
        { k: "States", v: "29", suffix: "" },
      ],
    },
    regionsData: FAVOUR_FLAVOR_SHARES,
    regionTitle: "Top savory flavor momentum (index)",
    flavours: [
      { name: "Honey Chilli", grow: "+48.7%", bars: [38,39,41,42,44,45,46,47,48,48.5,48.7,48.7], down: false },
      { name: "Gunpowder Podi", grow: "+46.2%", bars: [36,37,39,40,42,43,44,45,45.5,46,46.2,46.2], down: false },
      { name: "Schezwan Masala", grow: "+41.8%", bars: [32,33,35,36,38,39,40,40.5,41,41.5,41.8,41.8], down: false },
      { name: "Chaat Masala Blast", grow: "+38.6%", bars: [30,31,32,33,35,36,37,37.5,38,38.4,38.6,38.6], down: false },
      { name: "Tandoori BBQ", grow: "+35.1%", bars: [28,29,30,31,32,33,34,34.5,35,35,35.1,35.1], down: false },
      { name: "Thecha Spice", grow: "+44.8%", bars: [34,35,37,38,40,41,42,43,44,44.5,44.8,44.8], down: false },
    ],
    quotes: [
      { text: D().honeyChilli?.narrative || "", att: "Honey Chilli · report" },
      { text: "Strongest in Maharashtra, UP, Delhi NCR, Karnataka, and Telangana.", att: "National prioritization" },
      { text: `Extensions: ${(D().honeyChilli?.extensions || []).join(", ")}.`, att: "Product extension ideas" },
    ],
    exec: {
      h2: "Scale Honey Chilli on coated crackers and baked chips — national with state-localized packs.",
      p: `${HONEY_CHILLI_GROWTH}% conversation growth and ${D().honeyChilli?.engGrowthPct || 63.4}% engagement growth support a Treat and 50-50 launch window.`,
      meta: [{ k: "Conv.", v: "48.7%" }, { k: "Eng.", v: "63.4%" }, { k: "Trend", v: "Established" }, { k: "Regions", v: "5+" }],
    },
  },
  pricing: {
    id: "pricing",
    title: "Premium flavor elasticity",
    scopeDefaults: { region: "Metro", obj: "Pricing strategy" },
    muted: "Premium/luxury pull and health-premium signals from sweet flavor opportunity data.",
    cards: ["flavour", "sentiment", "region", "summary", "exec"],
    insight: {
      highlight: "premium flavor tiers",
      body: "show strongest pricing power on Caramel (62.43% premium/luxury pull) and Pistachio Kesar (60% healthy-ingredient demand, 35% nut premium) — better-for-you Date Jaggery Til at 75% natural-sweetener demand.",
      stats: [
        { k: "Caramel premium", v: "62.4", suffix: "%" },
        { k: "Natural sweetener", v: "75", suffix: "%" },
        { k: "Nut premium", v: "35", suffix: "%" },
        { k: "Gifting demand", v: "17.6", suffix: "%" },
      ],
    },
    regionsData: [
      { lbl: "Mishti Doi", val: 35 }, { lbl: "Nolen Gur", val: 33 }, { lbl: "Tamarind", val: 31 },
      { lbl: "Tilkut Sesame", val: 28 }, { lbl: "Qubani Meetha", val: 27 }, { lbl: "Honey Chilli", val: 49 },
    ],
    regionTitle: "Premium & health demand index (%)",
    flavours: [
      { name: "Caramel", grow: "+62.43%", bars: [4,5,6,7,8,9,9], down: false },
      { name: "Date Jaggery Til", grow: "+75%", bars: [3,4,5,6,7,8,8], down: false },
      { name: "Pistachio Kesar", grow: "+60%", bars: [3,4,4,5,6,7,7], down: false },
      { name: "Gulkand", grow: "+50%", bars: [3,3,4,5,5,6,6], down: false },
      { name: "Thandai", grow: "+29%", bars: [2,3,3,4,5,5,6], down: false },
      { name: "Honey Chilli", grow: "+48.7%", bars: [38,40,42,44,45,46,47,48,48.5,48.7,48.7,48.7], down: false },
    ],
    quotes: [
      { text: "Mishti Doi Caramel indexes high for family buyers in Bengal — yogurt-cream biscuit adjacency.", att: "Mishti Doi · sweet opportunity" },
      { text: "75% natural sweetener demand, 50% health-conscious choice — Date Jaggery Til for better-for-you premium.", att: "Date Jaggery Til · Bihar, MH, GJ" },
      { text: "60% healthy ingredients, 35% nut premium appeal, 17.57% gifting — Pistachio Kesar festive platform.", att: "Pistachio Kesar · RJ, GJ, MH" },
    ],
    exec: {
      h2: "Price premium packs on Mishti Doi and Nolen Gur platforms — tier Metro and East first.",
      p: "Elasticity favors heritage storytelling over mass discounting. Anchor ₹60–80 packs on regional sweet stories; Honey Chilli for national sweet-heat tier.",
      meta: [{ k: "Premium pull", v: "62%" }, { k: "Natural demand", v: "75%" }, { k: "Gifting", v: "17.6%" }, { k: "Metro", v: "First" }],
    },
  },
  default: {
    id: "default",
    title: "Sweet & savory insights",
    scopeDefaults: { region: "South", obj: "Product extension" },
    muted: "State deep dives, winning flavors, cross-state synthesis, national matrix, and actionables.",
    cards: ["summary", "quotes", "doc_states", "doc_winning", "doc_brands", "doc_verbatims", "doc_cross", "doc_national", "doc_actionables"],
    insight: {
      highlight: HERO_THESIS.headline,
      body: HERO_THESIS.body,
      stats: [
        ...heroFlavorStats(),
        { k: "Flavors Indexed", v: String(FIXED_RUN_STATS.flavorsIndexed) },
        { k: "Sample", v: "15M", suffix: "conversations" },
      ],
    },
    regionsData: REGIONS_DATA,
    regionTitle: "Regional affinity — favorite savory flavors",
    flavours: FLAVOURS,
    quotes: BRITANNIA_CONSUMER_QUOTES,
    exec: {
      h2: "Launch Honey Chilli nationally and Gunpowder Podi in South — localize packs using state top-5 tables.",
      p: `Three signals: ${HONEY_CHILLI_GROWTH}% Honey Chilli conversation growth, ${GUNPOWDER_GROWTH}% Gunpowder Podi conversation growth, 29 states mapped with regional extension ideas.`,
      meta: [{ k: "Confidence", v: "92%" }, { k: "Honey Chilli", v: "48.7%" }, { k: "Sample", v: "1.5L" }, { k: "States", v: "29" }],
    },
  },
};

const matchResearchScript = (query) => {
  const ql = (query || "").toLowerCase();
  const presets = D().predefinedQuestions || [];
  const preset = presets.find((p) => ql === p.q.toLowerCase() || ql.includes(p.id));
  if (preset && RESEARCH_SCRIPTS[preset.id]) return RESEARCH_SCRIPTS[preset.id];
  if (/britannia|performing|good day|marie gold|nutrichoice|50-50|treat/.test(ql)) return RESEARCH_SCRIPTS.default;
  if (/flavour|flavor|state|trend/.test(ql)) return RESEARCH_SCRIPTS.flavour;
  if (/honey.chilli|honey chilli/.test(ql)) return RESEARCH_SCRIPTS.honeyChilli;
  if (/gunpowder|podi/.test(ql)) return RESEARCH_SCRIPTS.flavour;
  if (/sentiment|sweet|mishti|nolen/.test(ql)) return RESEARCH_SCRIPTS.sentiment;
  if (/extension|opportunit/.test(ql)) return RESEARCH_SCRIPTS.extension;
  if (/pric|elastic|premium|sku/.test(ql)) return RESEARCH_SCRIPTS.pricing;
  return RESEARCH_SCRIPTS.default;
};

const getScript = (script) => script || RESEARCH_SCRIPTS.default;

/* ============================================================
   Detail panel — click anything → readable PDF-backed detail
============================================================ */
const openDetail = (item) => {
  window.dispatchEvent(new CustomEvent("brit-detail", { detail: item }));
};

function DetailPanel({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="detail-panel" onClick={onClose}>
      <div className="detail-panel-inner" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="detail-close" onClick={onClose}>✕</button>
        <div className="detail-tag">{item.type}</div>
        <h3 className="detail-title">{item.title}</h3>
        {item.subtitle && <p className="detail-sub">{item.subtitle}</p>}
        <p className="detail-body">{item.body}</p>
        {item.facts && (
          <ul className="detail-facts">
            {item.facts.map((f, i) => <li key={i}><b>{f.k}:</b> {f.v}</li>)}
          </ul>
        )}
        {item.source && <div className="detail-source">Source · {item.source}</div>}
      </div>
    </div>
  );
}

function ClickableStat({ label, value, suffix, onClick }) {
  return (
    <div className="click-stat" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={(e) => e.key === "Enter" && onClick()}>
      <span className="k">{label}</span>
      <span className="v">{value}{suffix && <small>{suffix}</small>}</span>
      <span className="click-hint">View detail →</span>
    </div>
  );
}

/* ============================================================
   BootBlock — streaming "engine warming up" logs (inline)
============================================================ */
function BootBlock({ onComplete }) {
  const [n, setN] = useState(0);
  const did = useRef(false);

  useEffect(() => {
    if (did.current) return;
    did.current = true;
    let i = 0;
    const step = () => {
      i++;
      setN(i);
      if (i < BOOT_LINES.length) {
        setTimeout(step, 400 + Math.random() * 300);
      } else {
        setTimeout(() => onComplete && onComplete(), 500);
      }
    };
    setTimeout(step, 400);
  }, []);

  return (
    <div className="boot-block">
      {BOOT_LINES.slice(0, n + 1).map((l, idx) => {
        const isLast = idx === Math.min(n, BOOT_LINES.length - 1) && n < BOOT_LINES.length;
        const done = !isLast;
        return (
          <div key={idx} className={"log-line " + (done ? "done" : "")}>
            <span className="ts">[{l.t}]</span>
            {l.marker && done ? <span className="ok">{l.marker}</span> : <span className="spinner"></span>}
            <span>{l.text}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   ScopeForm — metadata follow-up inline card
============================================================ */
function ScopeForm({ defaults, locked, onRun }) {
  const [region, setRegion] = useState(defaults?.region || "South");
  const [tf, setTf] = useState(defaults?.tf || "12 months");
  const [obj, setObj] = useState(defaults?.obj || "Product extension");
  const [filters, setFilters] = useState(defaults?.filters || ["Urban", "Gen-Z"]);
  const [extra, setExtra] = useState(defaults?.extra || "");

  const tog = (f) => setFilters(filters.includes(f) ? filters.filter(x=>x!==f) : [...filters, f]);

  const credits = useMemo(() => {
    return 320 + TIMEFRAMES.indexOf(tf) * 40 + filters.length * 25;
  }, [tf, filters]);

  if (locked) {
    return (
      <div className="card">
        <div className="card-h">
          <h3>Research scope</h3>
          <span className="tag">confirmed</span>
        </div>
        <div className="card-body">
          <div className="scope-chips">
            <span className="chip"><b>Region:</b>&nbsp;{region}</span>
            <span className="chip"><b>Timeframe:</b>&nbsp;{tf}</span>
            <span className="chip"><b>Objective:</b>&nbsp;{obj}</span>
            {filters.map(f => <span key={f} className="chip">{f}</span>)}
            {extra && <span className="chip"><b>Note:</b>&nbsp;{extra}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-h">
        <h3>A few quick details</h3>
        <span className="tag">scope · 4 fields</span>
      </div>
      <div className="card-body">
        <div className="scope-form">
          <div className="scope-field">
            <div className="scope-label">Region</div>
            <div className="opt-row">
              {REGIONS.map(r => <span key={r} className={"opt " + (region===r?"sel":"")} onClick={()=>setRegion(r)}>{r}</span>)}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Timeframe</div>
            <div className="opt-row">
              {TIMEFRAMES.map(t => <span key={t} className={"opt " + (tf===t?"sel":"")} onClick={()=>setTf(t)}>{t}</span>)}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Business objective</div>
            <div className="opt-row">
              {OBJECTIVES.map(o => <span key={o} className={"opt " + (obj===o?"sel":"")} onClick={()=>setObj(o)}>{o}</span>)}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Audience filters <span className="hint">multi-select</span></div>
            <div className="opt-row">
              {FILTERS.map(f => <span key={f} className={"opt " + (filters.includes(f)?"sel":"")} onClick={()=>tog(f)}>{f}</span>)}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Additional context <span className="hint">optional</span></div>
            <input className="scope-input" placeholder="e.g. focus on dessert adjacency, avoid masala variants…"
                   value={extra} onChange={e=>setExtra(e.target.value)} />
          </div>

          <div className="scope-meta">
            <div><span className="k">Sources matched</span><span className="v">6</span></div>
            <div><span className="k">Credits</span><span className="v">{credits}</span></div>
            <div><span className="k">ETA</span><span className="v">~12s</span></div>
            <div><span className="k">Confidence floor</span><span className="v">84%</span></div>
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div className="note">Ready · {SOURCE_NAMES.length} sources selected</div>
        <button className="btn-primary" onClick={() => onRun({ region, tf, obj, filters, extra })}>
          Run research <kbd>⌘↵</kbd>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   TimelineBlock — cinematic execution timeline (inline)
============================================================ */
function TimelineBlock({ onDone }) {
  const stages = RRP_TIMELINE_STAGES.map(s => ({ ...s, dur: s.dur * 3 }));
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [srcCount, setSrcCount] = useState(2);
  const started = useRef(Date.now());
  const finished = useRef(false);
  const elapsedFrozen = useRef(null);
  const timerRef = useRef(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const freezeElapsed = useCallback(() => {
    stopTimer();
    if (elapsedFrozen.current != null) return;
    elapsedFrozen.current = (Date.now() - started.current) / 1000;
    setElapsed(elapsedFrozen.current);
  }, [stopTimer]);

  useEffect(() => {
    const tick = () => {
      if (elapsedFrozen.current != null) return;
      setElapsed((Date.now() - started.current) / 1000);
    };
    tick();
    timerRef.current = setInterval(tick, 100);
    return stopTimer;
  }, [stopTimer]);

  useEffect(() => {
    if (idx >= stages.length) return;
    const dur = stages[idx].dur;
    const t0 = Date.now();
    let raf;
    const step = () => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setProg(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else if (idx + 1 < stages.length) {
        setIdx(idx + 1);
        setProg(0);
      } else if (!finished.current) {
        finished.current = true;
        freezeElapsed();
        setIdx(stages.length);
        setProg(1);
        setTimeout(() => onDoneRef.current?.(), 600);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [idx, freezeElapsed, stages.length]);

  const allDone = idx >= stages.length;

  useEffect(() => {
    if (allDone && elapsedFrozen.current == null) freezeElapsed();
  }, [allDone, freezeElapsed]);

  useEffect(() => {
    const want = Math.min(SOURCE_NAMES.length, 2 + Math.floor((idx + prog) * 1.2));
    setSrcCount(want);
  }, [idx, prog]);

  const overall = useMemo(() => {
    if (allDone) return 100;
    const total = stages.reduce((a, s) => a + s.dur, 0);
    let done = 0;
    for (let i = 0; i < idx; i++) done += stages[i].dur;
    done += prog * (stages[idx]?.dur || 0);
    return Math.min(99, Math.round((done / total) * 100));
  }, [idx, prog, allDone, stages]);

  const signalsProcessed = useMemo(() => {
    if (allDone) return TOTAL_CONVERSATIONS;
    const totalDur = stages.reduce((a, s) => a + s.dur, 0);
    let doneDur = 0;
    for (let i = 0; i < idx; i++) doneDur += stages[i].dur;
    if (idx < stages.length) doneDur += prog * stages[idx].dur;
    return Math.min(
      TOTAL_CONVERSATIONS,
      Math.round((doneDur / totalDur) * TOTAL_CONVERSATIONS)
    );
  }, [idx, prog, allDone, stages]);

  const sourcePills = SOURCE_NAMES.slice(0, srcCount);
  const filteringStageIndex = stages.findIndex((s) => s.id === "clean");
  const confidenceReady = allDone || (filteringStageIndex >= 0 && idx > filteringStageIndex);

  return (
    <div className="tl-block">
      <div className={"tl-head" + (allDone ? " tl-head--done" : "")}>
        <span className="l">
          Run #4821 · {allDone ? "complete" : "in progress"} · t+{elapsed.toFixed(1)}s
        </span>
        <span className="r">{overall}%</span>
      </div>
      <div className="tl-list">
        {stages.map((s, i) => {
          const status = allDone || i < idx ? "done" : i === idx ? "active" : "queued";
          const p = allDone || i < idx ? 1 : i === idx ? prog : 0;
          return (
            <div key={s.id} className={"tl-row " + status}>
              <div className="tl-num">{status === "done" ? "✓" : String(i+1).padStart(2,"0")}</div>
              <div className="tl-body">
                <div className="tl-title">{s.title}</div>
                <div className="tl-sub">{s.desc}</div>
                <div className="tl-bar"><span style={{width: Math.max(0.5, p*100)+"%", minWidth: "2px"}}></span></div>
              </div>
              <div className={"tl-stat " + (status === "active" ? "live" : status === "done" ? "ok" : "")}>
                {status === "done" ? "done" : status === "active" ? "in progress" : "waiting"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="tl-foot">
        <div className="col">
          <div className="lbl">Sources included · {sourcePills.length}/{SOURCE_NAMES.length}</div>
          <div>
            {sourcePills.map(s => <span key={s} className="src-pill">{s}</span>)}
          </div>
        </div>
        <div className="col">
          <div className="lbl">Data confidence</div>
          {confidenceReady ? (
            <div className="v">{FIXED_RUN_STATS.confidence}</div>
          ) : (
            <div className="v tl-confidence-loading">
              <span className="tl-mini-spinner" aria-hidden />
              Calculating
            </div>
          )}
        </div>
        <div className="col">
          <div className="lbl">Signals processed</div>
          <div className="v">{signalsProcessed.toLocaleString("en-US")} / {TOTAL_CONVERSATIONS.toLocaleString("en-US")}</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   InsightBlock — the major insight headline
============================================================ */
function InsightBlock({ params, script }) {
  const s = getScript(script);
  const ins = s.insight;
  const reg = params?.region === "Pan-India" ? "India" : (params?.region || "India") + (params?.region === "Pan-India" ? "" : " India");
  const statSuffix = (suffix) => {
    if (!suffix) return "";
    if (suffix === "L") return "L convos";
    if (suffix === "K") return "K";
    if (suffix === "conversations") return " conversations";
    return suffix;
  };
  const statValue = (st) => {
    const suffix = statSuffix(st.suffix);
    if (!suffix) return st.v;
    if (suffix.startsWith(" ")) return `${st.v}${suffix}`;
    const joiner = suffix === "%" || suffix === "K" || suffix.startsWith("L") ? "" : " ";
    return `${st.v}${joiner}${suffix}`;
  };
  const onStat = (st) => openDetail({
    type: "Key metric",
    title: st.k,
    body: `Report value: ${statValue(st)}. Research scope: ${reg}. From Flavor Insights India — ${TOTAL_CONVERSATIONS.toLocaleString("en-US")} conversations.`,
    source: "Consuma AI · 20 May 2026",
  });
  return (
    <div className="insight">
      <h2>{HERO_THESIS.title}</h2>
      <p className="insight-lead">{ins.highlight}. {ins.body.replace("{region}", reg)}</p>
      <div className="insight-stats">
        {ins.stats.map((st, i) => (
          <div key={i} className="click-stat">
            <span className="k">{st.k}</span>
            <span className="v">{st.v}{statSuffix(st.suffix) && <small>{statSuffix(st.suffix)}</small>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Region affinity card
============================================================ */
function RegionCard({ script }) {
  const s = getScript(script);
  const data = s.regionsData || REGIONS_DATA;

  const onBarSelect = (r) => {
    openDetail({
      type: "Flavor share",
      title: r.lbl,
      subtitle: `${r.val}% of favorite savory flavor conversations`,
      body: r.lbl === "Honey Chilli"
        ? D().honeyChilli?.narrative
        : r.lbl === "Gunpowder Podi"
          ? D().gunpowderPodi?.narrative
          : `Top savory flavor momentum index for ${r.lbl}. Sample: ${D().meta?.totalSample?.toLocaleString("en-IN")} conversations across India.`,
      facts: [{ k: "Share", v: `${r.val}%` }, { k: "Period", v: "Last 12 months" }],
      source: "Flavor Insights · p.3",
    });
  };

  return (
    <div className="card">
      <div className="card-h">
        <h3>{s.regionTitle || "Regional affinity"}</h3>
        <span className="tag">click a bar · % share</span>
      </div>
      <div className="card-body">
        <RegionBarChart data={data} onSelect={onBarSelect} />
      </div>
    </div>
  );
}

/* ============================================================
   Sentiment ring card
============================================================ */
function SentimentCard({ script }) {
  const sc = getScript(script);
  const sent = sc.sentData || SENT_DATA;
  const center = sc.sentCenter ?? REGIONAL_SWEET_POSITIVE;
  const mentions = sc.sentMentions ?? D().regionalSweetSentiment?.conversations ?? TOTAL_CONVERSATIONS;

  const onSegment = (s) => {
    openDetail({
      type: "Sentiment",
      title: `${s.lbl} — ${s.v}%`,
      body: `Regional sweets sentiment: ${D().regionalSweetSentiment?.sentiment?.positive}% positive, ${D().regionalSweetSentiment?.sentiment?.neutral}% neutral, ${D().regionalSweetSentiment?.sentiment?.negative}% negative. Headline positive ${D().regionalSweetSentiment?.positivePct}%.`,
      source: `${mentions.toLocaleString("en-IN")} conversations`,
    });
  };

  return (
    <div className="card">
      <div className="card-h">
        <h3>Sentiment towards regional sweets</h3>
        <span className="tag">{mentions.toLocaleString("en-IN")} mentions · click chart</span>
      </div>
      <div className="card-body">
        <div className="sent sent-recharts">
          <SentimentDonutChart segments={sent} center={center} onSelect={onSegment} />
          <div className="sent-list">
            {sent.map((s, i) => (
              <div key={i} className="sent-item clickable" onClick={() => onSegment(s)}>
                <span className="sw" style={{ background: s.color }}></span>
                <span>{s.lbl}</span>
                <span className="v">{s.v}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   States card — top flavors by state (PDF)
============================================================ */
function StatesCard() {
  const rows = DEMO_STATES.length ? DEMO_STATES : D().states || STATES_TABLE;
  const [open, setOpen] = useState(null);
  return (
    <div className="card">
      <div className="card-h">
        <h3>Top sweet &amp; savory flavors by state</h3>
        <span className="tag">click a state · {rows.length} regions</span>
      </div>
      <div className="card-body state-list">
        {rows.map((row) => (
          <div key={row.state}
               className={"state-row " + (open === row.state ? "open" : "")}
               onClick={() => {
                 setOpen(open === row.state ? null : row.state);
                 openDetail({
                   type: "State flavor map",
                   title: row.state,
                   body: `Top 5 sweet and savory flavors from ${D().meta?.totalSample?.toLocaleString("en-IN")} India conversations.`,
                   facts: [
                     { k: "Sweet top 5", v: row.sweet.join(", ") },
                     { k: "Savory top 5", v: row.savory.join(", ") },
                   ],
                   source: "Flavor Insights · state table",
                 });
               }}>
            <div className="state-head">
              <span className="state-name">{row.state}</span>
              <span className="state-chev">{open === row.state ? "−" : "+"}</span>
            </div>
            {open === row.state && (
              <div className="state-detail">
                <p><b>Sweet:</b> {row.sweet.join(", ")}</p>
                <p><b>Savory:</b> {row.savory.join(", ")}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Extensions card
============================================================ */
function ExtensionsCard() {
  const savory = D().savoryOpportunities || [];
  const sweet = D().sweetOpportunities || [];
  const onExt = (name, track, flavor) => openDetail({
    type: "Product extension",
    title: name,
    body: `${name} — extension idea for ${flavor} (${track}). Grounded in Flavor Insights India state and national flavor data.`,
    source: "Flavor Insights · extension list",
  });
  return (
    <div className="card">
      <div className="card-h">
        <h3>Extension opportunities</h3>
        <span className="tag">click any idea</span>
      </div>
      <div className="card-body">
        <div className="ext-group">
          <div className="ext-label">Savory · India</div>
          <div className="scope-chips">
            {savory.flatMap((o) =>
              o.extensions.map((e) => (
                <span key={`${o.flavor}-${e}`} className="chip clickable" onClick={() => onExt(e, "Savory", o.flavor)}>
                  {e}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="ext-group">
          <div className="ext-label">Sweet · India</div>
          <div className="scope-chips">
            {sweet.flatMap((o) =>
              o.extensions.map((e) => (
                <span key={`${o.flavor}-${e}`} className="chip clickable" onClick={() => onExt(e, "Sweet", o.flavor)}>
                  {e}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Trend chart card
============================================================ */
const getTrendSeries = (script) => {
  const sc = getScript(script);
  const h = D().honeyChilli?.trend12m;
  const g = D().gunpowderPodi?.trend12m;
  const r = D().regionalSweetSentiment?.trend12m;
  const fromData =
    sc.id === "sentiment" ? r : sc.id === "flavour" || /podi|gunpowder/i.test(sc.title || "") ? g : h;
  if (fromData) {
    return {
      label: fromData.label,
      months: fromData.months,
      data: fromData.primary.values,
      data2: fromData.secondary.values,
      primaryName: fromData.primary.name,
      secondaryName: fromData.secondary.name,
    };
  }
  return {
    label: sc.trendLabel || "12-month trend",
    months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    data: sc.trendSolid || [12, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18],
    data2: sc.trendDashed || [18, 19, 19, 20, 20, 21, 21, 21, 22, 22, 22, 22],
    primaryName: "Primary",
    secondaryName: "Comparison",
  };
};

function TrendCard({ script }) {
  const series = getTrendSeries(script);
  const { data, data2, months, label, primaryName, secondaryName } = series;

  return (
    <div className="card">
      <div className="card-h">
        <h3>12-month trend</h3>
        <span className="tag">{label}</span>
      </div>
      <div className="card-body">
        <TrendLineChart
          months={months}
          data={data}
          data2={data2}
          primaryName={primaryName}
          secondaryName={secondaryName}
          onSelect={(row) =>
            openDetail({
              type: "Trend",
              title: row.month,
              body: `${primaryName}: ${row.primary}%. ${secondaryName}: ${row.secondary}%. Flavor Insights India · last 12 months.`,
              source: `1,53,496 conversations · ${SOURCE_NAMES.length} channels`,
            })
          }
        />
      </div>
    </div>
  );
}

/* ============================================================
   Flavour explorer card
============================================================ */
function FlavourCard({ script }) {
  const flavours = getScript(script).flavours || FLAVOURS;
  const sweet = D().sweetOpportunities || [];
  const savory = D().savoryOpportunities || [];
  const lookup = [...sweet, ...savory].reduce((a, o) => { a[o.flavor] = o; return a; }, {});

  const onFlavor = (f) => {
    const opp = lookup[f.name] || lookup[f.name.split(" ")[0]];
    openDetail({
      type: "Flavor opportunity",
      title: f.name,
      subtitle: f.grow,
      body: opp ? `${opp.proof}. Extensions: ${opp.extensions}` : `Trend signal ${f.grow} from Flavor Insights India.`,
      facts: opp ? [{ k: "Anchor", v: opp.anchor }] : [],
      source: "Sweet & savory opportunities · report",
    });
  };

  return (
    <div className="card">
      <div className="card-h">
        <h3>Flavour trend explorer</h3>
        <span className="tag">click a bar · growth %</span>
      </div>
      <div className="card-body">
        <FlavorGrowthChart flavours={flavours} onSelect={onFlavor} />
      </div>
    </div>
  );
}

/* ============================================================
   Quotes card
============================================================ */
function QuotesCard({ script }) {
  const scriptObj = typeof script === "string" ? matchResearchScript(script) : getScript(script);
  // Pick exactly the top 3 quotes related to this specific research script
  // (no randomization, ensuring it is deterministic and stays strictly on-topic)
  const quotes = (scriptObj.quotes || RESEARCH_SCRIPTS.default.quotes).slice(0, 3);
  
  return (
    <div className="card">
      <div className="card-h">
        <h3>Consumer voice</h3>
        <span className="tag">panel + social + delivery</span>
      </div>
      <div className="card-body">
        {quotes.map((q, i) => (
          <div key={i} className="quote clickable"
               onClick={() => openDetail({ type: "Consumer voice", title: "Verbatim signal", body: q.text, source: q.att })}>
            <p>&quot;{q.text}&quot;</p>
            <div className="att">{q.att} · click to expand</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ExecBlock — final executive recommendation (dark, prominent)
============================================================ */
function ExecBlock({ onOpenReport, onExportBrief, onShareBrief, script }) {
  const ex = getScript(script).exec || RESEARCH_SCRIPTS.default.exec;
  const meta = (ex.meta || []).filter((m) => !/confidence/i.test(String(m.k)));
  return (
    <div className="exec-block">
      <div className="eyebrow">Recommended action · confidence 84%</div>
      <h2>{ex.h2}</h2>
      <p>{ex.p}</p>
      {meta.length > 0 && (
        <div className="meta">
          {meta.map((m, i) => (
            <button
              key={i}
              type="button"
              className="meta-tile clickable"
              onClick={() =>
                openDetail({
                  type: "Key metric",
                  title: m.k,
                  body: `${m.k}: ${m.v}. Part of the executive recommendation for this study.`,
                  source: "Flavor Insights India · exec summary",
                })
              }
            >
              <span className="k">{m.k}</span>
              <span className="v">{m.v}</span>
            </button>
          ))}
        </div>
      )}
      <div className="actions">
        <button type="button" className="btn-primary" onClick={onOpenReport}>View full report ↗</button>
        <button type="button" className="btn-ghost" onClick={onExportBrief}>Export brief · PDF</button>
        <button type="button" className="btn-ghost" onClick={onShareBrief}>Share with team</button>
      </div>
    </div>
  );
}

/* ============================================================
   Actions bar — create, content engine, FPD, 1DS
============================================================ */
const ACTION_BUTTONS = [
  { id: "concept_cards", label: "Create", sub: "Concept cards", icon: "◆", primary: true },
  { id: "content_engine", label: "Campaign messaging", sub: "Scripts + packshots", icon: "↗" },
  { id: "fpd_scout", label: "Scout for FPD", sub: "Field discovery", icon: "◎" },
  { id: "triangulate_1ds", label: "Triangulate with 1DS", sub: "Sales + social", icon: "△" },
];

/* In-chat action recommendations (not a pinned dock) */
function ActionsRecommendations({ onAction, busy, script, params, followUp, completedActions = [] }) {
  const actionMap = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));
  const completed = new Set(completedActions || []);
  const suggestedIds = (followUp?.suggestions || []).map((s) => s.actionId);
  const reasonById = Object.fromEntries(
    (followUp?.suggestions || []).map((s) => [s.actionId, s.reason])
  );

  const ordered = followUp?.suggestions?.length
    ? [
        ...suggestedIds.map((id) => actionMap[id]).filter(Boolean),
        ...ACTIONS.filter((a) => !suggestedIds.includes(a.id)),
      ]
    : ACTIONS;

  const handleClick = (actionId) => {
    if (busy || !onAction) return;
    onAction(actionId);
  };

  return (
    <div className="actions-reco">
      <div className="actions-reco-head">
        <span className="reco-eyebrow">
          {followUp?.llm ? "Smart next steps" : "Suggested next steps"}
        </span>
        <p className="actions-reco-intro">
          {followUp?.intro || (
            <>
              Turn this insight into downstream work
              {script?.title ? <strong> · {script.title}</strong> : null}
              {params?.region ? <span className="reco-meta"> · {params.region}</span> : null}
            </>
          )}
        </p>
      </div>
      <div className="actions-reco-chips">
        {ordered.map((a) => {
          const done = completed.has(a.id);
          const isTopPick = suggestedIds.includes(a.id);
          return (
          <button
            key={a.id}
            type="button"
            className={
              "reco-chip " +
              (a.primary && !followUp ? "reco-chip-primary" : "") +
              (a.film ? " reco-chip-film" : "") +
              (isTopPick ? " reco-chip-smart" : "") +
              (done ? " reco-chip-done" : "")
            }
            disabled={busy}
            onClick={() => handleClick(a.id)}
            aria-busy={busy && (a.primary || a.film)}
          >
            <span className="reco-icon">{done ? "✓" : a.icon}</span>
            <span className="reco-label-wrap">
              <span className="reco-label-text">
                {a.label}
                {isTopPick && !done && <span className="reco-pick"> · recommended</span>}
              </span>
              {reasonById[a.id] ? (
                <span className="reco-reason">{reasonById[a.id]}</span>
              ) : (
                a.sub && <span className="reco-sub">{a.sub}</span>
              )}
            </span>
          </button>
          );
        })}
      </div>
      {busy && (
        <p className="actions-reco-busy">
          <span className="live-dot" /> Running…
        </p>
      )}
    </div>
  );
}

function ConceptCardImage({ concept }) {
  const [failed, setFailed] = useState(false);
  const showImage = concept.imageUri && !failed;

  return (
    <div
      className="concept-visual"
      style={
        showImage
          ? undefined
          : { background: `linear-gradient(135deg, ${concept.gradient}22, ${concept.gradient}88)` }
      }
    >
      {showImage ? (
        <img
          className="concept-image"
          src={concept.imageUri}
          alt={concept.title}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="concept-placeholder concept-placeholder-rich">
          <span className="concept-ph-icon" aria-hidden>🖼</span>
          <span className="concept-ph-generated">Generated image</span>
          <span className="concept-ph-lane">{concept.lane}</span>
          <span className="concept-ph-title">{concept.title}</span>
        </div>
      )}
    </div>
  );
}

const resolveFilmPlayUrl = (videoUri, filmHref) => {
  const candidate = filmHref || videoUri;
  if (!candidate) return null;
  if (candidate.startsWith("/") || candidate.startsWith("data:")) return candidate;
  if (/^https?:\/\//i.test(candidate) && (candidate.includes(".mp4") || candidate.includes("X-Amz"))) {
    return candidate;
  }
  return null;
};

function InlineFilmPlayer({ videoUri, filmHref, className = "hero-film-video" }) {
  const [playUrl, setPlayUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const direct = resolveFilmPlayUrl(videoUri, filmHref);
      if (direct) {
        if (!cancelled) {
          setPlayUrl(direct);
          setLoading(false);
        }
        return;
      }

      const uri = videoUri || filmHref;
      if (!uri) {
        if (!cancelled) {
          setError("No video URI");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/film?uri=${encodeURIComponent(uri)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load film");
        if (!cancelled) setPlayUrl(data.playUrl);
      } catch (e) {
        if (!cancelled) setError(e.message || "Could not load film");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [videoUri, filmHref]);

  if (loading) {
    return <p className="film-loading">Loading hero film…</p>;
  }
  if (error || !playUrl) {
    return <p className="concept-err">{error || "Film not available yet."}</p>;
  }

  return (
    <video
      className={className}
      src={playUrl}
      controls
      playsInline
      preload="metadata"
    />
  );
}

const dispatchHandoff = (target, detail = {}) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("brit-handoff", { detail: { target, ...detail } }));
};

const DeliverableHandoff = ({ label, target, flavor, state }) => {
  const [sent, setSent] = useState(false);
  const onSend = () => {
    dispatchHandoff(target, { flavor, state, label });
    setSent(true);
  };
  return (
    <div className="deliverable-handoff">
      <p className="deliverable-handoff-lead">Ready for downstream review</p>
      <button
        type="button"
        className="btn-primary deliverable-handoff-btn"
        onClick={onSend}
        disabled={sent}
      >
        {sent ? `Sent to ${target} ✓` : label}
      </button>
    </div>
  );
};

const STORYBOARD_FRAME_STYLES = {
  retail: "linear-gradient(145deg, #f5ebe0 0%, #d4c4b0 100%)",
  macro: "linear-gradient(145deg, #3d2314 0%, #8b4513 55%, #c45c3e 100%)",
  lifestyle: "linear-gradient(145deg, #e8dfd4 0%, #b8a090 100%)",
  product: "linear-gradient(145deg, #1a1410 0%, #4a3020 100%)",
  brand: "linear-gradient(145deg, #c41e3a 0%, #8b1538 100%)",
};

const buildStoryboardScenes = (payload) => {
  if (payload?.scenes?.length) return payload.scenes;
  const bullets = payload?.bullets || [];
  const timings = ["0–3s", "3–8s", "8–18s", "18–24s", "24–30s"];
  const titles = ["Hero shelf", "Ingredient cue", "Snacking moment", "Product crunch", "Brand lock-up"];
  const moods = ["retail", "macro", "lifestyle", "product", "brand"];
  return bullets.slice(0, 5).map((b, i) => ({
    beat: i + 1,
    timing: timings[i],
    title: titles[i],
    shot: String(b),
    vo: payload?.recommendations?.[i] || "",
    onScreen: payload?.flavor || "",
    frameStyle: moods[i],
  }));
};

const StoryboardSceneVisual = ({ scene, videoUrl, veoStatus, veoError }) => {
  if (videoUrl && veoStatus === "ready") {
    return (
      <div className="artifact-stack-visual storyboard-scene-visual storyboard-scene-visual--video">
        <video
          className="storyboard-scene-video"
          src={videoUrl}
          controls
          playsInline
          muted
          loop
          preload="metadata"
        />
      </div>
    );
  }

  if (veoStatus === "generating") {
    return (
      <div className="artifact-stack-visual storyboard-scene-visual storyboard-scene-visual--loading">
        <div className="storyboard-scene-veo-loader">
          <span className="storyboard-scene-veo-spinner" aria-hidden />
          <p className="storyboard-scene-veo-loader-title">Rendering with Veo</p>
          <p className="storyboard-scene-veo-loader-sub">
            Scene {scene.beat} · {scene.timing} · ~2–4 min
          </p>
        </div>
      </div>
    );
  }

  if (veoStatus === "queued") {
    return (
      <div className="artifact-stack-visual storyboard-scene-visual storyboard-scene-visual--queued">
        <div className="storyboard-scene-veo-loader storyboard-scene-veo-loader--muted">
          <span className="storyboard-scene-veo-queue-icon" aria-hidden>◷</span>
          <p className="storyboard-scene-veo-loader-title">Queued</p>
          <p className="storyboard-scene-veo-loader-sub">Scene {scene.beat} · {scene.title}</p>
        </div>
      </div>
    );
  }

  if (veoStatus === "error") {
    return (
      <div className="artifact-stack-visual storyboard-scene-visual storyboard-scene-visual--error">
        <p className="storyboard-scene-veo-loader-title">Clip unavailable</p>
        <p className="storyboard-scene-veo-loader-sub">{veoError || "Veo generation failed"}</p>
      </div>
    );
  }

  if (veoStatus === "skipped") {
    return (
      <div className="artifact-stack-visual storyboard-scene-visual storyboard-scene-visual--skipped">
        <p className="storyboard-scene-veo-loader-title">Veo not configured</p>
        <p className="storyboard-scene-veo-loader-sub">Add GEMINI_API_KEY to .env</p>
      </div>
    );
  }

  const frameBg = STORYBOARD_FRAME_STYLES[scene.frameStyle] || STORYBOARD_FRAME_STYLES.retail;
  return (
    <div
      className="artifact-stack-visual storyboard-scene-visual storyboard-scene-visual--mock"
      style={{ background: frameBg }}
    >
      <span className="storyboard-frame-beat">Scene {scene.beat}</span>
      <span className="storyboard-frame-timing">{scene.timing}</span>
      <p className="storyboard-frame-title">{scene.title}</p>
    </div>
  );
};

const StoryboardSceneCard = ({ scene, videoUrl, veoStatus, veoError }) => {
  const showVeoBadge = videoUrl && veoStatus === "ready";

  return (
    <article className="artifact-stack-card storyboard-scene-card">
      <StoryboardSceneVisual
        scene={scene}
        videoUrl={videoUrl}
        veoStatus={veoStatus}
        veoError={veoError}
      />
      <div className="artifact-stack-copy">
        <div className="concept-artifact-row">
          <span className="concept-artifact-num">Scene {String(scene.beat).padStart(2, "0")}</span>
          <span className="concept-artifact-tone">{scene.timing}</span>
          {showVeoBadge && <span className="storyboard-scene-veo-badge">Veo</span>}
          {veoStatus === "generating" && (
            <span className="storyboard-scene-veo-badge storyboard-scene-veo-badge--live">Rendering</span>
          )}
        </div>
        <h4 className="concept-artifact-headline">{scene.title}</h4>
        <p className="concept-artifact-body">
          <b>Shot</b> {scene.shot}
          {scene.vo ? <> · <b>VO</b> {scene.vo}</> : null}
          {scene.onScreen ? <> · <b>On-screen</b> {scene.onScreen}</> : null}
        </p>
      </div>
    </article>
  );
};

const StoryboardMockPanel = ({ payload }) => {
  const scenes = buildStoryboardScenes(payload);
  const flavor = payload?.flavor;
  const state = payload?.state;
  const headerScope = [flavor, state].filter(Boolean).join(" · ");
  const [sceneVideos, setSceneVideos] = useState({});
  const [sceneVeoStatus, setSceneVeoStatus] = useState({});
  const [sceneVeoErrors, setSceneVeoErrors] = useState({});
  const [veoQueueNote, setVeoQueueNote] = useState("");
  const sceneRunKey = scenes.map((s) => `${s.beat}:${s.shot}`).join("|");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const configRes = await fetch("/api/veo");
      const config = await configRes.json().catch(() => ({ configured: false }));
      if (!config.configured) {
        const skipped = {};
        scenes.forEach((s) => { skipped[s.beat] = "skipped"; });
        if (!cancelled) setSceneVeoStatus(skipped);
        return;
      }

      const queued = {};
      scenes.forEach((s) => { queued[s.beat] = "queued"; });
      if (!cancelled) setSceneVeoStatus(queued);

      setVeoQueueNote(`Generating ${scenes.length} Veo clips (about 2–4 min each)…`);

      for (const scene of scenes) {
        if (cancelled) break;
        if (scene.videoUri) {
          setSceneVideos((v) => ({ ...v, [scene.beat]: scene.videoUri }));
          setSceneVeoStatus((s) => ({ ...s, [scene.beat]: "ready" }));
          continue;
        }

        setSceneVeoStatus((s) => ({ ...s, [scene.beat]: "generating" }));
        setVeoQueueNote(`Rendering scene ${scene.beat} of ${scenes.length} with Veo…`);

        try {
          const res = await fetch("/api/veo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scene, flavor, state, beat: scene.beat }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Veo failed");
          if (!cancelled && data.videoUrl) {
            setSceneVideos((v) => ({ ...v, [scene.beat]: data.videoUrl }));
            setSceneVeoStatus((s) => ({ ...s, [scene.beat]: "ready" }));
          }
        } catch (e) {
          if (!cancelled) {
            const msg = e instanceof Error ? e.message : String(e);
            setSceneVeoStatus((s) => ({ ...s, [scene.beat]: "error" }));
            setSceneVeoErrors((errs) => ({ ...errs, [scene.beat]: msg }));
          }
        }
      }

      if (!cancelled) setVeoQueueNote("");
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [sceneRunKey, flavor, state]);

  const heroBeat = scenes[0]?.beat ?? 1;
  const heroVideoUri = sceneVideos[heroBeat];
  const heroVeoStatus = sceneVeoStatus[heroBeat];
  const showHeroBlock =
    heroVideoUri ||
    heroVeoStatus === "generating" ||
    heroVeoStatus === "queued" ||
    heroVeoStatus === "error";

  return (
    <div className="card storyboard-mock-card artifact-panel">
      <div className="card-h">
        <h3>Video ad storyboard{headerScope ? ` — ${headerScope}` : ""}</h3>
        <span className="tag">{scenes.length} scenes · 30s · Veo</span>
      </div>
      <div className="card-body">
        {payload?.message && <p className="concept-msg">{payload.message}</p>}
        {payload?.body && <p className="action-outcome-lead">{payload.body}</p>}
        {veoQueueNote && <p className="storyboard-veo-queue-note">{veoQueueNote}</p>}
        {showHeroBlock && (
          <div className="storyboard-hero-film">
            <p className="storyboard-hero-film-label">6s hero spot</p>
            {heroVideoUri && heroVeoStatus === "ready" ? (
              <InlineFilmPlayer
                videoUri={heroVideoUri}
                filmHref={heroVideoUri}
                className="storyboard-hero-video"
              />
            ) : (
              <StoryboardSceneVisual
                scene={scenes[0]}
                videoUrl={null}
                veoStatus={heroVeoStatus || "queued"}
                veoError={sceneVeoErrors[heroBeat]}
              />
            )}
            {payload?.filmMessage && heroVideoUri && (
              <p className="muted storyboard-hero-film-note">
                {flavor && state
                  ? `Hero clip for ${flavor} in ${state} (Scene 1).`
                  : payload.filmMessage}
              </p>
            )}
          </div>
        )}
        <div className="artifact-stack storyboard-scene-stack">
          {scenes.map((s) => (
            <StoryboardSceneCard
              key={s.beat}
              scene={s}
              videoUrl={sceneVideos[s.beat] || s.videoUri}
              veoStatus={sceneVeoStatus[s.beat] || (s.videoUri ? "ready" : "idle")}
              veoError={sceneVeoErrors[s.beat]}
            />
          ))}
        </div>
        <DeliverableHandoff
          label="Send to FPD"
          target="FPD"
          flavor={flavor}
          state={state}
        />
      </div>
    </div>
  );
};

const MessagingCard = ({ card, index }) => (
  <article className="artifact-stack-card messaging-card">
    <div className="artifact-stack-visual messaging-card-visual">
      <span className="concept-ph-generated">Comms frame</span>
      <span className="concept-ph-lane">Recommendation {String(index + 1).padStart(2, "0")}</span>
    </div>
    <div className="artifact-stack-copy">
      <div className="concept-artifact-row">
        <span className="concept-artifact-num">Message {String(index + 1).padStart(2, "0")}</span>
        {card.tone && <span className="concept-artifact-tone">{card.tone}</span>}
      </div>
      <h4 className="concept-artifact-headline">{card.headline}</h4>
      <p className="concept-artifact-body">{card.body}</p>
    </div>
  </article>
);

const CreativeBriefPanel = ({ payload }) => {
  const flavor = payload?.flavor;
  const state = payload?.state;
  const headerScope = [flavor, state].filter(Boolean).join(" · ");

  const cards = payload?.messagingCards?.length
    ? payload.messagingCards
    : (payload?.messaging || payload?.bullets || []).slice(0, 3).map((line, i) => ({
        tone: ["Regional", "Occasion", "Shelf"][i] || "Comms",
        headline: `Recommendation ${i + 1}`,
        body: String(line),
      }));

  return (
    <div className="card creative-brief-card artifact-panel">
      <div className="card-h">
        <h3>Messaging recommendations{headerScope ? ` — ${headerScope}` : ""}</h3>
        <span className="tag">{cards.length} recommendations</span>
      </div>
      <div className="card-body">
        {payload?.message && <p className="concept-msg">{payload.message}</p>}
        {payload?.body && <p className="action-outcome-lead">{payload.body}</p>}
        <div className="artifact-stack">
          {cards.map((card, i) => (
            <MessagingCard key={`msg-card-${i}`} card={card} index={i} />
          ))}
        </div>
        <DeliverableHandoff
          label="Send to FPD"
          target="FPD"
          flavor={flavor}
          state={state}
        />
      </div>
    </div>
  );
};

function ConceptArtifactCard({ concept, flavor, state }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const num = String(concept.conceptNumber || 1).padStart(2, "0");

  const onDownload = async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        filter: (node) => !(node?.dataset && node.dataset.noexport === "true"),
      });
      const a = document.createElement("a");
      a.download = `${flavor || "concept"}-${state || "india"}-concept-${num}.png`
        .replace(/\s+/g, "-")
        .toLowerCase();
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.warn("Concept PNG export failed:", e);
      if (typeof window !== "undefined") {
        window.alert(
          "Couldn't export this card as PNG — the AI visual may be cross-origin. The styled preview still downloads when local images are used."
        );
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <article className="concept-artifact" ref={cardRef}>
      <div className="concept-artifact-visual">
        <ConceptCardImage concept={concept} />
      </div>
      <div className="concept-artifact-copy">
        <div className="concept-artifact-row">
          <span className="concept-artifact-num">Concept {num}</span>
          {concept.tone && <span className="concept-artifact-tone">{concept.tone}</span>}
        </div>
        <h4 className="concept-artifact-headline">{concept.headline || concept.title}</h4>
        <p className="concept-artifact-body">{concept.body || concept.tagline}</p>
        <div className="concept-artifact-foot">
          <span className="concept-artifact-brand">{concept.brandLabel || concept.sku}</span>
          <button
            type="button"
            className="concept-dl-btn"
            data-noexport="true"
            onClick={onDownload}
            disabled={downloading}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v12" />
              <path d="m7 11 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            {downloading ? "Exporting…" : "Download"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ConceptCardsPanel({ payload }) {
  const { concepts = [], mode, message, error, flavor, state } = payload || {};
  const created = mode === "created";
  const headerScope = [flavor, state].filter(Boolean).join(" · ");

  return (
    <div className="card concept-artifact-card artifact-panel">
      <div className="card-h">
        <h3>Concept cards{headerScope ? ` — ${headerScope}` : ""}</h3>
        <span className="tag">{created ? `${concepts.length} concepts generated` : "Preview"}</span>
      </div>
      <div className="card-body artifact-panel-body">
        {message && !error && <p className="concept-msg">{message}</p>}
        {error && <p className="concept-err">{error}</p>}
        <div className="concept-stack">
          {concepts.map((c) => (
            <ConceptArtifactCard key={c.id} concept={c} flavor={flavor} state={state} />
          ))}
        </div>
        <DeliverableHandoff
          label="Send to FPD"
          target="FPD"
          flavor={flavor}
          state={state}
        />
      </div>
    </div>
  );
}

const ACTION_META = {
  content_engine: { label: "Creative brief", icon: "📋", accent: "#c45c3e" },
  creative_brief: { label: "Creative brief", icon: "📋", accent: "#c45c3e" },
  storyboard: { label: "Video storyboard", icon: "▶", accent: "#5c4a3e" },
  positioning: { label: "Creative brief", icon: "📋", accent: "#6b3d2e" },
  fpd_scout: { label: "FPD scout", icon: "◎", accent: "#5c3d2e" },
  triangulate_1ds: { label: "1DS triangulation", icon: "△", accent: "#8b2e1a" },
};

function ActionOutcomeCards({ payload }) {
  const meta = ACTION_META[payload.type] || { label: "Action output", icon: "◆", accent: "#c45c3e" };
  const findings = (payload.bullets || []).slice(0, 5);
  const recommendations = (payload.recommendations || []).slice(0, 3);
  const nextSteps = (payload.nextSteps || []).slice(0, 2);

  return (
    <div className="card action-outcome-wrap">
      <div className="card-h">
        <h3>{payload.title || meta.label}</h3>
        <span className="tag">{payload.status || "queued"}</span>
      </div>
      <div className="card-body">
        {payload.message && <p className="concept-msg">{payload.message}</p>}
        {payload.body && <p className="action-outcome-lead">{payload.body}</p>}

        {findings.length > 0 && (
          <div className="action-outcome-section">
            <h4 className="aoc-section-title">Findings</h4>
            <div className="action-outcome-grid">
              {findings.map((b, i) => (
                <div
                  key={`finding-${i}`}
                  className="action-outcome-card"
                  style={{ borderColor: meta.accent + "44" }}
                >
                  <span className="aoc-icon" style={{ color: meta.accent }}>
                    {["①", "②", "③", "④", "⑤"][i] || "·"}
                  </span>
                  <p className="aoc-body">{String(b)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="action-outcome-section">
            <h4 className="aoc-section-title">Recommendations</h4>
            <ul className="action-reco-list">
              {recommendations.map((r, i) => (
                <li key={`reco-${i}`}>{String(r)}</li>
              ))}
            </ul>
          </div>
        )}

        {(nextSteps.length > 0 || payload.eta) && (
          <div className="action-outcome-footer">
            {nextSteps.length > 0 && (
              <div className="action-outcome-section compact">
                <h4 className="aoc-section-title">This week</h4>
                <ul className="action-next-list">
                  {nextSteps.map((s, i) => (
                    <li key={`next-${i}`}>{String(s)}</li>
                  ))}
                </ul>
              </div>
            )}
            {payload.eta && (
              <div className="action-eta-pill">
                <span>⏱</span> {payload.eta}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const FilmJobCard = ({ job, onClick }) => {
  const pct = job.progress ?? 0;
  const label = job.flavor && job.state ? `${job.flavor} · ${job.state}` : "Hero film";

  return (
    <button type="button" className="card film-job-card" onClick={() => onClick?.(job)}>
      <div className="card-h">
        <h3>{label}</h3>
        <span className="tag film-job-tag">{job.status === "queued" ? "waiting" : "in progress"}</span>
      </div>
      <div className="card-body">
        <div className="film-job-track" aria-hidden>
          <div className="film-job-fill" style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <div className="film-job-row">
          <span className="dots film-job-dots">
            <span></span><span></span><span></span>
          </span>
          <span className="film-job-status">{job.progressText || "Creating your film…"}</span>
        </div>
        <p className="muted film-job-hint">Runs in background · click for storyboard &amp; status</p>
      </div>
    </button>
  );
};

function HeroFilmPanel({ payload, onOpenDetail }) {
  const {
    filmPrompt,
    videoUri,
    filmHref,
    message,
    error,
    setupSteps,
    sku,
    productName,
    region,
    flavor,
    mode,
    storyboard,
  } = payload || {};
  const needsSetup = mode === "setup_required";
  const isPreview = mode === "preview";

  const openFilmDetail = () => {
    onOpenDetail?.({
      type: "Hero film",
      title: productName || sku || flavor || "Hero film",
      subtitle: region,
      body: message || filmPrompt,
      facts: storyboard?.map((s) => ({ k: `Scene ${s.beat}`, v: s.text })),
      source: isPreview ? "Demo storyboard" : "Flavor Insights · hero film",
    });
  };

  return (
    <div
      className={"card hero-film-card " + (onOpenDetail ? "clickable-card" : "")}
      onClick={onOpenDetail ? openFilmDetail : undefined}
      onKeyDown={onOpenDetail ? (e) => e.key === "Enter" && openFilmDetail() : undefined}
      role={onOpenDetail ? "button" : undefined}
      tabIndex={onOpenDetail ? 0 : undefined}
    >
      <div className="card-h">
        <h3>Hero film{flavor ? ` · ${flavor}` : ""}</h3>
        <span className="tag">
          {needsSetup ? "Setup" : isPreview ? "Demo" : mode === "created" ? "Ready" : "Failed"}
        </span>
      </div>
      <div className="card-body">
        {message && <p className="concept-msg">{message}</p>}
        {error && !needsSetup && <p className="concept-err">{error}</p>}
        {(productName || sku || region) && (
          <p className="film-meta">
            {(productName || sku) && <span>{productName || sku}</span>}
            {region && <span> · {region}</span>}
          </p>
        )}
        {storyboard?.length > 0 && (
          <div className="film-storyboard">
            {storyboard.map((s) => (
              <p key={s.beat} className="film-storybeat clickable" onClick={(e) => { e.stopPropagation(); onOpenDetail?.({ type: "Scene", title: `Beat ${s.beat}`, body: s.text, source: "Storyboard" }); }}>
                <b>{s.beat}.</b> {s.text}
              </p>
            ))}
          </div>
        )}
        {filmPrompt && (mode === "failed" || isPreview) && (
          <details className="concept-prompt-details" onClick={(e) => e.stopPropagation()}>
            <summary>Film brief</summary>
            <p className="concept-prompt">{filmPrompt}</p>
          </details>
        )}
        {(videoUri || filmHref) && (
          <div onClick={(e) => e.stopPropagation()}>
            <InlineFilmPlayer videoUri={videoUri} filmHref={filmHref} />
          </div>
        )}
        {setupSteps?.length > 0 && (
          <ol className="film-setup-steps">
            {setupSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}
        {onOpenDetail && (
          <p className="muted film-click-hint">Click card for full detail · scenes are clickable</p>
        )}
      </div>
    </div>
  );
}

function ActionResultPanel({ payload, onOpenDetail }) {
  if (!payload) return null;
  if (payload.type === "concept_cards") return <ConceptCardsPanel payload={payload} />;
  if (payload.type === "create_film") return <HeroFilmPanel payload={payload} onOpenDetail={onOpenDetail} />;
  if (payload.type === "storyboard") return <StoryboardMockPanel payload={payload} />;
  if (
    payload.type === "creative_brief" ||
    payload.type === "content_engine" ||
    payload.type === "positioning"
  ) {
    return <CreativeBriefPanel payload={payload} />;
  }
  return <ActionOutcomeCards payload={payload} />;
}

function ApiKeySettings({ open, onClose, serverConnected, config }) {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  useEffect(() => {
    if (open) {
      setKey(getApiKey() || "");
      setSaved(false);
      setShowOverride(!serverConnected);
    }
  }, [open, serverConnected]);

  if (!open) return null;

  const save = () => {
    setApiKey(key);
    setSaved(true);
    import("@/lib/api-status").then(({ resetBedrockConfigCache }) => resetBedrockConfigCache());
    setTimeout(() => onClose?.(), 600);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="title">{serverConnected ? "API connected" : "API key"}</div>
            <div className="meta">
              {serverConnected
                ? "Your server key is active."
                : "Paste your API key to enable live generation."}
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          {serverConnected && (
            <div className="settings-connected">
              <p className="settings-status-line">
                <span className="live-dot" /> Connected and ready
              </p>
              <button
                type="button"
                className="btn-ghost settings-override-toggle"
                onClick={() => setShowOverride((v) => !v)}
              >
                {showOverride ? "Hide browser override" : "Override key in browser (optional)"}
              </button>
            </div>
          )}

          {(!serverConnected || showOverride) && (
            <>
              <label className="settings-label" htmlFor="api-key">
                {serverConnected ? "Browser override (optional)" : "API key"}
              </label>
              <input
                id="api-key"
                type="password"
                className="settings-input"
                placeholder="Paste API key…"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                autoComplete="off"
              />
              <div className="settings-actions">
                <button type="button" className="btn-primary" onClick={save}>Save key</button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setApiKey("");
                    setKey("");
                  }}
                >
                  Clear
                </button>
              </div>
              {saved && <p className="settings-saved">Saved.</p>}
            </>
          )}

          {serverConnected && !showOverride && (
            <div className="settings-actions">
              <button type="button" className="btn-primary" onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Q&A answer card — any question from Flavor Insights dataset
============================================================ */
function QAResponse({ answer, onPickRelated }) {
  if (!answer) return null;
  return (
    <div className="card qa-card">
      <div className="card-h">
        <h3>{answer.title}</h3>
        <span className="tag">Flavor Insights</span>
      </div>
      <div className="card-body">
        <p className="qa-body">{answer.body}</p>
        {answer.bullets?.length > 0 && (
          <ul className="qa-bullets">
            {answer.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
        {answer.sources?.length > 0 && (
          <div className="qa-sources">
            {answer.sources.map((s, i) => (
              <span key={i} className="qa-source-chip">{s}</span>
            ))}
          </div>
        )}
        {answer.related?.length > 0 && (
          <div className="qa-related">
            <span className="qa-related-label">Related</span>
            {answer.related.map((q, i) => (
              <button key={i} type="button" className="qa-related-btn" onClick={() => onPickRelated?.(q)}>
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DatasetBreakdown() {
  const bd = D().breakdown;
  if (!bd) return null;
  return (
    <div className="dataset-breakdown">
      <p className="dataset-overview">{bd.overview}</p>
      <div className="dataset-sections">
        {(bd.sections || []).map((sec) => (
          <div key={sec.id} className="dataset-sec">
            <span className="ds-title">{sec.title}</span>
            <span className="ds-bul">{sec.bullets[0]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Full summary — clickable index of all report findings
============================================================ */
function FullSummaryCard({ script, onOpenReport }) {
  const s = getScript(script);
  const tiles = [
    { id: "sample", title: "Sample size", val: "1.53L", sub: `${SOURCE_NAMES.length} channels · 12 mo`, section: "method" },
    { id: "hc", title: "Honey Chilli", val: "48.7%", sub: "Conv. growth", section: "honeyChilli" },
    { id: "gp", title: "Gunpowder Podi", val: "46.2%", sub: "Conv. growth", section: "gunpowderPodi" },
    { id: "regional", title: "Regional sweets", val: "68.4%", sub: "Positive sentiment", section: "regional" },
    { id: "states", title: "States mapped", val: "29", sub: "Sweet + savory top 5", section: "states" },
    { id: "sweet", title: "Sweet opps.", val: "5", sub: "Mishti Doi → Qubani", section: "sweet" },
    { id: "savory", title: "Savory opps.", val: "5", sub: "Podi → Honey Chilli", section: "savory" },
    { id: "exec", title: "Recommendation", val: "92%", sub: "Confidence", section: "exec" },
  ];
  const onTile = (t) => {
    const sec = (D().reportSections || []).find((r) => r.id === t.section);
    openDetail({
      type: "Report section",
      title: t.title,
      subtitle: t.val + " · " + t.sub,
      body: sec?.content || s.exec?.p,
      source: "Flavor Insights India · Consuma AI",
    });
  };
  return (
    <div className="card summary-card">
      <div className="card-h">
        <h3>Full research summary</h3>
        <span className="tag">click any tile · PDF data</span>
      </div>
      <div className="card-body">
        <p className="summary-lead">
          {D().meta?.title} — {D().meta?.date}. All figures from {D().meta?.totalSample?.toLocaleString("en-IN")} conversations
          ({D().meta?.channels?.join(", ")}).
        </p>
        <div className="summary-grid">
          {tiles.map((t) => (
            <button key={t.id} type="button" className="summary-tile" onClick={() => onTile(t)}>
              <span className="st-val">{t.val}</span>
              <span className="st-title">{t.title}</span>
              <span className="st-sub">{t.sub}</span>
            </button>
          ))}
        </div>
        <div className="summary-actions">
          <button type="button" className="btn-primary" onClick={onOpenReport}>Open full report ↗</button>
          <span className="summary-note">Every chart, stat, state, and extension chip above is clickable for detail.</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Report modal — full PDF-backed sections, clickable TOC
============================================================ */
function ReportModal({ params, script, onClose, onDownloadBrief, onShareBrief, initialSection = "exec" }) {
  const s = getScript(script);
  const sections = D().reportSections || [];
  const sweet = D().sweetOpportunities || [];
  const savory = D().savoryOpportunities || [];
  const [active, setActive] = useState(initialSection);
  const scrollRef = useRef(null);
  const sectionRefs = useRef({});

  const scrollToSection = useCallback((id) => {
    setActive(id);
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const el = sectionRefs.current[initialSection];
    if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
  }, [initialSection]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target?.id;
        if (id) setActive(id);
      },
      { root, rootMargin: "-12% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] }
    );

    sections.forEach((sec) => {
      const el = sectionRefs.current[sec.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const bindSection = (id) => (el) => {
    if (el) sectionRefs.current[id] = el;
  };

  const sectionById = (id) => sections.find((x) => x.id === id);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="title">{D().meta?.title} — Consumer Research Report</div>
            <div className="meta">Run #4821 · {D().meta?.date} · {D().meta?.channels?.length} sources · scope: {params.region}</div>
          </div>
          <div style={{display:'flex', gap: 8, alignItems: 'center'}}>
            <button type="button" className="btn-ghost" style={{padding:'6px 10px', fontSize:12}} onClick={onDownloadBrief}>Download PDF</button>
            {onShareBrief && (
              <button type="button" className="btn-ghost" style={{padding:'6px 10px', fontSize:12}} onClick={onShareBrief}>Share</button>
            )}
            <button type="button" className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="report-body" ref={scrollRef}>
          <aside className="report-toc">
            <div className="label">Contents · click to navigate</div>
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={`report-toc-link ${active === sec.id ? "active" : ""}`}
                onClick={() => scrollToSection(sec.id)}
              >
                {sec.title}
              </button>
            ))}
          </aside>
          <article className="report-main">
            <div className="report-hero">
              <div className="deck">Brit GPT · Consuma AI · under 30 minutes</div>
              <h1>{s.title} — India flavor insights</h1>
            </div>

            <section id="exec" ref={bindSection("exec")} className="report-section">
              <h2>{sectionById("exec")?.title || "Executive summary"}</h2>
              <p className="report-section-lead">{sectionById("exec")?.content}</p>
              <div className="pull">&quot;{D().honeyChilli?.narrative}&quot;</div>
              <div className="factbox clickable-factbox">
                <div onClick={() => openDetail({ type: "Metric", title: "Honey Chilli", body: `${HONEY_CHILLI_GROWTH}% conversation growth nationally.`, source: "National matrix" })}>
                  <div className="k">Honey Chilli</div><div className="v">{HONEY_CHILLI_GROWTH}%</div>
                </div>
                <div onClick={() => openDetail({ type: "Metric", title: "Gunpowder Podi", body: `${GUNPOWDER_GROWTH}% conversation growth in South India.`, source: "National matrix" })}>
                  <div className="k">Gunpowder Podi</div><div className="v">{GUNPOWDER_GROWTH}%</div>
                </div>
                <div onClick={() => openDetail({ type: "Metric", title: "Sample", body: `${TOTAL_CONVERSATIONS.toLocaleString("en-IN")} conversations.`, source: "cover" })}>
                  <div className="k">Total sample</div><div className="v">1.53L</div>
                </div>
              </div>
              <p><b>Recommendation · {params.region}:</b> {s.exec?.h2}</p>
              <p>{s.exec?.p}</p>
            </section>

            <section id="honeyChilli" ref={bindSection("honeyChilli")} className="report-section">
              <h2>{sectionById("honeyChilli")?.title || "Honey Chilli"}</h2>
              <p className="report-section-lead">{sectionById("honeyChilli")?.content}</p>
              <p>{D().honeyChilli?.narrative}</p>
              <p><b>Extensions:</b> {(D().honeyChilli?.extensions || []).join(" · ")}.</p>
            </section>

            <section id="gunpowderPodi" ref={bindSection("gunpowderPodi")} className="report-section">
              <h2>{sectionById("gunpowderPodi")?.title || "Gunpowder Podi"}</h2>
              <p className="report-section-lead">{sectionById("gunpowderPodi")?.content}</p>
              <p>{D().gunpowderPodi?.narrative}</p>
              <p><b>Extensions:</b> {(D().gunpowderPodi?.extensions || []).join(" · ")}.</p>
            </section>

            <section id="regional" ref={bindSection("regional")} className="report-section">
              <h2>{sectionById("regional")?.title || "Regional sweets"}</h2>
              <p className="report-section-lead">{sectionById("regional")?.content}</p>
              <p>{D().regionalSweetSentiment?.narrative}</p>
            </section>

            <section id="shares" ref={bindSection("shares")} className="report-section" style={{ display: "none" }} aria-hidden="true" />

            <section id="states" ref={bindSection("states")} className="report-section">
              <h2>{sectionById("states")?.title || "States — top flavors"}</h2>
              <p className="report-section-lead">{sectionById("states")?.content}</p>
              {(D().states || STATES_TABLE).map((row) => (
                <p
                  key={row.state}
                  className="report-state-line clickable"
                  onClick={() => openDetail({ type: "State", title: row.state, facts: [{ k: "Sweet", v: row.sweet.join(", ") }, { k: "Savory", v: row.savory.join(", ") }], source: "State table" })}
                >
                  <b>{row.state}</b> — Sweet: {row.sweet.join(", ")}. Savory: {row.savory.join(", ")}.
                </p>
              ))}
            </section>

            <section id="sweet" ref={bindSection("sweet")} className="report-section">
              <h2>{sectionById("sweet")?.title || "Sweet opportunities"}</h2>
              <p className="report-section-lead">{sectionById("sweet")?.content}</p>
              {sweet.map((o) => (
                <p key={o.flavor} className="clickable" onClick={() => openDetail({ type: "Sweet", title: o.flavor, body: `${o.proof}. Extensions: ${o.extensions}`, source: o.anchor })}>
                  <b>{o.flavor}</b> ({o.anchor}) — {o.proof}
                </p>
              ))}
            </section>

            <section id="savory" ref={bindSection("savory")} className="report-section">
              <h2>{sectionById("savory")?.title || "Savory opportunities"}</h2>
              <p className="report-section-lead">{sectionById("savory")?.content}</p>
              {savory.map((o) => (
                <p key={o.flavor} className="clickable" onClick={() => openDetail({ type: "Savory", title: o.flavor, body: `${o.proof}. Extensions: ${o.extensions}`, source: o.anchor })}>
                  <b>{o.flavor}</b> ({o.anchor}) — {o.proof}
                </p>
              ))}
            </section>

            <section id="method" ref={bindSection("method")} className="report-section">
              <h2>{sectionById("method")?.title || "Methodology"}</h2>
              <p className="report-section-lead">{sectionById("method")?.content}</p>
              <p><b>Channels:</b> {(D().meta?.channels || []).join(" · ")}.</p>
              <p><b>Sample:</b> {TOTAL_CONVERSATIONS.toLocaleString("en-IN")} conversations · India · last 12 months.</p>
              <p><b>Prepared by:</b> Consuma AI · generated in under 30 minutes.</p>
            </section>
          </article>
        </div>
      </div>
    </div>
  );
}


export {
  BootBlock, ScopeForm, TimelineBlock, InsightBlock,
  RegionCard, StatesCard, ExtensionsCard, SentimentCard, TrendCard, FlavourCard, QuotesCard,
  FullSummaryCard, ExecBlock, FilmJobCard, ReportModal, DetailPanel, QAResponse, DatasetBreakdown,
  ActionsRecommendations, ConceptCardsPanel, ActionResultPanel, ActionOutcomeCards, ApiKeySettings,
  SUGGESTIONS, RESEARCH_SCRIPTS, matchResearchScript, STATES_TABLE, openDetail,
};
