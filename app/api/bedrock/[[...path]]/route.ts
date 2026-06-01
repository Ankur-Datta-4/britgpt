import { NextRequest, NextResponse } from "next/server";
import { BEDROCK_REGION, getBedrockKeyFromEnv } from "@/lib/config";

const BEDROCK_HOST = `bedrock-runtime.${BEDROCK_REGION}.amazonaws.com`;

export const runtime = "nodejs";

const proxy = async (req: NextRequest, path: string[]) => {
  // Reel status ARN contains slashes — Next splits path segments; re-encode for Bedrock
  let targetPath: string;
  if (path[0] === "async-invoke" && path.length > 1) {
    const arn = path.slice(1).join("/");
    targetPath = `/async-invoke/${encodeURIComponent(arn)}`;
  } else {
    targetPath = `/${path.join("/")}`;
  }
  const clientKey =
    req.headers.get("x-bedrock-api-key") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const apiKey = clientKey?.trim() || getBedrockKeyFromEnv();

  const headers: Record<string, string> = {
    host: BEDROCK_HOST,
    "content-type": req.headers.get("content-type") || "application/json",
    accept: req.headers.get("accept") || "application/json",
  };
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  const upstream = await fetch(`https://${BEDROCK_HOST}${targetPath}`, {
    method: req.method,
    headers,
    body,
  });

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!["transfer-encoding", "connection", "content-encoding"].includes(key)) {
      resHeaders.set(key, value);
    }
  });

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
};

export const GET = async (
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) => proxy(req, (await ctx.params).path || []);

export const POST = async (
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) => proxy(req, (await ctx.params).path || []);

export const OPTIONS = () =>
  new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Bedrock-Api-Key",
    },
  });
