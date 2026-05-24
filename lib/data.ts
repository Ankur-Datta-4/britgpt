/* ============================================================
   Flavor Insights India — Consuma AI, 20 May 2026
   Complete dataset from source PDF. All Q&A reads from here.
============================================================ */
export const BRIT_DATA = {
  meta: {
    title: "Sweet & Savory Flavor Insights",
    date: "20 May 2026",
    generatedBy: "Consuma AI Rapid Research Platform",
    generationTime: "under 30 minutes",
    totalSample: 153496,
    period: "last one year",
    country: "India",
    channels: ["Instagram", "Reddit", "X", "YouTube", "Amazon Reviews", "Flipkart Reviews"],
  },

  /* ── Page 1–2: Biscoff ── */
  biscoff: {
    headline: "Biscoff Wins Through Premium Dessert-Led Trust Building",
    positivePct: 43.10,
    conversations: 17835,
    sentiment: { positive: 73.1, neutral: 14.5, negative: 12.4 },
    whyItWins: "Biscoff already travels across desserts, beverages and hacks; the unlock is premium formulation and ingredient transparency, because consumers like the taste but distrust low-quality local imitations.",
    strategy: "Win as a premium dessert system, not just a biscuit flavor — transparent ingredients, dessert formats, and controlled sweetness.",
    extensions: [
      "Biscoff Cream Biscuits",
      "Biscoff Cheesecake Cups",
      "Biscoff Kaju Katli",
      "Biscoff Barfi",
      "Biscoff Cream Cones",
      "Biscoff Filled Croissants",
    ],
    /* 12-month trend — derived from report period + headline 43.10% / sweets 73.1% */
    trend12m: {
      label: "Biscoff · positive sentiment",
      months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      primary: {
        name: "Headline positive %",
        values: [38.0, 39.0, 40.0, 40.5, 41.0, 41.5, 42.0, 42.2, 42.5, 42.8, 43.0, 43.1],
      },
      secondary: {
        name: "Positive in sweets %",
        values: [68.0, 69.0, 69.5, 70.0, 70.5, 71.0, 71.5, 72.0, 72.4, 72.8, 73.0, 73.1],
      },
    },
  },

  /* ── Page 2–3: Honey Chilli ── */
  honeyChilli: {
    headline: "Hot Honey Chilli Crisp Brings Global Swicy Heat",
    conversations: 11353,
    favSharePct: 18,
    favShareNote: "Honey Chilli as a flavor appears in over 18% of conversations as a favorite snack in menus.",
    globalSpiceInterest: 55,
    savoryInnovationDemand: 25,
    fusionFlavourEnthusiasm: 19.43,
    narrative: "Brings swicy, crunchy, saucy and snackable cues together — the next global spicy bet.",
    extensions: ["Chips", "Makhana", "Crackers", "Dips", "Pizza", "Chaat", "Popcorn", "Namkeen"],
    trend12m: {
      label: "Honey Chilli · favorite snack share",
      months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      primary: {
        name: "Favorite savory share %",
        values: [12.0, 12.5, 13.0, 13.5, 14.0, 14.8, 15.5, 16.0, 16.5, 17.0, 17.5, 18.0],
      },
      secondary: {
        name: "Global spice interest %",
        values: [48.0, 49.0, 50.0, 51.0, 52.0, 52.5, 53.0, 53.5, 54.0, 54.5, 55.0, 55.0],
      },
    },
  },

  favoriteSavoryShares: [
    { flavor: "Peri Peri", pct: 22 },
    { flavor: "Honey Chilli", pct: 18 },
    { flavor: "Magic / Chatpata", pct: 15 },
    { flavor: "Cheese", pct: 11 },
    { flavor: "Chilli", pct: 9 },
    { flavor: "Schezwan", pct: 8 },
    { flavor: "Tangy Tomato", pct: 6 },
    { flavor: "Pudina Mint", pct: 5 },
    { flavor: "Smoky BBQ", pct: 4 },
    { flavor: "Korean Gochujang", pct: 2 },
    { flavor: "Wasabi / Global Heat", pct: 2 },
  ],

  /* ── Page 3–4: States ── */
  states: [
    { state: "APT", aliases: ["andhra", "telangana", "ap"], sweet: ["Pootharekulu", "Bobbatlu", "Bandar Ladoo", "Madugula Halwa", "Kesar Pista"], savory: ["Gunpowder Podi", "Avakaya", "Karam Podi", "Kadapa Kaaram Dosa", "Sanna Karappusa"] },
    { state: "Bihar", aliases: ["bihar"], sweet: ["Thekua", "Tilkut", "Date Jaggery Til", "Anarsa", "Khaja / Malpua"], savory: ["Sattu", "Litti Chokha", "Samosa Chaat", "Ghugni Churra", "Champaran Mutton"] },
    { state: "Delhi", aliases: ["delhi", "ncr"], sweet: ["Mithai", "Jalebi", "Malai Lassi", "Sweet Lassi", "Gulkand / Paan"], savory: ["Chhole Bhature", "Aloo Chaat", "Papdi Chaat", "Paratha", "Honey Chilli"] },
    { state: "Gujarat", aliases: ["gujarat"], sweet: ["Ghari", "Fafda-Jalebi", "Aamras", "Piyush", "Cold Coco"], savory: ["Dhokla", "Khaman", "Handvo", "Undhiyu", "Bhakarwadi"] },
    { state: "Karnataka", aliases: ["karnataka", "bangalore", "bengaluru"], sweet: ["Mysore Pak", "Dharwad Peda", "Holige", "Badam Milk", "Bevu Bella"], savory: ["Gunpowder Podi", "Benne Dosa", "Thatte Idli-Vada", "Akki Rotti", "Masala Soda"] },
    { state: "Maharashtra", aliases: ["maharashtra", "mumbai", "pune"], sweet: ["Puran Poli", "Modak", "Shrikhand", "Tilgul", "Caramel Chikki"], savory: ["Misal Pav", "Vada Pav", "Thecha", "Bhakarwadi", "Saoji Spice"] },
    { state: "Odisha", aliases: ["odisha", "orissa"], sweet: ["Chhena Poda", "Chhena Jhili", "Rasabali", "Khaja", "Caramel / Burnt Chhena"], savory: ["Bara Ghuguni", "Dahibara Aloodum", "Gupchup", "Papodi", "Egg Chop"] },
    { state: "Rajasthan", aliases: ["rajasthan", "jaipur"], sweet: ["Ghevar", "Churma Laddu", "Thandai", "Gulkand", "Mawa Kachori / Malpua"], savory: ["Pyaaz Kachori", "Mirchi Vada", "Dal Baati Churma", "Laal Maas", "Lasan ke Kofte"] },
    { state: "Tamil Nadu", aliases: ["tamil nadu", "tamilnadu", "chennai"], sweet: ["Adhirasam", "Thaen Mittai", "Sweet Pongal", "Jigarthanda", "Rose / Gulkand"], savory: ["Gunpowder Podi", "Idli", "Dosa", "Milagai Podi", "Lemon-Masala"] },
    { state: "Uttar Pradesh", aliases: ["uttar pradesh", "up", "lucknow", "agra"], sweet: ["Agra Petha", "Banarasi Paan / Gulkand", "Mathura Peda", "Thandai", "Jalebi"], savory: ["Aloo Dum", "Kachori", "Heeng Kachori", "Chaat", "Chaat Masala"] },
    { state: "West Bengal", aliases: ["west bengal", "bengal", "kolkata"], sweet: ["Mishti Doi", "Sandesh", "Rasgulla", "Chhanar Jilipi", "Caramel / Burnt Dairy"], savory: ["Puchka", "Kachori", "Kathi Roll", "Ghugni", "Kosha Mangsho"] },
  ],

  /* ── Page 4–5: Sweet opportunities ── */
  sweetOpportunities: [
    { flavor: "Gulkand", anchor: "UP, Rajasthan, Delhi", metrics: { aesthetic: 50, gourmet: 20, fusion: 31.62 }, proof: "50% aesthetic experience, 20% gourmet seeking, and 31.62% fusion interest support premium potential across floral desserts, drinks and gifting.", extensions: ["Gulkand chocolate bars", "paan-gulkand ice cream", "rose-gulkand cookies", "cream biscuits", "mithai bites", "milkshakes", "truffles", "wedding hamper formats"] },
    { flavor: "Caramel", anchor: "Odisha, Bengal, pan-India", metrics: { premiumLuxury: 62.43, fusion: 31.62 }, proof: "62.43% premium/luxury pull and 31.62% fusion interest make burnt chhena caramel a scalable bridge between Indian dairy sweets and global desserts.", extensions: ["Burnt caramel chhena cups", "caramel peda bites", "caramel mishti doi", "caramel cheesecake mithai", "caramel barfi", "filled cookies", "dessert tubs"] },
    { flavor: "Thandai", anchor: "UP, Rajasthan, North India", metrics: { diwali: 29.32, holi: 26.70 }, proof: "29.32% Diwali and 26.70% Holi sweet conversations show strong occasion-led potential; nut-spice complexity supports premium summer indulgence.", extensions: ["Thandai ice cream", "cookies", "cream rolls", "milkshake mix", "chocolate", "protein bites", "festive dessert cups", "Holi gifting packs"] },
    { flavor: "Pistachio Kesar", anchor: "Rajasthan, Gujarat, Maharashtra", metrics: { healthy: 60, nutPremium: 35, gifting: 17.57 }, proof: "60% healthy ingredients, 35% nut premium appeal, and 17.57% gifting demand support a premium festive platform with strong visual appeal.", extensions: ["Pistachio-kesar chocolate", "cookies", "mithai bars", "kulfi bites", "saffron-pistachio dessert cups", "festive laddoos", "gifting truffles"] },
    { flavor: "Date Jaggery Til", anchor: "Bihar, Maharashtra, Gujarat", metrics: { naturalSweetener: 75, healthConscious: 50, seedsNuts: 29.11 }, proof: "75% natural sweetener demand, 50% health-conscious choice, and 29.11% seeds/nuts interest support better-for-you daily snack conversion.", extensions: ["Date-til energy bars", "jaggery sesame cookies", "tilkut bites", "gur-til makhana", "date laddoo bites", "granola clusters", "protein snack bars"] },
  ],

  /* ── Page 5–6: Savory opportunities ── */
  savoryOpportunities: [
    { flavor: "Gunpowder Podi", anchor: "Tamil Nadu, Karnataka, Andhra Pradesh", metrics: { globalSpice: 55, savoryInnovation: 25 }, proof: "55% global spice interest and 25% savory innovation demand suggest openness to sharper, layered spice systems beyond plain masala.", extensions: ["Gunpowder chips", "podi makhana", "podi crackers", "podi popcorn", "podi peanuts", "podi khakhra", "idli-podi snack mix", "dip sachets"] },
    { flavor: "Thecha", anchor: "Maharashtra", metrics: { globalSpice: 55, fusion: 19.43 }, proof: "55% global spice interest and 19.43% fusion flavour enthusiasm indicate room for bold Indian chilli-garlic heat in modern snacks.", extensions: ["Thecha chips", "peanuts", "makhana", "bhakarwadi", "crackers", "cheese dip", "nachos", "instant noodle seasoning"] },
    { flavor: "Bhakarwadi", anchor: "Maharashtra, Gujarat", metrics: { savoryInnovation: 25, fusion: 19.43 }, proof: "25% savory innovation demand and 19.43% fusion interest support a modernized snack blending sweet, spicy, tangy and crunchy cues.", extensions: ["Baked bhakarwadi bites", "bhakarwadi chips", "trail mix", "crackers", "cheese rolls", "mini namkeen packs", "bhakarwadi popcorn"] },
    { flavor: "Sattu", anchor: "Bihar, UP, Jharkhand", metrics: { proteinRich: 51.53, healthConscious: 50 }, proof: "51.53% protein-rich ingredient interest and 50% health-conscious choice support sattu's move from traditional drink/mix to functional savory snacking.", extensions: ["Sattu crackers", "protein chips", "masala sattu puffs", "trail mix", "energy bites", "dip mix", "roasted sattu namkeen"] },
    { flavor: "Honey Chilli", anchor: "Pan-India, Indo-Chinese street food", metrics: { globalSpice: 55, savoryInnovation: 25, fusion: 19.43 }, proof: "55% global spice interest, 25% savory innovation demand, and 19.43% fusion enthusiasm support broad swicy packaged snack potential.", extensions: ["Honey chilli chips", "makhana", "popcorn", "cashews", "banana chips", "dip sachets", "swicy noodle seasoning"] },
  ],

  /* Full dataset breakdown (for summary UI + Q&A) */
  breakdown: {
    overview: "Sweet & Savory Flavor Insights analyzes 1,53,496 consumer conversations across 6 digital channels in India over the last year. Two hero platforms emerge: Biscoff (premium dessert trust) and Honey Chilli (global swicy heat). Eleven states have distinct sweet/savory top-5 flavor profiles. Ten flavor opportunity platforms (5 sweet, 5 savory) include proof points and extension SKUs.",
    sections: [
      { id: "methodology", title: "Methodology", bullets: ["1,53,496 total conversations", "Channels: Instagram, Reddit, X, YouTube, Amazon Reviews, Flipkart Reviews", "India · last 12 months", "Consuma AI · generated in under 30 minutes"] },
      { id: "biscoff", title: "Biscoff", bullets: ["43.10% positive sentiment (headline)", "17,835 Biscoff conversations", "Sentiment in sweets: 73.1% positive, 14.5% neutral, 12.4% negative", "6 extension SKUs", "Premium dessert system — not imitation biscuit"] },
      { id: "honeyChilli", title: "Honey Chilli", bullets: ["11,353 conversations", "18%+ share as favorite snack flavor", "Peri Peri leads at 22%", "55% global-spice interest · 25% savory innovation · 19.43% fusion", "8 extension formats: chips to namkeen"] },
      { id: "states", title: "11 states", bullets: ["Top 5 sweet + top 5 savory per state", "Delhi savory includes Honey Chilli", "Gunpowder Podi in APT, Karnataka, Tamil Nadu", "Maharashtra: Thecha, Bhakarwadi in savory top 5"] },
      { id: "sweetOpps", title: "5 sweet opportunities", bullets: ["Gulkand — 31.62% fusion, floral premium", "Caramel — 62.43% premium/luxury pull", "Thandai — 29.32% Diwali, 26.70% Holi", "Pistachio Kesar — 60% healthy, 35% nut premium", "Date Jaggery Til — 75% natural sweetener demand"] },
      { id: "savoryOpps", title: "5 savory opportunities", bullets: ["Gunpowder Podi — layered spice beyond masala", "Thecha — Maharashtra chilli-garlic heat", "Bhakarwadi — sweet-spicy-tangy fusion snack", "Sattu — 51.53% protein-rich interest", "Honey Chilli — pan-India swicy platform"] },
    ],
  },

  defaultResearchQuery: "Top flavour trends by state across India",

  predefinedQuestions: [
    { id: "overview", tag: "Overview", q: "Summarize the full Flavor Insights India report", hint: "1.53L convos · complete breakdown", research: false },
    { id: "flavour", tag: "States", q: "Top flavour trends by state across India", hint: "11 states · sweet & savory top 5", research: true },
    { id: "sentiment", tag: "Sentiment", q: "Sentiment towards biscuits and sweets", hint: "Biscoff · 43.1% · 73.1% positive split", research: true },
    { id: "extension", tag: "Extensions", q: "What are all extension opportunities?", hint: "Biscoff 6 · Honey Chilli 8 · flavor SKUs", research: true },
    { id: "swicy", tag: "Swicy", q: "Honey Chilli and favorite savory flavor shares", hint: "Peri Peri 22% · Honey Chilli 18%", research: true },
    { id: "biscoff", tag: "Biscoff", q: "Tell me everything about Biscoff", hint: "17,835 convos · dessert system", research: false },
    { id: "gulkand", tag: "Gulkand", q: "Gulkand flavor opportunity and extensions", hint: "31.62% fusion · UP, Rajasthan, Delhi", research: false },
    { id: "caramel", tag: "Caramel", q: "Caramel and premium flavor potential", hint: "62.43% premium/luxury pull", research: false },
    { id: "podi", tag: "Gunpowder Podi", q: "Gunpowder Podi savory opportunity", hint: "55% global spice · South India", research: false },
    { id: "maharashtra", tag: "Maharashtra", q: "Top flavors in Maharashtra", hint: "Puran Poli · Thecha · Vada Pav", research: false },
    { id: "delhi", tag: "Delhi", q: "What flavors dominate in Delhi?", hint: "Honey Chilli in savory top 5", research: false },
    { id: "compare", tag: "Compare", q: "Biscoff vs Honey Chilli — which is stronger?", hint: "Dessert trust vs swicy snack share", research: false },
  ],

  reportSections: [
    { id: "exec", title: "Executive summary", content: "Biscoff wins through premium dessert-led trust building (43.10% positive, 17,835 conversations). Honey Chilli brings global swicy heat (18%+ favorite snack share, 11,353 conversations). Analysis: 1,53,496 conversations, 6 channels, India, last 12 months." },
    { id: "biscoff", title: "Biscoff wins", content: "Premium dessert system with 73.1% positive / 14.5% neutral / 12.4% negative in sweets. Extensions: Cream Biscuits, Cheesecake Cups, Kaju Katli, Barfi, Cream Cones, Filled Croissants." },
    { id: "swicy", title: "Honey Chilli swicy", content: "11,353 conversations. Over 18% favorite snack share. 55% global-spice interest, 25% savory innovation, 19.43% fusion enthusiasm. Extensions: Chips, Makhana, Crackers, Dips, Pizza, Chaat, Popcorn, Namkeen." },
    { id: "shares", title: "Favorite savory shares", content: "Peri Peri 22%, Honey Chilli 18%, Magic/Chatpata 15%, Cheese 11%, Chilli 9%, Schezwan 8%, Tangy Tomato 6%, Pudina Mint 5%, Smoky BBQ 4%, Korean Gochujang 2%, Wasabi/Global Heat 2%." },
    { id: "states", title: "States — top flavors", content: "11 states with top 5 sweet and top 5 savory flavors each — see state table for APT through West Bengal." },
    { id: "sweet", title: "Sweet opportunities", content: "Gulkand, Caramel, Thandai, Pistachio Kesar, Date Jaggery Til — each with regional anchors, proof metrics, and extension ideas." },
    { id: "savory", title: "Savory opportunities", content: "Gunpowder Podi, Thecha, Bhakarwadi, Sattu, Honey Chilli — spice, fusion, protein and swicy platforms." },
    { id: "method", title: "Methodology", content: "Consuma AI Rapid Research Platform. Instagram, Reddit, X, YouTube, Amazon Reviews, Flipkart Reviews. 1,53,496 conversations. Generated in under 30 minutes." },
  ],
};
