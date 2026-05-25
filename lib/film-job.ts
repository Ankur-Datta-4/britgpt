export const parseFilmProgress = (text: string) => {
  const m = String(text || "").match(/(\d+)\s*%/);
  return m ? Math.min(100, Number(m[1])) : undefined;
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
