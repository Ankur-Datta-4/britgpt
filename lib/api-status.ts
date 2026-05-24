import { hasBedrockKey } from "@/lib/config-client";

export const checkBedrockConfigured = async () => {
  if (hasBedrockKey()) return true;
  if (typeof window === "undefined") {
    const { getBedrockKeyFromEnv } = await import("@/lib/config");
    return !!getBedrockKeyFromEnv();
  }
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    return !!data.bedrockConfigured;
  } catch {
    return false;
  }
};
