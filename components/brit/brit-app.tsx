// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { BRIT_DATA } from '@/lib/data';
import { answerQuestion, wantsFullResearch } from '@/lib/qa';
import { enrichQAAnswer, hasLlmKeyAsync } from '@/lib/llm';
import { runAction as executeAction } from '@/lib/actions';
import { hasApiKey } from '@/lib/config-client';
import {
  ReportModal,
  DetailPanel,
  ApiKeySettings,
  SUGGESTIONS,
  matchResearchScript,
  BootBlock,
  ScopeForm,
  TimelineBlock,
  InsightBlock,
  RegionCard,
  StatesCard,
  ExtensionsCard,
  SentimentCard,
  TrendCard,
  FlavourCard,
  QuotesCard,
  FullSummaryCard,
  ExecBlock,
  ActionsRecommendations,
  ActionResultPanel,
  QAResponse,
} from '@/components/brit/chat-ui';

const DEFAULT_RESEARCH_Q =
  BRIT_DATA?.defaultResearchQuery || "Top flavour trends by state across India";

const getDefaultResearchHero = () => {
  const presets = BRIT_DATA?.predefinedQuestions || SUGGESTIONS;
  const research = presets.filter((p) => p.research !== false);
  return research[0] || { tag: "States", q: DEFAULT_RESEARCH_Q, hint: "11 states · sweet & savory top 5" };
};

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
        {m.kind === "boot"     && <BootBlock onComplete={() => ctx.onBootDone(m.id)} />}
        {m.kind === "scope"    && <ScopeForm defaults={m.defaults} locked={m.locked} onRun={(p) => ctx.onScopeRun(m.id, p)} />}
        {m.kind === "timeline" && <TimelineBlock onDone={() => ctx.onTimelineDone(m.id)} />}
        {m.kind === "insight"  && <InsightBlock params={m.params} script={m.script} />}
        {m.kind === "region"   && <RegionCard script={m.script} />}
        {m.kind === "states"  && <StatesCard />}
        {m.kind === "extensions" && <ExtensionsCard />}
        {m.kind === "sentiment"&& <SentimentCard script={m.script} />}
        {m.kind === "trend"    && <TrendCard script={m.script} />}
        {m.kind === "flavour"  && <FlavourCard script={m.script} />}
        {m.kind === "quotes"   && <QuotesCard script={m.script} />}
        {m.kind === "summary"  && <FullSummaryCard script={m.script} onOpenReport={ctx.onOpenReport} />}
        {m.kind === "exec"     && <ExecBlock script={m.script} onOpenReport={ctx.onOpenReport} />}
        {m.kind === "actions"  && (
          <ActionsRecommendations
            script={m.script}
            params={m.params}
            busy={ctx.actionBusy}
            onAction={ctx.onAction}
            s3Configured={ctx.s3Configured}
          />
        )}
        {m.kind === "action_result" && <ActionResultPanel payload={m.payload} />}
        {m.kind === "qa"       && <QAResponse answer={m.answer} onPickRelated={ctx.onPickRelated} />}
        {m.kind === "research_reco" && (
          <ResearchRecoCard
            tag={m.tag}
            query={m.query}
            hint={m.hint}
            onStart={ctx.onStartResearch}
          />
        )}
      </div>
    </div>
  );
}

function ResearchRecoCard({ tag, query, hint, onStart }) {
  return (
    <div className="research-reco-wrap">
      <p className="research-reco-lead">Ready to go deeper? Run the full research pipeline on this study:</p>
      <button type="button" className="welcome-hero research-reco-inline" onClick={() => onStart(query)}>
        <span className="hero-tag">{tag} · recommended</span>
        <span className="hero-q">{query}</span>
        {hint && <span className="hero-hint">{hint}</span>}
        <span className="hero-cta">Start research →</span>
      </button>
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
  const runActionRef = useRef(null);

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

  const actionContext = () => ({
    script: scriptRef.current || activeScript,
    params: params || scriptRef.current?.scopeDefaults,
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

    if (opts.showResearchReco) {
      const hero = getDefaultResearchHero();
      pushDelayed({
        role: "asst",
        kind: "research_reco",
        tag: hero.tag,
        query: hero.q,
        hint: hero.hint,
      }, 300);
      return;
    }

    pushDelayed({
      role: "asst",
      kind: "actions",
      script: scriptRef.current || activeScript,
      params: params || scriptRef.current?.scopeDefaults,
    }, 300);
  };

  const startResearchPipeline = (text) => {
    const script = matchResearchScript(text);
    scriptRef.current = script;
    setActiveScript(script);
    setMessages([{ role: "user", text, id: nextMsgId() }]);
    pushDelayed({ role: "asst", kind: "text", text: "On it. Spinning up the research engine and parsing your question." }, 280);
    pushDelayed({ role: "asst", kind: "boot" }, 600);
  };

  const handleUserSubmit = (text) => {
    if (phase === "idle") {
      setPhase("qa");
      replyWithQA(text, null, { showResearchReco: true });
      return;
    }

    if (phase === "qa" || phase === "done") {
      if (phase === "qa" && wantsFullResearch?.(text)) {
        startResearchPipeline(text);
        setPhase("idle");
        return;
      }
      replyWithQA(text);
      return;
    }
  };

  const handleAction = async (actionId) => {
    if (actionBusy) return;
    if (!executeAction) {
      push({
        role: "asst",
        kind: "text",
        text: "Actions failed to load. Hard-refresh the page (Cmd+Shift+R).",
      });
      return;
    }
    const ctx = actionContext();
    const labels = {
      concept_cards: "Create",
      create_film: "Create film",
      content_engine: "Shoot to content engine",
      fpd_scout: "Scout for FPD",
      triangulate_1ds: "Triangulate with 1DS",
    };
    const typingStart = {
      concept_cards: "Creating concept cards…",
      create_film: "Creating hero film (Nova Reel)…",
      content_engine: "Preparing content engine handoff…",
      fpd_scout: "Starting FPD scout…",
      triangulate_1ds: "Running 1DS triangulation…",
    };
    push({ role: "user", text: labels[actionId] || `Run: ${actionId}` });
    setActionBusy(true);
    push({ role: "asst", kind: "typing", text: typingStart[actionId] || "Running…" });

    try {
      const payload = await executeAction(actionId, ctx, setTypingText);
      setMessages(ms => {
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
      setMessages(ms => {
        const copy = [...ms];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].kind === "typing") {
            copy[i] = {
              ...copy[i],
              kind: "text",
              text: `Action failed: ${err.message}`,
            };
            break;
          }
        }
        return copy;
      });
    } finally {
      setActionBusy(false);
    }
  };

  runActionRef.current = handleAction;
  useEffect(() => {
    window.__britHandleAction = (actionId) => runActionRef.current?.(actionId);
    return () => {
      delete window.__britHandleAction;
    };
  }, []);

  const onBootDone = () => {
    pushDelayed({ role: "asst", kind: "text", text: "I parsed the question and matched 6 datasets. Confirm a few details and I'll run the full research pipeline." }, 300);
    const script = scriptRef.current || matchResearchScript("");
    pushDelayed({
      role: "asst",
      kind: "scope",
      defaults: script.scopeDefaults,
      script,
    }, 700);
    setTimeout(() => setPhase("scoping"), 720);
  };

  const onScopeRun = (msgId, p) => {
    setParams(p);
    setMessages(ms => ms.map(m => m.id === msgId ? { ...m, locked: true, defaults: p } : m));
    pushDelayed({ role: "user", text: `Run with these settings.` }, 200);
    pushDelayed({ role: "asst", kind: "text", text: "Running consumer research across 6 sources. You'll see the orchestration in real time." }, 500);
    pushDelayed({ role: "asst", kind: "timeline" }, 800);
    setTimeout(() => setPhase("running"), 820);
  };

  const onTimelineDone = () => {
    const script = scriptRef.current || activeScript || matchResearchScript("");
    const scope = params || script.scopeDefaults || { region: "South" };
    let delay = 250;
    const bump = (ms) => { delay += ms; return delay - ms; };

    pushDelayed({ role: "asst", kind: "text", text: "Pipeline complete. Here's the headline." }, bump(250));
    pushDelayed({ role: "asst", kind: "insight", params: scope, script }, bump(350));
    pushDelayed({ role: "asst", kind: "muted", text: script.muted || "Below are the supporting findings." }, bump(900));

    script.cards.forEach((card) => {
      pushDelayed({ role: "asst", kind: card, script, params: scope }, bump(400));
    });

    pushDelayed({ role: "asst", kind: "text", text: "Synthesising executive recommendation:" }, bump(500));
    if (!script.cards.includes("exec")) {
      pushDelayed({ role: "asst", kind: "exec", script }, bump(400));
    }
    pushDelayed({
      role: "asst",
      kind: "actions",
      script,
      params: scope,
    }, bump(350));
    pushDelayed({
      role: "asst",
      kind: "muted",
      text: "Ask a follow-up below, or pick a suggested next step when you're ready.",
    }, bump(500));
    setTimeout(() => setPhase("done"), delay + 100);
  };

  const reset = () => {
    setMessages([]);
    setPhase("idle");
    setParams(null);
    setActiveScript(null);
    scriptRef.current = null;
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
    onBootDone,
    onScopeRun,
    onTimelineDone,
    onOpenReport: () => setReportOpen(true),
    onPickRelated: (q) => handleUserSubmit(q),
    onStartResearch: (q) => startResearchPipeline(q),
    onAction: handleAction,
    actionBusy,
    s3Configured,
  };

  const canPickQuestion = phase === "idle" || phase === "qa" || phase === "done";
  const hasKey = hasApiKey() || serverBedrock;

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
            <span
              className={"credit-pill " + (hasKey ? "key-on" : "")}
              style={{ cursor: "pointer" }}
              onClick={() => setSettingsOpen(true)}
              title={serverBedrock ? "Bedrock connected (.env.local)" : "Add Bedrock API key"}
            >
              {hasKey ? "◆ Bedrock live" : "◇ Add API key"}
            </span>
            <span className="credit-pill"><span className="live-dot"></span> engine live</span>
            <span className="credit-pill">credits <b>1,820</b></span>
            <span className="credit-pill" style={{cursor:'pointer'}} onClick={reset}>↺ restart</span>
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
          disabled={phase === "scoping" || phase === "running" || actionBusy}
          placeholder={
            phase === "scoping" ? "Confirm scope above to continue…" :
            phase === "running" ? "Engine is running. You'll see updates inline…" :
            phase === "done"    ? "Ask a follow-up…" :
            phase === "qa"      ? "Ask a follow-up…" :
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

function WelcomeView() {
  return (
    <div className="welcome welcome-minimal">
      <div className="badge">Flavor Insights India · {BRIT_DATA?.meta?.date || "20 May 2026"}</div>
      <h1>What would you like to <em>discover</em> today?</h1>
      <p className="welcome-sub">
        Ask anything about Flavor Insights India — Biscoff, states, extensions, trends, and more.
      </p>
    </div>
  );
}

