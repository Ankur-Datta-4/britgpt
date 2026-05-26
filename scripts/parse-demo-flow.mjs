import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = readFileSync(join(root, "docs/britgpt-demo-flow.txt"), "utf8");
const lines = src.split(/\r?\n/).map((l) => l.replace(/^\t+/, "").trim());

const sliceBetween = (start, end) => {
  const i = lines.findIndex((l) => l === start);
  const j = end ? lines.findIndex((l) => l === end) : lines.length;
  if (i < 0) return [];
  return lines.slice(i + 1, j >= 0 ? j : undefined);
};

const INDIAN_STATES = new Set([
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi NCR", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
]);

const CLUSTER_IDS = {
  "Tamil Nadu + Karnataka": "south-podi",
  "Delhi + NCR": "delhi-ncr",
  Maharashtra: "maharashtra",
  "Uttar Pradesh + Rajasthan": "up-raj",
  "West Bengal + Odisha": "east",
};

const isVolume = (s) => /^\d+(\.\d+)?K$/.test(s);

/* ── Section 2.1: state top-5 ── */
const s21 = sliceBetween("Section 2.1", "Section 2.2");
const demoStates = [];
for (let i = 0; i < s21.length; i++) {
  const line = s21[i];
  if (!INDIAN_STATES.has(line)) continue;
  const sweet = (s21[i + 1] || "").split(",").map((s) => s.trim()).filter(Boolean);
  const savory = (s21[i + 2] || "").split(",").map((s) => s.trim()).filter(Boolean);
  demoStates.push({ state: line, sweet, savory });
  i += 2;
}

writeFileSync(
  join(root, "lib/demo-states-parsed.json"),
  JSON.stringify(demoStates, null, 2)
);

/* ── Section 2.2: state metrics ── */
const s22 = sliceBetween("Section 2.2", "Section 3");
const stateDetails = {};
let current = null;
let i = 0;
while (i < s22.length) {
  const line = s22[i];
  if (!line) { i++; continue; }
  if (INDIAN_STATES.has(line)) {
    current = line;
    stateDetails[current] = { metrics: [] };
    i++;
    if (s22[i] === "Flavor") i += 4;
    continue;
  }
  if (current && line !== "Flavor" && line !== "Flavor Type") {
    const flavor = line;
    const type = s22[i + 1];
    const conv = s22[i + 2];
    const eng = s22[i + 3];
    if (type === "Sweet" || type === "Savory") {
      stateDetails[current].metrics.push({
        flavor,
        type,
        convVolume: conv,
        totalEngagement: eng,
      });
      i += 4;
      continue;
    }
  }
  i++;
}

const buildInsight = (state, metrics) => {
  const savory = metrics.filter((m) => m.type === "Savory").sort((a, b) => parseFloat(b.convVolume) - parseFloat(a.convVolume));
  const sweet = metrics.filter((m) => m.type === "Sweet").sort((a, b) => parseFloat(b.convVolume) - parseFloat(a.convVolume));
  const topS = savory[0]?.flavor || "regional savory";
  const topSw = sweet[0]?.flavor || "regional sweet";
  return `${state}: ${topSw} leads sweet conversations; ${topS} anchors savory — localize packs before national scale.`;
};

const buildTakeaway = (state, metrics) => {
  const topS = metrics.filter((m) => m.type === "Savory")[0]?.flavor;
  const topSw = metrics.filter((m) => m.type === "Sweet")[0]?.flavor;
  return `What this means: Consumers in ${state} reward ${topSw} for sweet occasions and ${topS} for everyday savory — pilot extensions on those two anchors first.`;
};

for (const [state, data] of Object.entries(stateDetails)) {
  data.insight = buildInsight(state, data.metrics);
  data.takeaway = buildTakeaway(state, data.metrics);
}

writeFileSync(
  join(root, "lib/demo-state-details-parsed.json"),
  JSON.stringify(stateDetails, null, 2)
);

/* ── Section 3: winning flavors ── */
const s3 = sliceBetween("Section 3", "Section 4");
const winningRows = [];
for (let j = 0; j < s3.length; j++) {
  const a = s3[j];
  if (!INDIAN_STATES.has(a)) continue;
  const flavorType = s3[j + 1];
  if (flavorType !== "Sweet" && flavorType !== "Savory") continue;
  winningRows.push({
    state: a,
    flavorType,
    flavor: s3[j + 2],
    trendType: s3[j + 3],
    extensions: s3[j + 4],
    brandFit: s3[j + 5],
  });
  j += 5;
}

writeFileSync(
  join(root, "lib/demo-winning-flavors-parsed.json"),
  JSON.stringify(winningRows, null, 2)
);

/* ── Section 4: cross-state ── */
const s4raw = sliceBetween("Section 4", "Section 5").join("\n");

const parseBlock = (text) => {
  const insightM = text.match(/Insight:\s*([\s\S]+?)(?=Key flavors:|Peak flavors:|Top flavors:|Opportunity signal:|Implication:|Trial potential:|$)/);
  const keyM = text.match(/Key flavors:\s*(.+)/);
  const peakM = text.match(/Peak flavors:\s*(.+)/);
  const topM = text.match(/Top flavors:\s*(.+)/);
  const signalM = text.match(/Opportunity signal:\s*(.+)/);
  const implM = text.match(/Implication:\s*(.+)/);
  const trialM = text.match(/Trial potential:\s*(.+)/);
  const labelLine = text.split("\n")[0].trim();
  const id = labelLine.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return {
    id,
    label: labelLine.replace(/^\d+\.\s*/, "").split("(")[0].trim() || labelLine,
    insight: insightM?.[1]?.trim() || "",
    keyFlavors: keyM?.[1]?.trim(),
    peakFlavors: peakM?.[1]?.trim(),
    topFlavors: topM?.[1]?.trim(),
    signal: signalM?.[1]?.trim(),
    implication: implM?.[1]?.trim(),
    trial: trialM?.[1]?.trim(),
  };
};

const zoneSection = s4raw.split("2. Weather")[0].replace("1. Zone-wise trends", "");
const weatherSection = s4raw.split("2. Weather")[1]?.split("3. Age")[0] || "";
const ageSection = s4raw.split("3. Age")[1] || "";

const zoneBlocks = zoneSection.split(/_{5,}/).filter((b) => b.includes("Insight:"));
const weatherBlocks = weatherSection.split(/_{5,}/).filter((b) => b.includes("Insight:"));
const ageBlocks = ageSection.split(/_{5,}/).filter((b) => b.includes("Insight:"));

const crossState = {
  zone: zoneBlocks.map(parseBlock).map((b, idx) => ({ ...b, id: ["north", "south", "west", "east", "northeast"][idx] || b.id })),
  weather: weatherBlocks.map(parseBlock).map((b, idx) => ({ ...b, id: ["summer", "monsoon", "winter"][idx] || b.id })),
  age: ageBlocks.map(parseBlock).map((b, idx) => ({ ...b, id: ["genz", "millennials", "families", "45plus"][idx] || b.id })),
};

writeFileSync(
  join(root, "lib/demo-cross-state-parsed.json"),
  JSON.stringify(crossState, null, 2)
);

/* ── Section 5: national prioritization ── */
const s5 = sliceBetween("Section 5", "Section 6");
const nationalFlavors = [];
for (let k = 0; k < s5.length; k++) {
  const name = s5[k];
  if (!name || name === "Flavor Name" || name.includes("Conversation Growth")) { k++; continue; }
  if (s5[k + 1]?.endsWith("%") && s5[k + 2]?.endsWith("%")) {
    nationalFlavors.push({
      name,
      convGrowth: s5[k + 1],
      engGrowth: s5[k + 2],
      trendType: s5[k + 3],
      states: s5[k + 4],
      extensions: s5[k + 5],
      brandFit: s5[k + 6],
    });
    k += 6;
  }
}

writeFileSync(
  join(root, "lib/demo-national-parsed.json"),
  JSON.stringify(nationalFlavors, null, 2)
);

/* ── Overall flavor machine table ── */
const fmHeader = lines.findIndex((l) => l === "Product Category Portfolio Recommendation");
const fmEnd = lines.findIndex((l) => l === "STATE-WISE FLAVOR TABLES");
const flavorMachine = [];

if (fmHeader >= 0 && fmEnd > fmHeader) {
  const fmLines = lines.slice(fmHeader + 1, fmEnd);
  for (let m = 0; m < fmLines.length; m++) {
    const name = fmLines[m];
    if (!name || name === "Flavor" || name.includes("Conversation Growth")) continue;
    if (fmLines[m + 1]?.endsWith("%") && fmLines[m + 2]?.endsWith("%")) {
      flavorMachine.push({
        name,
        convGrowth: fmLines[m + 1],
        engGrowth: fmLines[m + 2],
        productCategory: fmLines[m + 3],
        brandFit: fmLines[m + 4],
      });
      m += 4;
    }
  }
}

writeFileSync(
  join(root, "lib/demo-flavor-machine.json"),
  JSON.stringify(flavorMachine, null, 2)
);

/* ── Regional flavor clusters ── */
const clusterStart = fmEnd >= 0 ? fmEnd + 1 : -1;
const clusters = [];

if (clusterStart >= 0) {
  const clusterLines = lines.slice(clusterStart);
  let c = 0;
  while (c < clusterLines.length) {
    const line = clusterLines[c];
    if (!line) { c++; continue; }
    if (line.startsWith(">") || line.includes("Actionable Options")) break;
    if (clusterLines[c + 1] === "Flavor") {
      const label = line;
      const rows = [];
      c += 4;
      while (c < clusterLines.length && isVolume(clusterLines[c + 1])) {
        rows.push({
          flavor: clusterLines[c],
          convVolume: clusterLines[c + 1],
          engVolume: clusterLines[c + 2],
        });
        c += 3;
      }
      let insight = clusterLines[c] || "";
      insight = insight.replace(/^Insight Callout:\s*/i, "").trim();
      if (insight && !insight.startsWith(">")) {
        clusters.push({
          id: CLUSTER_IDS[label] || label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          label,
          insight,
          rows,
        });
        c++;
      }
      continue;
    }
    c++;
  }
}

writeFileSync(
  join(root, "lib/demo-state-clusters.json"),
  JSON.stringify(clusters, null, 2)
);

console.log(
  "Parsed",
  demoStates.length, "states,",
  Object.keys(stateDetails).length, "state details,",
  winningRows.length, "winning rows,",
  nationalFlavors.length, "national flavors,",
  flavorMachine.length, "flavor machine rows,",
  clusters.length, "clusters,",
  "cross:", crossState.zone.length, crossState.weather.length, crossState.age.length
);
