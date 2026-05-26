import { CROSS_STATE_INSIGHTS } from "@/lib/demo-flow-data";

export type AudienceCohortId = "genz" | "millennials" | "families" | "45plus";

export type AudienceCohort = {
  id: AudienceCohortId;
  label: string;
  icon: string;
  insight: string;
  flavors: string[];
  generations: string[];
  ages: string[];
};

const flavorList = (topFlavors?: string) =>
  (topFlavors || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const shortenInsight = (text: string, max = 220) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const last = cut.lastIndexOf(". ");
  return (last > 80 ? cut.slice(0, last + 1) : cut).trim() + "…";
};

const crossById = Object.fromEntries(CROSS_STATE_INSIGHTS.age.map((a) => [a.id, a]));

export const AUDIENCE_COHORTS: AudienceCohort[] = [
  {
    id: "genz",
    label: "Gen Z (18–24)",
    icon: "✦",
    insight: shortenInsight(crossById.genz?.insight || ""),
    flavors: flavorList(crossById.genz?.topFlavors),
    generations: ["Gen Z"],
    ages: ["18-24"],
  },
  {
    id: "millennials",
    label: "Millennials (25–38)",
    icon: "↗",
    insight: shortenInsight(crossById.millennials?.insight || ""),
    flavors: flavorList(crossById.millennials?.topFlavors),
    generations: ["Millennials", "Gen Y"],
    ages: ["25-34", "35-44"],
  },
  {
    id: "families",
    label: "Parents & families (30–45)",
    icon: "⌂",
    insight: shortenInsight(crossById.families?.insight || ""),
    flavors: flavorList(crossById.families?.topFlavors),
    generations: ["Millennials"],
    ages: ["35-44", "45+"],
  },
  {
    id: "45plus",
    label: "45 and above",
    icon: "❧",
    insight: shortenInsight(crossById["45plus"]?.insight || ""),
    flavors: flavorList(crossById["45plus"]?.topFlavors),
    generations: [],
    ages: ["45+"],
  },
];

export const getCohortById = (id: string | null | undefined) =>
  AUDIENCE_COHORTS.find((c) => c.id === id);

export const getAudienceDefaultsFromCohort = (cohortId: string | null | undefined) => {
  const cohort = getCohortById(cohortId);
  if (!cohort) return {};
  return {
    cohortId: cohort.id,
    generations: [...cohort.generations],
    ages: [...cohort.ages],
    lifestyles: [] as string[],
    tiers: [] as string[],
  };
};
