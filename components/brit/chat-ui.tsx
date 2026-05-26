// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BRIT_DATA } from '@/lib/data';
import { DEMO_STATES, HERO_THESIS, RRP_TIMELINE_STAGES, BRITANNIA_CONSUMER_QUOTES } from '@/lib/demo-flow-data';
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
  { t: "0.20s", text: "Running consumer research engine…",       marker: null,  done: false },
  { t: "0.60s", text: "Consumer discovery started",              marker: "✓",   done: true  },
  { t: "1.10s", text: "Gathering market signals…",               marker: null,  done: false },
  { t: "1.55s", text: "6 channels identified · 1.53L conversations", marker: "✓", done: true },
  { t: "2.05s", text: "Generating follow-up questions",          marker: "✓",   done: true  },
];

const REGIONS = ["Pan-India", "North", "South", "West", "East", "Metro"];
const TIMEFRAMES = ["90 days", "6 months", "12 months", "24 months"];
const OBJECTIVES = ["Product extension", "New SKU launch", "Pricing strategy", "Channel mix", "Brand refresh"];
const FILTERS = ["Urban", "Rural", "Premium tier", "Mass tier", "Gen-Z", "Millennials", "Families"];

const SOURCE_NAMES = [
  "Instagram", "Reddit", "X", "YouTube", "Amazon Reviews", "Flipkart Reviews",
];

const REGIONS_DATA = [
  { lbl: "Peri Peri",            val: 22 },
  { lbl: "Honey Chilli",         val: 18 },
  { lbl: "Magic / Chatpata",     val: 15 },
  { lbl: "Cheese",               val: 11 },
  { lbl: "Chilli",               val:  9 },
  { lbl: "Metro avg.",           val:  8 },
];

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

const TOTAL_CONVERSATIONS = 153496;
const BISCOFF_CONVERSATIONS = 17835;
const HONEY_CHILLI_CONVERSATIONS = 11353;
const BISCOFF_POSITIVE_PCT = 43.10;
const HONEY_CHILLI_FAV_SHARE = 18;
const GLOBAL_SPICE_INTEREST = 55;
const SAVORY_INNOVATION_DEMAND = 25;
const FUSION_FLAVOUR_ENTHUSIASM = 19.43;

const BISCOFF_EXTENSIONS = [
  "Biscoff Cream Biscuits", "Biscoff Cheesecake Cups", "Biscoff Kaju Katli",
  "Biscoff Barfi", "Biscoff Cream Cones", "Biscoff Filled Croissants",
];

const HONEY_CHILLI_EXTENSIONS = [
  "Chips", "Makhana", "Crackers", "Dips", "Pizza", "Chaat", "Popcorn", "Namkeen",
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

const FAVOUR_FLAVOR_SHARES = [
  { lbl: "Peri Peri", val: 22 }, { lbl: "Honey Chilli", val: 18 }, { lbl: "Magic / Chatpata", val: 15 },
  { lbl: "Cheese", val: 11 }, { lbl: "Chilli", val: 9 }, { lbl: "Schezwan", val: 8 },
];

/* Per-question research scripts — real PDF data, deterministic demo paths */
const RESEARCH_SCRIPTS = {
  flavour: {
    id: "flavour",
    title: "Top flavours by state",
    scopeDefaults: { region: "Pan-India", obj: "Product extension" },
    muted: "State-level sweet & savory top-5 lists, flavor opportunity scores, and regional snack share.",
    cards: ["states", "flavour", "region", "quotes", "summary", "exec"],
    insight: {
      highlight: "Honey Chilli & Gunpowder Podi",
      body: HERO_THESIS.body,
      stats: [
        { k: "States covered", v: "29" },
        { k: "Honey Chilli conv. growth", v: "48.7", suffix: "%" },
        { k: "Gunpowder Podi eng. growth", v: "61.8", suffix: "%" },
        { k: "Sample", v: "1.5", suffix: "L" },
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
      meta: [{ k: "States", v: "11" }, { k: "Fusion", v: "19.4%" }, { k: "Global spice", v: "55%" }, { k: "Sample", v: "1.5L" }],
    },
  },
  sentiment: {
    id: "sentiment",
    title: "Biscoff sentiment — sweets",
    scopeDefaults: { region: "Pan-India", obj: "New SKU launch" },
    muted: "Biscoff sentiment split, positive rate, and trust narrative from 17,835 conversations.",
    cards: ["sentiment", "trend", "quotes", "summary", "exec"],
    insight: {
      highlight: "Biscoff",
      body: "shows 43.10% positive sentiment in sweets — consumers like the taste but distrust low-quality imitations. Win as a premium dessert system with transparent ingredients, not a copycat biscuit.",
      stats: [
        { k: "Positive", v: "43.1", suffix: "%" },
        { k: "Sentiment +", v: "73.1", suffix: "%" },
        { k: "Conversations", v: "17.8", suffix: "K" },
        { k: "Neutral", v: "14.5", suffix: "%" },
      ],
    },
    sentData: SENT_DATA,
    sentCenter: BISCOFF_POSITIVE_PCT,
    sentMentions: BISCOFF_CONVERSATIONS,
    trendLabel: "Biscoff · positive sentiment",
    trendSolid: [38, 39, 40, 41, 41, 42, 42, 43, 43, 43, 43, 43],
    trendDashed: [65, 66, 67, 68, 69, 70, 71, 72, 72, 73, 73, 73],
    quotes: [
      { text: "Biscoff already travels across desserts, beverages and hacks; the unlock is premium formulation and ingredient transparency.", att: `Biscoff · ${BISCOFF_CONVERSATIONS.toLocaleString("en-IN")} conversations · ${BISCOFF_POSITIVE_PCT}% positive` },
      { text: "Sentiment in sweets: 73.1% positive, 14.5% neutral, 12.4% negative — trust gap on local imitations.", att: "Flavor Insights · India · last 12 months" },
      { text: "Consumers like the taste but distrust low-quality local imitations — controlled sweetness matters.", att: "Report narrative · Consuma AI" },
    ],
    exec: {
      h2: "Position Biscoff as a premium dessert system — cream biscuits, mithai, and cheesecake adjacency first.",
      p: `Lead with transparent ingredients and dessert formats. ${BISCOFF_POSITIVE_PCT}% positive sentiment across ${BISCOFF_CONVERSATIONS.toLocaleString("en-IN")} conversations; negative risk is imitation quality, not flavor rejection.`,
      meta: [{ k: "Positive", v: "43.1%" }, { k: "Convos", v: "17.8K" }, { k: "Trust gap", v: "Imitation" }, { k: "Format", v: "Dessert" }],
    },
  },
  extension: {
    id: "extension",
    title: "Extension opportunities",
    scopeDefaults: { region: "Pan-India", obj: "Product extension" },
    muted: "Biscoff dessert extensions and Honey Chilli swicy snack line — from report opportunity lists.",
    cards: ["extensions", "flavour", "region", "summary", "exec"],
    insight: {
      highlight: "Biscoff + Honey Chilli",
      body: "extension pipelines are the clearest near-term plays — six Biscoff dessert SKUs and eight Honey Chilli savory formats, backed by 17,835 and 11,353 conversations respectively.",
      stats: [
        { k: "Biscoff SKUs", v: "6" },
        { k: "Honey Chilli SKUs", v: "8" },
        { k: "Swicy share", v: "18", suffix: "%" },
        { k: "Fusion", v: "19.4", suffix: "%" },
      ],
    },
    regionsData: FAVOUR_FLAVOR_SHARES,
    regionTitle: "Share of favorite savory flavors (%)",
    flavours: [
      { name: "Biscoff Cream", grow: "Dessert", bars: [4,5,6,7,8,8,9], down: false },
      { name: "Honey Chilli Chips", grow: "Swicy", bars: [3,4,5,6,7,8,8], down: false },
      { name: "Gunpowder Podi", grow: "+55%", bars: [3,4,5,5,6,7,7], down: false },
      { name: "Bhakarwadi", grow: "+25%", bars: [3,3,4,4,5,5,6], down: false },
      { name: "Gulkand", grow: "+31.6%", bars: [3,4,4,5,6,6,7], down: false },
      { name: "Sattu", grow: "+51.5%", bars: [2,3,4,4,5,6,6], down: false },
    ],
    quotes: [
      { text: "Extension opportunities: Biscoff Cream Biscuits, Cheesecake Cups, Kaju Katli, Barfi, Cream Cones, Filled Croissants.", att: "Biscoff · Flavor Insights" },
      { text: "Honey Chilli extensions: Chips, Makhana, Crackers, Dips, Pizza, Chaat, Popcorn, Namkeen.", att: "Honey Chilli · 18%+ favorite snack share" },
      { text: "55% global-spice interest and 25% savory innovation demand support swicy and podi-led launches.", att: "Savory opportunities · report" },
    ],
    exec: {
      h2: "Prioritize Biscoff dessert-system extensions, then Honey Chilli swicy snacks in parallel.",
      p: `Phase 1: ${BISCOFF_EXTENSIONS.slice(0, 3).join(", ")}. Phase 2: ${HONEY_CHILLI_EXTENSIONS.slice(0, 4).join(", ")}. Both tracks use real conversation volume (${BISCOFF_CONVERSATIONS.toLocaleString("en-IN")} / ${HONEY_CHILLI_CONVERSATIONS.toLocaleString("en-IN")}).`,
      meta: [{ k: "Biscoff SKUs", v: "6" }, { k: "Honey Chilli", v: "8" }, { k: "Spice interest", v: "55%" }, { k: "Confidence", v: "84%" }],
    },
  },
  biscoff: {
    id: "biscoff",
    title: "Biscoff dessert system",
    scopeDefaults: { region: "Pan-India", obj: "Premium dessert system" },
    muted: "Full Biscoff narrative — sentiment, trust, extensions from 17,835 conversations.",
    cards: ["sentiment", "extensions", "trend", "quotes", "summary", "exec"],
    insight: {
      highlight: "Biscoff",
      body: "wins through premium dessert-led trust building — 43.10% positive sentiment across 17,835 conversations; not a copycat biscuit play.",
      stats: [
        { k: "Positive", v: "43.1", suffix: "%" },
        { k: "In sweets +", v: "73.1", suffix: "%" },
        { k: "Conversations", v: "17.8", suffix: "K" },
        { k: "Extensions", v: "6", suffix: "" },
      ],
    },
    sentData: SENT_DATA,
    sentCenter: BISCOFF_POSITIVE_PCT,
    sentMentions: BISCOFF_CONVERSATIONS,
    trendLabel: "Biscoff positive % · 12 mo",
    trendSolid: [38, 39, 40, 41, 41, 42, 42, 43, 43, 43, 43, 43],
    trendDashed: [70, 71, 71, 72, 72, 73, 73, 73, 73, 73, 73, 73],
    quotes: [
      { text: D().biscoff?.narrative || "Premium formulation and ingredient transparency unlock trust.", att: "Biscoff · Flavor Insights" },
      { text: "73.1% positive, 14.5% neutral, 12.4% negative in sweets category.", att: "Sentiment split · report" },
      { text: "Travels across desserts, beverages and hacks — distrust is on imitation quality.", att: "17,835 conversations" },
    ],
    exec: {
      h2: "Launch Biscoff as a premium dessert system — transparent ingredients, controlled sweetness.",
      p: "Prioritize Cream Biscuits, Cheesecake Cups, and mithai formats. 43.10% positive; imitation-quality is the main risk.",
      meta: [{ k: "Positive", v: "43.1%" }, { k: "Convos", v: "17.8K" }, { k: "SKUs", v: "6" }, { k: "Format", v: "Dessert" }],
    },
  },
  swicy: {
    id: "swicy",
    title: "Honey Chilli swicy heat",
    scopeDefaults: { region: "Pan-India", obj: "Swicy innovation" },
    muted: "Favorite flavor shares, global spice signals, Honey Chilli extensions.",
    cards: ["region", "extensions", "trend", "flavour", "summary", "exec"],
    insight: {
      highlight: "Hot Honey Chilli Crisp",
      body: "is the global swicy bet — 18%+ favorite-snack share, 55% global-spice interest, 11,353 conversations.",
      stats: [
        { k: "Fav. share", v: "18", suffix: "%+" },
        { k: "Global spice", v: "55", suffix: "%" },
        { k: "Savory innov.", v: "25", suffix: "%" },
        { k: "Convos", v: "11.4", suffix: "K" },
      ],
    },
    regionsData: D().favoriteSavoryShares || FAVOUR_FLAVOR_SHARES,
    regionTitle: "Share of favorite savory flavors (%)",
    flavours: [
      { name: "Honey Chilli", grow: "18%+", bars: [12,13,14,15,16,17,17,18,18,18,18,18], down: false },
      { name: "Peri Peri", grow: "22%", bars: [18,19,19,20,20,21,21,22,22,22,22,22], down: false },
      { name: "Gunpowder Podi", grow: "55%", bars: [3,4,5,6,7,8,8], down: false },
      { name: "Thecha", grow: "55%", bars: [3,3,4,5,6,6,7], down: false },
      { name: "Bhakarwadi", grow: "25%", bars: [3,3,4,4,5,5,6], down: false },
      { name: "Sattu", grow: "51.5%", bars: [2,3,4,4,5,6,6], down: false },
    ],
    quotes: [
      { text: D().honeyChilli?.narrative || "Swicy, crunchy, saucy, snackable.", att: "Honey Chilli · report" },
      { text: "Peri Peri 22%, Honey Chilli 18%, Magic/Chatpata 15% — favorite savory menu shares.", att: "Flavor share · India" },
      { text: "Extensions: chips, makhana, crackers, dips, pizza, chaat, popcorn, namkeen.", att: "11,353 conversations" },
    ],
    exec: {
      h2: "Pilot Honey Chilli swicy line — chips, makhana, popcorn, dip sachets — pan-India.",
      p: "Differentiate on swicy (55% global-spice interest), not plain heat. Delhi already lists Honey Chilli in savory top-5.",
      meta: [{ k: "Share", v: "18%" }, { k: "Spice", v: "55%" }, { k: "Fusion", v: "19.4%" }, { k: "SKUs", v: "8" }],
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
      { lbl: "Caramel", val: 62 }, { lbl: "Date Jaggery Til", val: 75 }, { lbl: "Pistachio Kesar", val: 60 },
      { lbl: "Gulkand", val: 50 }, { lbl: "Thandai", val: 29 }, { lbl: "Biscoff positive", val: 43 },
    ],
    regionTitle: "Premium & health demand index (%)",
    flavours: [
      { name: "Caramel", grow: "+62.43%", bars: [4,5,6,7,8,9,9], down: false },
      { name: "Date Jaggery Til", grow: "+75%", bars: [3,4,5,6,7,8,8], down: false },
      { name: "Pistachio Kesar", grow: "+60%", bars: [3,4,4,5,6,7,7], down: false },
      { name: "Gulkand", grow: "+50%", bars: [3,3,4,5,5,6,6], down: false },
      { name: "Thandai", grow: "+29%", bars: [2,3,3,4,5,5,6], down: false },
      { name: "Biscoff", grow: "+43%", bars: [3,3,4,4,4,4,4], down: false },
    ],
    quotes: [
      { text: "62.43% premium/luxury pull and 31.62% fusion interest make burnt chhena caramel a scalable bridge.", att: "Caramel · sweet opportunity" },
      { text: "75% natural sweetener demand, 50% health-conscious choice — Date Jaggery Til for better-for-you premium.", att: "Date Jaggery Til · Bihar, MH, GJ" },
      { text: "60% healthy ingredients, 35% nut premium appeal, 17.57% gifting — Pistachio Kesar festive platform.", att: "Pistachio Kesar · RJ, GJ, MH" },
    ],
    exec: {
      h2: "Price premium biscuit SKUs on Caramel and Pistachio Kesar platforms — tier Metro first.",
      p: "Elasticity favors transparent premium ingredients over mass discounting. Anchor ₹60–80 packs on Caramel and Kesar stories; Biscoff dessert line for indulgence tier.",
      meta: [{ k: "Premium pull", v: "62%" }, { k: "Natural demand", v: "75%" }, { k: "Gifting", v: "17.6%" }, { k: "Metro", v: "First" }],
    },
  },
  default: {
    id: "default",
    title: "Sweet & savory insights",
    scopeDefaults: { region: "South", obj: "Product extension" },
    muted: "State deep dives, winning flavors, cross-state synthesis, national matrix, and actionables.",
    cards: ["summary", "exec"],
    insight: {
      highlight: HERO_THESIS.headline,
      body: HERO_THESIS.body,
      stats: [
        { k: "Honey Chilli conv.", v: "48.7", suffix: "%" },
        { k: "Gunpowder Podi conv.", v: "46.8", suffix: "%" },
        { k: "Flavors indexed", v: "38" },
        { k: "Sample", v: "1.53", suffix: "L" },
      ],
    },
    regionsData: REGIONS_DATA,
    regionTitle: "Regional affinity — favorite savory flavors",
    flavours: FLAVOURS,
    sentData: SENT_DATA,
    sentCenter: BISCOFF_POSITIVE_PCT,
    sentMentions: BISCOFF_CONVERSATIONS,
    quotes: BRITANNIA_CONSUMER_QUOTES,
    exec: {
      h2: "Launch Biscoff as a premium dessert system and pilot Honey Chilli swicy snacks — first in South India.",
      p: `Three signals: ${BISCOFF_POSITIVE_PCT}% Biscoff positive, ${HONEY_CHILLI_FAV_SHARE}% Honey Chilli favorite-snack share, ${GLOBAL_SPICE_INTEREST}% global-spice interest.`,
      meta: [{ k: "Confidence", v: "84%" }, { k: "Biscoff", v: "17.8K" }, { k: "Sample", v: "1.5L" }, { k: "Channels", v: "6" }],
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
  if (/biscoff|dessert/.test(ql)) return RESEARCH_SCRIPTS.biscoff;
  if (/swicy|honey.chilli|honey chilli/.test(ql)) return RESEARCH_SCRIPTS.swicy;
  if (/sentiment|biscuit|sweet/.test(ql)) return RESEARCH_SCRIPTS.sentiment;
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
        setTimeout(step, 380 + Math.random() * 200);
      } else {
        setTimeout(() => onComplete && onComplete(), 500);
      }
    };
    setTimeout(step, 320);
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
        <div className="note">Engine ready · 6 sources staged</div>
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
  const stages = RRP_TIMELINE_STAGES;
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [srcCount, setSrcCount] = useState(2);
  const started = useRef(Date.now());
  const finished = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

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
      }       else if (!finished.current) {
        finished.current = true;
        setIdx(stages.length);
        setProg(1);
        setTimeout(() => onDoneRef.current?.(), 600);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [idx]);

  useEffect(() => {
    const i = setInterval(() => setElapsed((Date.now() - started.current) / 1000), 100);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const want = Math.min(SOURCE_NAMES.length, 2 + Math.floor((idx + prog) * 1.2));
    setSrcCount(want);
  }, [idx, prog]);

  const allDone = idx >= stages.length;

  const overall = useMemo(() => {
    if (allDone) return 100;
    const total = stages.reduce((a, s) => a + s.dur, 0);
    let done = 0;
    for (let i = 0; i < idx; i++) done += stages[i].dur;
    done += prog * (stages[idx]?.dur || 0);
    return Math.min(100, Math.round((done / total) * 100));
  }, [idx, prog, allDone, stages]);

  const sourcePills = SOURCE_NAMES.slice(0, srcCount);

  return (
    <div className="tl-block">
      <div className="tl-head">
        <span className="l">Run #4821 · executing · t+{elapsed.toFixed(1)}s</span>
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
                <div className="tl-bar"><span style={{width: (p*100)+"%"}}></span></div>
              </div>
              <div className={"tl-stat " + (status === "active" ? "live" : status === "done" ? "ok" : "")}>
                {status === "done" ? "done" : status === "active" ? "running" : "queued"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="tl-foot">
        <div className="col">
          <div className="lbl">Sources aggregated · {sourcePills.length}/6</div>
          <div>
            {sourcePills.map(s => <span key={s} className="src-pill">{s}</span>)}
          </div>
        </div>
        <div className="col">
          <div className="lbl">Signals processed</div>
          <div className="v">{Math.round(((idx + prog) / stages.length) * TOTAL_CONVERSATIONS).toLocaleString("en-IN")} / {TOTAL_CONVERSATIONS.toLocaleString("en-IN")}</div>
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
  const onStat = (st) => openDetail({
    type: "Key metric",
    title: st.k,
    body: `Report value: ${st.v}${st.suffix || ""}. Research scope: ${reg}. From Flavor Insights India — ${D().meta?.totalSample?.toLocaleString("en-IN")} conversations.`,
    source: "Consuma AI · 20 May 2026",
  });
  return (
    <div className="insight">
      <div className="eyebrow">Insight · opening hero</div>
      <h2>{HERO_THESIS.title}</h2>
      <p className="insight-lead">{ins.highlight}. {ins.body.replace("{region}", reg)}</p>
      <div className="insight-stats">
        {ins.stats.map((st, i) => (
          <ClickableStat key={i} label={st.k} value={st.v}
            suffix={st.suffix === "L" ? "L convos" : st.suffix === "K" ? "K" : st.suffix ? "%" : ""}
            onClick={() => onStat(st)} />
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
        : `Ranked in national favorite snack menus. Peri Peri leads at 22%, Honey Chilli at 18%+. Sample: ${D().meta?.totalSample?.toLocaleString("en-IN")} conversations.`,
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
  const center = sc.sentCenter ?? BISCOFF_POSITIVE_PCT;
  const mentions = sc.sentMentions ?? BISCOFF_CONVERSATIONS;

  const onSegment = (s) => {
    openDetail({
      type: "Sentiment",
      title: `${s.lbl} — ${s.v}%`,
      body: `Biscoff in sweets: ${D().biscoff?.sentiment?.positive}% positive, ${D().biscoff?.sentiment?.neutral}% neutral, ${D().biscoff?.sentiment?.negative}% negative. Headline positive sentiment ${D().biscoff?.positivePct}%.`,
      source: `${mentions.toLocaleString("en-IN")} conversations`,
    });
  };

  return (
    <div className="card">
      <div className="card-h">
        <h3>Sentiment towards Biscoff in sweets</h3>
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
  const biscoff = D().biscoff?.extensions || BISCOFF_EXTENSIONS;
  const hc = D().honeyChilli?.extensions || HONEY_CHILLI_EXTENSIONS;
  const onExt = (name, track) => openDetail({
    type: "Extension SKU",
    title: name,
    body: track === "Biscoff"
      ? `Part of Biscoff dessert-system extensions. ${D().biscoff?.conversations?.toLocaleString("en-IN")} conversations · ${D().biscoff?.positivePct}% positive.`
      : `Honey Chilli swicy extension. ${D().honeyChilli?.conversations?.toLocaleString("en-IN")} conversations · ${D().honeyChilli?.favSharePct}%+ favorite snack share.`,
    source: "Flavor Insights · extension list",
  });
  return (
    <div className="card">
      <div className="card-h">
        <h3>Extension opportunities</h3>
        <span className="tag">click any SKU</span>
      </div>
      <div className="card-body">
        <div className="ext-group">
          <div className="ext-label">Biscoff · premium dessert</div>
          <div className="scope-chips">
            {biscoff.map((e) => (
              <span key={e} className="chip clickable" onClick={() => onExt(e, "Biscoff")}>{e}</span>
            ))}
          </div>
        </div>
        <div className="ext-group">
          <div className="ext-label">Honey Chilli · swicy</div>
          <div className="scope-chips">
            {hc.map((e) => (
              <span key={e} className="chip clickable" onClick={() => onExt(e, "Honey Chilli")}>{e}</span>
            ))}
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
  const b = D().biscoff?.trend12m;
  const h = D().honeyChilli?.trend12m;
  const fromData = sc.id === "swicy" ? h : b;
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
              source: "1,53,496 conversations · 6 channels",
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
  const quotes = getScript(script).quotes || RESEARCH_SCRIPTS.default.quotes;
  return (
    <div className="card">
      <div className="card-h">
        <h3>Consumer voice</h3>
        <span className="tag">panel + social</span>
      </div>
      <div className="card-body">
        {quotes.map((q, i) => (
          <div key={i} className="quote clickable"
               onClick={() => openDetail({ type: "Consumer voice", title: "Verbatim signal", body: q.text, source: q.att })}>
            <p>"{q.text}"</p>
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
  { id: "content_engine", label: "Shoot to content engine", sub: "Scripts + packshots", icon: "↗" },
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
          <span className="concept-ph-lane">{concept.lane}</span>
          <span className="concept-ph-title">{concept.title}</span>
          <span className="concept-ph-sku">{concept.sku}</span>
        </div>
      )}
    </div>
  );
}

function InlineFilmPlayer({ videoUri, filmHref, className = "hero-film-video" }) {
  const [playUrl, setPlayUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      if (filmHref && (filmHref.includes("X-Amz") || filmHref.includes(".mp4"))) {
        if (!cancelled) {
          setPlayUrl(filmHref);
          setLoading(false);
        }
        return;
      }

      if (!videoUri) {
        if (!cancelled) {
          setError("No video URI");
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/film?uri=${encodeURIComponent(videoUri)}`);
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

function ConceptCardsPanel({ payload }) {
  const { concepts = [], mode, message, error } = payload || {};
  const created = mode === "created";

  return (
    <div className="card concept-cards-card">
      <div className="card-h">
        <h3>Concept cards</h3>
        <span className="tag">{created ? "Ready" : "Preview"}</span>
      </div>
      <div className="card-body">
        {message && !error && <p className="concept-msg">{message}</p>}
        {error && <p className="concept-err">{error}</p>}
        <div className="concept-grid">
          {concepts.map((c) => (
            <div key={c.id} className="concept-card">
              <ConceptCardImage concept={c} />
              <div className="concept-meta">
                <span className="concept-lane">{c.lane}</span>
                <h4>{c.title}</h4>
                <p className="concept-sku">{c.sku}</p>
                <p className="concept-tag">{c.tagline}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ACTION_META = {
  content_engine: { label: "Content engine", icon: "↗", accent: "#c45c3e" },
  storyboard: { label: "Video storyboard", icon: "▶", accent: "#5c4a3e" },
  positioning: { label: "Positioning", icon: "◇", accent: "#6b3d2e" },
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
        <span className="tag film-job-tag">{job.status === "queued" ? "queued" : "rendering"}</span>
      </div>
      <div className="card-body">
        <div className="film-job-track" aria-hidden>
          <div className="film-job-fill" style={{ width: `${Math.max(4, pct)}%` }} />
        </div>
        <div className="film-job-row">
          <span className="dots film-job-dots">
            <span></span><span></span><span></span>
          </span>
          <span className="film-job-status">{job.progressText || "Rendering film…"}</span>
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
    { id: "sample", title: "Sample size", val: "1.53L", sub: "6 channels · 12 mo", section: "method" },
    { id: "biscoff", title: "Biscoff positive", val: "43.1%", sub: `${D().biscoff?.conversations?.toLocaleString("en-IN")} convos`, section: "biscoff" },
    { id: "hc", title: "Honey Chilli share", val: "18%+", sub: `${D().honeyChilli?.conversations?.toLocaleString("en-IN")} convos`, section: "swicy" },
    { id: "spice", title: "Global spice", val: "55%", sub: "Savory innov. 25%", section: "swicy" },
    { id: "states", title: "States mapped", val: "11", sub: "Sweet + savory top 5", section: "states" },
    { id: "sweet", title: "Sweet opps.", val: "5", sub: "Gulkand → Date-til", section: "sweet" },
    { id: "savory", title: "Savory opps.", val: "5", sub: "Podi → Honey Chilli", section: "savory" },
    { id: "exec", title: "Recommendation", val: "84%", sub: "Confidence", section: "exec" },
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
              <div className="deck">Brit GPT · Consuma AI Rapid Research · under 30 minutes</div>
              <h1>{s.title} — India flavor insights</h1>
            </div>

            <section id="exec" ref={bindSection("exec")} className="report-section">
              <h2>{sectionById("exec")?.title || "Executive summary"}</h2>
              <p className="report-section-lead">{sectionById("exec")?.content}</p>
              <div className="pull">"{D().biscoff?.narrative}"</div>
              <div className="factbox clickable-factbox">
                <div onClick={() => openDetail({ type: "Metric", title: "Biscoff positive", body: `${BISCOFF_POSITIVE_PCT}% across ${BISCOFF_CONVERSATIONS.toLocaleString("en-IN")} conversations.`, source: "p.2" })}>
                  <div className="k">Biscoff positive</div><div className="v">{BISCOFF_POSITIVE_PCT}%</div>
                </div>
                <div onClick={() => openDetail({ type: "Metric", title: "Honey Chilli", body: `${HONEY_CHILLI_FAV_SHARE}%+ favorite snack share.`, source: "p.3" })}>
                  <div className="k">Honey Chilli</div><div className="v">{HONEY_CHILLI_FAV_SHARE}%+</div>
                </div>
                <div onClick={() => openDetail({ type: "Metric", title: "Sample", body: `${TOTAL_CONVERSATIONS.toLocaleString("en-IN")} conversations.`, source: "cover" })}>
                  <div className="k">Total sample</div><div className="v">1.53L</div>
                </div>
              </div>
              <p><b>Recommendation · {params.region}:</b> {s.exec?.h2}</p>
              <p>{s.exec?.p}</p>
            </section>

            <section id="biscoff" ref={bindSection("biscoff")} className="report-section">
              <h2>{sectionById("biscoff")?.title || "Biscoff wins"}</h2>
              <p className="report-section-lead">{sectionById("biscoff")?.content}</p>
              <p>{D().biscoff?.narrative} Sentiment in sweets: {SENT_DATA.map((x) => `${x.lbl} ${x.v}%`).join(", ")}.</p>
              <p><b>Extensions:</b> {(D().biscoff?.extensions || BISCOFF_EXTENSIONS).join(" · ")}.</p>
            </section>

            <section id="swicy" ref={bindSection("swicy")} className="report-section">
              <h2>{sectionById("swicy")?.title || "Honey Chilli swicy"}</h2>
              <p className="report-section-lead">{sectionById("swicy")?.content}</p>
              <p>{D().honeyChilli?.narrative}</p>
              <p><b>Signals:</b> {GLOBAL_SPICE_INTEREST}% global spice · {SAVORY_INNOVATION_DEMAND}% savory innovation · {FUSION_FLAVOUR_ENTHUSIASM}% fusion.</p>
              <p><b>Extensions:</b> {(D().honeyChilli?.extensions || HONEY_CHILLI_EXTENSIONS).join(" · ")}.</p>
            </section>

            <section id="shares" ref={bindSection("shares")} className="report-section">
              <h2>{sectionById("shares")?.title || "Favorite savory shares"}</h2>
              <p className="report-section-lead">{sectionById("shares")?.content}</p>
              <div className="report-share-grid">
                {(D().favoriteSavoryShares || []).map((f) => (
                  <button
                    key={f.lbl}
                    type="button"
                    className="report-share-chip clickable"
                    onClick={() => openDetail({ type: "Share", title: f.lbl, body: `${f.val}% favorite savory share`, source: "Favorite flavors" })}
                  >
                    <span className="rs-label">{f.lbl}</span>
                    <span className="rs-val">{f.val}%</span>
                  </button>
                ))}
              </div>
            </section>

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
              <p><b>Platform:</b> Consuma AI Rapid Research · generated in under 30 minutes.</p>
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
