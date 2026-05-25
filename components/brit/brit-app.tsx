// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BRIT_DATA } from '@/lib/data';
import { answerQuestion } from '@/lib/qa';
import { enrichQAAnswer, hasLlmKeyAsync } from '@/lib/llm';
import { runAction as executeAction } from '@/lib/actions';
import {
  DEFAULT_RESEARCH_PROMPT,
  DataConfigForm,
  AudienceConfigForm,
  DocStateTableCard,
  DocWinningClustersCard,
  DocCrossStateCard,
  DocNationalCard,
  DocActionablesCard,
} from '@/components/brit/doc-flow-cards';
import {
  ReportModal,
  DetailPanel,
  ApiKeySettings,
  SUGGESTIONS,
  matchResearchScript,
  TimelineBlock,
  InsightBlock,
  RegionCard,
  SentimentCard,
  TrendCard,
  FlavourCard,
  QuotesCard,
  FullSummaryCard,
  ExecBlock,
  ActionResultPanel,
  QAResponse,
} from '@/components/brit/chat-ui';

/* ============================================================
   Sidebar
============================================================ */
function Sidebar({ onNewChat, onPickQuestion, activeTitle }) {
  const presets = (BRIT_DATA?.predefinedQuestions || SUGGESTIONS).slice(0, 8);
  const recents = presets.map((p, i) => ({
    id: p.id || "c"+i,
    title: p.q.length > 42 ? p.q.slice(0, 40) + "…" : p.q,
    badge: p.research ? "pipeline" : "Q&A",
    active: activeTitle && p.q.includes(activeTitle?.slice(0, 12)),
    q: p.q,
  }));
  const older = [
    "Festive flavour 2024",
    "Tier-2 sweet & savoury",
    "Regional repurchase rates",
    "Modern trade penetration",
  ];

  return (
    <aside className="sidebar">
      <div className="side-h">
        <div className="brand">
          <div className="brand-mark"></div>
          <div className="brand-name">
            Brit GPT
            <small>consumer research</small>
          </div>
        </div>
        <button className="icon-btn" title="Collapse">‹</button>
      </div>

      <button className="side-newchat" onClick={onNewChat}>
        <span className="plus">+</span>
        <span>New research</span>
      </button>

      <div className="side-scroll">
        <div className="side-group">
          <div className="side-label">Today</div>
          {recents.map(r => (
            <div key={r.id} className={"side-item " + (r.active ? "active" : "")}
                 onClick={() => onPickQuestion && onPickQuestion(r.q)} title={r.q}>
              <span>{r.title}</span>
              {r.badge && <span className="badge">{r.badge}</span>}
            </div>
          ))}
        </div>
        <div className="side-group">
          <div className="side-label">Last week</div>
          {older.map(t => (
            <div key={t} className="side-item">
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="side-foot">
        <div className="user-card">
          <div className="avatar">AR</div>
          <div className="meta">
            <div className="name">Aarav R.</div>
            <div className="org">brand · ops</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   Composer
============================================================ */
function ComposerInner({ onSubmit, disabled, placeholder }) {
  const [v, setV] = useState("");
  const ta = useRef(null);

  useEffect(() => {
    if (ta.current) {
      ta.current.style.height = "auto";
      ta.current.style.height = Math.min(ta.current.scrollHeight, 200) + "px";
    }
  }, [v]);

  const send = () => {
    const txt = v.trim();
    if (!txt || disabled) return;
    onSubmit(txt);
    setV("");
  };

  return (
    <div className="composer-wrap">
      <div className="composer">
        <textarea
          ref={ta}
          value={v}
          onChange={e => setV(e.target.value)}
          placeholder={placeholder || "Ask a consumer research question…"}
          disabled={disabled}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <div className="composer-bar">
          <div className="chips">
            <span className="composer-chip">＋ data universe</span>
            <span className="composer-chip">＋ attach brief</span>
            <span className="composer-chip">＋ compare brands</span>
          </div>
          <button className="composer-send" onClick={send} disabled={disabled || !v.trim()} title="Send">↑</button>
        </div>
      </div>
      <div className="composer-foot">
        Brit GPT can make mistakes. Cross-check important findings with your data team · <a>privacy</a>
      </div>
    </div>
  );
}

/* ============================================================
   Message renderer
============================================================ */
function MessageView({ m, ctx }) {
  if (m.role === "user") {
    return (
      <div className="msg msg-user">
        <div className="bubble">{m.text}</div>
      </div>
    );
  }
  return (
    <div className="msg msg-asst">
      <div className="av"></div>
      <div className="content">
        {m.kind === "text"     && <p>{m.text}</p>}
        {m.kind === "muted"    && <p className="muted">{m.text}</p>}
        {m.kind === "typing"   && (
          <div className="typing">
            <span className="dots"><span></span><span></span><span></span></span>
            {m.text || "Working…"}
          </div>
        )}
        {m.kind === "data_config" && (
          <DataConfigForm locked={m.locked} defaults={m.defaults} onConfirm={(d) => ctx.onDataConfig(m.id, d)} />
        )}
        {m.kind === "audience_config" && (
          <AudienceConfigForm locked={m.locked} defaults={m.defaults} onConfirm={(d) => ctx.onAudienceConfig(m.id, d)} />
        )}
        {m.kind === "timeline" && <TimelineBlock onDone={() => ctx.onTimelineDone(m.id)} />}
        {m.kind === "insight" && <InsightBlock params={m.params} script={m.script} />}
        {m.kind === "doc_states" && <DocStateTableCard />}
        {m.kind === "doc_winning" && <DocWinningClustersCard />}
        {m.kind === "region" && <RegionCard script={m.script} />}
        {m.kind === "doc_cross" && <DocCrossStateCard />}
        {m.kind === "sentiment" && <SentimentCard script={m.script} />}
        {m.kind === "trend" && <TrendCard script={m.script} />}
        {m.kind === "doc_national" && <DocNationalCard />}
        {m.kind === "flavour" && <FlavourCard script={m.script} />}
        {m.kind === "quotes" && <QuotesCard script={m.script} />}
        {m.kind === "doc_actionables" && (
          <DocActionablesCard onRunDeliverable={ctx.onRunDeliverable} busy={ctx.actionBusy} />
        )}
        {m.kind === "summary" && <FullSummaryCard script={m.script} onOpenReport={ctx.onOpenReport} />}
        {m.kind === "exec" && <ExecBlock script={m.script} onOpenReport={ctx.onOpenReport} />}
        {m.kind === "action_result" && <ActionResultPanel payload={m.payload} />}
        {m.kind === "qa" && <QAResponse answer={m.answer} onPickRelated={ctx.onPickRelated} />}
        {m.kind === "research_reco" && (
          <ResearchRecoCard tag={m.tag} query={m.query} hint={m.hint} onStart={ctx.onStartResearch} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Main app
============================================================ */
export default function BritApp() {
  const msgIdRef = useRef(0);
  const nextMsgId = () => {
    msgIdRef.current += 1;
    return `msg-${msgIdRef.current}`;
  };

  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [params, setParams] = useState(null);
  const [runConfig, setRunConfig] = useState(null);
  const [activeScript, setActiveScript] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [serverBedrock, setServerBedrock] = useState(false);
  const [s3Configured, setS3Configured] = useState(false);
  const [bedrockConfig, setBedrockConfig] = useState(null);
  const threadRef = useRef(null);
  const scriptRef = useRef(null);
  const pipelineDoneRef = useRef(false);

  useEffect(() => {
    const handler = (e) => setDetail(e.detail);
    window.addEventListener("brit-detail", handler);
    return () => window.removeEventListener("brit-detail", handler);
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setServerBedrock(!!d.bedrockConfigured);
        setS3Configured(!!d.s3Configured);
        setBedrockConfig(d);
      })
      .catch(() => {
        setServerBedrock(false);
        setS3Configured(false);
      });
  }, []);

  useEffect(() => {
    const t = threadRef.current;
    if (!t) return;
    requestAnimationFrame(() => {
      t.scrollTo({ top: t.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length, actionBusy]);

  const push = (m) =>
    setMessages((ms) => [...ms, { ...m, id: nextMsgId() }]);
  const pushDelayed = (m, ms) => setTimeout(() => push(m), ms);

  const actionContext = (overrides = {}) => ({
    script: scriptRef.current || activeScript,
    params: params || scriptRef.current?.scopeDefaults,
    ...overrides,
  });

  const answerFromDataset = (query: string) => answerQuestion(query);

  const setTypingText = (text) => {
    setMessages((ms) => {
      const copy = [...ms];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].kind === "typing") {
          copy[i] = { ...copy[i], text };
          break;
        }
      }
      return copy;
    });
  };

  const replyWithQA = async (text, intro, opts = {}) => {
    push({ role: "user", text });
    if (intro) pushDelayed({ role: "asst", kind: "text", text: intro }, 200);
    pushDelayed({ role: "asst", kind: "typing", text: "Searching Flavor Insights India…" }, intro ? 450 : 280);
    await new Promise((r) => setTimeout(r, intro ? 700 : 500));

    let answer = answerFromDataset(text);
    if (await hasLlmKeyAsync()) {
      setTypingText("Refining answer…");
      try {
        answer = await enrichQAAnswer(text, answer);
      } catch { /* keep dataset answer */ }
    }

    setMessages((ms) => {
      const copy = [...ms];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i].kind === "typing") {
          copy[i] = { ...copy[i], kind: "qa", answer };
          break;
        }
      }
      return copy;
    });

  };

  const showResearchReco = (text) => {
    const query = text?.trim();
    if (!query) return;
    const script = matchResearchScript(query);
    scriptRef.current = script;
    setActiveScript(script);
    push({ role: "user", text: query });
    pushDelayed({
      role: "asst",
      kind: "text",
      text: "Got it. Here's the recommended study for that question — start when you're ready.",
    }, 280);
    pushDelayed({
      role: "asst",
      kind: "research_reco",
      tag: script.title || "Research",
      query,
      hint: "29 states · 2 credits · ~45 min",
    }, 550);
    setPhase("reco");
  };

  const startDocPipeline = (text) => {
    const prompt = (text?.trim() || DEFAULT_RESEARCH_PROMPT);
    const script = matchResearchScript(prompt);
    scriptRef.current = script;
    setActiveScript(script);
    setParams({ region: "Pan-India", obj: "Product extension" });
    pushDelayed({
      role: "asst",
      kind: "text",
      text: "I'll run this across your selected sources. Confirm data configuration and audience, then the engine will generate the full narrative.",
    }, 280);
    pushDelayed({ role: "asst", kind: "data_config", defaults: { geography: "India" } }, 550);
    setPhase("data_config");
  };

  const onDataConfig = (msgId, dataConfig) => {
    setRunConfig((c) => ({ ...c, dataConfig }));
    setMessages((ms) => ms.map((m) => (m.id === msgId ? { ...m, locked: true, defaults: dataConfig } : m)));
    pushDelayed({ role: "asst", kind: "audience_config" }, 350);
    setPhase("audience_config");
  };

  const onAudienceConfig = (msgId, audience) => {
    const full = { ...(runConfig || {}), audience };
    setRunConfig(full);
    setMessages((ms) => ms.map((m) => (m.id === msgId ? { ...m, locked: true, defaults: audience } : m)));
    pushDelayed({ role: "user", text: "Run research with these settings." }, 200);
    pushDelayed({
      role: "asst",
      kind: "text",
      text: `Running across ${full.dataConfig?.sources?.length || 7} sources · ${full.dataConfig?.timeframe || "Last 1 Year"} · ${full.dataConfig?.geography || "India"}.`,
    }, 450);
    pushDelayed({ role: "asst", kind: "timeline" }, 750);
    setPhase("running");
  };

  const handleUserSubmit = (text) => {
    if (phase === "idle") {
      showResearchReco(text);
      return;
    }
    if (phase === "done") {
      replyWithQA(text);
      return;
    }
  };

  const onRunDeliverable = async ({ actionId, state, flavor, instructions }) => {
    if (actionBusy) return;
    const labels = {
      content_engine: "Content & messaging",
      concept_cards: "Concept cards",
      storyboard: "Video ad storyboard",
      positioning: "Positioning",
    };
    push({ role: "user", text: `${labels[actionId] || actionId} · ${flavor} · ${state}` });
    setActionBusy(true);
    push({ role: "asst", kind: "typing", text: `Generating ${labels[actionId] || actionId}…` });
    const ctx = actionContext({ state, flavor, instructions });
    try {
      const payload = await executeAction(actionId, ctx, setTypingText);
      setMessages((ms) => {
        const copy = [...ms];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].kind === "typing") {
            copy[i] = { ...copy[i], kind: "action_result", payload };
            break;
          }
        }
        return copy;
      });
    } catch (err) {
      setMessages((ms) => {
        const copy = [...ms];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].kind === "typing") {
            copy[i] = { ...copy[i], kind: "text", text: `Generation failed: ${err.message}` };
            break;
          }
        }
        return copy;
      });
    } finally {
      setActionBusy(false);
    }
  };

  const onTimelineDone = useCallback(() => {
    if (pipelineDoneRef.current) return;
    pipelineDoneRef.current = true;

    const script = scriptRef.current || activeScript || matchResearchScript(DEFAULT_RESEARCH_PROMPT);
    const scope = params || script.scopeDefaults || { region: "Pan-India", obj: "Product extension" };
    let delay = 250;
    const bump = (ms) => { delay += ms; return delay - ms; };

    pushDelayed({ role: "asst", kind: "text", text: "Pipeline complete. Here's the headline thesis." }, bump(250));
    pushDelayed({ role: "asst", kind: "insight", params: scope, script }, bump(350));
    pushDelayed({ role: "asst", kind: "muted", text: script.muted || "State tables, clusters, charts, and national performance follow." }, bump(500));

    const docSequence = [
      "doc_states",
      "doc_winning",
      "region",
      "doc_cross",
      "sentiment",
      "trend",
      "doc_national",
      "flavour",
      "quotes",
      "doc_actionables",
      "exec",
    ];
    docSequence.forEach((kind) => {
      pushDelayed({ role: "asst", kind, script, params: scope }, bump(420));
    });

    pushDelayed({
      role: "asst",
      kind: "muted",
      text: "Ask a follow-up below, or generate deliverables from the actionables card.",
    }, bump(400));
    setTimeout(() => setPhase("done"), delay + 100);
  }, [activeScript, params]);

  const reset = () => {
    setMessages([]);
    setPhase("idle");
    setParams(null);
    setRunConfig(null);
    setActiveScript(null);
    scriptRef.current = null;
    pipelineDoneRef.current = false;
    setReportOpen(false);
    setActionBusy(false);
    msgIdRef.current = 0;
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (reportOpen) setReportOpen(false);
        if (settingsOpen) setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reportOpen, settingsOpen]);

  const ctx = {
    onDataConfig,
    onAudienceConfig,
    onTimelineDone,
    onOpenReport: () => setReportOpen(true),
    onPickRelated: (q) => handleUserSubmit(q),
    onStartResearch: (q) => startDocPipeline(q),
    onRunDeliverable,
    actionBusy,
  };

  const canPickQuestion = (phase === "idle" && messages.length === 0) || phase === "done";
  const composerLocked = ["reco", "data_config", "audience_config", "running"].includes(phase) || actionBusy;

  return (
    <div className="app">
      <Sidebar
        onNewChat={reset}
        onPickQuestion={canPickQuestion ? handleUserSubmit : undefined}
        activeTitle={activeScript?.title}
      />
      <div className="main">
        <div className="topbar">
          <div className="title">
            <span>{messages.length === 0 ? "New research" : (activeScript?.title || "South snacking pulse")}</span>
            <span className="pill">Run #4821</span>
          </div>
          <div className="topbar-right">
            <span className="credit-pill">credits <b>1,820</b></span>
            <span className="credit-pill" style={{ cursor: "pointer" }} onClick={reset}>↺ restart</span>
          </div>
        </div>

        <div className="thread" ref={threadRef}>
          {messages.length === 0 ? (
            <WelcomeView />
          ) : (
            <div className="thread-inner">
              {messages.map((m, i) => (
                <MessageView key={m.id ?? `msg-fallback-${i}`} m={m} ctx={ctx} />
              ))}
            </div>
          )}
        </div>

        <ComposerInner
          onSubmit={handleUserSubmit}
          disabled={composerLocked}
          placeholder={
            phase === "reco" ? "Start research from the card above…" :
            phase === "data_config" ? "Confirm data configuration above…" :
            phase === "audience_config" ? "Confirm audience above to run research…" :
            phase === "running" ? "Research is running. You'll see updates inline…" :
            phase === "done" ? "Ask a follow-up…" :
            "Ask a research question…"
          }
        />
      </div>
      {reportOpen && <ReportModal params={params || { region: "South" }} script={activeScript} onClose={() => setReportOpen(false)} />}
      <ApiKeySettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        serverConnected={serverBedrock}
        config={bedrockConfig}
      />
      <DetailPanel item={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function ResearchRecoCard({ tag, query, hint, onStart }) {
  return (
    <div className="research-reco-wrap">
      <p className="research-reco-lead">Ready to run the full research pipeline on this?</p>
      <button type="button" className="welcome-hero research-reco-inline" onClick={() => onStart?.(query)}>
        <span className="hero-tag">{tag} · recommended</span>
        <span className="hero-q">{query}</span>
        {hint && <span className="hero-hint">{hint}</span>}
        <span className="hero-cta">Start research →</span>
      </button>
    </div>
  );
}

function WelcomeView() {
  return (
    <div className="welcome welcome-minimal">
      <div className="badge">Flavor Insights India · {BRIT_DATA?.meta?.date || "20 May 2026"}</div>
      <h1>What would you like to <em>discover</em> today?</h1>
      <p className="welcome-sub">
        Ask about flavors, states, extensions, or trends — we'll suggest a study, then you confirm sources and audience.
      </p>
    </div>
  );
}

