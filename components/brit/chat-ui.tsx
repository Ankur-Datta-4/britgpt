// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BRIT_DATA } from '@/lib/data';
import { ACTIONS, runAction } from '@/lib/actions';
import { getApiKey, setApiKey, hasApiKey } from '@/lib/config-client';
import { BEDROCK_S3_PUBLIC_URL, s3UriToHttps } from '@/lib/config';

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

const TIMELINE_STAGES = [
  { id: "discovery", title: "Discovery",          desc: "Indexing consumer universe · 1.53L conversations",      dur: 1700 },
  { id: "signals",   title: "Consumer Signals",   desc: "Quick-search · social listening · panel surveys",   dur: 2100 },
  { id: "market",    title: "Market Analysis",    desc: "Sales velocity · channel mix · YoY growth",         dur: 1900 },
  { id: "sources",   title: "Source Aggregation", desc: "Instagram · Reddit · X · YouTube · Amazon · Flipkart",   dur: 1700 },
  { id: "report",    title: "Report Generation",  desc: "Synthesising executive narrative",                    dur: 1900 },
];

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
      highlight: "state-local sweet & savory leaders",
      body: "Across 11 states, local sweet icons (Mysore Pak, Puran Poli, Mishti Doi) and savory systems (Gunpowder Podi, Thecha, Honey Chilli in Delhi) dominate — national SKUs win by anchoring to these roots.",
      stats: [
        { k: "States covered", v: "11" },
        { k: "Honey Chilli (Delhi savory)", v: "Top 5" },
        { k: "Fusion interest", v: "31.6", suffix: "%" },
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
    quotes: [
      { text: "Delhi savory top-5 includes Honey Chilli — street-food swicy is crossing into packaged snacks.", att: "Delhi · Flavor Insights state table" },
      { text: "Maharashtra pairs Puran Poli / Modak sweets with Misal Pav, Vada Pav, Thecha — fusion room at 19.43%.", att: "Maharashtra · 1.53L conversation sample" },
      { text: "Gunpowder Podi spans TN, KA, AP — 55% global-spice interest supports layered spice systems.", att: "Savory opportunities · Consuma AI" },
    ],
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
    muted: "Regional affinity, sentiment composition, the 12-month trend, flavour explorer, and direct consumer voice.",
    cards: ["region", "sentiment", "trend", "flavour", "quotes", "summary", "exec"],
    insight: {
      highlight: "Biscoff + Honey Chilli",
      body: "combinations show the strongest consumer affinity — Biscoff as premium dessert system, Honey Chilli as the swicy snack bet.",
      stats: [
        { k: "Biscoff positive", v: "43.1", suffix: "%" },
        { k: "Honey Chilli share", v: "18", suffix: "%" },
        { k: "Fusion interest", v: "19.4", suffix: "%" },
        { k: "Sample", v: "1.5", suffix: "L" },
      ],
    },
    regionsData: REGIONS_DATA,
    regionTitle: "Regional affinity — favorite savory flavors",
    flavours: FLAVOURS,
    sentData: SENT_DATA,
    sentCenter: BISCOFF_POSITIVE_PCT,
    sentMentions: BISCOFF_CONVERSATIONS,
    quotes: [
      { text: "Biscoff already travels across desserts, beverages and hacks; the unlock is premium formulation and ingredient transparency.", att: `Biscoff · ${BISCOFF_CONVERSATIONS.toLocaleString("en-IN")} conversations` },
      { text: `Hot Honey Chilli Crisp — ${GLOBAL_SPICE_INTEREST}% global-spice interest, ${SAVORY_INNOVATION_DEMAND}% savory innovation demand.`, att: `Honey Chilli · ${HONEY_CHILLI_CONVERSATIONS.toLocaleString("en-IN")} conversations` },
      { text: "Gunpowder Podi: sharper, layered spice systems beyond plain masala.", att: "TN · KA · AP" },
    ],
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
  const stages = TIMELINE_STAGES;
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [srcCount, setSrcCount] = useState(2);
  const started = useRef(Date.now());
  const did = useRef(false);

  useEffect(() => {
    if (did.current) return;
    did.current = true;
  }, []);

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
      } else {
        setTimeout(() => onDone && onDone(), 500);
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

  const overall = useMemo(() => {
    const total = stages.reduce((a,s)=>a+s.dur, 0);
    let done = 0;
    for (let i = 0; i < idx; i++) done += stages[i].dur;
    done += prog * (stages[idx]?.dur || 0);
    return Math.round((done / total) * 100);
  }, [idx, prog]);

  const sourcePills = SOURCE_NAMES.slice(0, srcCount);

  return (
    <div className="tl-block">
      <div className="tl-head">
        <span className="l">Run #4821 · executing · t+{elapsed.toFixed(1)}s</span>
        <span className="r">{overall}%</span>
      </div>
      <div className="tl-list">
        {stages.map((s, i) => {
          const status = i < idx ? "done" : i === idx ? "active" : "queued";
          const p = i < idx ? 1 : i === idx ? prog : 0;
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
      <div className="eyebrow">Key insight · confidence 84% · click any metric</div>
      <h2>
        <em>{ins.highlight}</em> {ins.body.replace("{region}", reg)}
      </h2>
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
  const [hover, setHover] = useState(null);
  const [sel, setSel] = useState(null);
  return (
    <div className="card">
      <div className="card-h">
        <h3>{s.regionTitle || "Regional affinity"}</h3>
        <span className="tag">click a bar · % share</span>
      </div>
      <div className="card-body">
        {data.map((r, i) => (
          <div key={i}
               className={"bar-row interactive " + (sel === i ? "sel" : "") + (hover === i ? "hover" : "")}
               onMouseEnter={() => setHover(i)}
               onMouseLeave={() => setHover(null)}
               onClick={() => {
                 setSel(i);
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
               }}>
            <div className="lbl">{r.lbl}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: r.val + "%", transition: "width 0.4s ease" }} />
            </div>
            <div className="val">{r.val}%</div>
          </div>
        ))}
        {hover !== null && (
          <div className="chart-tooltip">{data[hover].lbl}: {data[hover].val}% — click for full detail</div>
        )}
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
  const r = 60;
  const C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="card">
      <div className="card-h">
        <h3>Sentiment towards Biscoff in sweets</h3>
        <span className="tag">{mentions.toLocaleString("en-IN")} mentions · click rows</span>
      </div>
      <div className="card-body">
        <div className="sent">
          <div className="sent-ring">
            <svg width="150" height="150" viewBox="0 0 150 150" style={{transform: "rotate(-90deg)"}}>
              <circle cx="75" cy="75" r={r} fill="none" stroke="oklch(0.92 0.005 80)" strokeWidth="12"/>
              {sent.map((s,i) => {
                const len = (s.v/100) * C;
                const da = `${len} ${C - len}`;
                const dof = -offset;
                offset += len;
                return (
                  <circle key={i} cx="75" cy="75" r={r} fill="none"
                          stroke={s.color} strokeWidth="12"
                          strokeDasharray={da} strokeDashoffset={dof}
                          style={{ cursor: "pointer" }}
                          onClick={() => openDetail({
                            type: "Sentiment",
                            title: `${s.lbl} — ${s.v}%`,
                            body: `Biscoff in sweets: ${D().biscoff?.sentiment?.positive}% positive, ${D().biscoff?.sentiment?.neutral}% neutral, ${D().biscoff?.sentiment?.negative}% negative. Headline positive sentiment ${D().biscoff?.positivePct}%.`,
                            source: `${mentions.toLocaleString("en-IN")} conversations`,
                          })} />
                );
              })}
            </svg>
            <div className="center">
              <div>
                <div className="num">{center}</div>
                <div className="lbl">Positive %</div>
              </div>
            </div>
          </div>
          <div className="sent-list">
            {sent.map((s,i) => (
              <div key={i} className="sent-item clickable"
                   onClick={() => openDetail({ type: "Sentiment", title: s.lbl, body: `${s.v}% of Biscoff sweet conversations.`, source: "Report p.2" })}>
                <span className="sw" style={{background:s.color}}></span>
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
  const rows = D().states || STATES_TABLE;
  const [open, setOpen] = useState(null);
  return (
    <div className="card">
      <div className="card-h">
        <h3>Top sweet &amp; savory flavors by state</h3>
        <span className="tag">click a state · 11 regions</span>
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
  const [hover, setHover] = useState(null);
  const W = 640, H = 160, P = 22;
  const all = [...data, ...data2];
  const yMin = Math.min(...all) - 4;
  const yMax = Math.max(...all) + 4;
  const x = (i) => P + (i * (W - P * 2) / (data.length - 1));
  const y = (v) => H - P - ((v - yMin) / (yMax - yMin)) * (H - P * 2);
  const path = (arr) => arr.map((v, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(v)).join(" ");
  const area = path(data) + ` L${x(data.length - 1)},${H - P} L${x(0)},${H - P} Z`;

  return (
    <div className="card">
      <div className="card-h">
        <h3>12-month trend</h3>
        <span className="tag">{label}</span>
      </div>
      <div className="card-body">
        <div className="chart-legend">
          <span><i className="leg-solid" /> {primaryName}</span>
          <span><i className="leg-dash" /> {secondaryName}</span>
        </div>
        <svg className="line-chart interactive-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--red)" stopOpacity="0.18"/>
              <stop offset="100%" stopColor="var(--red)" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((g,i) => (
            <line key={i} x1={P} x2={W-P} y1={P + g*(H-P*2)} y2={P + g*(H-P*2)}
                  stroke="oklch(0.88 0.008 70)" strokeDasharray="2 4"/>
          ))}
          <path d={area} fill="url(#lg2)"/>
          <path d={path(data2)} fill="none" stroke="oklch(0.7 0.01 50)" strokeWidth="1.5" strokeDasharray="3 3"/>
          <path d={path(data)} fill="none" stroke="var(--red)" strokeWidth="2"/>
          {data.map((v,i) => (
            <g key={i}
               onMouseEnter={() => setHover(i)}
               onMouseLeave={() => setHover(null)}
               onClick={() => openDetail({
                 type: "Trend",
                 title: months[i],
                 body: `${primaryName}: ${v}%. ${secondaryName}: ${data2[i]}%. Flavor Insights India · last 12 months.`,
                 source: "1,53,496 conversations · 6 channels",
               })}
               style={{ cursor: "pointer" }}>
              <circle cx={x(i)} cy={y(v)} r={hover === i ? 7 : 4}
                      fill={hover === i ? "var(--red-glow)" : "var(--red)"} opacity={hover === i ? 1 : 0.85}/>
            </g>
          ))}
          {months.map((m,i) => (
            <text key={"m"+i} x={x(i)} y={H-4} fontFamily="JetBrains Mono" fontSize="8"
                  fill={hover === i ? "var(--red)" : "var(--fg-dim)"} textAnchor="middle">{m}</text>
          ))}
        </svg>
        {hover !== null && (
          <div className="chart-tooltip">{months[hover]}: {data[hover]}% (compare {data2[hover]}%)</div>
        )}
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
  return (
    <div className="card">
      <div className="card-h">
        <h3>Flavour trend explorer</h3>
        <span className="tag">click a flavor · report data</span>
      </div>
      <div className="card-body">
        <div className="flav-grid">
          {flavours.map((f,i) => {
            const opp = lookup[f.name] || lookup[f.name.split(" ")[0]];
            return (
              <div key={i} className="flav clickable"
                   onClick={() => openDetail({
                     type: "Flavor opportunity",
                     title: f.name,
                     subtitle: f.grow,
                     body: opp ? `${opp.proof}. Extensions: ${opp.extensions}` : `Trend signal ${f.grow} from Flavor Insights India.`,
                     facts: opp ? [{ k: "Anchor", v: opp.anchor }] : [],
                     source: "Sweet & savory opportunities · report",
                   })}>
                <div className="row">
                  <div className="name">{f.name}</div>
                  <div className={"grow " + (f.down ? "down" : "")}>{f.grow}</div>
                </div>
                <div className="mini-bar">
                  {f.bars.map((b,j) => (
                    <i key={j} style={{ height: (b*2)+"px", opacity: 0.5 + j*0.07 }}></i>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
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
function ExecBlock({ onOpenReport, script }) {
  const ex = getScript(script).exec || RESEARCH_SCRIPTS.default.exec;
  return (
    <div className="exec-block">
      <div className="eyebrow">Recommended action · confidence 84%</div>
      <h2>{ex.h2}</h2>
      <p>{ex.p}</p>
      <div className="meta">
        {ex.meta.map((m, i) => (
          <div key={i}><span className="k">{m.k}</span><span className="v">{m.v}</span></div>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="btn-primary" onClick={onOpenReport}>View full report ↗</button>
        <button type="button" className="btn-ghost">Export brief · PDF</button>
        <button type="button" className="btn-ghost">Share with team</button>
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
function ActionsRecommendations({ onAction, busy, script, params, s3Configured }) {
  const actions = ACTIONS;

  const handleClick = (actionId) => {
    if (busy || !onAction) return;
    onAction(actionId);
  };

  return (
    <div className="actions-reco">
      <div className="actions-reco-head">
        <span className="reco-eyebrow">Suggested next steps</span>
        <p className="actions-reco-intro">
          Turn this insight into downstream work
          {script?.title ? <strong> · {script.title}</strong> : null}
          {params?.region ? <span className="reco-meta"> · {params.region}</span> : null}
        </p>
        <p className="actions-reco-hint">
          <strong>Create</strong> = 3 packshots (Nova Pro).
          <strong> Create film</strong> = 6s video (amazon.nova-reel-v1:1 → S3).
        </p>
      </div>
      <div className="actions-reco-chips">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            className={
              "reco-chip " +
              (a.primary ? "reco-chip-primary" : "") +
              (a.film ? " reco-chip-film" : "")
            }
            disabled={busy}
            onClick={() => handleClick(a.id)}
            aria-busy={busy && (a.primary || a.film)}
            title={
              a.film ? `amazon.nova-reel-v1:1 → ${BEDROCK_S3_PUBLIC_URL}/brit-videos/` : undefined
            }
          >
            <span className="reco-icon">{a.icon}</span>
            <span className="reco-label-wrap">
              <span className="reco-label-text">{a.label}</span>
              {a.sub && <span className="reco-sub">{a.sub}</span>}
            </span>
          </button>
        ))}
      </div>
      {busy && (
        <p className="actions-reco-busy">
          <span className="live-dot" /> Running…
        </p>
      )}
    </div>
  );
}

function ConceptCardsPanel({ payload }) {
  const { concepts = [], filmPrompt, prompt, mode, message, error } = payload || {};
  const brief = filmPrompt || prompt;
  const created = mode === "created";

  return (
    <div className="card concept-cards-card">
      <div className="card-h">
        <h3>Concept cards</h3>
        <span className="tag">{created ? "Created" : "Preview"}</span>
      </div>
      <div className="card-body">
        {message && <p className="concept-msg">{message}</p>}
        {error && <p className="concept-err">{error}</p>}
        {brief && (
          <details className="concept-prompt-details">
            <summary>Create brief</summary>
            <p className="concept-prompt">{brief}</p>
          </details>
        )}
        <div className="concept-grid">
          {concepts.map((c) => (
            <div key={c.id} className="concept-card">
              <div
                className="concept-visual"
                style={
                  c.imageUri
                    ? undefined
                    : { background: `linear-gradient(135deg, ${c.gradient}22, ${c.gradient}88)` }
                }
              >
                {c.videoUri && c.filmIsS3 ? (
                  <div className="concept-s3-film">
                    <span className="concept-ph-icon">▶</span>
                    <a
                      href={c.filmHref || s3UriToHttps(c.videoUri)}
                      target="_blank"
                      rel="noreferrer"
                      className="concept-s3-link"
                    >
                      Hero film ready (S3)
                    </a>
                  </div>
                ) : c.imageUri ? (
                  <img className="concept-image" src={c.imageUri} alt={c.title} />
                ) : (
                  <div className="concept-placeholder concept-placeholder-rich">
                    <span className="concept-ph-lane">{c.lane}</span>
                    <span className="concept-ph-title">{c.title}</span>
                    <span className="concept-ph-sku">{c.sku}</span>
                  </div>
                )}
              </div>
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
  fpd_scout: { label: "FPD scout", icon: "◎", accent: "#5c3d2e" },
  triangulate_1ds: { label: "1DS triangulation", icon: "△", accent: "#8b2e1a" },
};

function ActionOutcomeCards({ payload }) {
  const meta = ACTION_META[payload.type] || { label: "Action output", icon: "◆", accent: "#c45c3e" };
  const shortTitle = meta.label;
  const summary = (payload.body || "").slice(0, 220);
  const steps = (payload.bullets || []).slice(0, 3);
  const tiles = [
    { id: "summary", title: "Brief", body: summary, icon: meta.icon, wide: true },
    ...steps.map((b, i) => ({
      id: `step-${i}`,
      title: `Output ${i + 1}`,
      body: String(b).slice(0, 140),
      icon: ["①", "②", "③"][i] || "·",
    })),
    payload.eta
      ? { id: "eta", title: "ETA", body: payload.eta, icon: "⏱" }
      : null,
  ].filter(Boolean);

  return (
    <div className="card action-outcome-wrap">
      <div className="card-h">
        <h3>{shortTitle}</h3>
        <span className="tag">{payload.status || "queued"}</span>
      </div>
      <div className="card-body">
        {payload.message && <p className="concept-msg">{payload.message}</p>}
        <div className="action-outcome-grid">
          {tiles.map((t) => (
            <div
              key={t.id}
              className={"action-outcome-card " + (t.wide ? "wide" : "")}
              style={{ borderColor: meta.accent + "44" }}
            >
              <span className="aoc-icon" style={{ color: meta.accent }}>{t.icon}</span>
              <span className="aoc-title">{t.title}</span>
              <p className="aoc-body">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroFilmPanel({ payload }) {
  const { filmPrompt, videoUri, filmHref, message, error, setupSteps, sku, region, mode } =
    payload || {};
  const openUrl = filmHref || (videoUri ? s3UriToHttps(videoUri) : null);
  const needsSetup = mode === "setup_required";

  return (
    <div className="card hero-film-card">
      <div className="card-h">
        <h3>Hero film</h3>
        <span className="tag">
          {needsSetup ? "Setup" : mode === "created" ? "Nova Reel" : "Failed"}
        </span>
      </div>
      <div className="card-body">
        {message && <p className="concept-msg">{message}</p>}
        {error && <p className="concept-err">{error}</p>}
        {(sku || region) && (
          <p className="film-meta">
            {sku && <span>{sku}</span>}
            {region && <span> · {region}</span>}
          </p>
        )}
        {filmPrompt && (
          <details className="concept-prompt-details">
            <summary>Film prompt</summary>
            <p className="concept-prompt">{filmPrompt}</p>
          </details>
        )}
        {openUrl && openUrl.includes(".mp4") && (
          <video
            className="hero-film-video"
            src={openUrl}
            controls
            playsInline
            preload="metadata"
          />
        )}
        {openUrl && (
          <a href={openUrl} target="_blank" rel="noreferrer" className="film-s3-cta" download>
            ▶ {openUrl.includes("X-Amz") ? "Download / play film" : "Open in S3"}
          </a>
        )}
        {setupSteps?.length > 0 && (
          <ol className="film-setup-steps">
            {setupSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function ActionResultPanel({ payload }) {
  if (!payload) return null;
  if (payload.type === "concept_cards") return <ConceptCardsPanel payload={payload} />;
  if (payload.type === "create_film") return <HeroFilmPanel payload={payload} />;
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
    setTimeout(() => onClose?.(), 600);
  };

  const llm = config?.llmModel || "amazon.nova-pro-v1:0";
  const video = config?.videoModel || "amazon.nova-reel-v1:1";
  const s3 = config?.s3PublicUrl || BEDROCK_S3_PUBLIC_URL;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="title">{serverConnected ? "Bedrock connected" : "API key"}</div>
            <div className="meta">
              {serverConnected
                ? "Key loaded from .env.local — no paste needed"
                : "Add BEDROCK_API_KEY to .env.local or paste below"}
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">
          {serverConnected && (
            <div className="settings-connected">
              <p className="settings-status-line">
                <span className="live-dot" /> Server key active
              </p>
              <ul className="settings-model-list">
                <li><span>Text / packshots</span><code>{llm}</code></li>
                <li><span>Hero film</span><code>{video}</code></li>
                <li><span>S3 output</span><code>{s3}/brit-videos/</code></li>
                {config?.s3SignedAccess && (
                  <li><span>Film playback</span><code>presigned URLs enabled</code></li>
                )}
              </ul>
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
                placeholder="ABSK…"
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
function ReportModal({ params, script, onClose }) {
  const s = getScript(script);
  const sections = D().reportSections || [];
  const [active, setActive] = useState("exec");
  const sweet = D().sweetOpportunities || [];
  const savory = D().savoryOpportunities || [];
  const activeSec = sections.find((x) => x.id === active) || sections[0];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-h">
          <div>
            <div className="title">{D().meta?.title} — Consumer Research Report</div>
            <div className="meta">Run #4821 · {D().meta?.date} · {D().meta?.channels?.length} sources · scope: {params.region}</div>
          </div>
          <div style={{display:'flex', gap: 8, alignItems: 'center'}}>
            <button type="button" className="btn-ghost" style={{padding:'6px 10px', fontSize:12}}>Download PDF</button>
            <button type="button" className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="report-body">
          <aside className="report-toc">
            <div className="label">Contents · click to read</div>
            {sections.map((sec) => (
              <a key={sec.id}
                 href={"#"+sec.id}
                 className={active === sec.id ? "active" : ""}
                 onClick={(e) => { e.preventDefault(); setActive(sec.id); }}>
                {sec.title}
              </a>
            ))}
          </aside>
          <article className="report-main">
            <div className="deck">Brit GPT · Consuma AI Rapid Research · under 30 minutes</div>
            <h1>{s.title} — India flavor insights</h1>
            <p className="report-active-section">{activeSec?.content}</p>
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

            <h2 id="biscoff">Biscoff wins through premium dessert-led trust</h2>
            <p>{D().biscoff?.narrative} Sentiment in sweets: {SENT_DATA.map(x => `${x.lbl} ${x.v}%`).join(", ")}.</p>
            <p><b>Extensions:</b> {(D().biscoff?.extensions || BISCOFF_EXTENSIONS).join(" · ")}.</p>

            <h2 id="swicy">Hot Honey Chilli — global swicy heat</h2>
            <p>{D().honeyChilli?.narrative}</p>
            <p><b>Signals:</b> {GLOBAL_SPICE_INTEREST}% global spice · {SAVORY_INNOVATION_DEMAND}% savory innovation · {FUSION_FLAVOUR_ENTHUSIASM}% fusion.</p>
            <p><b>Extensions:</b> {(D().honeyChilli?.extensions || HONEY_CHILLI_EXTENSIONS).join(" · ")}.</p>
            <p><b>Favorite flavors:</b> {(D().favoriteSavoryShares || []).map(f => `${f.lbl} ${f.val}%`).join(" · ")}.</p>

            <h2 id="states">Top flavors by state (11 states)</h2>
            {(D().states || STATES_TABLE).map((row) => (
              <p key={row.state} className="report-state-line clickable"
                 onClick={() => openDetail({ type: "State", title: row.state, facts: [{ k: "Sweet", v: row.sweet.join(", ") }, { k: "Savory", v: row.savory.join(", ") }], source: "State table" })}>
                <b>{row.state}</b> — Sweet: {row.sweet.join(", ")}. Savory: {row.savory.join(", ")}.
              </p>
            ))}

            <h2 id="sweet">Sweet flavor opportunities</h2>
            {sweet.map((o) => (
              <p key={o.flavor} className="clickable" onClick={() => openDetail({ type: "Sweet", title: o.flavor, body: `${o.proof}. Extensions: ${o.extensions}`, source: o.anchor })}>
                <b>{o.flavor}</b> ({o.anchor}) — {o.proof}
              </p>
            ))}

            <h2 id="savory">Savory flavor opportunities</h2>
            {savory.map((o) => (
              <p key={o.flavor} className="clickable" onClick={() => openDetail({ type: "Savory", title: o.flavor, body: `${o.proof}. Extensions: ${o.extensions}`, source: o.anchor })}>
                <b>{o.flavor}</b> ({o.anchor}) — {o.proof}
              </p>
            ))}

            <h2 id="exec">Executive recommendation · {params.region}</h2>
            <p>{s.exec?.h2}</p>
            <p>{s.exec?.p}</p>
          </article>
        </div>
      </div>
    </div>
  );
}


export {
  BootBlock, ScopeForm, TimelineBlock, InsightBlock,
  RegionCard, StatesCard, ExtensionsCard, SentimentCard, TrendCard, FlavourCard, QuotesCard,
  FullSummaryCard, ExecBlock, ReportModal, DetailPanel, QAResponse, DatasetBreakdown,
  ActionsRecommendations, ConceptCardsPanel, ActionResultPanel, ActionOutcomeCards, ApiKeySettings,
  SUGGESTIONS, RESEARCH_SCRIPTS, matchResearchScript, STATES_TABLE, openDetail,
};
