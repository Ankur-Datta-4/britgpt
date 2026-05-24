/** Always-renderable packshot (no Nova SVG required). */
export const buildPackshotDataUrl = (opts: {
  title?: string;
  sku?: string;
  lane?: string;
  gradient?: string;
  accent?: string;
}) => {
  const title = String(opts.title || opts.sku || "Concept").slice(0, 36);
  const lane = String(opts.lane || "Innovation").slice(0, 24);
  const g1 = opts.gradient || "#c45c3e";
  const g2 = opts.accent || "#8b2e1a";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${g1}"/>
      <stop offset="100%" style="stop-color:${g2}"/>
    </linearGradient>
    <linearGradient id="pack" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#fff8f0"/>
      <stop offset="100%" style="stop-color:#f5e6d8"/>
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#bg)"/>
  <rect x="55" y="95" width="290" height="340" rx="18" fill="url(#pack)" opacity="0.95"/>
  <rect x="75" y="120" width="250" height="180" rx="10" fill="${g1}" opacity="0.35"/>
  <ellipse cx="200" cy="290" rx="95" ry="28" fill="#000" opacity="0.08"/>
  <rect x="95" y="330" width="210" height="14" rx="7" fill="${g2}" opacity="0.5"/>
  <rect x="115" y="355" width="170" height="10" rx="5" fill="${g2}" opacity="0.3"/>
  <circle cx="320" cy="130" r="22" fill="${g1}" opacity="0.85"/>
</svg>`;

  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(svg, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${b64}`;
};
