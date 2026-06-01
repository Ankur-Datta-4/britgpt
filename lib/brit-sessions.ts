export const BRIT_SESSIONS_KEY = "brit-gpt-sessions-v1";

export const createSessionId = () =>
  `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const loadSessionIndex = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BRIT_SESSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveSessionIndex = (sessions) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRIT_SESSIONS_KEY, JSON.stringify(sessions.slice(0, 40)));
  } catch (e) {
    console.warn("[Brit GPT] Could not persist sessions:", e);
  }
};

export const deleteSessionFromIndex = (sessionId) => {
  const list = loadSessionIndex().filter((s) => s.id !== sessionId);
  saveSessionIndex(list);
  return list;
};

const stripScript = (script) =>
  script ? { id: script.id, title: script.title } : null;

export const serializeMessages = (messages = []) =>
  messages.map((m) => ({
    ...m,
    script: m.script ? stripScript(m.script) : m.script,
  }));

export const getSessionTitle = (messages, script) => {
  const user = messages.find((m) => m.role === "user" && m.text);
  if (user?.text) {
    const t = user.text.trim();
    return t.length > 48 ? `${t.slice(0, 46)}…` : t;
  }
  return script?.title || "New research";
};

export const isSessionToday = (updatedAt) => {
  const d = new Date(updatedAt);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

export const formatSessionTime = (updatedAt) => {
  const d = new Date(updatedAt);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};
