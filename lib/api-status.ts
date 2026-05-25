import { hasBedrockKey } from "@/lib/config-client";

let cachedBedrockConfigured: boolean | null = null;

export const checkBedrockConfigured = async (force = false) => {
  if (hasBedrockKey()) return true;
  if (!force && cachedBedrockConfigured !== null) return cachedBedrockConfigured;

  if (typeof window === "undefined") {
    const { getBedrockKeyFromEnv } = await import("@/lib/config");
    const ok = !!getBedrockKeyFromEnv();
    cachedBedrockConfigured = ok;
    return ok;
  }

  try {
    const res = await fetch("/api/config", { cache: "no-store" });
    const data = await res.json();
    cachedBedrockConfigured = !!data.bedrockConfigured;
    return cachedBedrockConfigured;
  } catch {
    cachedBedrockConfigured = false;
    return false;
  }
};

export const resetBedrockConfigCache = () => {
  cachedBedrockConfigured = null;
};
