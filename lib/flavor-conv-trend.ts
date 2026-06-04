import trendJson from "@/lib/flavor-conv-trend.json";

const MONTHS = trendJson.months as string[];
const SERIES = trendJson.series as Record<string, number[]>;

/** Values are conversation volume in thousands (K). */
export const FLAVOR_CONV_TREND_MONTHS = MONTHS;

export const FLAVORS_WITH_CONV_TREND = Object.keys(SERIES);

export const hasFlavorConvTrend = (flavorName: string) =>
  Boolean(SERIES[flavorName]?.length);

export const formatConvTrendK = (value: number) => {
  const n = Number(value) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}M`;
  return `${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}K`;
};

/** Chart rows for Recharts: { month, [flavorName]: valueK } */
export const buildFlavorConvTrendChartData = (flavorName: string) => {
  const values = SERIES[flavorName];
  if (!values?.length) return null;
  return MONTHS.map((month, i) => ({
    month,
    [flavorName]: values[i] ?? values[values.length - 1],
  }));
};
