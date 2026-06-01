// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  NATIONAL_FLAVORS,
  getStateInsight,
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
  const [additionalQuestions, setAdditionalQuestions] = useState(defaults?.additionalQuestions || defaults?.context || "");

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
              {additionalQuestions && <span className="chip"><b>Additional questions:</b> {additionalQuestions}</span>}
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
            <div className="scope-label">Additional questions <span className="hint">optional</span></div>
            <textarea
              className="scope-input scope-textarea"
              rows={3}
              value={additionalQuestions}
              onChange={(e) => setAdditionalQuestions(e.target.value)}
              placeholder="Add any extra questions or constraints for this research run."
            />
          </div>
        </div>
      </div>
      <div className="card-foot">
        <div className="note">{sources.length} sources · {timeframe} · {geography}</div>
        <button type="button" className="btn-primary" disabled={sources.length < 1} onClick={() => onConfirm({ sources, timeframe, geography, additionalQuestions })}>
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
          <h3>Target audience configuration</h3>
          <span className="tag">confirmed</span>
        </div>
        <div className="card-body">
          <div className="scope-meta">
            <div><span className="k">Age generation</span><span className="v">{generations.join(", ") || "—"}</span></div>
            <div><span className="k">Age category</span><span className="v">{ages.join(", ") || "—"}</span></div>
            <div><span className="k">Lifestyle</span><span className="v">{lifestyles.join(", ") || "—"}</span></div>
            <div><span className="k">City tier</span><span className="v">{tiers.join(", ") || "—"}</span></div>
            <div><span className="k">Credits</span><span className="v">{FIXED_RUN_STATS.credits}</span></div>
            <div><span className="k">TAT</span><span className="v">{FIXED_RUN_STATS.tat}</span></div>
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
            <div className="scope-label">Age generation <span className="hint">optional / multi-select</span></div>
            <div className="opt-row">
              {DEMO_GENERATIONS.map((g) => (
                <span key={g} className={"opt " + (generations.includes(g) ? "sel" : "")} onClick={() => toggle(generations, setGenerations, g)}>{g}</span>
              ))}
            </div>
          </div>
          <div className="scope-field">
            <div className="scope-label">Age category <span className="hint">optional / multi-select</span></div>
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
        <div className="note">Audience filters optional · uses {FIXED_RUN_STATS.credits} credits · ~{FIXED_RUN_STATS.tat}</div>
        <button type="button" className="btn-primary" onClick={() => onConfirm(buildPayload())}>
          Run research
        </button>
      </div>
    </div>
  );
};

const STATE_TREND_MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
const STATE_CHART_COLORS = {
  Sweet: ["#f05a32", "#d58a18", "#6654d8", "#1aa986", "#8d8a82"],
  Savory: ["#18a879", "#3b8eea", "#dd5a91", "#f06432", "#6654d8"],
};

const parseMetricVolume = (value) => {
  const match = String(value).replace(/,/g, "").trim().match(/^(-?\d+(?:\.\d+)?)([KkMm])?$/);
  if (!match) return Number(String(value).replace(/[^0-9.-]/g, "")) || 0;
  const n = Number(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "M") return n * 1_000_000;
  if (unit === "K") return n * 1_000;
  return n;
};

const formatTrendVolume = (value) => {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  return `${(n / 1000).toFixed(0)}K`;
};

const hashStr = (str) =>
  Array.from(str).reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);

const seededRand = (seed) => {
  let s = (Math.abs(seed) || 1) >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
};

const buildTrendData = (rows) => {
  const noiseMap: Record<string, number[]> = {};
  rows.forEach((metric, metricIdx) => {
    const rand = seededRand(hashStr(metric.flavor) ^ (metricIdx * 2654435761));
    noiseMap[metric.flavor] = STATE_TREND_MONTHS.map(() => rand() - 0.5);
  });

  return STATE_TREND_MONTHS.map((month, monthIdx) => {
    const point: Record<string, any> = { month };
    rows.forEach((metric) => {
      const end = parseMetricVolume(metric.convVolume);
      const growth = parsePct(metric.convGrowth);
      const start = growth <= -99 ? end : end / (1 + growth / 100);
      const delta = end - start;
      const progress = monthIdx / (STATE_TREND_MONTHS.length - 1);
      const noise = noiseMap[metric.flavor][monthIdx] * Math.abs(delta) * 0.22;
      point[metric.flavor] = Math.max(0, Math.round(start + delta * progress + noise));
    });
    return point;
  });
};

const StateTrendTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="state-trend-tooltip">
      <p>{label}</p>
      {payload.map((item) => (
        <div key={item.dataKey} className="state-trend-tooltip-row">
          <span style={{ background: item.color }} />
          <b>{item.dataKey}</b>
          <em>{formatTrendVolume(item.value)}</em>
        </div>
      ))}
    </div>
  );
};

const StateFlavorTable = ({ title, rows }) => (
  <section className="state-deep-section">
    <div className="state-deep-section-title">
      <span className={`state-flavor-badge state-flavor-badge--${title.toLowerCase()}`}>{title}</span>
      <span>Top {rows.length} flavors</span>
    </div>
    <table className="state-metrics-table state-metrics-table--deep">
      <thead>
        <tr>
          <th>Flavor</th>
          <th>Conv. volume</th>
          <th>Conv. vol growth (L1Y)</th>
          <th>Engagement vol</th>
          <th>Engagement growth (L1Y)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={`${title}-${m.flavor}`}>
            <td>{m.flavor}</td>
            <td>{m.convVolume}</td>
            <td>{m.convGrowth || "—"}</td>
            <td>{m.totalEngagement}</td>
            <td>{m.engagementGrowth || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
);

const StateFlavorTrendChart = ({ title, rows }) => {
  const data = useMemo(() => buildTrendData(rows), [rows]);
  const colors = STATE_CHART_COLORS[title] || STATE_CHART_COLORS.Sweet;

  return (
    <div className={`state-trend-card state-trend-card--${title.toLowerCase()}`}>
      <div className="state-trend-card-head">
        <h4>{title} flavors</h4>
      </div>
      <div className="state-trend-chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -6 }}>
            <CartesianGrid stroke="#eadfce" strokeWidth={1} />
            <XAxis
              dataKey="month"
              interval={1}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#8f8174", fontSize: 11, fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[0, "dataMax"]}
              tickFormatter={formatTrendVolume}
              tick={{ fill: "#8f8174", fontSize: 11, fontWeight: 700 }}
              width={38}
            />
            <Tooltip content={<StateTrendTooltip />} cursor={{ stroke: "#d6c8b6", strokeWidth: 1 }} />
            {rows.map((m, idx) => (
              <Line
                key={m.flavor}
                type="monotone"
                dataKey={m.flavor}
                stroke={colors[idx % colors.length]}
                strokeWidth={2.4}
                strokeDasharray={idx === 0 ? undefined : "4 4"}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="state-trend-legend">
        {rows.map((m, idx) => (
          <span key={m.flavor}>
            <i style={{ background: colors[idx % colors.length] }} />
            {m.flavor}
          </span>
        ))}
      </div>
    </div>
  );
};

const LightbulbIcon = () => (
  <svg className="state-callout-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M8.6 14.4A5.7 5.7 0 0 1 6.5 10a5.5 5.5 0 0 1 11 0c0 1.7-.8 3.3-2.1 4.4-.7.6-.9 1.1-.9 2.1V17h-5v-.5c0-1-.2-1.5-.9-2.1Z" />
    <path d="M12 2v1.5" />
    <path d="m4.9 4.9 1.1 1.1" />
    <path d="m19.1 4.9-1.1 1.1" />
  </svg>
);

const StateMetricsByType = ({ state, metrics }) => {
  const sweet = metrics.filter((m) => m.type === "Sweet");
  const savory = metrics.filter((m) => m.type === "Savory");

  return (
    <div className="state-deep-dive">
      <div className="state-deep-callout">
        <LightbulbIcon />
        <p><b>{state}:</b> {getStateInsight(state)}</p>
      </div>

      <div className="state-deep-tables">
        <StateFlavorTable title="Sweet" rows={sweet} />
        <StateFlavorTable title="Savory" rows={savory} />
      </div>

      <div className="state-trend-label">Conversation volume trend</div>
      <div className="state-trend-grid">
        <StateFlavorTrendChart title="Sweet" rows={sweet} />
        <StateFlavorTrendChart title="Savory" rows={savory} />
      </div>
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

const parseVolume = (value: string) => Number(String(value).replace(/,/g, "")) || 0;

const totalConversationByFlavor = (row: { flavor: string; values: string[] }) =>
  row.values.reduce((sum, value) => sum + parseVolume(value), 0);

const CONVERSATION_ROWS_SORTED = [...CONVERSATION_BY_STATE_ROWS].sort(
  (a, b) => totalConversationByFlavor(b) - totalConversationByFlavor(a)
);

const conversationRankByFlavor = new Map(
  CONVERSATION_ROWS_SORTED.map((row, idx) => [row.flavor, idx])
);

const ENGAGEMENT_ROWS_SORTED = [...ENGAGEMENT_BY_STATE_ROWS].sort(
  (a, b) =>
    (conversationRankByFlavor.get(a.flavor) ?? Number.MAX_SAFE_INTEGER) -
    (conversationRankByFlavor.get(b.flavor) ?? Number.MAX_SAFE_INTEGER)
);

const normalizeVolume = (value: string) => {
  const n = Number(String(value).replace(/,/g, ""));
  if (Number.isNaN(n)) return value;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
};

const StateVolumeTable = ({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ flavor: string; values: string[] }>;
}) => (
  <section className="state-volume-table-section">
    <div className="state-volume-table-head">
      <h3>{title}</h3>
    </div>
    {/*
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
                  {normalizeVolume(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    */}
  </section>
);

export const DocConversationByStateCard = () => (
  <StateVolumeTable
    title="Conversation by state"
    rows={CONVERSATION_ROWS_SORTED}
  />
);

export const DocEngagementByStateCard = () => (
  <StateVolumeTable
    title="Engagement by state"
    rows={ENGAGEMENT_ROWS_SORTED}
  />
);

const FLAVOR_VERBATIMS = [
  {
    flavor: "Honey Chilli",
    product: "Treat Honey Chilli Crackers",
    verbatim: "Bought this for evening chai with my family - sweet on first bite, then the chilli comes in nicely.",
    source: "Flipkart",
    social: ["Instagram"],
    rating: "4.5/5",
  },
  {
    flavor: "Gunpowder Podi",
    product: "NutriChoice Gunpowder Podi Khakhra",
    verbatim: "This actually tastes like real podi from home and works great as a quick office snack.",
    source: "Amazon",
    social: ["Reddit"],
    rating: "4.4/5",
  },
  {
    flavor: "Schezwan",
    product: "50-50 Schezwan Crackers",
    verbatim: "Movie-night favorite now - crunchy texture with proper schezwan kick, not bland at all.",
    source: "Amazon",
    social: ["YouTube"],
    rating: "4.3/5",
  },
  {
    flavor: "Mango Pickle",
    product: "50-50 Mango Pickle Cracker Bites",
    verbatim: "Gives that achar-style tangy-spicy taste and goes perfectly in my tiffin box.",
    source: "Flipkart",
    social: ["Instagram"],
    rating: "4.2/5",
  },
  {
    flavor: "Chettinad Pepper",
    product: "Marie Gold Chettinad Pepper Biscuits",
    verbatim: "Pepper warmth builds slowly and feels premium - I keep this for my late-night tea break.",
    source: "Amazon",
    social: ["Reddit"],
    rating: "4.1/5",
  },
  {
    flavor: "Coffee",
    product: "Good Day Coffee Cookies",
    verbatim: "Strong coffee aroma and crisp bite make it my default 4 pm desk snack.",
    source: "Amazon",
    social: ["X"],
    rating: "4.6/5",
  },
  {
    flavor: "Jhalmuri",
    product: "50-50 Jhalmuri Spice Crackers",
    verbatim: "Tastes exactly like Kolkata street jhalmuri masala and feels super nostalgic.",
    source: "Flipkart",
    social: ["Instagram"],
    rating: "4.3/5",
  },
  {
    flavor: "Kasundi Mustard",
    product: "50-50 Kasundi Mustard Sticks",
    verbatim: "Sharp mustard punch is the hero here - perfect for rainy-day snacking with tea.",
    source: "Amazon",
    social: ["Reddit"],
    rating: "4.2/5",
  },
];

const getVoiceChannels = (row) => [row.source, ...(row.social || [])].join(" · ");

export const DocVerbatimsCard = () => (
  <div className="card">
    <div className="card-h">
      <h3>Customer voices</h3>
      <span className="tag">Amazon · Flipkart · Instagram · Reddit · X · YouTube</span>
    </div>
    <div className="card-body">
      {FLAVOR_VERBATIMS.map((row) => {
        const channels = getVoiceChannels(row);
        return (
        <div
          key={`${row.flavor}-${channels}`}
          className="quote clickable"
          onClick={() =>
            openDetail({
              type: "Customer voice",
              title: row.flavor,
              body: row.verbatim,
              facts: [
                { k: "Flavor", v: row.flavor },
                { k: "Channels", v: channels },
                { k: "Rating", v: row.rating },
              ],
              source: `${channels} · ${row.rating}`,
            })
          }
        >
          <p>&quot;{row.verbatim}&quot;</p>
          <div className="att">{row.flavor} · {channels} · {row.rating} · click to expand</div>
        </div>
        );
      })}
    </div>
  </div>
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
                          <StateMetricsByType state={row.state} metrics={metrics} />
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
              <th>Alignment</th>
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
                <td>{row.alignment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FLAVOR_BRAND_ROWS = [
  { flavor: "Kaju Katli", brands: "Haldiram's, Bikanervala, Bikaji, G. Pulla Reddy Sweets" },
  { flavor: "Coconut Jaggery", brands: "Pedro Pao, Navruchi" },
  { flavor: "Jalebi", brands: "Haldiram's, Bikanervala, Bikano, Naturals, Vadilal" },
  { flavor: "Badam Pista", brands: "Vadilal, Amul, Havmor, NIC" },
  { flavor: "Bellam / Jaggery", brands: "G. Pulla Reddy Sweets, 24 Mantra Organic, Two Brothers Organic Farms" },
  { flavor: "Gunpowder Podi", brands: "777, MTR, Adukale, Yours Freshly" },
  { flavor: "Gongura", brands: "Priya, Vellanki Foods, A1 Chips, NOICE" },
  { flavor: "Tamarind", brands: "GO DESi, SWAD, Paper Boat, Mapro" },
  { flavor: "Curry Leaf", brands: "Sweet Karam Coffee, Adukale, The Whole Truth" },
  { flavor: "Garlic Chilli", brands: "Jabsons, South Side Habits, Ching's, Wingreens" },
  { flavor: "Wild Honey", brands: "Akshayakalpa Organic, Safa Honey Co., Indigenous Honey" },
  { flavor: "Orange Blossom", brands: "Maksika Honey, Honey and Spice" },
  { flavor: "Kiwi", brands: "Naturals, Paper Boat, Mapro, Mala's" },
  { flavor: "Himalayan Berry", brands: "Himalayan Berry, IMC" },
  { flavor: "Black Sesame", brands: "Nomou, Mochico, Smoor" },
  { flavor: "Smoked Chilli", brands: "Saucy Joe's, SmallBatch, Naagin" },
  { flavor: "Bamboo Shoot", brands: "Graminway, Coorg Basket, Y Not" },
  { flavor: "Black Sesame Salt", brands: "S&B, Bakefat India" },
  { flavor: "Sichuan Pepper", brands: "Moi Soi, Ching's, HUNAN AT HOME" },
  { flavor: "Nolen Gur", brands: "NIC, Pabrai's, Keventer Metro, Rollick" },
  { flavor: "Pudina Masala", brands: "Haldiram's, Evolve Snacks" },
  { flavor: "Schezwan", brands: "Kurkure, Ching's, Jadhav's, GO HUNGRY, Moi Soi" },
  { flavor: "Bebinca Caramel", brands: "Pedro Pao" },
  { flavor: "Cashew", brands: "Haldiram's, Bikaji, Krishival, The Snack Company, Trader Joe's" },
  { flavor: "Recheado Spice", brands: "Karma Foods, SARANZ" },
  { flavor: "Kokum", brands: "Paper Boat, Mapro, Khuvi Organics" },
  { flavor: "Xacuti Spice", brands: "Karma Foods, Best Foods Goa" },
  { flavor: "Shrikhand", brands: "Amul, Govardhan, Madhav Sweets, Naturals, Rangoli" },
  { flavor: "Basundi", brands: "Mother Dairy, Gokul, Manoj Ice Cream" },
  { flavor: "Methi Masala", brands: "Hira Sweets, Chandra Snacks" },
  { flavor: "Sev Masala", brands: "Haldiram's, Bikaji, Balaji, Aakash Namkeen" },
  { flavor: "Green Chilli Lime", brands: "Mr. Makhana, NoHo, FabBox" },
  { flavor: "Apple Cinnamon", brands: "Nourish Organics, Pure Project, Hostess" },
  { flavor: "Pahadi Chilli", brands: "N/A" },
  { flavor: "Garlic Herb", brands: "Wingreens, Cornitos, Sorrentina" },
  { flavor: "Mint", brands: "Pulse, Alpenliebe, Orbit, Tic Tac, Haldiram's" },
  { flavor: "Walnut Spice", brands: "Vibrant Living" },
  { flavor: "Nippattu Spice", brands: "Anand Sweets, Sweet Karam Coffee, Tasty World, Modern Kitchens" },
  { flavor: "Mysore Pak", brands: "Sri Krishna Sweets, Anand Sweets, India Sweet House, Haldiram's, A2B" },
  { flavor: "Black Pepper", brands: "Snack Factory, Sri Radhaa's, Grab N Eat" },
  { flavor: "Honey", brands: "Dabur, Saffola, Kellogg's, Yoga Bar, The Whole Truth" },
  { flavor: "Black Rice Sweet", brands: "For8, Chakhao, Manipur Organic Mission Agency" },
  { flavor: "Assam Tea", brands: "Tata Tea, Halmari, Vahdam, Octavius, Jayshree Tea" },
  { flavor: "Bhut Jolokia", brands: "Naagin, Wingreens, Rasaveda, SM Freshy" },
  { flavor: "Mustard", brands: "Kasundi, Wingreens, The Gourmet Jar, Veeba, Del Monte" },
  { flavor: "Panch Phoron", brands: "Sunrise, Bharat Masala, JMC, KDA" },
  { flavor: "Soan Papdi", brands: "Haldiram's, Bikaji, Bikano, Bikanervala" },
  { flavor: "Til Jaggery", brands: "Haldiram's, Chitale Bandhu, Garden, Laxmi Narayan Chiwda" },
  { flavor: "Khaja", brands: "Sha Motiram, Suruchi Foods, Parsi Dairy Farm" },
  { flavor: "Motichoor", brands: "Haldiram's, Bikanervala, Bikaji, Bikano" },
  { flavor: "Rabri", brands: "Haldiram's, Bikanervala, Havmor, NIC, Vadilal" },
  { flavor: "Sattu Masala", brands: "BIHARI SATTU, Ganesh, Natureship, Baaghi Ballia" },
  { flavor: "Ajwain", brands: "Haldiram's, Bikano, Aakash Namkeen, 4700BC, Cornitos" },
  { flavor: "Chaat Masala", brands: "MDH, Everest, Catch, Tata Sampann, Haldiram's" },
  { flavor: "Mahua Honey", brands: "Cottage Wellness, Dr. Bee's" },
  { flavor: "Chana Jor Masala", brands: "Haldiram's, Bikaji, Svasthyaa, Medhyata" },
  { flavor: "Red Chilli", brands: "Lay's, Kurkure, Bingo!, Haldiram's, 90's MILL" },
  { flavor: "Ras Malai", brands: "Haldiram's, Bikanervala, Bikaji, NIC, Vadilal" },
  { flavor: "Achari Spice", brands: "Bingo!, Too Yumm!, Ching's, Haldiram's, Lay's" },
  { flavor: "Tandoori Spice", brands: "Too Yumm!, Open Secret, Haldiram's, A1 Chips, ONE HEALTH NUTRI" },
  { flavor: "Banana Jaggery", brands: "A1 Chips, Flavors of Kerala, Mylapore Ganapathy's, Amma's Kitchen" },
  { flavor: "Ada Pradhaman", brands: "Tasty Nibbles, Kanchana, Double Horse" },
  { flavor: "Coconut Pepper", brands: "N/A" },
  { flavor: "Malabar Spice", brands: "Beyond Snack, A1 Chips" },
  { flavor: "Ginger Chilli", brands: "Blue Dragon" },
  { flavor: "Gajar Halwa", brands: "Haldiram's, Bikanervala, Naturals, Arun Icecreams, Bikano" },
  { flavor: "Gulab Jamun", brands: "Haldiram's, Bikanervala, Bikaji, Gits, NIC" },
  { flavor: "Namkeen Masala", brands: "Haldiram's, Bikaji, Yellow Diamond, Balaji, Aakash Namkeen" },
  { flavor: "Modak Coconut", brands: "HOCCO, Chitale Bandhu, Bikanervala" },
  { flavor: "Pineapple", brands: "Paper Boat, Mapro, Naturals, Mala's, Vadilal" },
  { flavor: "Passion Fruit", brands: "Paper Boat, Mapro, Häagen-Dazs, Naturals" },
  { flavor: "Sesame Chilli", brands: "Real Thai, Ghee Hiang, Moi Soi" },
  { flavor: "Herb Mix", brands: "Wingreens, Cornitos, Sorrentina, Keya" },
  { flavor: "Turmeric", brands: "The Snack Company, Stanes, Taali" },
  { flavor: "Citrus", brands: "Tic Tac, Pulse, Shadani, Paper Boat, Mapro" },
  { flavor: "Banana Blossom Honey", brands: "Galho Wild Foods, HoneyKart" },
  { flavor: "Bird's Eye Chilli", brands: "Ong's, Hot Toddy" },
  { flavor: "Rice Malt Caramel", brands: "SMOOR" },
  { flavor: "Naga Garlic", brands: "Zonee, Saucy Joe's, Bengamese" },
  { flavor: "Chhena Poda", brands: "OMFED, Crecta Foods, Chenapodo, Native Milk" },
  { flavor: "Rasgulla", brands: "Haldiram's, Bikaji, Bikanervala, Bikano, Amul" },
  { flavor: "Phirni", brands: "Haldiram's, Bikano" },
  { flavor: "Ker Sangri Spice", brands: "Spice Platter, Indiana Organic, Delight Foods" },
  { flavor: "Gundruk", brands: "The Northeast Store" },
  { flavor: "Cardamom Milk", brands: "Amul, Mother Dairy, Keventers" },
  { flavor: "Mandarin Orange", brands: "Ossoro, PRAN" },
  { flavor: "Berry", brands: "Farmley, SnackAmor, The Gourmet Stories" },
  { flavor: "Kesar Milk", brands: "Amul, Mother Dairy" },
  { flavor: "Qubani Apricot", brands: "Sitara Foods, Naturogin, Charminar Hotel" },
  { flavor: "Mosdeng Chilli", brands: "N/A" },
  { flavor: "Bhang Jeera", brands: "The Pahari Life, House of Himalayas, KUDAAL, Anamaya" },
  { flavor: "Bal Mithai", brands: "Kheem Singh Mohan Singh Rautela Sweets" },
  { flavor: "Singori Coconut", brands: "Kheem Singh Mohan Singh Rautela Sweets" },
  { flavor: "Mishti Doi", brands: "Mother Dairy, Amul, Epigamia, Milky Mist" },
  { flavor: "Kasundi", brands: "Biswa Bangla, Cookme, Sunrise" },
  { flavor: "Jhalmuri Masala", brands: "Bikaji, Balaji" },
  { flavor: "Gondhoraj Lime", brands: "Pabrai's, FAB, Ossoro" },
  { flavor: "Chanachur", brands: "Mukharochak, Haldiram's, Bikaji" },
];

export const DocBrandsCard = () => (
  <div className="card">
    <div className="card-h">
      <h3>Brands</h3>
      <span className="tag">{FLAVOR_BRAND_ROWS.length} flavor rows</span>
    </div>
    <div className="card-body state-table-wrap">
      <table className="national-table brand-table">
        <thead>
          <tr>
            <th>Flavor</th>
            <th>Brands</th>
          </tr>
        </thead>
        <tbody>
          {FLAVOR_BRAND_ROWS.map((row) => (
            <tr
              key={row.flavor}
              className="clickable-row"
              onClick={() =>
                openDetail({
                  type: "Brands",
                  title: row.flavor,
                  body: row.brands,
                  facts: [
                    { k: "Flavor", v: row.flavor },
                    { k: "Brands", v: row.brands },
                  ],
                  source: "Section 4 · Brands",
                })
              }
            >
              <td><b>{row.flavor}</b></td>
              <td>{row.brands}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

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

const parseNationalVolume = (value) => {
  const text = String(value || "").trim();
  const n = parseFloat(text.replace(/,/g, ""));
  if (Number.isNaN(n)) return 0;
  if (/m$/i.test(text)) return n * 1000000;
  if (/k$/i.test(text)) return n * 1000;
  return n;
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
            {th("convVolume", "Conversation volume")}
            {th("engVolume", "Engagement volume")}
            {th("conv", "Conversation growth")}
            {th("eng", "Engagement growth")}
            {th("diyIndex", "DIY Index")}
            {th("shareabilityIndex", "Shareability Index")}
            {th("cravingIndex", "Craving Index")}
            {th("comfortIndex", "Comfort Index")}
            {th("curiosityIndex", "Curiosity Index")}
            <th>Why popular</th>
            {th("trend", "Trend Type")}
            <th>States Popular in</th>
            <th>When trends</th>
            <th>Product Extension Recommendations</th>
            <th>Britannia portfolio fit</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={16} className="national-table-empty">
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
                  <td><span className="national-volume">{f.convVolume || "-"}</span></td>
                  <td><span className="national-volume">{f.engVolume || "-"}</span></td>
                  <td><span className="national-growth">{formatGrowth(f.convGrowth)}</span></td>
                  <td><span className="national-growth">{formatGrowth(f.engGrowth)}</span></td>
                  <td><span className="national-index">{f.diyIndex ?? "-"}</span></td>
                  <td><span className="national-index">{f.shareabilityIndex ?? "-"}</span></td>
                  <td><span className="national-index">{f.cravingIndex ?? "-"}</span></td>
                  <td><span className="national-index">{f.comfortIndex ?? "-"}</span></td>
                  <td><span className="national-index">{f.curiosityIndex ?? "-"}</span></td>
                  <td className="national-why-cell">{f.whyPopular}</td>
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
                  <td className="national-when-cell">{f.whenTrends}</td>
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
  const [sortKey, setSortKey] = useState("source");
  const [sortDir, setSortDir] = useState("asc");
  const matrixPoints = useMemo(() => NATIONAL_FLAVORS, []);

  const sortedRows = useMemo(() => {
    const rows = [...NATIONAL_FLAVORS];
    if (sortKey === "source") return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "convVolume") return (parseNationalVolume(a.convVolume) - parseNationalVolume(b.convVolume)) * dir;
      if (sortKey === "engVolume") return (parseNationalVolume(a.engVolume) - parseNationalVolume(b.engVolume)) * dir;
      if (sortKey === "conv") return (parsePct(a.convGrowth) - parsePct(b.convGrowth)) * dir;
      if (sortKey === "eng") return (parsePct(a.engGrowth) - parsePct(b.engGrowth)) * dir;
      if (sortKey === "diyIndex") return ((a.diyIndex || 0) - (b.diyIndex || 0)) * dir;
      if (sortKey === "shareabilityIndex") return ((a.shareabilityIndex || 0) - (b.shareabilityIndex || 0)) * dir;
      if (sortKey === "cravingIndex") return ((a.cravingIndex || 0) - (b.cravingIndex || 0)) * dir;
      if (sortKey === "comfortIndex") return ((a.comfortIndex || 0) - (b.comfortIndex || 0)) * dir;
      if (sortKey === "curiosityIndex") return ((a.curiosityIndex || 0) - (b.curiosityIndex || 0)) * dir;
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
      body: row.whyPopular || row.extensions,
      facts: [
        { k: "Conversation volume", v: row.convVolume },
        { k: "Engagement volume", v: row.engVolume },
        { k: "Conv. growth", v: row.convGrowth || f.convGrowth },
        { k: "Eng. growth", v: row.engGrowth || f.engGrowth },
        { k: "DIY Index", v: row.diyIndex != null ? String(row.diyIndex) : undefined },
        { k: "Shareability Index", v: row.shareabilityIndex != null ? String(row.shareabilityIndex) : undefined },
        { k: "Craving Index", v: row.cravingIndex != null ? String(row.cravingIndex) : undefined },
        { k: "Comfort Index", v: row.comfortIndex != null ? String(row.comfortIndex) : undefined },
        { k: "Curiosity Index", v: row.curiosityIndex != null ? String(row.curiosityIndex) : undefined },
        { k: "Trend", v: row.trendType || f.trendType },
        { k: "Where popular", v: row.states || f.states },
        { k: "When trends", v: row.whenTrends },
        { k: "Extensions", v: row.extensions || f.extensions },
        { k: "Brand fit", v: row.brandFit || f.brandFit },
      ].filter((fact) => fact.v),
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
  const [flavorName, setFlavorName] = useState("Kaju Katli");
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
              {selectedType === "creative_brief" ? "Additional questions for the brief" : "Brief on Instructions"} <span className="hint">optional</span>
            </label>
            <textarea
              id="gi-instructions"
              className="configure-textarea"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={selectedType === "creative_brief"
                ? "Add any extra questions the creative brief should answer."
                : "e.g. Focus on Instagram Reels for 18-24 age group, use regional language hooks, include a festive angle..."
              }
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

/* ============================================================
   Simple state table (v2)
============================================================ */
export const DocSimpleStateTableCard = () => (
  <div className="card simple-state-table-card">
    <div className="card-h">
      <h3>State-wise flavor overview</h3>
      <span className="tag">{DEMO_STATES.length} states · top 5 sweet &amp; savory</span>
    </div>
    <div className="card-body state-table-wrap">
      <table className="national-table simple-state-table">
        <thead>
          <tr>
            <th>State</th>
            <th>Top 5 Sweet</th>
            <th>Top 5 Savory</th>
          </tr>
        </thead>
        <tbody>
          {DEMO_STATES.map((s) => (
            <tr key={s.state}>
              <td className="sst-state"><b>{s.state}</b></td>
              <td className="sst-flavors sst-sweet">
                {s.sweet.slice(0, 5).map((f, i) => (
                  <span key={f} className="sst-pill sst-pill--sweet">
                    <span className="sst-rank">{i + 1}</span>{f}
                  </span>
                ))}
              </td>
              <td className="sst-flavors sst-savory">
                {s.savory.slice(0, 5).map((f, i) => (
                  <span key={f} className="sst-pill sst-pill--savory">
                    <span className="sst-rank">{i + 1}</span>{f}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ============================================================
   Flavor Prioritization Matrix (v2 singular view)
============================================================ */

const parseNatVol = (v) => parseFloat(String(v).replace(/[Kk]/, "")) || 0;

const medianVal = (arr) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const getBrandCount = (flavorName) => {
  const row = FLAVOR_BRAND_ROWS.find((r) => r.flavor === flavorName);
  if (!row) return 0;
  return row.brands.split(",").filter((b) => b.trim()).length;
};

const FLAVOR_VOICE_QUOTES: Record<string, string> = {
  "Kaju Katli": "Nothing says celebration like kaju katli — it's the one mithai you actually want to receive, not just give. The cashew richness just hits differently in biscuit form.",
  "Nolen Gur": "The moment I smell nolen gur I'm back in Kolkata in January. Smoky, sweet, irreplaceable — nothing from a bottle comes close to the real thing.",
  "Honey": "Found raw forest honey from a tribal market last year and it completely changed how I think about sweetness. Floral, slightly tangy — nothing like the supermarket stuff.",
  "Schezwan": "Schezwan is literally on everything now — maggi, momos, dosa — and I'm not complaining. That garlic-chilli heat with a hint of sweetness is genuinely addictive.",
  "Garlic Chilli": "Garlic chilli is my baseline now. Plain snacks feel boring after you've had something with that proper garlic-chilli punch. Can't go back.",
  "Bhut Jolokia": "Tried Bhut Jolokia chutney once in Nagaland and I've been chasing that flavour ever since. It's not just heat — there's an actual fruity depth underneath the fire.",
  "Tandoori Spice": "Tandoori snacks just make sense — smoky, spiced, but familiar enough that you finish the whole packet without noticing. That charred smokiness is what I'm hooked on.",
  "Mishti Doi": "Mishti doi is the comfort food I never talk about enough. Sweet but not cloying, and that slight tang makes it feel almost earned. Wish everything came in mishti doi flavour.",
};

const TREND_DOT_COLORS = {
  Established: "#5B8DEF",
  Emerging: "#3DDC84",
  Seasonal: "#F0A04B",
  "Regional Classic": "#A78BFA",
  Fad: "#F05252",
  Stable: "#7A808A",
};
const trendDotColor = (t) => TREND_DOT_COLORS[t] || TREND_DOT_COLORS.Stable;

const FlavorDetailModal = ({ flavor, onClose, onRunDeliverable, busy }) => {
  const trendData = useMemo(
    () => buildTrendData([{ flavor: flavor.name, convVolume: flavor.convVolume, convGrowth: flavor.convGrowth }]),
    [flavor]
  );
  const brandCount = getBrandCount(flavor.name);

  const deliverables = [
    { label: "Generate a Concept Card", actionId: "concept_cards" },
    { label: "Generate a Video Ad Storyboard", actionId: "storyboard" },
    { label: "Generate Message and Comms Recommendation", actionId: "creative_brief" },
  ];

  const indices = [
    ["DIY Index", flavor.diyIndex],
    ["Shareability", flavor.shareabilityIndex],
    ["Consumption Intent", flavor.cravingIndex],
    ["Comfort", flavor.comfortIndex],
    ["Curiosity", flavor.curiosityIndex],
  ];

  return (
    <div className="flavor-modal-overlay" onClick={onClose}>
      <div className="flavor-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="flavor-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="flavor-modal-header">
          <h2 className="flavor-modal-title">{flavor.name}</h2>
          <div className="flavor-modal-header-badges">
            <span className="flavor-modal-trend-badge" style={{ background: trendDotColor(flavor.trendType) }}>
              {flavor.trendType}
            </span>
            {CROSS_CATEGORY_FLAVORS.has(flavor.name) && <span className="flavor-flag flavor-flag--cat">Cross-Category</span>}
            {isCrossRegion(flavor.states || "") && <span className="flavor-flag flavor-flag--reg">Cross-Region</span>}
          </div>
        </div>

        <div className="flavor-modal-body flavor-modal-body--split">
          {/* ── Left column ── */}
          <div className="flavor-modal-left">
            {/* Core metrics row */}
            <div className="flavor-modal-core-metrics">
              {[
                ["Conv. Volume", flavor.convVolume],
                ["Eng. Volume", flavor.engVolume],
                ["Conv. Growth", flavor.convGrowth],
                ["Eng. Growth", flavor.engGrowth],
                ["Trend Type", flavor.trendType],
                ["No. of Brands", brandCount || "—"],
              ].map(([label, val]) => (
                <div key={label} className="flavor-modal-metric-item">
                  <span className="fmm-label">{label}</span>
                  <b className="fmm-val">{val}</b>
                </div>
              ))}
            </div>

            {/* Qual fields */}
            <div className="flavor-modal-qual">
              {[
                ["Why the Flavor is Popular", flavor.whyPopular],
                ["States Most Popular In", flavor.states],
                ["When the Flavor Trends", flavor.whenTrends],
                ["Product Extensions", flavor.extensions],
                ["Britannia Fit", flavor.brandFit],
              ]
                .filter(([, v]) => v)
                .map(([label, val]) => (
                  <div key={label} className="flavor-modal-qual-item">
                    <span className="fmq-label">{label}</span>
                    <p className="fmq-val">{val}</p>
                  </div>
                ))}
            </div>

            {/* Consumer verbatim */}
            {FLAVOR_VOICE_QUOTES[flavor.name] && (
              <div className="flavor-modal-verbatim">
                <span className="flavor-modal-verbatim__mark">"</span>
                <p className="flavor-modal-verbatim__text">{FLAVOR_VOICE_QUOTES[flavor.name]}</p>
                <span className="flavor-modal-verbatim__source">Consumer voice · Social listening</span>
              </div>
            )}

            {/* Trendline */}
            <div className="flavor-modal-trend-chart">
              <p className="flavor-modal-chart-label">Conversation volume · L1Y trend</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={trendData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid stroke="#E6E1D8" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#8A8478" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#8A8478" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [v, "Conv. Volume"]}
                  />
                  <Line type="monotone" dataKey={flavor.name} stroke="#B4232A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Right column — 5 index scores ── */}
          <div className="flavor-modal-right">
            <p className="flavor-modal-indices-label">Flavor Indices</p>
            {indices.map(([label, val]) => (
              <div key={label} className="flavor-modal-index-item">
                <span className="fmi-val">{val ?? "—"}</span>
                <span className="fmi-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flavor-modal-actions">
          {deliverables.map((d) => (
            <button
              key={d.actionId}
              className="flavor-modal-action-btn"
              disabled={busy}
              onClick={() => {
                onRunDeliverable?.({ actionId: d.actionId, flavor: flavor.name, brandFit: flavor.brandFit, state: "Maharashtra", instructions: "" });
                onClose();
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const PrioritizeTable = ({ flavors }) => {
  const [sortKey, setSortKey] = useState("convVolume");
  const [sortDir, setSortDir] = useState("desc");

  const sorted = useMemo(() => {
    const rows = [...flavors];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "convVolume") return (parseNatVol(a.convVolume) - parseNatVol(b.convVolume)) * dir;
      if (sortKey === "engVolume") return (parseNatVol(a.engVolume) - parseNatVol(b.engVolume)) * dir;
      if (sortKey === "convGrowth") return (parsePct(a.convGrowth) - parsePct(b.convGrowth)) * dir;
      if (sortKey === "engGrowth") return (parsePct(a.engGrowth) - parsePct(b.engGrowth)) * dir;
      if (sortKey === "diyIndex") return ((a.diyIndex || 0) - (b.diyIndex || 0)) * dir;
      if (sortKey === "shareabilityIndex") return ((a.shareabilityIndex || 0) - (b.shareabilityIndex || 0)) * dir;
      if (sortKey === "cravingIndex") return ((a.cravingIndex || 0) - (b.cravingIndex || 0)) * dir;
      if (sortKey === "comfortIndex") return ((a.comfortIndex || 0) - (b.comfortIndex || 0)) * dir;
      if (sortKey === "curiosityIndex") return ((a.curiosityIndex || 0) - (b.curiosityIndex || 0)) * dir;
      return 0;
    });
    return rows;
  }, [flavors, sortKey, sortDir]);

  const onSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  };

  const SortTh = ({ k, label }) => (
    <th className="sortable" onClick={() => onSort(k)} style={{ cursor: "pointer", userSelect: "none" }}>
      {label}{sortKey === k ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div className="prioritize-table-wrap">
      <div className="prioritize-table-head">
        <h4>Prioritize · top-right quadrant</h4>
        <span className="tag">{sorted.length} flavors</span>
      </div>
      <div className="state-table-wrap">
        <table className="national-table prioritize-table">
          <thead>
            <tr>
              <SortTh k="name" label="Flavor" />
              <SortTh k="convVolume" label="Conv. Volume" />
              <SortTh k="engVolume" label="Eng. Volume" />
              <SortTh k="convGrowth" label="Conv. Growth" />
              <SortTh k="engGrowth" label="Eng. Growth" />
              <SortTh k="diyIndex" label="DIY" />
              <SortTh k="shareabilityIndex" label="Shareability" />
              <SortTh k="cravingIndex" label="Craving" />
              <SortTh k="comfortIndex" label="Comfort" />
              <SortTh k="curiosityIndex" label="Curiosity" />
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f) => (
              <tr key={f.name}>
                <td><b>{f.name}</b></td>
                <td>{f.convVolume}</td>
                <td>{f.engVolume}</td>
                <td>{f.convGrowth}</td>
                <td>{f.engGrowth}</td>
                <td><span className="national-index">{f.diyIndex ?? "—"}</span></td>
                <td><span className="national-index">{f.shareabilityIndex ?? "—"}</span></td>
                <td><span className="national-index">{f.cravingIndex ?? "—"}</span></td>
                <td><span className="national-index">{f.comfortIndex ?? "—"}</span></td>
                <td><span className="national-index">{f.curiosityIndex ?? "—"}</span></td>
                <td>{f.trendType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Cross-category / cross-region helpers ── */
const CROSS_CATEGORY_FLAVORS = new Set([
  "Honey", "Wild Honey", "Mahua Honey", "Kesar Milk", "Turmeric",
  "Coconut Jaggery", "Tamarind", "Schezwan", "Garlic Chilli", "Kokum",
  "Gondhoraj Lime", "Nolen Gur", "Sattu Masala", "Til Jaggery",
  "Black Pepper", "Assam Tea", "Passion Fruit", "Pineapple",
  "Mishti Doi", "Shrikhand", "Bhang Jeera", "Kasundi", "Gongura",
  "Gajar Halwa", "Panch Phoron", "Garlic Chutney",
]);

const ZONE_MAP: Record<string, string> = {
  ap: "south", ka: "south", kerala: "south", tn: "south", telangana: "south",
  bihar: "east", jh: "east", odisha: "east", wb: "east", "west bengal": "east",
  goa: "west", gujarat: "west", mh: "west", maharashtra: "west",
  delhi: "north", "delhi ncr": "north", haryana: "north", hp: "north",
  punjab: "north", rj: "north", up: "north", uttarakhand: "north",
  arunachal: "northeast", assam: "northeast", manipur: "northeast",
  meghalaya: "northeast", mizoram: "northeast", nagaland: "northeast",
  sikkim: "northeast", tripura: "northeast",
  cg: "central", mp: "central",
};

const isCrossRegion = (states: string): boolean => {
  const parts = states.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (parts.length >= 5) return true;
  const zones = new Set(parts.map((s) => ZONE_MAP[s]).filter(Boolean));
  return zones.size >= 3;
};

export const DocFlavorMatrixCard = ({ onRunDeliverable, busy }) => {
  const [hovered, setHovered] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("both");
  const [stateFilter, setStateFilter] = useState("All States");
  const [showCrossCategory, setShowCrossCategory] = useState(false);
  const [showCrossRegion, setShowCrossRegion] = useState(false);
  const hideTimerRef = useRef(null);

  // Build sweet/savory category map from state data
  const flavorCategories = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    DEMO_STATES.forEach((s) => {
      s.sweet.forEach((f) => { if (!map[f]) map[f] = new Set(); map[f].add("sweet"); });
      s.savory.forEach((f) => { if (!map[f]) map[f] = new Set(); map[f].add("savory"); });
    });
    return map;
  }, []);

  // Set of flavors visible in the selected state
  const stateFlavorSet = useMemo(() => {
    if (stateFilter === "All States") return null;
    const s = DEMO_STATES.find((d) => d.state === stateFilter);
    if (!s) return null;
    return new Set([...s.sweet, ...s.savory]);
  }, [stateFilter]);

  const plotData = useMemo(
    () =>
      NATIONAL_FLAVORS.map((p) => ({
        name: p.name,
        conv: parseNatVol(p.convVolume),
        eng: parseNatVol(p.engVolume),
        trendType: p.trendType,
        raw: p,
      })),
    []
  );

  const filteredPlotData = useMemo(() => {
    return plotData.filter((d) => {
      if (stateFlavorSet && !stateFlavorSet.has(d.name)) return false;
      if (categoryFilter !== "both") {
        const cats = flavorCategories[d.name] || new Set();
        if (!cats.has(categoryFilter)) return false;
      }
      if (showCrossCategory && !CROSS_CATEGORY_FLAVORS.has(d.name)) return false;
      if (showCrossRegion && !isCrossRegion(d.raw.states || "")) return false;
      return true;
    });
  }, [plotData, stateFlavorSet, categoryFilter, flavorCategories, showCrossCategory, showCrossRegion]);

  const convVals = plotData.map((d) => d.conv);
  const engVals = plotData.map((d) => d.eng);
  const midConv = medianVal(convVals);
  const midEng = medianVal(engVals);
  const maxConv = Math.ceil(Math.max(...convVals, 10) + 4);
  const maxEng = Math.ceil(Math.max(...engVals, 10) + 4);

  const topRight = useMemo(
    () => NATIONAL_FLAVORS.filter((p) => parseNatVol(p.convVolume) >= midConv && parseNatVol(p.engVolume) >= midEng),
    [midConv, midEng]
  );

  const showHover = useCallback((info) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setHovered(info);
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setHovered(null), 220);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  return (
    <div className="card flavor-matrix-v2-card">
      <div className="card-h">
        <h3>Flavor Prioritization View</h3>
        <span className="tag">{filteredPlotData.length} of {NATIONAL_FLAVORS.length} flavors</span>
      </div>
      <div className="card-body">

        {/* ── Filters ── */}
        <div className="matrix-filters">
          <div className="matrix-filter-group">
            <span className="matrix-filter-label">Category</span>
            <div className="matrix-filter-toggle">
              {["both", "sweet", "savory"].map((opt) => (
                <button
                  key={opt}
                  className={"matrix-filter-btn " + (categoryFilter === opt ? "sel" : "")}
                  onClick={() => setCategoryFilter(opt)}
                >
                  {opt === "both" ? "Both" : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="matrix-filter-group">
            <span className="matrix-filter-label">State</span>
            <select
              className="matrix-filter-select"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="All States">All States</option>
              {DEMO_STATES.map((s) => (
                <option key={s.state} value={s.state}>{s.state}</option>
              ))}
            </select>
          </div>
          <div className="matrix-filter-group">
            <span className="matrix-filter-label">Signals</span>
            <div className="matrix-filter-toggle">
              <button
                className={"matrix-filter-btn " + (showCrossCategory ? "sel sel--gold" : "")}
                onClick={() => setShowCrossCategory((v) => !v)}
              >
                ◈ Cross-Category
              </button>
              <button
                className={"matrix-filter-btn " + (showCrossRegion ? "sel sel--blue" : "")}
                onClick={() => setShowCrossRegion((v) => !v)}
              >
                ◎ Cross-Region
              </button>
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <div className="brit-priority-matrix__quadrants" aria-hidden>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--tl">Build momentum</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--tr">Prioritize</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--bl">Fading / fad</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--br">Niche loyal</span>
          </div>

          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 24, right: 28, bottom: 48, left: 44 }}>
              <CartesianGrid stroke="#E6E1D8" strokeDasharray="3 4" />
              <ReferenceLine x={midEng} stroke="#8A8478" strokeDasharray="4 4" strokeOpacity={0.4} />
              <ReferenceLine y={midConv} stroke="#8A8478" strokeDasharray="4 4" strokeOpacity={0.4} />
              <XAxis
                type="number"
                dataKey="eng"
                domain={[0, maxEng]}
                tick={{ fill: "#6F695E", fontSize: 11 }}
                tickFormatter={(v) => `${v}K`}
                axisLine={{ stroke: "#D2CCC0", strokeWidth: 1 }}
                tickLine={false}
                label={{ value: "Engagement Volume", position: "insideBottom", offset: -32, fill: "#6F695E", fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="conv"
                domain={[0, maxConv]}
                tick={{ fill: "#6F695E", fontSize: 11 }}
                tickFormatter={(v) => `${v}K`}
                axisLine={{ stroke: "#D2CCC0", strokeWidth: 1 }}
                tickLine={false}
                width={72}
                label={{ value: "Conversation Volume", angle: -90, position: "insideLeft", offset: 30, fill: "#6F695E", fontSize: 11 }}
              />
              <Tooltip content={() => null} cursor={false} />
              <Scatter
                data={filteredPlotData}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null) return null;
                  const isCat = CROSS_CATEGORY_FLAVORS.has(payload.name);
                  const isReg = isCrossRegion(payload.raw?.states || "");
                  return (
                    <g
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => showHover({ cx, cy, data: payload })}
                      onMouseLeave={scheduleHide}
                    >
                      {isReg && <circle cx={cx} cy={cy} r={13} fill="none" stroke="#5B8DEF" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.85} />}
                      {isCat && <circle cx={cx} cy={cy} r={isReg ? 18 : 13} fill="none" stroke="#C9A227" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.85} />}
                      <circle cx={cx} cy={cy} r={8} fill={trendDotColor(payload.trendType)} stroke="#fff" strokeWidth={2.5} opacity={0.9} />
                    </g>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>

          {hovered && (
            <div
              className="flavor-hover-tip"
              style={{ position: "absolute", left: hovered.cx + 16, top: hovered.cy - 20, zIndex: 20 }}
              onMouseEnter={cancelHide}
              onMouseLeave={scheduleHide}
            >
              <div className="flavor-hover-tip__name">{hovered.data.name}</div>
              <div className="flavor-hover-tip__metrics">
                <div><span>Conv. Volume</span> <b>{hovered.data.raw.convVolume}</b></div>
                <div><span>Eng. Volume</span> <b>{hovered.data.raw.engVolume}</b></div>
              </div>
              {(CROSS_CATEGORY_FLAVORS.has(hovered.data.name) || isCrossRegion(hovered.data.raw?.states || "")) && (
                <div className="flavor-hover-tip__flags">
                  {CROSS_CATEGORY_FLAVORS.has(hovered.data.name) && <span className="flavor-flag flavor-flag--cat">Cross-Category</span>}
                  {isCrossRegion(hovered.data.raw?.states || "") && <span className="flavor-flag flavor-flag--reg">Cross-Region</span>}
                </div>
              )}
              <button
                className="flavor-hover-tip__cta"
                onClick={() => {
                  setSelectedFlavor(hovered.data.raw);
                  setHovered(null);
                }}
              >
                Explore Flavor →
              </button>
            </div>
          )}
        </div>

        <div className="brit-priority-matrix__legend" style={{ marginTop: 12, marginBottom: 28 }}>
          {Object.entries(TREND_DOT_COLORS).map(([label, color]) => (
            <span key={label} className="brit-priority-matrix__legend-item">
              <i style={{ background: color }} />
              {label}
            </span>
          ))}
          <span className="brit-priority-matrix__legend-item legend-ring-item">
            <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="#C9A227" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
            Cross-Category
          </span>
          <span className="brit-priority-matrix__legend-item legend-ring-item">
            <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="none" stroke="#5B8DEF" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
            Cross-Region
          </span>
        </div>

        <PrioritizeTable flavors={topRight} />

        {selectedFlavor && (
          <FlavorDetailModal
            flavor={selectedFlavor}
            onClose={() => setSelectedFlavor(null)}
            onRunDeliverable={onRunDeliverable}
            busy={busy}
          />
        )}
      </div>
    </div>
  );
};
