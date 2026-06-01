import { BRIT_DATA } from "@/lib/data";

const slug = (s) =>
  String(s || "brief")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

export const buildExecutiveBrief = ({ script, params, messages = [] }) => {
  const ex = script?.exec || {};
  const meta = BRIT_DATA?.meta || {};
  const userLines = messages
    .filter((m) => m.role === "user" && m.text)
    .map((m) => `- ${m.text}`)
    .join("\n");

  return [
    `${meta.title || "Flavor Insights India"}`,
    `Generated ${meta.date || "May 2026"} · Britannia consumer research`,
    `Scope: ${params?.region || "Pan-India"} · ${params?.obj || "Product extension"}`,
    `Sample: ${meta.totalSample?.toLocaleString("en-IN") || "1.53L"} conversations`,
    "",
    "RECOMMENDED ACTION",
    ex.h2 || "",
    ex.p || "",
    "",
    ...(ex.meta || []).map((m) => `${m.k}: ${m.v}`),
    "",
    userLines ? `SESSION QUESTIONS\n${userLines}` : "",
    "",
    "— Brit GPT · Flavor Insights India",
  ]
    .filter(Boolean)
    .join("\n");
};

export const buildFullReportText = ({ script, params }) => {
  const sections = BRIT_DATA?.reportSections || [];
  const ex = script?.exec || {};
  const header = buildExecutiveBrief({ script, params, messages: [] });

  const body = sections
    .map((s) => `\n## ${s.title}\n${s.content || ""}`)
    .join("\n");

  return `${header}\n\nFULL REPORT\n${body}\n\nExecutive summary\n${ex.h2}\n${ex.p}`;
};

export const downloadTextFile = (text, filename) => {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportBriefPdf = ({ script, params, messages }) => {
  const text = buildExecutiveBrief({ script, params, messages });
  const name = slug(script?.title || "research");
  downloadTextFile(text, `brit-gpt-brief-${name}.txt`);
  return text;
};

export const exportFullReport = ({ script, params }) => {
  const text = buildFullReportText({ script, params });
  const name = slug(script?.title || "report");
  downloadTextFile(text, `brit-gpt-report-${name}.txt`);
  return text;
};

export const shareText = async ({ title, text }) => {
  if (typeof navigator !== "undefined" && navigator.share) {
    await navigator.share({ title, text });
    return "shared";
  }
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return "copied";
  }
  throw new Error("Sharing is not supported in this browser");
};

export const printBrief = ({ script, params, messages }) => {
  const text = buildExecutiveBrief({ script, params, messages });
  const win = window.open("", "_blank", "width=720,height=900");
  if (!win) throw new Error("Allow pop-ups to print the brief");
  win.document.write(
    `<!DOCTYPE html><html><head><title>${script?.title || "Brit GPT Brief"}</title>
    <style>body{font-family:Georgia,serif;padding:40px;line-height:1.6;color:#1a1a1a}
    h1{font-size:22px} pre{white-space:pre-wrap;font-family:system-ui,sans-serif;font-size:13px}</style></head>
    <body><h1>${script?.title || "Research brief"}</h1><pre>${text.replace(/</g, "&lt;")}</pre></body></html>`
  );
  win.document.close();
  win.focus();
  win.print();
};
