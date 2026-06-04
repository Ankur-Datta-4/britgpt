import { NextRequest, NextResponse } from "next/server";
import { youtubeThumbnailUrl } from "@/lib/verbatim-thumbnail";

export const runtime = "nodejs";

const cache = new Map<string, { url: string; at: number }>();
const TTL_MS = 1000 * 60 * 60 * 12;

const extractOgImage = (html: string) => {
  const patterns = [
    /property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi,
    /content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/gi,
    /name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/gi,
  ];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const m = pattern.exec(html);
    if (m?.[1]) return m[1].replace(/&amp;/g, "&").trim();
  }
  return null;
};

const isAllowedUrl = (raw: string) => {
  try {
    const u = new URL(raw);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
};

export const GET = async (req: NextRequest) => {
  const target = req.nextUrl.searchParams.get("url")?.trim();
  if (!target || !isAllowedUrl(target)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const yt = youtubeThumbnailUrl(target);
  if (yt) {
    return NextResponse.redirect(yt, { status: 302 });
  }

  const cached = cache.get(target);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.redirect(cached.url, { status: 302 });
  }

  try {
    const res = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +https://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    const html = await res.text();
    const img = extractOgImage(html);
    if (img && isAllowedUrl(img)) {
      cache.set(target, { url: img, at: Date.now() });
      return NextResponse.redirect(img, { status: 302 });
    }
  } catch {
    /* fall through */
  }

  return NextResponse.json({ error: "Thumbnail not found" }, { status: 404 });
};
