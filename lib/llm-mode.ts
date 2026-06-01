const LLM_LIVE_KEY = "brit-llm-live";

export const isLlmLiveEnabled = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(LLM_LIVE_KEY) === "1";
};

export const setLlmLiveEnabled = (on: boolean) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LLM_LIVE_KEY, on ? "1" : "0");
};

export const toggleLlmLive = () => {
  const next = !isLlmLiveEnabled();
  setLlmLiveEnabled(next);
  return next;
};
