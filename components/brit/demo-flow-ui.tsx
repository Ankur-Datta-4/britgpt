// @ts-nocheck
"use client";

import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import {
  DEFAULT_RESEARCH_PROMPT,
  DEMO_SOURCES,
  DEMO_TIMEFRAMES,
  DEMO_GENERATIONS,
  DEMO_AGE_CATEGORIES,
  DEMO_LIFESTYLES,
  DEMO_CITY_TIERS,
  FIXED_RUN_STATS,
  RRP_TIMELINE_STAGES,
  HERO_THESIS,
  DEMO_STATES,
  NATIONAL_FLAVORS,
  buildFlavorMetrics,
  getStateInsight,
  STATE_WINNING_CLUSTERS,
  CROSS_STATE_INSIGHTS,
  DELIVERABLE_TYPES,
  parsePct,
} from "@/lib/demo-flow-data";
import { openDetail } from "@/components/brit/chat-ui";

/* ── 0️⃣ Data configuration ── */
export const DataConfigForm = ({ locked, defaults, onConfirm }) => {
  const [sources, setSources] = useState(
    defaults?.sources || [...DEMO_SOURCES]
  );
  const [timeframe, setTimeframe] = useState(defaults?.timeframe || "Last 1 Year");
  const [geography, setGeography] = useState(defaults?.geography || "India");
  const [context, setContext] = useState(defaults?.context || "");

  const toggleSource = (s) =>
    setSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  if (locked) {
    return (
      <div className="card demo-config-card">
        <div className="card-h">
          <h3>Data configuration</h3>
          <span className="tag">confirmed</span>
        </div>
        <div className="card-body">
          <div className="scope-chips">
            <span className="chip"><b>Sources:</b> {sources.join(", ")}</span>
            <span className="chip"><b>Time:</b> {timeframe}</span>
            <span className="chip"><b>Geography:</b> {geography}</span>
            {context && <span className="chip"><b>Context:</b> {context}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card demo-config-card">
      <div className="card-h">
        <h3>Data configuration</h3>
        <span className="tag">step 1 of 2</span>
      </div>
      <div className="card-body">
        <div className="scope-form">
          <div className="scope-field">
            <div className="scope-label">Select sources</div>
            <div className="opt-row">
              {DEMO_SOURCES.map((s) => (
                <span
                  key={s}
                  className={"opt " + (sources.includes(s) ? "sel" : "")}
                  onClick={() => toggleSource(s)}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Select time frame</div>
            <div className="opt-row">
              {DEMO_TIMEFRAMES.map((t) => (
                <span
                  key={t}
                  className={"opt " + (timeframe === t ? "sel" : "")}
                  onClick={() => setTimeframe(t)}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Select geography</div>
            <input
              className="scope-input"
              value={geography}
              onChange={(e) => setGeography(e.target.value)}
              placeholder="Country"
            />
          </div>
          <div className="scope-field">
            <div className="scope-label">Provide context <span className="hint">optional</span></div>
            <input
              className="scope-input"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g. focus on biscuit extensions, avoid masala-only plays…"
            />
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div className="note">{sources.length} sources · {timeframe} · {geography}</div>
        <button
          type="button"
          className="btn-primary"
          disabled={sources.length < 1}
          onClick={() => onConfirm({ sources, timeframe, geography, context })}
        >
          Continue to audience
        </button>
      </div>
    </div>
  );
};

/* ── 0️⃣ Audience configuration ── */
export const AudienceConfigForm = ({ locked, defaults, onConfirm }) => {
  const [generations, setGenerations] = useState(defaults?.generations || []);
  const [ages, setAges] = useState(defaults?.ages || []);
  const [lifestyles, setLifestyles] = useState(defaults?.lifestyles || []);
  const [tiers, setTiers] = useState(defaults?.tiers || []);

  const toggle = (list, setList, item) =>
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  if (locked) {
    return (
      <div className="card demo-config-card">
        <div className="card-h">
          <h3>Target audience</h3>
          <span className="tag">confirmed</span>
        </div>
        <div className="card-body">
          <div className="demo-fixed-stats">
            <div><span className="k">Credits</span><span className="v">{FIXED_RUN_STATS.credits}</span></div>
            <div><span className="k">TAT</span><span className="v">{FIXED_RUN_STATS.tat}</span></div>
            <div><span className="k">Data confidence</span><span className="v">{FIXED_RUN_STATS.confidence}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card demo-config-card">
      <div className="card-h">
        <h3>Target audience configuration</h3>
        <span className="tag">step 2 of 2 · optional</span>
      </div>
      <div className="card-body">
        <div className="scope-form">
          <div className="scope-field">
            <div className="scope-label">Age generation <span className="hint">multi-select</span></div>
            <div className="opt-row">
              {DEMO_GENERATIONS.map((g) => (
                <span key={g} className={"opt " + (generations.includes(g) ? "sel" : "")} onClick={() => toggle(generations, setGenerations, g)}>{g}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Age category</div>
            <div className="opt-row">
              {DEMO_AGE_CATEGORIES.map((a) => (
                <span key={a} className={"opt " + (ages.includes(a) ? "sel" : "")} onClick={() => toggle(ages, setAges, a)}>{a}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Lifestyle</div>
            <div className="opt-row">
              {DEMO_LIFESTYLES.map((l) => (
                <span key={l} className={"opt " + (lifestyles.includes(l) ? "sel" : "")} onClick={() => toggle(lifestyles, setLifestyles, l)}>{l}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">City tier</div>
            <div className="opt-row">
              {DEMO_CITY_TIERS.map((t) => (
                <span key={t} className={"opt " + (tiers.includes(t) ? "sel" : "")} onClick={() => toggle(tiers, setTiers, t)}>{t}</span>
              ))}
            </div>
          </div>
          <div className="demo-fixed-stats">
            <div><span className="k">Credits</span><span className="v">{FIXED_RUN_STATS.credits}</span></div>
            <div><span className="k">TAT</span><span className="v">{FIXED_RUN_STATS.tat}</span></div>
            <div><span className="k">Data confidence</span><span className="v">{FIXED_RUN_STATS.confidence}</span></div>
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div className="note">Run will use {FIXED_RUN_STATS.credits} credits · ~{FIXED_RUN_STATS.tat}</div>
        <button type="button" className="btn-primary" onClick={() => onConfirm({ generations, ages, lifestyles, tiers })}>
          Run research
        </button>
      </div>
    </div>
  );
};

/* ── RRP loading timeline ── */
export const RrpTimelineBlock = ({ onDone }) => {
  const stages = RRP_TIMELINE_STAGES;
  const [idx, setIdx] = useState(0);
  const [prog, setProg] = useState(0);
  const [doneAll, setDoneAll] = useState(false);
  const did = useRef(false);

  useEffect(() => {
    if (idx >= stages.length) {
      setDoneAll(true);
      if (!did.current) {
        did.current = true;
        setTimeout(() => onDone?.(), 400);
      }
      return;
    }
    const dur = stages[idx].dur;
    const t0 = Date.now();
    let raf;
    const step = () => {
      const p = Math.min(1, (Date.now() - t0) / dur);
      setProg(p);
      if (p < 1) raf = requestAnimationFrame(step);
      else if (idx + 1 <= stages.length) setIdx(idx + 1);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [idx, stages, onDone]);

  return (
    <div className="card timeline-card">
      <div className="card-h">
        <h3>Running research</h3>
        <span className="tag">{doneAll ? "complete" : "in progress"}</span>
      </div>
      <div className="card-body">
        <ul className="rrp-timeline-list">
          {stages.map((s, i) => {
            const complete = i < idx || doneAll;
            const active = i === idx && !doneAll;
            return (
              <li key={s.id} className={"rrp-step " + (complete ? "done" : "") + (active ? " active" : "")}>
                <span className="rrp-marker">{complete ? "✓" : active ? "◎" : "○"}</span>
                <div className="rrp-step-body">
                  <span className="rrp-step-title">{s.title}</span>
                  <span className="rrp-step-desc">{s.desc}</span>
                  {active && (
                    <div className="rrp-bar">
                      <div className="rrp-bar-fill" style={{ width: `${prog * 100}%` }} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

/* ── 1 Opening thesis ── */
export const HeroThesisCard = () => (
  <div className="card hero-thesis-card">
    <div className="card-body">
      <span className="hero-thesis-eyebrow">Opening thesis · macro shift</span>
      <h2 className="hero-thesis-title">{HERO_THESIS.title}</h2>
      <p className="hero-thesis-body">{HERO_THESIS.body}</p>
    </div>
  </div>
);

/* ── 2 State table expandable ── */
export const StateFlavorTableCard = () => {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="card">
      <div className="card-h">
        <h3>State-by-state flavor deep dives</h3>
        <span className="tag">click arrow · {DEMO_STATES.length} states</span>
      </div>
      <div className="card-body">
        <div className="state-table-wrap">
          <table className="state-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Top 5 sweet</th>
                <th>Top 5 savory</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {DEMO_STATES.map((row, ri) => {
                const isOpen = expanded === row.state;
                const metrics = isOpen
                  ? [
                      ...buildFlavorMetrics(row.state, row.sweet, "Sweet"),
                      ...buildFlavorMetrics(row.state, row.savory, "Savory"),
                    ]
                  : [];
                return (
                  <Fragment key={row.state}>
                    <tr
                      className={"state-table-row " + (isOpen ? "open" : "")}
                      onClick={() => setExpanded(isOpen ? null : row.state)}
                    >
                      <td className="state-table-name">{row.state}</td>
                      <td>{row.sweet.join(", ")}</td>
                      <td>{row.savory.join(", ")}</td>
                      <td className="state-table-expand">{isOpen ? "▾" : "▸"}</td>
                    </tr>
                    {isOpen && (
                      <tr className="state-table-detail-row">
                        <td colSpan={4}>
                          <div className="state-expand-panel">
                            <p className="state-strategic-line">{getStateInsight(row.state)}</p>
                            <p className="state-takeaway"><b>What this means:</b> Anchor launches to {row.sweet[0]} (sweet) and {row.savory[0]} (savory) before nationalizing.</p>
                            <table className="state-metrics-table">
                              <thead>
                                <tr>
                                  <th>Flavor</th>
                                  <th>Type</th>
                                  <th>Conv. volume</th>
                                  <th>Engagement</th>
                                </tr>
                              </thead>
                              <tbody>
                                {metrics.map((m) => (
                                  <tr key={m.flavor + m.type}>
                                    <td>{m.flavor}</td>
                                    <td>{m.type}</td>
                                    <td>{m.conv}</td>
                                    <td>{m.eng}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── 3 Winning flavor clusters ── */
export const StateWinningClustersCard = () => {
  const [open, setOpen] = useState(STATE_WINNING_CLUSTERS[0]?.id);
  return (
    <div className="card">
      <div className="card-h">
        <h3>Key state-wise winning flavors</h3>
        <span className="tag">brand fit clusters</span>
      </div>
      <div className="card-body">
        {STATE_WINNING_CLUSTERS.map((c) => (
          <div key={c.id} className={"win-cluster " + (open === c.id ? "open" : "")}>
            <button type="button" className="win-cluster-head" onClick={() => setOpen(open === c.id ? null : c.id)}>
              <span>{c.label}</span>
              <span>{open === c.id ? "−" : "+"}</span>
            </button>
            {open === c.id && (
              <div className="win-cluster-body">
                <table className="state-metrics-table compact">
                  <thead>
                    <tr><th>Flavor</th><th>Conv.</th><th>Engagement</th></tr>
                  </thead>
                  <tbody>
                    {c.rows.map((r) => (
                      <tr key={r.flavor}><td>{r.flavor}</td><td>{r.conv}</td><td>{r.eng}</td></tr>
                    ))}
                  </tbody>
                </table>
                <p className="win-cluster-insight">{c.insight}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── 4 Cross-state toggles ── */
export const CrossStateInsightsCard = () => {
  const [dim, setDim] = useState("zone");
  const [activeId, setActiveId] = useState(CROSS_STATE_INSIGHTS.zone[0].id);
  const items = CROSS_STATE_INSIGHTS[dim];
  const active = items.find((x) => x.id === activeId) || items[0];

  return (
    <div className="card">
      <div className="card-h">
        <h3>Cross-state insight synthesis</h3>
        <span className="tag">overall flavor reads</span>
      </div>
      <div className="card-body">
        <div className="cross-dim-tabs">
          {[
            { id: "zone", label: "Zone-wise" },
            { id: "weather", label: "Weather / seasonal" },
            { id: "age", label: "Age / demographic" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              className={"cross-dim-btn " + (dim === d.id ? "sel" : "")}
              onClick={() => {
                setDim(d.id);
                setActiveId(CROSS_STATE_INSIGHTS[d.id][0].id);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="cross-chip-row">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={"cross-chip " + (activeId === item.id ? "sel" : "")}
              onClick={() => setActiveId(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="cross-insight-panel">
          <h4>{active.label}</h4>
          <p>{active.insight}</p>
          {active.keyFlavors && <p><b>Key flavors:</b> {active.keyFlavors}</p>}
          {active.peakFlavors && <p><b>Peak flavors:</b> {active.peakFlavors}</p>}
          {active.topFlavors && <p><b>Top flavors:</b> {active.topFlavors}</p>}
          {active.signal && <p className="cross-signal"><b>Opportunity:</b> {active.signal}</p>}
          {active.implication && <p><b>Implication:</b> {active.implication}</p>}
          {active.trial && <p><b>Trial potential:</b> {active.trial}</p>}
        </div>
      </div>
    </div>
  );
};

/* ── 5 National table + 2x2 ── */
export const NationalFlavorSection = () => {
  const top = NATIONAL_FLAVORS.slice(0, 16);
  const matrixFlavors = top.slice(0, 12);

  return (
    <div className="card">
      <div className="card-h">
        <h3>National flavor performance</h3>
        <span className="tag">prioritization matrix</span>
      </div>
      <div className="card-body">
        <div className="matrix-2x2-wrap">
          <div className="matrix-label-y">Conversation growth →</div>
          <div className="matrix-grid">
            <div className="matrix-quad matrix-q-tr"><span className="matrix-q-title">Stars</span></div>
            <div className="matrix-quad matrix-q-br"><span className="matrix-q-title">Engagement leaders</span></div>
            <div className="matrix-quad matrix-q-tl"><span className="matrix-q-title">Emerging</span></div>
            <div className="matrix-quad matrix-q-bl"><span className="matrix-q-title">Niche</span></div>
            {matrixFlavors.map((f) => {
              const cx = parsePct(f.convGrowth);
              const cy = parsePct(f.engGrowth);
              const left = Math.min(92, Math.max(8, (cx / 55) * 100));
              const top = Math.min(88, Math.max(12, 100 - (cy / 70) * 100));
              return (
                <button
                  key={f.name}
                  type="button"
                  className="matrix-dot"
                  style={{ left: `${left}%`, top: `${top}%` }}
                  title={`${f.name}: ${f.convGrowth} conv · ${f.engGrowth} eng`}
                  onClick={() =>
                    openDetail({
                      type: "National flavor",
                      title: f.name,
                      body: `${f.trendType} · ${f.states}. Extensions: ${f.extensions}. Fit: ${f.brandFit}`,
                      source: "Flavor Insights · Section 5",
                    })
                  }
                >
                  {f.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
          <div className="matrix-label-x">Engagement growth →</div>
        </div>

        <div className="national-table-wrap">
          <table className="national-table">
            <thead>
              <tr>
                <th>Flavor</th>
                <th>Conv. growth</th>
                <th>Eng. growth</th>
                <th>Trend</th>
                <th>States popular in</th>
                <th>Extensions</th>
                <th>Brand fit</th>
              </tr>
            </thead>
            <tbody>
              {top.map((f) => (
                <tr
                  key={f.name}
                  className="clickable-row"
                  onClick={() =>
                    openDetail({
                      type: "National flavor",
                      title: f.name,
                      body: f.extensions,
                      facts: [
                        { k: "Conv. growth", v: f.convGrowth },
                        { k: "Eng. growth", v: f.engGrowth },
                        { k: "Trend", v: f.trendType },
                        { k: "States", v: f.states },
                        { k: "Brand fit", v: f.brandFit },
                      ],
                      source: "National prioritization · May 2026",
                    })
                  }
                >
                  <td><b>{f.name}</b></td>
                  <td>{f.convGrowth}</td>
                  <td>{f.engGrowth}</td>
                  <td><span className={"trend-pill trend-" + f.trendType.toLowerCase()}>{f.trendType}</span></td>
                  <td>{f.states}</td>
                  <td>{f.extensions}</td>
                  <td>{f.brandFit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ── 6 State actionables ── */
export const StateActionablesCard = ({ onRunDeliverable, busy }) => {
  const [expandedState, setExpandedState] = useState(null);
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedFlavor, setSelectedFlavor] = useState("Honey Chilli");
  const [instructions, setInstructions] = useState("");

  const stateRow = DEMO_STATES.find((s) => s.state === selectedState);
  const flavorOptions = useMemo(() => {
    if (!stateRow) return ["Honey Chilli"];
    return [...stateRow.sweet, ...stateRow.savory];
  }, [stateRow]);

  useEffect(() => {
    if (!flavorOptions.includes(selectedFlavor)) setSelectedFlavor(flavorOptions[0]);
  }, [selectedState, flavorOptions, selectedFlavor]);

  return (
    <div className="card actionables-card">
      <div className="card-h">
        <h3>Actionables for next steps</h3>
        <span className="tag">state-wise · generate deliverables</span>
      </div>
      <div className="card-body">
        <p className="actionables-lead">
          Generate from insights — select an output type, choose your state and flavor, and generate the deliverable.
        </p>

        <div className="actionables-states-grid">
          {DEMO_STATES.map((s) => (
            <button
              key={s.state}
              type="button"
              className={
                "actionable-state-btn " +
                (expandedState === s.state ? "open" : "") +
                (selectedState === s.state ? " picked" : "")
              }
              onClick={() => {
                setExpandedState(expandedState === s.state ? null : s.state);
                setSelectedState(s.state);
              }}
            >
              <span>{s.state}</span>
              <span className="actionable-plus">{expandedState === s.state ? "−" : "+"}</span>
            </button>
          ))}
        </div>

        {expandedState && (
          <div className="actionable-form">
            <div className="scope-field">
              <div className="scope-label">Select state</div>
              <select
                className="scope-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
              >
                {DEMO_STATES.map((s) => (
                  <option key={s.state} value={s.state}>{s.state}</option>
                ))}
              </select>
            </div>
            <div className="scope-field">
              <div className="scope-label">Select flavor</div>
              <select
                className="scope-select"
                value={selectedFlavor}
                onChange={(e) => setSelectedFlavor(e.target.value)}
              >
                {flavorOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="scope-field">
              <div className="scope-label">Specific instructions <span className="hint">optional</span></div>
              <input
                className="scope-input"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. premium pack, chai-time moment, no health claims…"
              />
            </div>
          </div>
        )}

        <div className="deliverable-grid">
          {DELIVERABLE_TYPES.map((d) => (
            <button
              key={d.id}
              type="button"
              className="deliverable-btn"
              disabled={busy}
              onClick={() =>
                onRunDeliverable?.({
                  deliverableId: d.id,
                  actionId: d.actionId,
                  state: selectedState,
                  flavor: selectedFlavor,
                  instructions,
                })
              }
            >
              <span className="deliverable-label">{d.label}</span>
              <span className="deliverable-sub">{d.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_RESEARCH_PROMPT };
