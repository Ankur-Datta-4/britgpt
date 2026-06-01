/* ============================================================
   Flavor Insights India — Consuma AI
   India traditional sweet & savory flavors · demo dataset
============================================================ */
export const BRIT_DATA = {
  meta: {
    title: "Britannia Consumer Research",
    date: "20 May 2026",
    generatedBy: "Consuma AI",
    generationTime: "under 30 minutes",
    totalSample: 153496,
    period: "last one year",
    country: "India",
    channels: [
      "Instagram",
      "Reddit",
      "X",
      "YouTube",
      "Amazon Reviews",
      "Flipkart Reviews",
      "Zomato",
      "Swiggy",
    ],
  },

  honeyChilli: {
    headline: "Honey Chilli leads India's sweet-heat snack conversation",
    conversations: 153496,
    convGrowthPct: 48.7,
    engGrowthPct: 63.4,
    trendType: "Established",
    narrative:
      "Sweet-heat is the pan-India bridge flavor — strong in Maharashtra, UP, Delhi NCR, Karnataka, and Telangana. Consumers want layered spice with a sweet finish, not plain heat.",
    extensions: [
      "Coated crackers",
      "Baked chips",
      "Snack mix",
      "Cream biscuits",
      "Namkeen sticks",
    ],
    trend12m: {
      label: "Honey Chilli · conversation growth",
      months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      primary: {
        name: "Conv. growth %",
        values: [38.0, 39.5, 41.0, 42.5, 44.0, 45.0, 46.0, 47.0, 47.5, 48.0, 48.5, 48.7],
      },
      secondary: {
        name: "Eng. growth %",
        values: [52.0, 54.0, 56.0, 57.5, 59.0, 60.0, 61.0, 61.5, 62.0, 62.5, 63.0, 63.4],
      },
    },
  },

  gunpowderPodi: {
    headline: "Gunpowder Podi anchors South India savory snacking",
    convGrowthPct: 46.2,
    engGrowthPct: 61.8,
    trendType: "Emerging",
    narrative:
      "Podi-first authenticity in Tamil Nadu, Karnataka, Andhra Pradesh, and Telangana — consumers reward double-roasted spice depth over generic masala.",
    extensions: [
      "Podi crackers",
      "Khakhra",
      "Savory biscuits",
      "Podi snack mix",
      "Baked chips",
    ],
    trend12m: {
      label: "Gunpowder Podi · conversation growth",
      months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      primary: {
        name: "Conv. growth %",
        values: [36.0, 37.5, 39.0, 40.5, 42.0, 43.0, 44.0, 44.8, 45.2, 45.6, 46.0, 46.2],
      },
      secondary: {
        name: "Eng. growth %",
        values: [50.0, 52.0, 54.0, 56.0, 57.5, 58.5, 59.5, 60.0, 60.5, 61.0, 61.5, 61.8],
      },
    },
  },

  regionalSweetSentiment: {
    headline: "Regional sweets drive trust — Mishti Doi and Nolen Gur lead the East",
    positivePct: 68.4,
    conversations: 89420,
    sentiment: { positive: 68.4, neutral: 19.2, negative: 12.4 },
    narrative:
      "Heritage-anchored sweets outperform novelty in West Bengal, Assam, and Odisha. Mishti Doi Caramel and Nolen Gur Toffee show the strongest repeat-conversation signals.",
    trend12m: {
      label: "Regional sweet · positive sentiment",
      months: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
      primary: {
        name: "Positive %",
        values: [62.0, 63.0, 64.0, 65.0, 65.5, 66.0, 66.5, 67.0, 67.5, 68.0, 68.2, 68.4],
      },
      secondary: {
        name: "Conversation index",
        values: [72, 74, 76, 78, 80, 82, 84, 85, 86, 87, 88, 89],
      },
    },
  },

  states: [
    { state: "Andhra Pradesh", aliases: ["andhra", "telangana", "ap"], sweet: ["Honey Chilli", "Tamarind Candy", "Bellam Coconut", "Pootharekulu Crunch", "Mango Pickle Candy"], savory: ["Gunpowder Podi", "Gongura Masala", "Mirchi Bajji Spice", "Chicken 65 Masala", "Pesarattu Chutney"] },
    { state: "Bihar", aliases: ["bihar"], sweet: ["Tilkut Sesame Jaggery", "Honey Chilli", "Khaja Caramel", "Anarsa Coconut", "Thekua Crunch"], savory: ["Sattu Masala", "Litti Chokha Spice", "Mustard Pickle", "Chaat Masala Blast", "Gunpowder Podi"] },
    { state: "Delhi NCR", aliases: ["delhi", "ncr"], sweet: ["Honey Chilli", "Churma & Jaggery", "Rose Paan Candy", "Mango Aamchur Twist", "Basundi Caramel"], savory: ["Schezwan Masala", "Chaat Masala Blast", "Dahi Papri Spice", "Tandoori BBQ", "Gunpowder Podi"] },
    { state: "Gujarat", aliases: ["gujarat"], sweet: ["Honey Chilli", "Mohanthal Crunch", "Basundi Caramel", "Ghari Toffee", "Mango Pickle Candy"], savory: ["Sev Masala", "Dhokla Chutney Spice", "Thepla Methi", "Khakhra Masala", "Jamnagari Chilli"] },
    { state: "Karnataka", aliases: ["karnataka", "bangalore", "bengaluru"], sweet: ["Honey Chilli", "Jaggery Sesame", "Tamarind Candy", "Coconut Jaggery", "Filter Coffee Caramel"], savory: ["Gunpowder Podi", "Bisi Bele Masala", "Akki Roti Spice", "Urad Dal Chutney", "Mysore Rasam"] },
    { state: "Maharashtra", aliases: ["maharashtra", "mumbai", "pune"], sweet: ["Honey Chilli", "Mango Pickle Candy", "Rose & Saffron", "Modak Fusion", "Jaggery Sesame"], savory: ["Schezwan Masala", "Mumbai Cutting Chai", "Vada Pav Masala", "Thecha Spice", "Bhakarwadi"] },
    { state: "Tamil Nadu", aliases: ["tamil nadu", "tamilnadu", "chennai"], sweet: ["Tamarind Candy", "Honey Chilli", "Raw Mango Salt", "Coconut Sugar Bites", "Elachi Milk Toffee"], savory: ["Gunpowder Podi", "Milagu Vadai Spice", "Chettinad Pepper", "Kottu Masala", "Kara Boondi Mix"] },
    { state: "Uttar Pradesh", aliases: ["uttar pradesh", "up", "lucknow"], sweet: ["Honey Chilli", "Petha Saffron", "Rabri Toffee", "Balushahi Caramel", "Mango Aamchur Twist"], savory: ["Chaat Masala Blast", "Lucknowi Kebab Spice", "Galawati Masala", "Tunday Spice", "Schezwan Masala"] },
    { state: "West Bengal", aliases: ["west bengal", "bengal", "kolkata"], sweet: ["Mishti Doi Caramel", "Nolen Gur Toffee", "Honey Chilli", "Gondhoraj Lemon Candy", "Narkel Naru Bite"], savory: ["Kasundi Mustard", "Panch Phoron Mix", "Jhalmuri Spice", "Hilsa Fry Masala", "Gunpowder Podi"] },
  ],

  sweetOpportunities: [
    { flavor: "Mishti Doi Caramel", anchor: "West Bengal", metrics: { growth: 35.4, engagement: 52.7 }, proof: "Emerging dessert-snack bridge in Bengal — yogurt-cream biscuit and bar formats index high with family buyers.", extensions: ["Yogurt cream biscuits", "Dessert bars", "Mishti doi bites", "Festival assortments"] },
    { flavor: "Nolen Gur Toffee", anchor: "Assam, West Bengal", metrics: { growth: 32.6, seasonal: 46.1 }, proof: "Seasonal jaggery pull peaks in winter — strong gifting and chai-time occasions.", extensions: ["Jaggery caramel biscuits", "Gur toffee bites", "Winter gift packs"] },
    { flavor: "Tamarind Candy", anchor: "Tamil Nadu, Karnataka, Telangana", metrics: { growth: 30.8, tangy: 42.1 }, proof: "Tangy-sweet entry point for South — consumers accept sweetness only with sour anchor.", extensions: ["Tamarind cookies", "Chewy bites", "Summer limited editions"] },
    { flavor: "Tilkut Sesame Jaggery", anchor: "Bihar, Jharkhand", metrics: { seasonal: 27.6, heritage: 39.4 }, proof: "Harvest-season nostalgia drives trial — sesame-jaggery formats win on familiarity.", extensions: ["Sesame cookies", "Gur snack bars", "Festive croissants"] },
    { flavor: "Qubani Ka Meetha Toffee", anchor: "Telangana", metrics: { growth: 27.1, regional: 39.9 }, proof: "Hyderabadi dessert equity translates to premium cream biscuit adjacency.", extensions: ["Dessert cookies", "Cream biscuits", "Apricot-jaggery bites"] },
  ],

  savoryOpportunities: [
    { flavor: "Gunpowder Podi", anchor: "Tamil Nadu, Karnataka, Andhra Pradesh, Telangana", metrics: { growth: 46.2, engagement: 61.8 }, proof: "Podi holds #1 savory position across four southern states — layered roast spice beats plain masala.", extensions: ["Podi crackers", "Podi khakhra", "Savory biscuits", "Podi snack mix"] },
    { flavor: "Honey Chilli", anchor: "Pan-India", metrics: { growth: 48.7, engagement: 63.4 }, proof: "Sweet-heat is the national trial flavor — strongest in North and West metros.", extensions: ["Coated crackers", "Baked chips", "Namkeen sticks", "Cream biscuits"] },
    { flavor: "Schezwan Masala", anchor: "Maharashtra, Delhi NCR, UP", metrics: { growth: 41.8, engagement: 56.4 }, proof: "Indo-Chinese street-food cue still drives daily snacking in urban North and West.", extensions: ["Schezwan chips", "Spicy crackers", "Chaat sticks"] },
    { flavor: "Chaat Masala Blast", anchor: "UP, Delhi NCR, Punjab", metrics: { growth: 38.6, engagement: 51.3 }, proof: "Chaat masala is the North's comfort savory — works on crackers and baked namkeen.", extensions: ["Chaat crackers", "Baked namkeen", "Snack sticks"] },
    { flavor: "Sattu Masala", anchor: "Bihar, Jharkhand", metrics: { growth: 34.5, engagement: 48.3 }, proof: "Earthy protein familiarity in East — sattu moves from drink mix to savory biscuit.", extensions: ["Sattu crackers", "Baked puffs", "Savory bites"] },
  ],

  breakdown: {
    overview:
      "Sweet & Savory Flavor Insights analyzes 1,53,496 consumer conversations across 8 digital channels in India over the last year. Honey Chilli and Gunpowder Podi lead national growth. Twenty-nine states have distinct sweet and savory top-5 profiles with regional extension ideas for Britannia's portfolio.",
    sections: [
      { id: "methodology", title: "Methodology", bullets: ["1,53,496 total conversations", "Channels: Instagram, Reddit, X, YouTube, Amazon Reviews, Flipkart Reviews, Zomato, Swiggy", "India · last 12 months", "Consuma AI · generated in under 30 minutes"] },
      { id: "honeyChilli", title: "Honey Chilli", bullets: ["48.7% conversation growth", "63.4% engagement growth", "Established nationally", "Strong in Maharashtra, UP, Delhi NCR, Karnataka, Telangana"] },
      { id: "gunpowderPodi", title: "Gunpowder Podi", bullets: ["46.2% conversation growth", "61.8% engagement growth", "Emerging in South", "TN, Karnataka, AP, Telangana podi lock"] },
      { id: "states", title: "29 states", bullets: ["Top 5 sweet + top 5 savory per state", "Expandable conv. volume per flavor", "Regional clusters for South, North, East"] },
      { id: "sweetOpps", title: "5 sweet opportunities", bullets: ["Mishti Doi Caramel — Bengal", "Nolen Gur Toffee — East", "Tamarind Candy — South tangy bridge", "Tilkut Sesame — Bihar/Jharkhand", "Qubani Ka Meetha — Telangana"] },
      { id: "savoryOpps", title: "5 savory opportunities", bullets: ["Gunpowder Podi — South podi platform", "Honey Chilli — pan-India sweet-heat", "Schezwan Masala — urban North/West", "Chaat Masala Blast — North chai-time", "Sattu Masala — Bihar/Jharkhand"] },
    ],
  },

  defaultResearchQuery: "Map India's top traditional sweet and savory flavors state-by-state",

  predefinedQuestions: [
    { id: "overview", tag: "Overview", q: "Summarize the full Flavor Insights India report", hint: "1.53L convos · 29 states", research: false },
    { id: "flavour", tag: "States", q: "Top flavour trends by state across India", hint: "29 states · sweet & savory top 5", research: true },
    { id: "sentiment", tag: "Sentiment", q: "Sentiment towards regional sweets in India", hint: "Mishti Doi · Nolen Gur · East", research: true },
    { id: "extension", tag: "Extensions", q: "What are all extension opportunities?", hint: "Honey Chilli · Gunpowder Podi · regional", research: true },
    { id: "honeyChilli", tag: "Honey Chilli", q: "Honey Chilli trends and extensions", hint: "48.7% conv. growth · pan-India", research: false },
    { id: "podi", tag: "Gunpowder Podi", q: "Gunpowder Podi savory opportunity", hint: "46.2% growth · South India", research: false },
    { id: "gulkand", tag: "Gulkand", q: "Gulkand and North India sweet flavors", hint: "UP · Rajasthan · Delhi", research: false },
    { id: "maharashtra", tag: "Maharashtra", q: "Top flavors in Maharashtra", hint: "Honey Chilli · Schezwan · Vada Pav", research: false },
    { id: "delhi", tag: "Delhi", q: "What flavors dominate in Delhi NCR?", hint: "Honey Chilli · Chaat Masala Blast", research: false },
    { id: "compare", tag: "Compare", q: "Honey Chilli vs Gunpowder Podi — which to prioritize?", hint: "National sweet-heat vs South podi", research: false },
  ],

  favoriteSavoryShares: [
    { flavor: "Honey Chilli", pct: 49 },
    { flavor: "Gunpowder Podi", pct: 46 },
    { flavor: "Schezwan Masala", pct: 42 },
    { flavor: "Chaat Masala Blast", pct: 39 },
    { flavor: "Tandoori BBQ", pct: 35 },
    { flavor: "Kerala Pepper Fry", pct: 34 },
  ],

  reportSections: [
    { id: "exec", title: "Executive summary", content: "Honey Chilli (48.7% conversation growth) and Gunpowder Podi (46.2% conversation growth) lead India's trending snack flavors. Sweet-heat works nationally; podi authenticity wins the South. Analysis: 1,53,496 conversations, 8 channels, India, last 12 months." },
    { id: "honeyChilli", title: "Honey Chilli", content: "Established nationally with 48.7% conversation growth and 63.4% engagement growth. Strongest in Maharashtra, UP, Delhi NCR, Karnataka, and Telangana. Extensions: coated crackers, baked chips, snack mix, cream biscuits, namkeen sticks." },
    { id: "gunpowderPodi", title: "Gunpowder Podi", content: "Emerging South anchor with 46.2% conversation growth. Holds #1 savory position in Tamil Nadu, Karnataka, Andhra Pradesh, and Telangana. Extensions: podi crackers, khakhra, savory biscuits, podi snack mix." },
    { id: "regional", title: "Regional sweets", content: "East leads on heritage sweets — Mishti Doi Caramel and Nolen Gur Toffee outperform novelty. West Bengal and Assam set the tone for dessert-snack extensions." },
    { id: "states", title: "States — top flavors", content: "Twenty-nine states with top 5 sweet and top 5 savory flavors each — expandable metrics with conversation volume and engagement per flavor." },
    { id: "sweet", title: "Sweet opportunities", content: "Mishti Doi Caramel, Nolen Gur Toffee, Tamarind Candy, Tilkut Sesame Jaggery, Qubani Ka Meetha Toffee — regional anchors with proof points and extension ideas." },
    { id: "savory", title: "Savory opportunities", content: "Gunpowder Podi, Honey Chilli, Schezwan Masala, Chaat Masala Blast, Sattu Masala — spice depth, sweet-heat, and regional masala platforms." },
    { id: "method", title: "Methodology", content: "Consuma AI · Flavor Insights India. Instagram, Reddit, X, YouTube, Amazon Reviews, Flipkart Reviews, Zomato, Swiggy. 1,53,496 conversations. Generated in under 30 minutes." },
  ],
};
