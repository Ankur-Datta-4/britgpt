// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { NationalScatterChart } from "@/components/brit/brit-charts";
import {
  DEFAULT_RESEARCH_PROMPT,
  DEMO_SOURCES,
  DEMO_TIMEFRAMES,
  DEMO_GENERATIONS,
  DEMO_AGE_CATEGORIES,
  DEMO_LIFESTYLES,
  DEMO_CITY_TIERS,
  FIXED_RUN_STATS,
  DEMO_STATES,
  NATIONAL_FLAVORS,
  buildFlavorMetrics,
  getStateInsight,
  STATE_WINNING_CLUSTERS,
  CROSS_STATE_INSIGHTS,
  DELIVERABLE_TYPES,
  parsePct,
} from "@/lib/demo-flow-data";

const openDetail = (item) => {
  window.dispatchEvent(new CustomEvent("brit-detail", { detail: item }));
};

/* ── Doc flow forms (same UI as ScopeForm) ── */
export const DataConfigForm = ({ locked, defaults, onConfirm }) => {
  const [sources, setSources] = useState(defaults?.sources || [...DEMO_SOURCES]);
  const [timeframe, setTimeframe] = useState(defaults?.timeframe || "Last 1 Year");
  const [geography, setGeography] = useState(defaults?.geography || "India");
  const [context, setContext] = useState(defaults?.context || "");

  const toggleSource = (s) =>
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  if (locked) {
    return (
      <div className="card">
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
    <div className="card">
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
                <span key={s} className={"opt " + (sources.includes(s) ? "sel" : "")} onClick={() => toggleSource(s)}>{s}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Select time frame</div>
            <div className="opt-row">
              {DEMO_TIMEFRAMES.map((t) => (
                <span key={t} className={"opt " + (timeframe === t ? "sel" : "")} onClick={() => setTimeframe(t)}>{t}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Select geography</div>
            <input className="scope-input" value={geography} onChange={(e) => setGeography(e.target.value)} placeholder="Country" />
          </div>
          <div className="scope-field">
            <div className="scope-label">Provide context <span className="hint">optional</span></div>
            <input className="scope-input" value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. focus on biscuit extensions…" />
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div className="note">{sources.length} sources · {timeframe} · {geography}</div>
        <button type="button" className="btn-primary" disabled={sources.length < 1} onClick={() => onConfirm({ sources, timeframe, geography, context })}>
          Continue to audience
        </button>
      </div>
    </div>
  );
};

export const AudienceConfigForm = ({ locked, defaults, onConfirm }) => {
  const [generations, setGenerations] = useState(defaults?.generations || []);
  const [ages, setAges] = useState(defaults?.ages || []);
  const [lifestyles, setLifestyles] = useState(defaults?.lifestyles || []);
  const [tiers, setTiers] = useState(defaults?.tiers || []);
  const toggle = (list, setList, item) =>
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  if (locked) {
    return (
      <div className="card">
        <div className="card-h">
          <h3>Target audience</h3>
          <span className="tag">confirmed</span>
        </div>
        <div className="card-body">
          <div className="scope-meta">
            <div><span className="k">Credits</span><span className="v">{FIXED_RUN_STATS.credits}</span></div>
            <div><span className="k">TAT</span><span className="v">{FIXED_RUN_STATS.tat}</span></div>
            <div><span className="k">Data confidence</span><span className="v">{FIXED_RUN_STATS.confidence}</span></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
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
          <div className="scope-meta">
            <div><span className="k">Credits</span><span className="v">{FIXED_RUN_STATS.credits}</span></div>
            <div><span className="k">TAT</span><span className="v">{FIXED_RUN_STATS.tat}</span></div>
            <div><span className="k">Data confidence</span><span className="v">{FIXED_RUN_STATS.confidence}</span></div>
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div className="note">Uses {FIXED_RUN_STATS.credits} credits · ~{FIXED_RUN_STATS.tat}</div>
        <button type="button" className="btn-primary" onClick={() => onConfirm({ generations, ages, lifestyles, tiers })}>
          Run research
        </button>
      </div>
    </div>
  );
};

/* ── Doc output cards (`.card` + existing patterns) ── */
export const DocStateTableCard = () => {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="card">
      <div className="card-h">
        <h3>State-by-state flavor deep dives</h3>
        <span className="tag">click arrow · {DEMO_STATES.length} states</span>
      </div>
      <div className="card-body state-table-wrap">
        <table className="state-table">
          <thead>
            <tr><th>State</th><th>Top 5 sweet</th><th>Top 5 savory</th><th></th></tr>
          </thead>
          <tbody>
            {DEMO_STATES.map((row) => {
              const isOpen = expanded === row.state;
              const metrics = isOpen
                ? [...buildFlavorMetrics(row.state, row.sweet, "Sweet"), ...buildFlavorMetrics(row.state, row.savory, "Savory")]
                : [];
              return (
                <Fragment key={row.state}>
                  <tr className={"state-table-row " + (isOpen ? "open" : "")} onClick={() => setExpanded(isOpen ? null : row.state)}>
                    <td className="state-table-name">{row.state}</td>
                    <td>{row.sweet.join(", ")}</td>
                    <td>{row.savory.join(", ")}</td>
                    <td className="state-table-expand">{isOpen ? "▾" : "▸"}</td>
                  </tr>
                  {isOpen && (
                    <tr className="state-table-detail-row">
                      <td colSpan={4}>
                        <div className="state-expand-panel">
                          <p className="muted" style={{ margin: "0 0 10px" }}>{getStateInsight(row.state)}</p>
                          <p className="muted" style={{ margin: "0 0 12px" }}><b>What this means:</b> Anchor to {row.sweet[0]} and {row.savory[0]} before nationalizing.</p>
                          <table className="state-metrics-table">
                            <thead><tr><th>Flavor</th><th>Type</th><th>Conv.</th><th>Engagement</th></tr></thead>
                            <tbody>
                              {metrics.map((m) => (
                                <tr key={m.flavor + m.type}><td>{m.flavor}</td><td>{m.type}</td><td>{m.conv}</td><td>{m.eng}</td></tr>
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
  );
};

export const DocWinningClustersCard = () => {
  const [open, setOpen] = useState(STATE_WINNING_CLUSTERS[0]?.id);
  return (
    <div className="card">
      <div className="card-h">
        <h3>Key state-wise winning flavors</h3>
        <span className="tag">click to expand</span>
      </div>
      <div className="card-body state-list">
        {STATE_WINNING_CLUSTERS.map((c) => (
          <div key={c.id} className={"state-row " + (open === c.id ? "open" : "")} onClick={() => setOpen(open === c.id ? null : c.id)}>
            <div className="state-head">
              <span className="state-name">{c.label}</span>
              <span className="state-chev">{open === c.id ? "−" : "+"}</span>
            </div>
            {open === c.id && (
              <div className="state-detail">
                {c.rows.map((r) => (
                  <p key={r.flavor}><b>{r.flavor}</b> · {r.conv} conv · {r.eng} eng</p>
                ))}
                <p style={{ marginTop: 10 }}>{c.insight}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DocCrossStateCard = () => {
  const [dim, setDim] = useState("zone");
  const [activeId, setActiveId] = useState(CROSS_STATE_INSIGHTS.zone[0].id);
  const items = CROSS_STATE_INSIGHTS[dim];
  const active = items.find((x) => x.id === activeId) || items[0];

  return (
    <div className="card">
      <div className="card-h">
        <h3>Cross-state insight synthesis</h3>
        <span className="tag">zone · weather · age</span>
      </div>
      <div className="card-body">
        <div className="scope-field">
          <div className="scope-label">View by</div>
          <div className="opt-row">
            {[
              { id: "zone", label: "Zone-wise" },
              { id: "weather", label: "Weather / seasonal" },
              { id: "age", label: "Age / demographic" },
            ].map((d) => (
              <span
                key={d.id}
                className={"opt " + (dim === d.id ? "sel" : "")}
                onClick={() => { setDim(d.id); setActiveId(CROSS_STATE_INSIGHTS[d.id][0].id); }}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>
        <div className="scope-field">
          <div className="opt-row">
            {items.map((item) => (
              <span key={item.id} className={"opt " + (activeId === item.id ? "sel" : "")} onClick={() => setActiveId(item.id)}>
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="card" style={{ marginTop: 12, boxShadow: "none" }}>
          <div className="card-body">
            <h4 style={{ margin: "0 0 8px", fontSize: 15 }}>{active.label}</h4>
            <p className="muted" style={{ margin: 0 }}>{active.insight}</p>
            {active.keyFlavors && <p className="muted"><b>Key flavors:</b> {active.keyFlavors}</p>}
            {active.peakFlavors && <p className="muted"><b>Peak:</b> {active.peakFlavors}</p>}
            {active.topFlavors && <p className="muted"><b>Top:</b> {active.topFlavors}</p>}
            {active.signal && <p className="muted"><b>Opportunity:</b> {active.signal}</p>}
            {active.implication && <p className="muted"><b>Implication:</b> {active.implication}</p>}
            {active.trial && <p className="muted"><b>Trial:</b> {active.trial}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DocNationalCard = () => {
  const top = NATIONAL_FLAVORS.slice(0, 16);
  const matrixFlavors = top.slice(0, 12);

  return (
    <div className="card">
      <div className="card-h">
        <h3>National flavor performance</h3>
        <span className="tag">2×2 matrix · click dots</span>
      </div>
      <div className="card-body">
        <NationalScatterChart
          points={matrixFlavors}
          onSelect={(f) =>
            openDetail({ type: "National flavor", title: f.name, body: f.extensions, source: "Section 5" })
          }
        />
        <div className="national-table-wrap">
          <table className="national-table">
            <thead>
              <tr><th>Flavor</th><th>Conv.</th><th>Eng.</th><th>Trend</th><th>States</th><th>Extensions</th><th>Brand</th></tr>
            </thead>
            <tbody>
              {top.map((f) => (
                <tr key={f.name} className="clickable-row" onClick={() => openDetail({ type: "National flavor", title: f.name, body: f.extensions, facts: [{ k: "Growth", v: f.convGrowth }, { k: "Engagement", v: f.engGrowth }], source: "May 2026" })}>
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

export const DocActionablesCard = ({ onRunDeliverable, busy, filmBusy }) => {
  const [expandedState, setExpandedState] = useState(null);
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [selectedFlavor, setSelectedFlavor] = useState("Honey Chilli");
  const [instructions, setInstructions] = useState("");
  const stateRow = DEMO_STATES.find((s) => s.state === selectedState);
  const flavorOptions = useMemo(() => (stateRow ? [...stateRow.sweet, ...stateRow.savory] : ["Honey Chilli"]), [stateRow]);

  useEffect(() => {
    if (!flavorOptions.includes(selectedFlavor)) setSelectedFlavor(flavorOptions[0]);
  }, [selectedState, flavorOptions, selectedFlavor]);

  return (
    <div className="card">
      <div className="card-h">
        <h3>Actionables for next steps</h3>
        <span className="tag">state + flavor → deliverable</span>
      </div>
      <div className="card-body">
        <p className="muted" style={{ marginTop: 0 }}>Select state and flavor, then generate messaging, concept cards, storyboard, or positioning.</p>
        <div className="state-list" style={{ maxHeight: 200, overflowY: "auto", margin: "12px 0" }}>
          {DEMO_STATES.slice(0, 12).map((s) => (
            <div
              key={s.state}
              className={"state-row " + (selectedState === s.state ? "open" : "")}
              onClick={() => { setSelectedState(s.state); setExpandedState(s.state); }}
            >
              <div className="state-head">
                <span className="state-name">{s.state}</span>
                <span className="state-chev">{selectedState === s.state ? "✓" : "+"}</span>
              </div>
            </div>
          ))}
        </div>
        {expandedState && (
          <div className="scope-form" style={{ marginBottom: 14 }}>
            <div className="scope-field">
              <div className="scope-label">State</div>
              <select className="scope-input" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
                {DEMO_STATES.map((s) => <option key={s.state} value={s.state}>{s.state}</option>)}
              </select>
            </div>
            <div className="scope-field">
              <div className="scope-label">Flavor</div>
              <select className="scope-input" value={selectedFlavor} onChange={(e) => setSelectedFlavor(e.target.value)}>
                {flavorOptions.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="scope-field">
              <div className="scope-label">Instructions <span className="hint">optional</span></div>
              <input className="scope-input" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="e.g. premium pack, chai-time…" />
            </div>
          </div>
        )}
        <div className="actions-reco-chips">
          {DELIVERABLE_TYPES.map((d) => (
            <button
              key={d.id}
              type="button"
              className={"reco-chip " + (d.primary ? "reco-chip-primary" : "")}
              disabled={d.actionId === "create_film" ? filmBusy : busy}
              onClick={() => onRunDeliverable?.({ actionId: d.actionId, state: selectedState, flavor: selectedFlavor, instructions })}
            >
              <span className="reco-icon">◆</span>
              <span className="reco-label-wrap">
                <span className="reco-label-text">{d.label}</span>
                <span className="reco-sub">{d.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_RESEARCH_PROMPT };
