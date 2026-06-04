import { resolveThumbnailUrl } from "@/lib/verbatim-thumbnail";

export type VerbatimPost = {
  id: string;
  link: string;
  platform: string;
  platformLabel: string;
  title: string;
  excerpt: string;
  createdAt: string;
  timeLabel: string;
  metrics: { likes: number; comments: number; shares: number; views: number };
  engagementLabel: string;
  thumbnailUrl: string | null;
};

/** Keys in lib/verbatium.json → national flavor names */
export const VERBATIM_FLAVOR_KEY_MAP: Record<string, string> = {
  "Kaju Katli Snack Flavor": "Kaju Katli",
  "Gulab Jamun Snack Flavor": "Gulab Jamun",
  "Gunpowder Podi Flavor": "Gunpowder Podi",
  "Garlic Chilli Flavor": "Garlic Chilli",
  "Schezwan Snack Flavor": "Schezwan",
  "Nolen Gur Snack Flavor": "Nolen Gur",
  "Rasmalai Snack Flavor": "Ras Malai",
  "Achari Spice Flavor": "Achari Spice",
  "Tandoori Spice Flavor": "Tandoori Spice",
};

const NATIONAL_TO_VERBATIM_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(VERBATIM_FLAVOR_KEY_MAP).map(([k, v]) => [v, k])
);

export const FLAVORS_WITH_VERBATIM_WALL = Object.values(VERBATIM_FLAVOR_KEY_MAP);

export const hasVerbatimWall = (flavorName: string) =>
  Boolean(NATIONAL_TO_VERBATIM_KEY[flavorName]);

const formatPlatform = (raw: string) => {
  const s = String(raw || "").toLowerCase();
  if (s.includes("youtube")) return "YouTube";
  if (s.includes("instagram")) return "Instagram";
  if (s.includes("twitter")) return "X";
  if (s.includes("facebook")) return "Facebook";
  if (s.includes("reddit")) return "Reddit";
  return "Social";
};

const formatCount = (n: number) => {
  if (!n || n < 1) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const formatEngagement = (m: VerbatimPost["metrics"]) => {
  const parts: string[] = [];
  const likes = formatCount(m.likes);
  const views = formatCount(m.views);
  const comments = formatCount(m.comments);
  const shares = formatCount(m.shares);
  if (likes) parts.push(`${likes} likes`);
  if (views) parts.push(`${views} views`);
  if (comments) parts.push(`${comments} comments`);
  if (shares) parts.push(`${shares} shares`);
  return parts.length ? parts.join(" · ") : "Engagement tracked";
};

const formatTime = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
};

const buildExcerpt = (title: string, platformLabel: string, link: string) => {
  const t = title?.trim();
  if (t) return t.length > 220 ? `${t.slice(0, 217)}…` : t;
  try {
    const host = new URL(link).hostname.replace("www.", "");
    return `Social post surfaced on ${platformLabel} (${host}) — open link for full context.`;
  } catch {
    return `Social post on ${platformLabel}.`;
  }
};

export type VerbatimRawPost = {
  link?: string;
  platform?: string;
  title?: string;
  createdAt?: string;
  metrics?: { likes?: number; comments?: number; shares?: number; views?: number };
};

export const verbatimDatasetKeyForFlavor = (flavorName: string) =>
  NATIONAL_TO_VERBATIM_KEY[flavorName] ?? null;

export const mapVerbatimRowsToPosts = (
  datasetKey: string,
  rows: VerbatimRawPost[],
  limit: number
): VerbatimPost[] =>
  rows.slice(0, limit).map((row, i) => {
    const platformLabel = formatPlatform(row.platform || "");
    const title = String(row.title || "").trim();
    const metrics = {
      likes: row.metrics?.likes ?? 0,
      comments: row.metrics?.comments ?? 0,
      shares: row.metrics?.shares ?? 0,
      views: row.metrics?.views ?? 0,
    };
    const link = row.link || "#";
    return {
      id: `${datasetKey}-${i}`,
      link,
      platform: row.platform || "",
      platformLabel,
      title,
      excerpt: buildExcerpt(title, platformLabel, link),
      createdAt: row.createdAt || "",
      timeLabel: formatTime(row.createdAt || ""),
      metrics,
      engagementLabel: formatEngagement(metrics),
      thumbnailUrl: resolveThumbnailUrl(link),
    };
  });

export const fetchVerbatimFeed = async (
  flavorName: string,
  limit = 40
): Promise<VerbatimPost[]> => {
  if (!verbatimDatasetKeyForFlavor(flavorName)) return [];

  const params = new URLSearchParams({
    flavor: flavorName,
    limit: String(limit),
  });
  const res = await fetch(`/api/verbatim-feed?${params}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Could not load verbatim feed (${res.status})`);
  }
  return res.json() as Promise<VerbatimPost[]>;
};
