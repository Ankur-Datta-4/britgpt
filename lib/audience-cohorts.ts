import { CROSS_STATE_INSIGHTS } from "@/lib/demo-flow-data";

export type AudienceCohortId = string;

export type AudienceCohort = {
  id: AudienceCohortId;
  label: string;
  icon: string;
  insight: string;
  flavors: string[];
  generations: string[];
  ages: string[];
  lifestyles: string[];
  tiers: string[];
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

const COHORT_META: Record<
  string,
  Pick<AudienceCohort, "icon" | "generations" | "ages" | "lifestyles" | "tiers">
> = {
  genz: {
    icon: "✦",
    generations: ["Gen Z"],
    ages: ["18-24"],
    lifestyles: ["Urban"],
    tiers: ["Tier 1", "Tier 2"],
  },
  millennials: {
    icon: "↗",
    generations: ["Millennials", "Gen Y"],
    ages: ["25-34", "35-44"],
    lifestyles: ["Urban", "Semi-Urban"],
    tiers: ["Tier 1", "Tier 2"],
  },
  mass35: {
    icon: "⌂",
    generations: ["Gen Y"],
    ages: ["35-44", "45+"],
    lifestyles: ["Semi-Urban", "Rural"],
    tiers: ["Tier 2", "Tier 3+"],
  },
  health: {
    icon: "◌",
    generations: ["Millennials", "Gen Y"],
    ages: ["25-34", "35-44"],
    lifestyles: ["Urban"],
    tiers: ["Tier 1", "Tier 2"],
  },
  urban_youth: {
    icon: "↯",
    generations: ["Gen Z", "Millennials"],
    ages: ["18-24", "25-34"],
    lifestyles: ["Urban"],
    tiers: ["Tier 1"],
  },
  premium_gifting: {
    icon: "◇",
    generations: ["Millennials", "Gen Y"],
    ages: ["25-34", "35-44", "45+"],
    lifestyles: ["Urban"],
    tiers: ["Tier 1"],
  },
};

export const AUDIENCE_COHORTS: AudienceCohort[] = CROSS_STATE_INSIGHTS.age.map((cohort) => {
  const meta = COHORT_META[cohort.id] || {
    icon: "•",
    generations: [],
    ages: [],
    lifestyles: [],
    tiers: [],
  };

  return {
    id: cohort.id,
    label: cohort.label || cohort.id,
    icon: meta.icon,
    insight: shortenInsight(crossById[cohort.id]?.insight || cohort.insight || ""),
    flavors: flavorList(crossById[cohort.id]?.topFlavors || cohort.topFlavors),
    generations: meta.generations,
    ages: meta.ages,
    lifestyles: meta.lifestyles,
    tiers: meta.tiers,
  };
});

export const getCohortById = (id: string | null | undefined) =>
  AUDIENCE_COHORTS.find((c) => c.id === id);

export const getAudienceDefaultsFromCohort = (cohortId: string | null | undefined) => {
  const cohort = getCohortById(cohortId);
  if (!cohort) return {};
  return {
    cohortId: cohort.id,
    generations: [...cohort.generations],
    ages: [...cohort.ages],
    lifestyles: [...cohort.lifestyles],
    tiers: [...cohort.tiers],
  };
};
