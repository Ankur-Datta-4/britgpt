// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { NationalPrioritizationMatrix } from "@/components/brit/brit-charts";
import { AgeCohortGrid } from "@/components/brit/age-cohort-grid";
import { getAudienceDefaultsFromCohort } from "@/lib/audience-cohorts";
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
  STATE_WINNING_FLAVORS,
  FLAVOR_MACHINE,
  flavorMachineAsNational,
  NATIONAL_FLAVORS,
  getStateInsight,
  getStateTakeaway,
  getStateMetrics,
  CROSS_STATE_INSIGHTS,
  DELIVERABLE_TYPES,
  parsePct,
  parseNationalStatePills,
  parseNationalExtensions,
  inferNationalCategory,
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
          <div className="scope-chips scope-chips--confirmed">
            <div className="chip chip--block">
              <span className="chip-label">Sources</span>
              <span className="chip-value">{sources.join(", ")}</span>
            </div>
            <div className="scope-chips-meta">
              <span className="chip"><b>Time:</b> {timeframe}</span>
              <span className="chip"><b>Geography:</b> {geography}</span>
              {context && <span className="chip"><b>Context:</b> {context}</span>}
            </div>
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
  const base = getAudienceDefaultsFromCohort(defaults?.cohortId || "millennials");
  const [generations, setGenerations] = useState(defaults?.generations || base.generations || []);
  const [ages, setAges] = useState(defaults?.ages || base.ages || []);
  const [lifestyles, setLifestyles] = useState(defaults?.lifestyles || []);
  const [tiers, setTiers] = useState(defaults?.tiers || []);
  const toggle = (list, setList, item) =>
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const buildPayload = () => ({
    cohortId: defaults?.cohortId || "millennials",
    generations,
    ages,
    lifestyles,
    tiers,
  });

  if (locked) {
    return (
      <div className="card">
        <div className="card-h">
          <h3>Target audience</h3>
          <span className="tag">confirmed</span>
        </div>
        <div className="card-body">
          <div className="scope-meta">
            <div><span className="k">Generation</span><span className="v">{generations.join(", ") || "—"}</span></div>
            <div><span className="k">Age</span><span className="v">{ages.join(", ") || "—"}</span></div>
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
        <h3>Target audience</h3>
        <span className="tag">step 2 of 2</span>
      </div>
      <div className="card-body">
        <div className="scope-form">
          <div className="scope-field">
            <div className="scope-label">Generation</div>
            <div className="opt-row">
              {DEMO_GENERATIONS.map((g) => (
                <span key={g} className={"opt " + (generations.includes(g) ? "sel" : "")} onClick={() => toggle(generations, setGenerations, g)}>{g}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Age band</div>
            <div className="opt-row">
              {DEMO_AGE_CATEGORIES.map((a) => (
                <span key={a} className={"opt " + (ages.includes(a) ? "sel" : "")} onClick={() => toggle(ages, setAges, a)}>{a}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Lifestyle <span className="hint">optional</span></div>
            <div className="opt-row">
              {DEMO_LIFESTYLES.map((l) => (
                <span key={l} className={"opt " + (lifestyles.includes(l) ? "sel" : "")} onClick={() => toggle(lifestyles, setLifestyles, l)}>{l}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">City tier <span className="hint">optional</span></div>
            <div className="opt-row">
              {DEMO_CITY_TIERS.map((t) => (
                <span key={t} className={"opt " + (tiers.includes(t) ? "sel" : "")} onClick={() => toggle(tiers, setTiers, t)}>{t}</span>
              ))}
            </div>
          </div>
          <div className="scope-meta">
            <div><span className="k">Credits</span><span className="v">{FIXED_RUN_STATS.credits}</span></div>
            <div><span className="k">TAT</span><span className="v">{FIXED_RUN_STATS.tat}</span></div>
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div className="note">Uses {FIXED_RUN_STATS.credits} credits · ~{FIXED_RUN_STATS.tat}</div>
        <button type="button" className="btn-primary" disabled={generations.length < 1 || ages.length < 1} onClick={() => onConfirm(buildPayload())}>
          Run research
        </button>
      </div>
    </div>
  );
};

const StateMetricsByType = ({ metrics }) => {
  const sweet = metrics.filter((m) => m.type === "Sweet");
  const savory = metrics.filter((m) => m.type === "Savory");

  const renderBlock = (title, rows) => (
    <div className="state-metrics-split">
      <p className="state-metrics-split-label">{title}</p>
      <table className="state-metrics-table compact">
        <thead>
          <tr>
            <th>Flavor</th>
            <th>Conv. volume</th>
            <th>Total engagement</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.flavor}>
              <td>{m.flavor}</td>
              <td>{m.convVolume}</td>
              <td>{m.totalEngagement}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="state-metrics-split-grid">
      {renderBlock("Sweet", sweet)}
      {renderBlock("Savory", savory)}
    </div>
  );
};

const STATE_VOLUME_COLUMNS = [
  { full: "Andhra Pradesh & Telangana", short: "AP + TS" },
  { full: "Delhi NCR", short: "Delhi NCR" },
  { full: "Karnataka", short: "KA" },
  { full: "Kerala", short: "KL" },
  { full: "Maharashtra", short: "MH" },
  { full: "Orissa", short: "OD" },
  { full: "Tamil Nadu", short: "TN" },
  { full: "West Bengal", short: "WB" },
];

const CONVERSATION_BY_STATE_ROWS = [
  { flavor: "Chanachur", values: ["3,847", "4,463", "5,218", "3,094", "7,126", "18,437", "6,372", "34,182"] },
  { flavor: "Chatpata", values: ["6,183", "8,742", "9,481", "6,917", "12,386", "10,731", "11,154", "14,623"] },
  { flavor: "Chettinad Pepper", values: ["8,697", "8,596", "8,056", "8,073", "8,482", "5,437", "8,209", "6,184"] },
  { flavor: "Coconut Jaggery", values: ["1,519", "476", "6,132", "4,141", "620", "2,873", "17,066", "3,294"] },
  { flavor: "Coffee", values: ["60,084", "107,549", "46,826", "512", "128,715", "11,482", "55,847", "16,943"] },
  { flavor: "Dark Choc Chilli", values: ["24", "25", "44", "4", "7", "13", "32", "19"] },
  { flavor: "Elaichi Cream", values: ["1", "151", "257", "436", "745", "117", "1", "146"] },
  { flavor: "Garlic Chilli", values: ["25,971", "17,716", "8,011", "8,028", "25,763", "6,847", "6,280", "7,561"] },
  { flavor: "Gunpowder Podi", values: ["5,004", "1,610", "22,892", "2,993", "2,565", "3,684", "5,437", "4,173"] },
  { flavor: "Honey Chilli", values: ["1,513", "5,442", "3,897", "3,433", "5,778", "3,281", "5,931", "4,612"] },
  { flavor: "Jhalmuri", values: ["1,863", "2,947", "3,584", "1,472", "2,386", "22,413", "3,128", "48,276"] },
  { flavor: "Kokum Spice", values: ["3,098", "1,488", "5,645", "4,355", "10,279", "2,948", "3,793", "3,486"] },
  { flavor: "Malai Kesar", values: ["370", "232", "12,389", "200", "11,835", "347", "272", "583"] },
  { flavor: "Mango Pickle", values: ["52,919", "44,401", "56,297", "46,326", "37,232", "28,314", "45,330", "39,218"] },
  { flavor: "Nipattu", values: ["4,183", "642", "15,472", "3,861", "1,783", "517", "9,284", "731"] },
  { flavor: "Nolen Gur", values: ["283", "731", "364", "247", "489", "4,628", "226", "31,482"] },
  { flavor: "Recheado Spice", values: ["174", "224", "389", "265", "677", "98", "168", "137"] },
  { flavor: "Rose Saffron", values: ["112", "33", "72", "233", "32", "69", "66", "128"] },
  { flavor: "Saoji Chilli", values: ["2,573", "741", "4,098", "655", "6,304", "1,143", "2,067", "1,584"] },
  { flavor: "Schezwan", values: ["11,186", "15,396", "15,105", "11,809", "27,146", "7,862", "16,795", "9,638"] },
  { flavor: "Smoky Garlic", values: ["159", "1,369", "162", "39", "66", "57", "102", "83"] },
];

const ENGAGEMENT_BY_STATE_ROWS = [
  { flavor: "Chanachur", values: ["418,362", "503,184", "648,291", "297,418", "812,647", "2,184,376", "691,284", "3,926,482"] },
  { flavor: "Chatpata", values: ["638,174", "982,631", "1,148,284", "702,463", "1,584,218", "1,083,462", "1,296,184", "1,742,635"] },
  { flavor: "Chettinad Pepper", values: ["295,965", "288,593", "243,811", "250,483", "317,689", "186,472", "253,089", "214,638"] },
  { flavor: "Coconut Jaggery", values: ["154,527", "29,379", "552,029", "201,230", "17,267", "128,463", "2,409,937", "172,581"] },
  { flavor: "Coffee", values: ["7,869,320", "11,820,226", "2,731,837", "44,447", "14,436,264", "1,286,482", "6,674,319", "2,048,375"] },
  { flavor: "Dark Choc Chilli", values: ["4,246", "4,691", "184", "9", "192", "2,681", "4,142", "3,127"] },
  { flavor: "Elaichi Cream", values: ["3", "5,853", "375", "10,082", "15,256", "2,947", "4", "3,628"] },
  { flavor: "Garlic Chilli", values: ["1,503,735", "1,794,098", "1,509,340", "823,285", "1,532,954", "586,372", "1,249,727", "648,283"] },
  { flavor: "Gunpowder Podi", values: ["550,888", "106,115", "3,087,191", "294,467", "459,540", "392,748", "721,783", "451,276"] },
  { flavor: "Honey Chilli", values: ["356,138", "1,082,028", "915,542", "528,487", "1,232,018", "381,264", "1,297,624", "524,183"] },
  { flavor: "Jhalmuri", values: ["218,374", "341,582", "486,193", "174,283", "268,471", "3,182,746", "392,648", "6,248,315"] },
  { flavor: "Kokum Spice", values: ["531,558", "89,082", "943,885", "819,431", "985,424", "274,183", "699,664", "352,817"] },
  { flavor: "Malai Kesar", values: ["106,660", "58,017", "80,871", "65,280", "83,955", "41,286", "97,464", "63,582"] },
  { flavor: "Mango Pickle", values: ["6,667,944", "9,745,019", "8,925,061", "8,203,724", "8,482,143", "4,286,471", "9,575,426", "6,182,374"] },
  { flavor: "Nipattu", values: ["486,271", "58,362", "1,864,283", "391,742", "164,381", "43,286", "1,092,648", "62,483"] },
  { flavor: "Nolen Gur", values: ["28,174", "64,382", "32,648", "24,183", "41,286", "586,372", "21,746", "3,861,274"] },
  { flavor: "Recheado Spice", values: ["5,816", "9,976", "19,836", "21,846", "8,921", "4,183", "3,296", "5,128"] },
  { flavor: "Rose Saffron", values: ["4,406", "8,451", "1,604", "6,528", "945", "2,183", "191", "3,847"] },
  { flavor: "Saoji Chilli", values: ["272,638", "33,263", "433,458", "20,164", "522,626", "96,483", "106,788", "132,648"] },
  { flavor: "Schezwan", values: ["2,175,658", "3,227,645", "2,561,131", "2,974,473", "6,239,632", "1,086,274", "3,298,223", "1,472,683"] },
  { flavor: "Smoky Garlic", values: ["8,342", "22,361", "4,490", "1,349", "1,892", "1,486", "3,498", "2,183"] },
];

const compactVolume = (value: string) => {
  const n = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(n)) return value;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
};

const StateVolumeTable = ({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ flavor: string; values: string[] }>;
}) => (
  <section className="state-volume-table-section">
    <div className="state-volume-table-head">
      <h3>{title}</h3>
      <span className="tag">{subtitle}</span>
    </div>
    <div className="state-volume-table-wrap">
      <table className="state-volume-table">
        <thead>
          <tr>
            <th>Flavor</th>
            {STATE_VOLUME_COLUMNS.map((col) => (
              <th key={col.full} title={col.full}>{col.short}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.flavor}>
              <td><b>{row.flavor}</b></td>
              {row.values.map((value, idx) => (
                <td key={`${row.flavor}-${STATE_VOLUME_COLUMNS[idx].full}`} title={value}>
                  {compactVolume(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

export const DocConversationByStateCard = () => (
  <StateVolumeTable
    title="Conversation by state"
    subtitle="flavor mentions by state"
    rows={CONVERSATION_BY_STATE_ROWS}
  />
);

export const DocEngagementByStateCard = () => (
  <StateVolumeTable
    title="Engagement by state"
    subtitle="flavor engagement by state"
    rows={ENGAGEMENT_BY_STATE_ROWS}
  />
);

/* ── Doc output cards (`.card` + existing patterns) ── */
export const DocStateTableCard = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="card">
      <div className="card-h">
        <h3>State-by-state flavor deep dives</h3>
        <span className="tag">expand row · {DEMO_STATES.length} states</span>
      </div>
      <div className="card-body state-table-wrap">
        <table className="state-table">
          <thead>
            <tr><th>State</th><th>Top 5 sweet</th><th>Top 5 savory</th><th></th></tr>
          </thead>
          <tbody>
            {DEMO_STATES.map((row) => {
              const isOpen = expanded === row.state;
              const metrics = isOpen ? getStateMetrics(row.state) : [];

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
                          <p className="muted" style={{ margin: "0 0 12px" }}>
                            <b>What this means:</b> {getStateTakeaway(row.state).replace(/^What this means:\s*/i, "")}
                          </p>
                          <StateMetricsByType metrics={metrics} />
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
  return (
    <div className="card">
      <div className="card-h">
        <h3>Key state-wise winning flavors</h3>
        <span className="tag">{STATE_WINNING_FLAVORS.length} flavor rows</span>
      </div>
      <div className="card-body state-table-wrap">
        <table className="national-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Flavor Type</th>
              <th>Flavor</th>
              <th>Trend Type</th>
              <th>Product Extension Ideas</th>
              <th>Brand Fit</th>
            </tr>
          </thead>
          <tbody>
            {STATE_WINNING_FLAVORS.map((row, idx) => (
              <tr key={`${row.state}-${row.flavorType}-${row.flavor}-${idx}`}>
                <td className="state-table-name">{row.state}</td>
                <td>{row.flavorType}</td>
                <td><b>{row.flavor}</b></td>
                <td>{row.trendType}</td>
                <td>{row.extensions}</td>
                <td>{row.brandFit}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className="card cross-state-card">
      <div className="card-h">
        <h3>Cross-State Insight Synthesis - Overall Flavor Reads</h3>
        <span className="tag">overall flavor reads</span>
      </div>
      <div className="card-body">
        <p className="muted cross-state-lead">
          Patterns that emerge when state-level data is read together — geographic clusters, seasonal triggers, and age-driven purchase behavior.
        </p>
        <div className="cross-state-tabs">
          {[
            { id: "zone", label: "Zone-wise" },
            { id: "weather", label: "Weather" },
            { id: "age", label: "Age & demographic" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              className={"cross-state-tab " + (dim === d.id ? "sel" : "")}
              onClick={() => {
                setDim(d.id);
                setActiveId(CROSS_STATE_INSIGHTS[d.id][0].id);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        {dim === "age" ? (
          <>
            <AgeCohortGrid
              selectedId={activeId}
              onSelect={setActiveId}
              variant="light"
              sectionLabel="Demographic trends"
            />
            {active?.trial && (
              <p className="muted cross-state-footnote"><b>Signal:</b> {active.trial}</p>
            )}
          </>
        ) : (
          <>
            <div className="scope-field">
              <div className="opt-row">
                {items.map((item) => (
                  <span
                    key={item.id}
                    className={"opt " + (activeId === item.id ? "sel" : "")}
                    onClick={() => setActiveId(item.id)}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="card cross-state-detail" style={{ marginTop: 12, boxShadow: "none" }}>
              <div className="card-body">
                <h4 style={{ margin: "0 0 8px", fontSize: 15 }}>{active.label}</h4>
                <p className="muted" style={{ margin: 0 }}>{active.insight}</p>
                {active.keyFlavors && <p className="muted"><b>Key flavors:</b> {active.keyFlavors}</p>}
                {active.peakFlavors && <p className="muted"><b>Peak:</b> {active.peakFlavors}</p>}
                {active.signal && <p className="muted"><b>Opportunity:</b> {active.signal}</p>}
                {active.implication && <p className="muted"><b>Implication:</b> {active.implication}</p>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const formatGrowth = (value) => {
  const n = parseFloat(String(value).replace("%", ""));
  if (Number.isNaN(n)) return value;
  return `+${n}%`;
};

const NationalFlavorTable = ({ rows, onRowClick, sortKey, sortDir, onSort }) => {
  const sortIndicator = (key) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const th = (key, label) => (
    <th>
      <button type="button" className="national-th-sort" onClick={() => onSort(key)}>
        {label}
        <span className="national-th-sort-ind">{sortIndicator(key)}</span>
      </button>
    </th>
  );

  return (
    <div className="national-table-wrap">
      <table className="national-table national-table--interactive">
        <thead>
          <tr>
            {th("name", "Flavor")}
            {th("conv", "Conversation growth")}
            {th("eng", "Engagement growth")}
            {th("trend", "Trend Type")}
            <th>States Popular in</th>
            <th>Product Extension Recommendations</th>
            <th>Britannia portfolio fit</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="national-table-empty">
                No flavors match this trend filter.
              </td>
            </tr>
          ) : (
            rows.map((f) => {
              const ext = parseNationalExtensions(f.extensions);
              const brands = f.brandFit.split(",").map((b) => b.trim()).filter(Boolean);
              return (
                <tr
                  key={f.name}
                  className="clickable-row"
                  onClick={() => onRowClick(f)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(f);
                    }
                  }}
                >
                  <td><b>{f.name}</b></td>
                  <td><span className="national-growth">{formatGrowth(f.convGrowth)}</span></td>
                  <td><span className="national-growth">{formatGrowth(f.engGrowth)}</span></td>
                  <td>
                    <span className={"trend-pill trend-" + f.trendType.toLowerCase()}>{f.trendType}</span>
                  </td>
                  <td>
                    <div className="national-pill-row">
                      {parseNationalStatePills(f.states).map((s) => (
                        <span
                          key={s.abbr + s.full}
                          className={"national-state-pill " + (s.isNational ? "national-state-pill--national" : "")}
                          title={s.full}
                        >
                          {s.abbr}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="national-ext-cell">
                    {ext.primary ? <b>{ext.primary}</b> : null}
                    {ext.rest.length > 0 ? (
                      <span className="national-ext-rest">
                        {ext.primary ? ", " : ""}
                        {ext.rest.join(", ")}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <div className="national-pill-row">
                      {brands.map((b) => (
                        <span key={b} className={"national-brand-pill national-brand-pill--" + b.toLowerCase().replace(/\s+/g, "-")}>
                          {b}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export const DocNationalCard = () => {
  const [sortKey, setSortKey] = useState("conv");
  const [sortDir, setSortDir] = useState("desc");
  const matrixPoints = useMemo(() => flavorMachineAsNational(), []);

  const sortedRows = useMemo(() => {
    const rows = [...NATIONAL_FLAVORS];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "conv") return (parsePct(a.convGrowth) - parsePct(b.convGrowth)) * dir;
      if (sortKey === "eng") return (parsePct(a.engGrowth) - parsePct(b.engGrowth)) * dir;
      if (sortKey === "trend") return a.trendType.localeCompare(b.trendType) * dir;
      return 0;
    });
    return rows;
  }, [sortKey, sortDir]);

  const onFlavorClick = (f) => {
    const row = NATIONAL_FLAVORS.find((m) => m.name === f.name) || f;
    openDetail({
      type: "National flavor",
      title: row.name,
      body: row.extensions,
      facts: [
        { k: "Conv. growth", v: row.convGrowth || f.convGrowth },
        { k: "Eng. growth", v: row.engGrowth || f.engGrowth },
        { k: "Brand fit", v: row.brandFit || f.brandFit },
      ],
      source: "National Flavor Performance View",
    });
  };

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "trend" || key === "category" ? "asc" : "desc");
    }
  };

  return (
    <div className="card flavor-machine-card">
      <div className="card-h">
        <h3>National Flavor Performance View</h3>
        <span className="tag">{NATIONAL_FLAVORS.length} flavors</span>
      </div>
      <div className="card-body">
        <section className="flavor-machine-matrix-section">
          <p className="flavor-machine-section-label">Conversation vs engagement · prioritization matrix</p>
          <NationalPrioritizationMatrix points={matrixPoints} onSelect={onFlavorClick} />
        </section>
        <section className="flavor-machine-table-section">
          <NationalFlavorTable
            rows={sortedRows}
            onRowClick={onFlavorClick}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={onSort}
          />
        </section>
      </div>
    </div>
  );
};

export const DocActionablesCard = ({ onRunDeliverable, busy }) => {
  const [selectedType, setSelectedType] = useState("content_cards");
  const [selectedState, setSelectedState] = useState("Maharashtra");
  const [flavorName, setFlavorName] = useState("Honey Chilli");
  const [instructions, setInstructions] = useState("");
  const active = DELIVERABLE_TYPES.find((d) => d.id === selectedType) || DELIVERABLE_TYPES[0];
  const flavorSuggestions = useMemo(() => FLAVOR_MACHINE.map((f) => f.name), []);

  const handleGo = () => {
    if (busy || !flavorName.trim()) return;
    onRunDeliverable?.({
      actionId: active.actionId,
      state: selectedState,
      flavor: flavorName.trim(),
      instructions,
    });
  };

  return (
    <div className="card actionables-card">
      <div className="card-h">
        <h3>Actionable options</h3>
        <span className="tag">deliverables</span>
      </div>
      <div className="card-body generate-insights-body">
        <p className="generate-insights-lead">
          Enter a flavor name, pick a deliverable type, and generate concept mock-ups, a video storyboard, or a creative brief.
        </p>

        <div className="deliverable-picker deliverable-picker--3" role="listbox" aria-label="Output type">
          {DELIVERABLE_TYPES.map((d) => {
            const sel = selectedType === d.id;
            return (
              <button
                key={d.id}
                type="button"
                role="option"
                aria-selected={sel}
                className={"deliverable-card " + (sel ? "sel" : "")}
                onClick={() => setSelectedType(d.id)}
              >
                <span className={"deliverable-card-icon " + d.iconClass} aria-hidden>
                  {d.icon}
                </span>
                {d.label ? <span className="deliverable-card-title">{d.label}</span> : null}
                <p className="deliverable-card-desc">{d.description}</p>
                <span className="deliverable-card-mark" aria-hidden>
                  {sel ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        <div className="generate-insights-configure">
          <div className="configure-eyebrow">
            <span className="configure-gear" aria-hidden>⚙</span>
            Configure: {active.configureTitle}
          </div>
          <div className="configure-field configure-field--flavor">
            <label className="configure-label" htmlFor="gi-flavor-name">Flavor name</label>
            <input
              id="gi-flavor-name"
              className="configure-select configure-flavor-input"
              list="flavor-machine-names"
              value={flavorName}
              onChange={(e) => setFlavorName(e.target.value)}
              placeholder="e.g. Honey Chilli, Gunpowder Podi, Thecha…"
            />
            <datalist id="flavor-machine-names">
              {flavorSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <div className="configure-field">
            <label className="configure-label" htmlFor="gi-state">State context <span className="hint">optional</span></label>
            <select
              id="gi-state"
              className="configure-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              {DEMO_STATES.map((s) => (
                <option key={s.state} value={s.state}>{s.state}</option>
              ))}
            </select>
          </div>
          <div className="configure-field">
            <label className="configure-label" htmlFor="gi-instructions">
              Specific instructions <span className="hint">optional</span>
            </label>
            <textarea
              id="gi-instructions"
              className="configure-textarea"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Focus on Instagram Reels for 18–24 age group, use regional language hooks, include a festive angle…"
            />
          </div>
          <div className="configure-actions">
            <button
              type="button"
              className="configure-go"
              disabled={busy || !flavorName.trim()}
              onClick={handleGo}
            >
              <span aria-hidden>✦</span> Go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DEFAULT_RESEARCH_PROMPT };
