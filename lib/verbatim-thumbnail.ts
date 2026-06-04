/** Resolve a display thumbnail for a social post link (no image field in verbatium.json). */

const YOUTUBE_ID =
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/i;

export const youtubeThumbnailUrl = (link: string) => {
  const m = String(link || "").match(YOUTUBE_ID);
  if (!m) return null;
  return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
};

export const needsOgThumbnail = (link: string) => {
  const u = String(link || "").toLowerCase();
  return (
    u.includes("instagram.com") ||
    u.includes("twitter.com") ||
    u.includes("x.com") ||
    u.includes("facebook.com")
  );
};

export const ogThumbnailProxyUrl = (link: string) =>
  `/api/verbatim-thumbnail?url=${encodeURIComponent(link)}`;

export const resolveThumbnailUrl = (link: string) => {
  if (!link) return null;
  const yt = youtubeThumbnailUrl(link);
  if (yt) return yt;
  if (needsOgThumbnail(link)) return ogThumbnailProxyUrl(link);
  return ogThumbnailProxyUrl(link);
};
