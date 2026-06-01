"use client";

import { BEDROCK_STORAGE, BUILD, isBedrockKey } from "@/lib/config";

export const getBedrockKey = () => {
  try {
    return (localStorage.getItem(BEDROCK_STORAGE) || "").trim();
  } catch {
    return "";
  }
};

export const setBedrockKey = (key: string) => {
  try {
    if (key) localStorage.setItem(BEDROCK_STORAGE, key.trim());
    else localStorage.removeItem(BEDROCK_STORAGE);
  } catch {
    /* private mode */
  }
};

export const setApiKey = (key: string) => {
  const k = String(key || "").trim();
  if (!k) {
    setBedrockKey("");
    return;
  }
  if (!isBedrockKey(k)) {
    console.warn("[Brit GPT] Only Bedrock API keys (ABSK…) are supported.");
    return;
  }
  setBedrockKey(k);
};

export const getApiKey = getBedrockKey;

export const hasBedrockKey = () => !!getBedrockKey();
export const hasApiKey = () => hasBedrockKey();
export const getProvider = () => (hasBedrockKey() ? "bedrock" : null);

export { BUILD };
