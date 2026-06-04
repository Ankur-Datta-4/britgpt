import { NextRequest, NextResponse } from "next/server";
import verbatiumData from "@/lib/verbatium.json";
import {
  mapVerbatimRowsToPosts,
  verbatimDatasetKeyForFlavor,
  type VerbatimRawPost,
} from "@/lib/verbatim-feed";

export const runtime = "nodejs";

const dataset = verbatiumData as Record<string, VerbatimRawPost[]>;

export const GET = async (req: NextRequest) => {
  const flavor = req.nextUrl.searchParams.get("flavor")?.trim();
  if (!flavor) {
    return NextResponse.json({ error: "Missing flavor" }, { status: 400 });
  }

  const limitRaw = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitRaw)
    ? Math.min(100, Math.max(1, Math.floor(limitRaw)))
    : 40;

  const key = verbatimDatasetKeyForFlavor(flavor);
  if (!key) {
    return NextResponse.json([]);
  }

  const rows = dataset[key] || [];
  return NextResponse.json(mapVerbatimRowsToPosts(key, rows, limit));
};
