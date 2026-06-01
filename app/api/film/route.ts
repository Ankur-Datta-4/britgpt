import { NextRequest, NextResponse } from "next/server";
import { getFilmPresignedUrl } from "@/lib/s3-film";

export const GET = async (req: NextRequest) => {
  const uri = req.nextUrl.searchParams.get("uri")?.trim();
  if (!uri) {
    return NextResponse.json({ error: "Missing uri query param" }, { status: 400 });
  }

  const result = await getFilmPresignedUrl(uri);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.error?.includes("not found") ? 404 : 503 });
  }

  return NextResponse.json({
    playUrl: result.playUrl,
    key: result.key,
    bucket: result.bucket,
  });
};
