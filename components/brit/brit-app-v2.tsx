// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { BRIT_DATA } from '@/lib/data';
import { answerQuestion } from '@/lib/qa';
import { enrichQAAnswer, hasLlmKeyAsync } from '@/lib/llm';
import { runAction as executeAction } from '@/lib/actions';
import { getAudienceDefaultsFromCohort } from '@/lib/audience-cohorts';
import { DEMO_SOURCES } from '@/lib/demo-flow-data';
import {
  DEFAULT_RESEARCH_PROMPT,
  DataConfigForm,
  AudienceConfigForm,
  DocCrossStateCard,
  DocActionablesCard,
  DocFlavorMatrixCard,
  DocSimpleStateTableCard,
} from '@/components/brit/doc-flow-cards-v2';
import {
  ReportModal,
  DetailPanel,
  ApiKeySettings,
  SUGGESTIONS,
  RESEARCH_SCRIPTS,
  matchResearchScript,
  TimelineBlock,
  InsightBlock,
  RegionCard,
  SentimentCard,
  TrendCard,
  FlavourCard,
  QuotesCard,
  ExecBlock,
  FilmJobCard,
  ActionResultPanel,
  QAResponse,
} from '@/components/brit/chat-ui';
import { parseFilmProgress } from '@/lib/film-job';
import { isLlmLiveEnabled, toggleLlmLive } from '@/lib/llm-mode';
import {
  createSessionId,
  loadSessionIndex,
  saveSessionIndex,
  deleteSessionFromIndex,
  serializeMessages,
  getSessionTitle,
  isSessionToday,
  formatSessionTime,
} from '@/lib/brit-sessions';
import { exportBriefPdf, exportFullReport, shareText } from '@/lib/brief-export';
import { BritanniaLogo, ConsumaLogo } from '@/components/brit/app-branding';

const restoreScript = (stored) => {
  if (!stored) return null;
  if (stored.id && RESEARCH_SCRIPTS[stored.id]) return RESEARCH_SCRIPTS[stored.id];
  if (stored.title) return matchResearchScript(stored.title);
  return null;
};

const DISABLED_REPORT_MESSAGE_KINDS = new Set(["doc_conv_state", "doc_eng_state"]);

const isDisabledReportMessage = (message) =>
  DISABLED_REPORT_MESSAGE_KINDS.has(message?.kind);

const cleanMessages = (messages = []) =>
  messages.filter((message) => !isDisabledReportMessage(message));

const shouldRenderThreadMessage = (message) =>
  !isDisabledReportMessage(message) &&
  message.kind !== "summary" &&
  message.kind !== "research_reco";

const hydrateMessages = (messages = []) =>
  cleanMessages(messages).map((m) => ({
    ...m,
    script: m.script ? restoreScript(m.script) : m.script,
  }));

const wantsResearchPipeline = (text) => {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return false;
  if (/^(run|start)\s+(full\s+)?research/.test(q)) return true;
  const researchHints =
    /research|flavour|flavor|state|trend|extension|biscuit|sentiment|pan-india|across india|map india|discover|sweet|savory|savoury|honey chilli|gunpowder|podi|gulkand/i;
  if (q.length < 28 && !researchHints.test(q)) return false;
  return researchHints.test(q) || q.length > 55;
};

/* ============================================================
   Sidebar
============================================================ */
const Sidebar = ({
  sessions,
  activeSessionId,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  onPickQuestion,
  canPickQuestion,
}) => {
  const [ctxMenu, setCtxMenu] = useState(null);
  const presets = (BRIT_DATA?.predefinedQuestions || SUGGESTIONS).slice(0, 4);
  const todaySessions = sessions.filter((s) => isSessionToday(s.updatedAt));
  const olderSessions = sessions.filter((s) => !isSessionToday(s.updatedAt));

  useEffect(() => {
    if (!ctxMenu) return undefined;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [ctxMenu]);

  const openCtxMenu = (e, sessionId) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, sessionId });
  };

  const renderSession = (s) => (
    <div
      key={s.id}
      className={"side-item session-item " + (s.id === activeSessionId ? "active" : "")}
      onClick={() => onSelectSession(s.id)}
      onContextMenu={(e) => openCtxMenu(e, s.id)}
      title={`${s.title} · right-click to delete`}
    >
      <span>{s.title}</span>
      <span className="side-time">{formatSessionTime(s.updatedAt)}</span>
      {s.phase === "done" && <span className="badge">done</span>}
    </div>
  );

  return (
    <aside className="sidebar">
      <div className="side-h">
        <div className="brand">
          <BritanniaLogo variant="square" size="md" className="brand-logo" />
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
          {todaySessions.length > 0 ? (
            todaySessions.map(renderSession)
          ) : (
            <div className="side-empty">No sessions yet — start a question below.</div>
          )}
        </div>
        {olderSessions.length > 0 && (
          <div className="side-group">
            <div className="side-label">Earlier</div>
            {olderSessions.map(renderSession)}
          </div>
        )}
        {canPickQuestion && (
          <div className="side-group">
            <div className="side-label">Starters</div>
            {presets.map((p, i) => (
              <div
                key={p.id || `p-${i}`}
                className="side-item"
                onClick={() => onPickQuestion?.(p.q)}
                title={p.q}
              >
                <span>{p.q.length > 42 ? `${p.q.slice(0, 40)}…` : p.q}</span>
              </div>
            ))}
          </div>
        )}
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

      {ctxMenu && (
        <div
          className="side-ctx-menu"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="side-ctx-item side-ctx-danger"
            onClick={() => {
              onDeleteSession?.(ctxMenu.sessionId);
              setCtxMenu(null);
            }}
          >
            Delete session
          </button>
        </div>
      )}
    </aside>
  );
};

/* ============================================================
   Composer
============================================================ */
const ComposerInner = ({ onSubmit, locked, placeholder, onChipAction, sessionKey, threadCount }) => {
  const ta = useRef(null);
  const [text, setText] = useState("");
  const syncHeight = useCallback(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const onDraftInput = useCallback(
    (e) => {
      setText(e.currentTarget.value);
      requestAnimationFrame(syncHeight);
    },
    [syncHeight]
  );

  useEffect(() => {
    setText("");
    if (ta.current) ta.current.style.height = "auto";
  }, [sessionKey]);

  useEffect(() => {
    if (!locked) ta.current?.focus();
  }, [locked]);

  useEffect(() => {
    syncHeight();
  }, [text, syncHeight]);

  useEffect(() => {
    if (threadCount > 0) {
      setText("");
      if (ta.current) ta.current.style.height = "auto";
    }
  }, [threadCount]);

  const send = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (locked) return;
    const txt = (ta.current?.value ?? text).trim();
    if (!txt) return;
    onSubmit(txt);
  };

  const chips = [
    { id: "data", label: "＋ data universe" },
    { id: "brief", label: "＋ attach brief" },
    { id: "compare", label: "＋ compare brands" },
  ];

  return (
    <div className="composer-wrap">
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea
          ref={ta}
          value={text}
          onInput={onDraftInput}
          onChange={onDraftInput}
          placeholder={placeholder || "Ask a consumer research question…"}
          readOnly={locked}
          aria-disabled={locked}
          rows={2}
          aria-label="Research prompt"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-bar">
          <div className="chips">
            {chips.map((c) => (
              <span
                key={c.id}
                className="composer-chip clickable"
                onClick={() => !locked && onChipAction?.(c.id)}
              >
                {c.label}
              </span>
            ))}
          </div>
          <button
            type="submit"
            className={"composer-send " + (locked ? "is-locked" : "is-ready")}
            onClick={send}
            onMouseDown={(e) => e.stopPropagation()}
            title={locked ? "Research is running" : "Send"}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </form>
      <div className="composer-foot">
        <p className="composer-foot-note">
          Brit GPT can make mistakes. Cross-check important findings with your data team ·{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); onChipAction?.("privacy"); }}>privacy</a>
        </p>
        <div className="composer-foot-powered">
          <span className="composer-foot-powered-label">Powered by</span>
          <ConsumaLogo size="sm" className="composer-consuma-logo" />
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   Message renderer
============================================================ */
function MessageView({ m, ctx }) {
  if (isDisabledReportMessage(m)) return null;

  if (m.role === "user") {
    return (
      <div className="msg msg-user">
        <div
          className="bubble clickable"
          title="Click to copy"
          onClick={() => ctx.onCopyText?.(m.text)}
        >
          {m.text}
        </div>
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
        {m.kind === "doc_simple_states" && <DocSimpleStateTableCard />}
        {m.kind === "doc_flavor_matrix" && (
          <DocFlavorMatrixCard onRunDeliverable={ctx.onRunDeliverable} busy={ctx.actionBusy} />
        )}
        {m.kind === "region" && <RegionCard script={m.script} />}
        {m.kind === "doc_cross" && <DocCrossStateCard />}
        {m.kind === "sentiment" && <SentimentCard script={m.script} />}
        {m.kind === "trend" && <TrendCard script={m.script} />}
        {m.kind === "flavour" && <FlavourCard script={m.script} />}
        {m.kind === "quotes" && <QuotesCard script={m.script} />}
        {m.kind === "doc_actionables" && (
          <DocActionablesCard
            onRunDeliverable={ctx.onRunDeliverable}
            busy={ctx.actionBusy}
          />
        )}
        {m.kind === "film_job" && (
          <FilmJobCard job={m} onClick={ctx.onFilmJobClick} />
        )}
        {m.kind === "action_result" && (
          <ActionResultPanel
            payload={m.payload}
            onOpenDetail={ctx.onOpenDetail}
            onRegenerateConcepts={
              m.payload?.type === "concept_cards" && ctx.onRegenerateConcepts
                ? ({ instructions }) =>
                    ctx.onRegenerateConcepts({
                      messageId: m.id,
                      instructions,
                      flavor: m.payload.flavor,
                      state: m.payload.state,
                      brandFit: m.payload.brandFit,
                      priorInstructions: m.payload.instructions,
                    })
                : undefined
            }
            regenerating={m.regenerating}
            regenProgress={m.regenProgress}
            actionBusy={ctx.actionBusy}
          />
        )}
        {m.kind === "qa" && <QAResponse answer={m.answer} onPickRelated={ctx.onPickRelated} />}
        {m.kind === "workflow_select" && (
          <WorkflowSelectorCard
            query={m.query}
            onProceed={(workflowId) => ctx.onWorkflowProceed(m.query, workflowId)}
          />
        )}
        {m.kind === "research_reco" && (
          <ResearchRecoCard tag={m.tag} query={m.query} hint={m.hint} onStart={ctx.onStartResearch} />
        )}
        {m.kind === "exec" && (
          <ExecBlock
            script={m.script}
            onOpenReport={ctx.onOpenReport}
            onExportBrief={ctx.onExportBrief}
            onShareBrief={ctx.onShareBrief}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Main app
============================================================ */
export default function BritAppV2() {
  const msgIdRef = useRef(0);
  const nextMsgId = () => {
    msgIdRef.current += 1;
    return `msg-${msgIdRef.current}`;
  };

  const [sessionId, setSessionId] = useState(() => createSessionId());
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [phase, setPhase] = useState("idle");
  const [audienceCohort, setAudienceCohort] = useState("millennials");
  const [params, setParams] = useState(null);
  const [runConfig, setRunConfig] = useState(null);
  const [activeScript, setActiveScript] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [llmLiveOn, setLlmLiveOn] = useState(false);
  const [filmBusy, setFilmBusy] = useState(false);
  const [serverBedrock, setServerBedrock] = useState(false);
  const [s3Configured, setS3Configured] = useState(false);
  const [bedrockConfig, setBedrockConfig] = useState(null);
  const threadRef = useRef(null);
  const scriptRef = useRef(null);
  const messagesRef = useRef([]);
  const phaseRef = useRef("idle");
  const pipelineDoneRef = useRef(false);
  const persistSkipRef = useRef(true);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const visible = messages.filter(shouldRenderThreadMessage);
    if (visible.length === 0) {
      if (phase === "running") setPhase("idle");
      setActionBusy(false);
      setFilmBusy(false);
      if (messages.length === 0) pipelineDoneRef.current = false;
    } else if (messages.length === 0 && phase !== "idle") {
      setPhase("idle");
      setActionBusy(false);
      setFilmBusy(false);
      pipelineDoneRef.current = false;
    }
  }, [messages, phase]);

  const showToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    const onHandoff = (e) => {
      const { target, flavor, state } = e.detail || {};
      const bits = [target, flavor, state].filter(Boolean);
      showToast(bits.length ? `Sent to ${bits.join(" · ")}` : "Sent for handoff");
    };
    window.addEventListener("brit-handoff", onHandoff);
    return () => window.removeEventListener("brit-handoff", onHandoff);
  }, [showToast]);

  const syncMessagesRef = useCallback((next) => {
    messagesRef.current = cleanMessages(Array.isArray(next) ? next : []);
  }, []);

  useEffect(() => {
    syncMessagesRef(messages);
  }, [messages, syncMessagesRef]);

  useEffect(() => {
    setSessions(loadSessionIndex());
    setLlmLiveOn(isLlmLiveEnabled());
  }, []);

  const flushSessionSave = useCallback(() => {
    const sessionMessages = cleanMessages(messages);
    if (sessionMessages.length === 0) return;
    const script = scriptRef.current || activeScript;
    const title = getSessionTitle(sessionMessages, script);
    const snapshot = {
      id: sessionId,
      title,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      phase,
      messages: serializeMessages(sessionMessages),
      params,
      runConfig,
      scriptId: script?.id || null,
      scriptTitle: script?.title || null,
      msgIdCounter: msgIdRef.current,
      pipelineDone: pipelineDoneRef.current,
    };
    setSessions((prev) => {
      const list = [...prev];
      const idx = list.findIndex((s) => s.id === sessionId);
      if (idx >= 0) {
        snapshot.createdAt = list[idx].createdAt;
        list[idx] = snapshot;
      } else {
        list.unshift(snapshot);
      }
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      saveSessionIndex(list);
      return list;
    });
  }, [sessionId, messages, phase, params, runConfig, activeScript]);

  const persistCurrentSession = useCallback(() => {
    const sessionMessages = cleanMessages(messages);
    if (persistSkipRef.current || sessionMessages.length === 0) return;
    const script = scriptRef.current || activeScript;
    const title = getSessionTitle(sessionMessages, script);
    const snapshot = {
      id: sessionId,
      title,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      phase,
      messages: serializeMessages(sessionMessages),
      params,
      runConfig,
      scriptId: script?.id || null,
      scriptTitle: script?.title || null,
      msgIdCounter: msgIdRef.current,
      pipelineDone: pipelineDoneRef.current,
    };

    setSessions((prev) => {
      const list = [...prev];
      const idx = list.findIndex((s) => s.id === sessionId);
      if (idx >= 0) {
        snapshot.createdAt = list[idx].createdAt;
        list[idx] = snapshot;
      } else {
        list.unshift(snapshot);
      }
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      saveSessionIndex(list);
      return list;
    });
  }, [sessionId, messages, phase, params, runConfig, activeScript]);

  useEffect(() => {
    const t = setTimeout(persistCurrentSession, 400);
    return () => clearTimeout(t);
  }, [persistCurrentSession]);

  const applySession = useCallback((snap) => {
    if (!snap) return;
    persistSkipRef.current = true;
    const script = restoreScript({ id: snap.scriptId, title: snap.scriptTitle });
    scriptRef.current = script;
    setSessionId(snap.id);
    const hydrated = hydrateMessages(snap.messages || []);
    syncMessagesRef(hydrated);
    setMessages(hydrated);
    const restoredPhase = snap.phase === "reco" ? "done" : (snap.phase || "idle");
    setPhase(restoredPhase);
    setParams(snap.params || null);
    setRunConfig(snap.runConfig || null);
    setAudienceCohort(snap.runConfig?.audience?.cohortId || "millennials");
    setActiveScript(script);
    msgIdRef.current = snap.msgIdCounter || 0;
    pipelineDoneRef.current = !!snap.pipelineDone;
    setReportOpen(false);
    setActionBusy(false);
    setFilmBusy(false);
    setTimeout(() => { persistSkipRef.current = false; }, 50);
  }, [syncMessagesRef]);

  const loadSession = useCallback((id) => {
    const list = loadSessionIndex();
    const snap = list.find((s) => s.id === id);
    if (snap) {
      setSessions(list);
      applySession(snap);
      showToast(`Restored · ${snap.title}`);
    }
  }, [applySession, showToast]);

  const clearToNewSession = useCallback(() => {
    persistSkipRef.current = true;
    setSessionId(createSessionId());
    syncMessagesRef([]);
    setMessages([]);
    setPhase("idle");
    setAudienceCohort("millennials");
    setParams(null);
    setRunConfig(null);
    setActiveScript(null);
    scriptRef.current = null;
    pipelineDoneRef.current = false;
    setReportOpen(false);
    setActionBusy(false);
    setFilmBusy(false);
    msgIdRef.current = 0;
    setTimeout(() => { persistSkipRef.current = false; }, 50);
  }, []);

  const deleteSession = useCallback((id) => {
    const list = deleteSessionFromIndex(id);
    setSessions(list);
    if (sessionId === id) {
      clearToNewSession();
    }
    showToast("Session deleted");
  }, [sessionId, clearToNewSession, showToast]);

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

  const push = (m) => {
    if (isDisabledReportMessage(m)) return;
    setMessages((ms) => {
      const next = [...ms, { ...m, id: m.id || nextMsgId() }];
      syncMessagesRef(next);
      return next;
    });
  };
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
    pushDelayed({ role: "asst", kind: "typing", text: "Searching Britannia consumer signals…" }, intro ? 450 : 280);
    await new Promise((r) => setTimeout(r, intro ? 700 : 500));

    let answer = answerFromDataset(text);
    const liveLlm = await hasLlmKeyAsync();
    if (liveLlm) {
      setTypingText("Refining answer…");
      try {
        answer = await enrichQAAnswer(text, answer);
      } catch {
        setTypingText("Using dataset answer…");
      }
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

  const startDocPipeline = (text) => {
    const prompt = (text?.trim() || DEFAULT_RESEARCH_PROMPT);
    const script = matchResearchScript(prompt);
    scriptRef.current = script;
    setActiveScript(script);
    setParams({ region: "Pan-India", obj: "Product extension" });
    setPhase("data_config");

    const hasUser = messages.some(
      (m) => m.role === "user" && m.text?.trim() === prompt
    );
    if (!hasUser) {
      push({ role: "user", text: prompt });
    }

    pushDelayed({
      role: "asst",
      kind: "text",
      text: "Confirm your sources and audience below — then we'll pull your insights.",
    }, 280);
    pushDelayed({ role: "asst", kind: "data_config", defaults: { geography: "India" } }, 550);
  };

  const startWorkflowSelect = (text) => {
    const prompt = (text?.trim() || DEFAULT_RESEARCH_PROMPT);
    const script = matchResearchScript(prompt);
    scriptRef.current = script;
    setActiveScript(script);
    setParams({ region: "Pan-India", obj: "Product extension" });
    setPhase("workflow_select");

    const hasUser = messages.some(
      (m) => m.role === "user" && m.text?.trim() === prompt
    );
    if (!hasUser) {
      push({ role: "user", text: prompt });
    }

    pushDelayed({ role: "asst", kind: "workflow_select", query: prompt }, 350);
  };

  const onWorkflowProceed = (query, workflowId) => {
    if (phaseRef.current !== "workflow_select") return;
    const workflow = WORKFLOW_OPTIONS.find((w) => w.id === workflowId);
    if (workflow) {
      setRunConfig((c) => ({ ...c, workflowId: workflow.id, workflowLabel: workflow.label }));
    }
    startDocPipeline(query);
  };

  const onDataConfig = (msgId, dataConfig) => {
    setRunConfig((c) => ({ ...c, dataConfig }));
    setMessages((ms) => ms.map((m) => (m.id === msgId ? { ...m, locked: true, defaults: dataConfig } : m)));
    pushDelayed({
      role: "asst",
      kind: "audience_config",
      defaults: getAudienceDefaultsFromCohort(audienceCohort),
    }, 350);
    setPhase("audience_config");
  };

  const onAudienceConfig = (msgId, audience) => {
    if (audience?.cohortId) setAudienceCohort(audience.cohortId);
    const full = { ...(runConfig || {}), audience };
    setRunConfig(full);
    setMessages((ms) => ms.map((m) => (m.id === msgId ? { ...m, locked: true, defaults: audience } : m)));
    pushDelayed({ role: "user", text: "Run research with these settings." }, 200);
    pushDelayed({ role: "asst", kind: "timeline" }, 450);
    setPhase("running");
  };

  const handleUserSubmit = async (text) => {
    const q = text?.trim();
    if (!q) return;

    const visible = messages.filter(shouldRenderThreadMessage);
    if (visible.length === 0) {
      startWorkflowSelect(q);
      return;
    }

    const currentPhase = phase;
    const hasMessages = messages.length > 0;

    if (currentPhase === "running") {
      showToast("Research is still in progress — hang tight.");
      return;
    }
    if (actionBusy || filmBusy) {
      showToast("Finishing another task — try again in a moment.");
      return;
    }

    if (currentPhase === "data_config" || currentPhase === "audience_config") {
      showToast("Confirm the configuration card above, then continue.");
      return;
    }

    if (currentPhase === "workflow_select") {
      showToast("Click a workflow card above to continue.");
      return;
    }

    if (!hasMessages || currentPhase === "idle" || currentPhase === "reco") {
      startWorkflowSelect(q);
      return;
    }

    if (currentPhase === "done") {
      if (wantsResearchPipeline(q)) {
        startWorkflowSelect(q);
        return;
      }
      await replyWithQA(q);
      return;
    }

    startWorkflowSelect(q);
  };

  const updateFilmJob = useCallback((jobId, patch) => {
    setMessages((ms) => ms.map((m) => (m.id === jobId ? { ...m, ...patch } : m)));
  }, []);

  const runFilmAsync = useCallback(({ state, flavor, instructions }) => {
    const jobId = nextMsgId();
    push({ role: "user", text: `Create film · ${flavor} · ${state}` });
    push({
      role: "asst",
      id: jobId,
      kind: "film_job",
      status: "queued",
      progress: 4,
      progressText: "Starting…",
      state,
      flavor,
    });
    setFilmBusy(true);

    const ctx = actionContext({ state, flavor, instructions });

    (async () => {
      try {
        const payload = await executeAction("create_film", ctx, (text) => {
          const pct = parseFilmProgress(text);
          updateFilmJob(jobId, {
            status: "rendering",
            progressText: text,
            progress: pct ?? undefined,
          });
        });
        updateFilmJob(jobId, {
          kind: "action_result",
          payload,
          status: "done",
          progress: 100,
          progressText: payload?.message || "Film ready",
        });
        showToast(payload?.mode === "preview" ? "Demo storyboard ready" : "Hero film ready — click to view");
      } catch {
        updateFilmJob(jobId, {
          kind: "action_result",
          status: "failed",
          payload: {
            type: "create_film",
            mode: "failed",
            message: "Film could not be generated. Try again.",
          },
        });
        showToast("Film generation failed");
      } finally {
        setFilmBusy(false);
      }
    })();
  }, [actionContext, updateFilmJob, showToast]);

  const onRunDeliverable = async ({ actionId, state, flavor, brandFit, instructions }) => {
    if (actionId === "create_film") {
      if (filmBusy) return;
      runFilmAsync({ state, flavor, instructions });
      return;
    }
    if (actionBusy) return;
    const labels = {
      concept_cards: "Concept cards",
      storyboard: "Video ad storyboard",
      creative_brief: "Creative brief",
      content_engine: "Creative brief",
      positioning: "Creative brief",
    };
    push({ role: "user", text: `${labels[actionId] || actionId} · ${flavor} · ${state}` });
    setActionBusy(true);
    push({ role: "asst", kind: "typing", text: `Generating ${labels[actionId] || actionId}…` });
    const ctx = actionContext({ state, flavor, brandFit, instructions });
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
    } catch {
      setMessages((ms) => {
        const copy = [...ms];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].kind === "typing") {
            copy[i] = { ...copy[i], kind: "text", text: "Generation failed. Try again in a moment." };
            break;
          }
        }
        return copy;
      });
    } finally {
      setActionBusy(false);
    }
  };

  const onRegenerateConcepts = useCallback(
    async ({ messageId, instructions, flavor, state, brandFit, priorInstructions }) => {
      if (actionBusy || !messageId || !instructions?.trim()) return;
      const merged = priorInstructions?.trim()
        ? `${priorInstructions.trim()}\n\nRegeneration edits:\n${instructions.trim()}`
        : instructions.trim();

      push({
        role: "user",
        text: `Regenerate concept cards · ${flavor || "flavor"} · ${state || "India"}`,
      });
      setActionBusy(true);
      setMessages((ms) =>
        ms.map((m) =>
          m.id === messageId
            ? { ...m, regenerating: true, regenProgress: "Regenerating concept cards…" }
            : m
        )
      );

      const ctx = actionContext({ state, flavor, brandFit, instructions: merged });
      try {
        const payload = await executeAction("concept_cards", ctx, (text) => {
          setMessages((ms) =>
            ms.map((m) => (m.id === messageId ? { ...m, regenProgress: text } : m))
          );
        });
        setMessages((ms) =>
          ms.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  kind: "action_result",
                  payload: {
                    ...payload,
                    brandFit: brandFit || payload.brandFit,
                    instructions: merged,
                  },
                  regenerating: false,
                  regenProgress: undefined,
                }
              : m
          )
        );
        showToast("Concept cards regenerated");
      } catch {
        setMessages((ms) =>
          ms.map((m) =>
            m.id === messageId ? { ...m, regenerating: false, regenProgress: undefined } : m
          )
        );
        showToast("Regeneration failed — try again");
      } finally {
        setActionBusy(false);
      }
    },
    [actionBusy, actionContext, push, showToast]
  );

  const onFilmJobClick = useCallback((job) => {
    if (job.kind === "action_result" && job.payload) {
      setDetail({
        type: "Hero film",
        title: job.flavor || job.payload.productName,
        subtitle: job.state,
        body: job.payload.message,
        facts: job.payload.storyboard?.map((s) => ({ k: `Scene ${s.beat}`, v: s.text })),
        source: job.payload.mode === "preview" ? "Demo" : "Film output",
      });
      return;
    }
    setDetail({
      type: "Film render",
      title: `${job.flavor} · ${job.state}`,
      body: job.progressText || "Creating in the background. You can keep chatting or run other actions.",
      facts: [{ k: "Progress", v: `${job.progress || 0}%` }],
      source: "Brit GPT · async film",
    });
  }, []);

  const onTimelineDone = useCallback(() => {
    if (pipelineDoneRef.current) return;
    if (messagesRef.current.some((m) => m.kind === "exec" || m.kind === "doc_flavor_matrix")) {
      pipelineDoneRef.current = true;
      return;
    }
    pipelineDoneRef.current = true;

    const script = scriptRef.current || activeScript || matchResearchScript(DEFAULT_RESEARCH_PROMPT);
    const scope = params || script.scopeDefaults || { region: "Pan-India", obj: "Product extension" };
    let delay = 250;
    const bump = (ms) => { delay += ms; return delay - ms; };

    pushDelayed({ role: "asst", kind: "insight", params: scope, script }, bump(250));

    const docSequence = [
      "doc_simple_states",
      "doc_flavor_matrix",
      "doc_cross",
    ];
    docSequence.forEach((kind) => {
      pushDelayed({ role: "asst", kind, script, params: scope }, bump(1200));
    });

    setTimeout(() => setPhase("done"), delay + 100);
  }, [activeScript, params]);

  const reset = () => {
    flushSessionSave();
    persistSkipRef.current = true;
    const newId = createSessionId();
    setSessionId(newId);
    syncMessagesRef([]);
    setMessages([]);
    setPhase("idle");
    setAudienceCohort("millennials");
    setParams(null);
    setRunConfig(null);
    setActiveScript(null);
    scriptRef.current = null;
    pipelineDoneRef.current = false;
    setReportOpen(false);
    setActionBusy(false);
    setFilmBusy(false);
    msgIdRef.current = 0;
    setTimeout(() => { persistSkipRef.current = false; }, 50);
    showToast("New research session");
  };

  useEffect(() => {
    persistSkipRef.current = false;
  }, []);

  const sessionScript = () => scriptRef.current || activeScript;

  const handleExportBrief = useCallback(() => {
    try {
      exportBriefPdf({ script: sessionScript(), params, messages });
      showToast("Brief downloaded — open or print to PDF");
    } catch (e) {
      showToast(e.message || "Export failed");
    }
  }, [activeScript, params, messages, showToast]);

  const handleShareBrief = useCallback(async () => {
    try {
      const script = sessionScript();
      const text = [
        script?.title || "Brit GPT research",
        script?.exec?.h2,
        script?.exec?.p,
        "",
        "— Shared from Brit GPT · Flavor Insights India",
      ].filter(Boolean).join("\n");
      const mode = await shareText({ title: script?.title, text });
      showToast(mode === "shared" ? "Shared with your team" : "Link copied to clipboard");
    } catch (e) {
      showToast(e.message || "Could not share");
    }
  }, [activeScript, showToast]);

  const handleDownloadReport = useCallback(() => {
    try {
      exportFullReport({ script: sessionScript(), params });
      showToast("Full report downloaded");
    } catch (e) {
      showToast(e.message || "Download failed");
    }
  }, [activeScript, params, showToast]);

  const handleChipAction = useCallback((chipId) => {
    if (chipId === "data") {
      if (phase === "idle" && messages.length === 0) {
        showToast("Start a question first — data config appears in the flow");
        return;
      }
      if (phase === "data_config") showToast("Confirm sources in the card above");
      else showToast(`Data universe: ${DEMO_SOURCES.length} sources · India · last 12 months`);
      return;
    }
    if (chipId === "brief") {
      handleExportBrief();
      return;
    }
    if (chipId === "compare") {
      setDetail({
        type: "Compare brands",
        title: "Britannia vs category",
        body: "Compare mode: Honey Chilli (national sweet-heat) vs Gunpowder Podi (South savory). Use state tables and national matrix in this run for side-by-side signals.",
        source: "Flavor Insights India",
      });
      return;
    }
    if (chipId === "privacy") {
      setDetail({
        type: "Privacy",
        title: "Data & privacy",
        body: "Sessions are stored locally in your browser only. Research draws on Flavor Insights India conversation data. Do not paste personal information into prompts.",
        source: "Brit GPT",
      });
    }
  }, [phase, messages.length, showToast, handleExportBrief]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (reportOpen) setReportOpen(false);
        if (settingsOpen) setSettingsOpen(false);
        if (detail) setDetail(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setLlmLiveOn(toggleLlmLive());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reportOpen, settingsOpen, detail]);

  const ctx = {
    onDataConfig,
    onAudienceConfig,
    onTimelineDone,
    onOpenReport: () => setReportOpen(true),
    onExportBrief: handleExportBrief,
    onShareBrief: handleShareBrief,
    onPickRelated: (q) => handleUserSubmit(q),
    onStartResearch: (q) => startDocPipeline(q),
    onWorkflowProceed,
    onRunDeliverable,
    onRegenerateConcepts,
    onFilmJobClick,
    onOpenDetail: (item) => setDetail(item),
    filmBusy,
    onCopyText: async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard");
      } catch {
        showToast("Could not copy");
      }
    },
    actionBusy,
  };

  const visibleMessages = messages.filter(shouldRenderThreadMessage);
  const onWelcome = visibleMessages.length === 0;
  const canPickQuestion = (phase === "idle" && onWelcome) || phase === "done";
  const hasActiveTimeline = visibleMessages.some((m) => m.kind === "timeline");
  const composerLocked = phase === "running" && hasActiveTimeline;

  return (
    <div className="app">
      <Sidebar
        sessions={sessions}
        activeSessionId={sessionId}
        onNewChat={reset}
        onSelectSession={loadSession}
        onDeleteSession={deleteSession}
        onPickQuestion={canPickQuestion ? handleUserSubmit : undefined}
        canPickQuestion={canPickQuestion && visibleMessages.length === 0}
      />
      <div className="main">
        <div className="topbar">
          <div className="title">
            <span>{visibleMessages.length === 0 ? "New research" : (activeScript?.title || "South snacking pulse")}</span>
            <span className="pill">Run #4821</span>
          </div>
          <div className="topbar-right">
            {llmLiveOn && (
              <span className="engine-mode-dot" title="Live search on (⌃⇧L to toggle)" />
            )}
            <span className="credit-pill">credits <b>1,820</b></span>
          </div>
        </div>

        <div className="thread" ref={threadRef}>
          {visibleMessages.length === 0 ? (
            <WelcomeView />
          ) : (
            <div className="thread-inner">
              {visibleMessages.map((m, i) => (
                  <MessageView key={m.id ?? `msg-fallback-${i}`} m={m} ctx={ctx} />
                ))}
            </div>
          )}
        </div>

        <ComposerInner
          sessionKey={sessionId}
          threadCount={visibleMessages.length}
          onSubmit={handleUserSubmit}
          onChipAction={handleChipAction}
          locked={composerLocked}
          placeholder={
            phase === "workflow_select" ? "Enable a workflow above, then proceed to data configuration…" :
            phase === "data_config" ? "Confirm data configuration above…" :
            phase === "audience_config" ? "Confirm audience above to run research…" :
            phase === "running" ? "Research is running. You'll see updates inline…" :
            phase === "done" ? "Ask a follow-up…" :
            "Ask anything — or describe a full research study…"
          }
        />
      </div>
      {reportOpen && (
        <ReportModal
          params={params || { region: "Pan-India" }}
          script={activeScript}
          onClose={() => setReportOpen(false)}
          onDownloadBrief={handleDownloadReport}
          onShareBrief={handleShareBrief}
        />
      )}
      {toast && <div className="brit-toast">{toast}</div>}
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

const WF_ICONS = {
  trendspotting: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l5-5 4 4 7-7" />
      <path d="M16 6h5v5" />
    </svg>
  ),
  hypothesis: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 3h6" />
      <path d="M10 3v6l-5 9a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18l-5-9V3" />
      <path d="M7.5 14h9" />
    </svg>
  ),
  consumer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 3.5a3 3 0 0 1 0 5.8" />
      <path d="M21 20c0-2.5-1.4-4.6-3.5-5.6" />
    </svg>
  ),
  category: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
};

const WORKFLOW_OPTIONS = [
  {
    id: "trendspotting",
    label: "Trendspotting for innovation",
    keywords: /trend|emerging|innovat|new\b|future|spot|discover|shaping|whitespace|opportunit/i,
    description:
      "The output will provide a comprehensive view of various flavor trends across India, consumer voice excerpts, and an emotional and functional analysis of each trend — along with FPD recommendations to guide product development.",
  },
  {
    id: "hypothesis",
    label: "Hypothesis testing",
    keywords: /hypothes|\btest\b|validate|prove|assumption|experiment|does\b|will\b|impact of/i,
    description:
      "Validate a specific assumption against consumer signals — surfacing supporting and contradicting evidence, with a confidence read to back your decision.",
  },
  {
    id: "consumer",
    label: "Consumer understanding study",
    keywords: /consumer|understand|behaviou?r|need|persona|audience|who\b|motivation|occasion/i,
    description:
      "Build a deep profile of the target consumer — needs, occasions, motivations, and barriers — read across cohorts and regions.",
  },
  {
    id: "category",
    label: "Category analysis",
    keywords: /categor|market|landscape|competit|segment|share|players|benchmark/i,
    description:
      "Map the category landscape — segments, key players, white spaces, and momentum — to frame where to play and how to win.",
  },
];

const recommendWorkflowId = (query) => {
  const q = String(query || "");
  const match = WORKFLOW_OPTIONS.find((w) => w.keywords.test(q));
  return match?.id || "trendspotting";
};

function WorkflowSelectorCard({ query, onProceed }) {
  const recommendedId = recommendWorkflowId(query);
  const [workflowId, setWorkflowId] = useState(recommendedId);
  const [enabled, setEnabled] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [proceeded, setProceeded] = useState(false);

  const active =
    WORKFLOW_OPTIONS.find((w) => w.id === workflowId) || WORKFLOW_OPTIONS[0];
  const alternates = WORKFLOW_OPTIONS.filter((w) => w.id !== workflowId);
  const isRecommended = workflowId === recommendedId;

  const pickWorkflow = (id) => {
    setWorkflowId(id);
    setEnabled(false);
    setProceeded(false);
  };

  return (
    <div className="workflow-panel">
      <p className="workflow-panel__head">
        I found a workflow that fits your query well. Would you like to enable it?
      </p>

      <div className="workflow-panel__query">
        <svg className="workflow-panel__query-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <span>{query}</span>
      </div>

      <div className="workflow-panel__label">
        {isRecommended ? "Suggested workflow" : "Selected workflow"}
        {isRecommended && <span className="workflow-panel__rec-tag">Best match</span>}
      </div>

      <div className={"workflow-card " + (enabled ? "workflow-card--selected" : "")}>
        <span className="workflow-card__icon">{WF_ICONS[active.id]}</span>
        <span className="workflow-card__title">{active.label}</span>
        {enabled ? (
          <span className="workflow-card__badge">Selected</span>
        ) : (
          <button type="button" className="workflow-card__enable" onClick={() => setEnabled(true)}>
            Enable
          </button>
        )}
      </div>

      {enabled && (
        <div className="workflow-confirm">
          <div className="workflow-confirm__head">
            <svg className="workflow-confirm__check" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.2-3.5-3.5 1.4-1.4 2.1 2.1 4.8-4.8 1.4 1.4-6.2 6.2z" />
            </svg>
            <b>{active.label} selected</b>
          </div>
          <p className="workflow-confirm__desc">{active.description}</p>
          <button
            type="button"
            className="workflow-confirm__cta"
            disabled={proceeded}
            onClick={() => {
              setProceeded(true);
              onProceed?.(active.id);
            }}
          >
            <span aria-hidden>→</span> Proceed to data configuration
          </button>
        </div>
      )}

      <button
        type="button"
        className="workflow-panel__more"
        onClick={() => setShowMore((v) => !v)}
        aria-expanded={showMore}
      >
        {showMore ? "Show fewer workflows" : "Show more workflows"}
        <span className={"workflow-panel__more-chev " + (showMore ? "open" : "")} aria-hidden>▾</span>
      </button>

      {showMore && (
        <div className="workflow-secondary" role="list">
          {alternates.map((w) => (
            <button
              key={w.id}
              type="button"
              role="listitem"
              className="workflow-secondary__item"
              onClick={() => pickWorkflow(w.id)}
            >
              <span className="workflow-secondary__icon">{WF_ICONS[w.id]}</span>
              <span className="workflow-secondary__label">{w.label}</span>
              {w.id === recommendedId && (
                <span className="workflow-secondary__rec">Suggested</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResearchRecoCard({ tag, query, hint, onStart }) {
  return (
    <div className="research-reco-wrap">
      <p className="research-reco-lead">Ready to run full research on this?</p>
      <button type="button" className="welcome-hero research-reco-inline" onClick={() => onStart?.(query)}>
        <span className="hero-tag">{tag} · recommended</span>
        <span className="hero-q">{query}</span>
        {hint && <span className="hero-hint">{hint}</span>}
        <span className="hero-cta">Start research →</span>
      </button>
    </div>
  );
}

const WelcomeView = () => (
  <div className="welcome welcome-minimal">
    <div className="welcome-brand-stack">
      <BritanniaLogo size="lg" className="welcome-britannia" />
    </div>
    <div className="badge">Consumer research · India</div>
    <h1>What would you like to <em>discover</em> today?</h1>
    <p className="welcome-sub">
      Describe your study in the box below — we&apos;ll configure sources and run your research.
    </p>
  </div>
);
