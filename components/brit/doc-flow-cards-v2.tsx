// @ts-nocheck
"use client";

import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import { createPortal } from "react-dom";
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
  FLAVOR_KEY_INSIGHTS,
  hasFlavorKeyInsight,
  getStateInsight,
  getStateMetrics,
  CROSS_STATE_INSIGHTS,
  DELIVERABLE_TYPES,
  parsePct,
  parseNationalStatePills,
  parseNationalExtensions,
  inferNationalCategory,
  STATE_ABBR,
} from "@/lib/demo-flow-data";
import {
  BRANDS_COUNT_TOOLTIP,
  FLAVOR_INDEX_TOOLTIPS,
  getBrandPositioning,
  resolveBrandKey,
} from "@/lib/flavor-card-meta";
import {
  fetchVerbatimFeed,
  hasVerbatimWall,
  FLAVORS_WITH_VERBATIM_WALL,
} from "@/lib/verbatim-feed";
import {
  buildFlavorConvTrendChartData,
  formatConvTrendK,
  hasFlavorConvTrend,
} from "@/lib/flavor-conv-trend";

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
            { id: "weather", label: "Seasonality" },
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
const SIMPLE_STATE_PREVIEW_COUNT = 5;

export const DocSimpleStateTableCard = () => {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = DEMO_STATES.length - SIMPLE_STATE_PREVIEW_COUNT;
  const visibleStates = expanded ? DEMO_STATES : DEMO_STATES.slice(0, SIMPLE_STATE_PREVIEW_COUNT);
  const canToggle = hiddenCount > 0;

  return (
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
            {visibleStates.map((s) => (
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
      {canToggle && (
        <div className="sst-toggle-row">
          <button
            type="button"
            className="sst-toggle-btn"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? "Show fewer states" : `Show ${hiddenCount} states`}
            <span className={"sst-toggle-chevron " + (expanded ? "open" : "")} aria-hidden>▾</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   Flavor Prioritization Matrix (v2 singular view)
============================================================ */

const parseNatVol = (v) => parseFloat(String(v).replace(/[Kk]/, "")) || 0;

const medianVal = (arr) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const meanVal = (arr) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);

const getBrandCount = (flavorName) => {
  const row = FLAVOR_BRAND_ROWS.find((r) => r.flavor === flavorName);
  if (!row) return 0;
  return row.brands.split(",").filter((b) => b.trim()).length;
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

const FLAVOR_CAT_COLORS = { sweet: "#E0922F", savory: "#C0392B" };

const DELIVERABLE_ACTION_LABELS: Record<string, string> = {
  concept_cards: "Concept cards",
  storyboard: "Video ad storyboard",
  creative_brief: "Messaging recommendations",
};

const inferDefaultStateForFlavor = (flavorName: string) => {
  for (const s of DEMO_STATES) {
    if (s.sweet.includes(flavorName) || s.savory.includes(flavorName)) return s.state;
  }
  return "Maharashtra";
};

const DeliverableConfigDialog = ({
  actionId,
  flavor,
  onClose,
  onConfirm,
  busy,
}) => {
  const defaultState = useMemo(
    () => inferDefaultStateForFlavor(flavor?.name || ""),
    [flavor?.name]
  );
  const [state, setState] = useState(defaultState);
  const [instructions, setInstructions] = useState("");

  useEffect(() => {
    setState(defaultState);
    setInstructions("");
  }, [defaultState, actionId]);

  const label = DELIVERABLE_ACTION_LABELS[actionId] || "Deliverable";

  return (
    <div className="deliverable-dialog-overlay" onClick={onClose}>
      <div
        className="deliverable-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deliverable-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="deliverable-dialog__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 id="deliverable-dialog-title" className="deliverable-dialog__title">
          Configure {label}
        </h3>
        <p className="deliverable-dialog__lead muted">
          Confirm state context and any creative specifications before we generate your output.
        </p>

        <div className="deliverable-dialog__field deliverable-dialog__field--locked">
          <span className="deliverable-dialog__label">Flavor</span>
          <div className="deliverable-dialog__locked-val">{flavor?.name}</div>
        </div>

        <div className="deliverable-dialog__field">
          <label className="deliverable-dialog__label" htmlFor="deliverable-state">
            Select state
          </label>
          <select
            id="deliverable-state"
            className="matrix-filter-select deliverable-dialog__select"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            {DEMO_STATES.map((s) => (
              <option key={s.state} value={s.state}>{s.state}</option>
            ))}
          </select>
        </div>

        <div className="deliverable-dialog__field">
          <label className="deliverable-dialog__label" htmlFor="deliverable-specs">
            Specifications <span className="hint">optional</span>
          </label>
          <textarea
            id="deliverable-specs"
            className="deliverable-dialog__textarea"
            rows={4}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Focus on evening chai occasion, Marathi cultural cues, premium 50-50 pack architecture, no health claims…"
          />
        </div>

        <div className="deliverable-dialog__actions">
          <button type="button" className="deliverable-dialog__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="deliverable-dialog__go"
            disabled={busy}
            onClick={() => onConfirm?.({ state, instructions: instructions.trim() })}
          >
            Generate {label}
          </button>
        </div>
      </div>
    </div>
  );
};

const FlavorInfoTip = ({ text }) => (
  <span className="flavor-info-tip">
    <button type="button" className="flavor-info-tip__btn" aria-label="More information">
      i
    </button>
    <span className="flavor-info-tip__bubble" role="tooltip">{text}</span>
  </span>
);

const FlavorBritanniaFitBlock = ({ flavor }) => {
  const brandKey = resolveBrandKey(flavor.brandFit);
  const positioning = getBrandPositioning(flavor.brandFit);

  if (!flavor.brandFit) return null;

  return (
    <div className="flavor-modal-qual-item flavor-modal-qual-item--fit">
      <span className="fmq-label">Recommended Britannia brand</span>
      <p className="fmq-val">
        <strong className="fmq-brand">{brandKey || flavor.brandFit}</strong>
        {positioning ? ` — ${positioning}` : null}
      </p>
    </div>
  );
};

const FlavorProductExtensionsBlock = ({ flavor }) => {
  if (!flavor.extensions) return null;

  return (
    <div className="flavor-modal-qual-item flavor-modal-qual-item--extensions">
      <span className="fmq-label">Product extension ideas</span>
      <p className="fmq-val">{flavor.extensions}</p>
    </div>
  );
};

const VERBATIM_PLATFORM_INITIAL: Record<string, string> = {
  YouTube: "▶",
  Instagram: "◎",
  X: "𝕏",
  Facebook: "f",
  Reddit: "r",
  Social: "◆",
};

const VerbatimWallThumb = ({ post }) => {
  const [failed, setFailed] = useState(false);
  const showImg = post.thumbnailUrl && !failed;
  const initial = VERBATIM_PLATFORM_INITIAL[post.platformLabel] || "◆";

  if (!showImg) {
    return (
      <div
        className={`verbatim-wall-thumb verbatim-wall-thumb--placeholder verbatim-wall-thumb--${post.platformLabel.toLowerCase().replace(/\s+/g, "")}`}
        aria-hidden
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <a
      className="verbatim-wall-thumb"
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${post.platformLabel} post`}
    >
      <img
        src={post.thumbnailUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    </a>
  );
};

const FlavorVerbatimWall = ({ flavorName }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchVerbatimFeed(flavorName, 48)
      .then((rows) => {
        if (!cancelled) setPosts(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Could not load verbatim feed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [flavorName]);

  if (loading) {
    return <div className="verbatim-wall-skeleton" aria-busy="true" aria-label="Loading verbatim wall" />;
  }
  if (error) {
    return <p className="verbatim-wall-status verbatim-wall-status--err">{error}</p>;
  }
  if (!posts.length) {
    return <p className="verbatim-wall-status">No posts in the verbatim dataset for this flavor.</p>;
  }

  return (
    <div className="verbatim-wall-feed" role="feed" aria-label={`Verbatim wall for ${flavorName}`}>
      {posts.map((post) => (
        <article key={post.id} className="verbatim-wall-card">
          <VerbatimWallThumb post={post} />
          <div className="verbatim-wall-card__body">
            <header className="verbatim-wall-card__head">
              <span className={`verbatim-wall-platform verbatim-wall-platform--${post.platformLabel.toLowerCase().replace(/\s+/g, "")}`}>
                {post.platformLabel}
              </span>
              {post.timeLabel && <time className="verbatim-wall-time">{post.timeLabel}</time>}
            </header>
            <p className="verbatim-wall-excerpt">{post.excerpt}</p>
            <footer className="verbatim-wall-card__foot">
              <span className="verbatim-wall-engagement">{post.engagementLabel}</span>
              <a
                className="verbatim-wall-link"
                href={post.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                View post
              </a>
            </footer>
          </div>
        </article>
      ))}
    </div>
  );
};

const FlavorDetailModal = ({ flavor, onClose, onRunDeliverable, busy }) => {
  const [mounted, setMounted] = useState(false);
  const [showPendingIntegrations, setShowPendingIntegrations] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const showKeyInsightTab = hasFlavorKeyInsight(flavor.name);
  const showVerbatimTab = hasVerbatimWall(flavor.name);
  const keyInsightText = FLAVOR_KEY_INSIGHTS[flavor.name];

  useEffect(() => {
    setMounted(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    setActiveTab("overview");
  }, [flavor.name]);

  useEffect(() => {
    if (activeTab === "insight" && !showKeyInsightTab) setActiveTab("overview");
    if (activeTab === "verbatim" && !showVerbatimTab) setActiveTab("overview");
  }, [activeTab, showKeyInsightTab, showVerbatimTab]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const trendData = useMemo(() => {
    const fromSheet = buildFlavorConvTrendChartData(flavor.name);
    if (fromSheet) return fromSheet;
    return buildTrendData([
      { flavor: flavor.name, convVolume: flavor.convVolume, convGrowth: flavor.convGrowth },
    ]);
  }, [flavor]);
  const trendUsesSheetData = hasFlavorConvTrend(flavor.name);
  const brandCount = getBrandCount(flavor.name);

  const deliverables = [
    { label: "Generate a Concept Card", actionId: "concept_cards" },
    { label: "Generate a Video Ad Storyboard", actionId: "storyboard" },
    { label: "Generate Message and Comms Recommendation", actionId: "creative_brief" },
    { label: "Forecast Trend (+24mo)", actionId: "forecast_trend", pending: true },
  ];

  const indices = [
    ["DIY Index", flavor.diyIndex, FLAVOR_INDEX_TOOLTIPS["DIY Index"]],
    ["Shareability", flavor.shareabilityIndex, FLAVOR_INDEX_TOOLTIPS.Shareability],
    ["Consumption Intent", flavor.cravingIndex, FLAVOR_INDEX_TOOLTIPS["Consumption Intent"]],
    ["Advocacy", flavor.comfortIndex, FLAVOR_INDEX_TOOLTIPS.Advocacy],
    ["Health–Indulgence", flavor.curiosityIndex, FLAVOR_INDEX_TOOLTIPS["Health–Indulgence"]],
    ["Gifting", flavor.giftingIndex, FLAVOR_INDEX_TOOLTIPS.Gifting],
  ];

  const qualFields = [
    ["Why the flavor is popular", flavor.whyPopular],
    ["States most popular in", flavor.states],
    ["When the flavor trends", flavor.whenTrends],
  ].filter((row): row is [string, string] => Boolean(row && row[1]));

  const modal = (
    <div className="flavor-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="flavor-modal-card flavor-modal-card--popout"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flavor-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="flavor-modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="flavor-modal-header">
          <div className="flavor-modal-header-main">
            <h2 id="flavor-modal-title" className="flavor-modal-title">{flavor.name}</h2>
            <div className="flavor-modal-header-badges">
              <span className="flavor-modal-trend-badge" style={{ background: trendDotColor(flavor.trendType) }}>
                {flavor.trendType}
              </span>
              {CROSS_CATEGORY_FLAVORS.has(flavor.name) && <span className="flavor-flag flavor-flag--cat">Cross-Category</span>}
              {isCrossRegion(flavor.states || "") && <span className="flavor-flag flavor-flag--reg">Cross-Region</span>}
            </div>
          </div>
          <div className="flavor-modal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              className={"flavor-modal-tab " + (activeTab === "overview" ? "sel" : "")}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            {showKeyInsightTab ? (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "insight"}
                className={"flavor-modal-tab " + (activeTab === "insight" ? "sel" : "")}
                onClick={() => setActiveTab("insight")}
              >
                Key insight
              </button>
            ) : (
              <span className="flavor-modal-tab flavor-modal-tab--spacer" aria-hidden />
            )}
            {showVerbatimTab ? (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "verbatim"}
                className={"flavor-modal-tab " + (activeTab === "verbatim" ? "sel" : "")}
                onClick={() => setActiveTab("verbatim")}
              >
                Verbatim wall
              </button>
            ) : (
              <span className="flavor-modal-tab flavor-modal-tab--spacer" aria-hidden />
            )}
          </div>
        </div>

        <div className="flavor-modal-scroll">
          <div className="flavor-modal-panels">
          <div
            className={"flavor-modal-panel flavor-modal-panel--overview " + (activeTab === "overview" ? "is-active" : "")}
            role="tabpanel"
            hidden={activeTab !== "overview"}
          >
            <div className="flavor-modal-body flavor-modal-body--split">
              <div className="flavor-modal-left">
                <div className="flavor-modal-core-metrics">
                  {[
                    ["Conv. volume", flavor.convVolume],
                    ["Eng. volume", flavor.engVolume],
                    ["Conv. growth", flavor.convGrowth],
                    ["Eng. growth", flavor.engGrowth],
                    ["Trend type", flavor.trendType],
                  ].map(([label, val]) => (
                    <div key={label} className="flavor-modal-metric-item">
                      <span className="fmm-label">{label}</span>
                      <b className="fmm-val">{val}</b>
                    </div>
                  ))}
                  <div className="flavor-modal-metric-item flavor-modal-metric-item--brands">
                    <span className="fmm-label">
                      No. of brands
                      <FlavorInfoTip text={BRANDS_COUNT_TOOLTIP} />
                    </span>
                    <b className="fmm-val">{brandCount || "—"}</b>
                  </div>
                </div>

                <div className="flavor-modal-qual">
                  {qualFields.map(([label, val]) => (
                    <div key={label} className="flavor-modal-qual-item">
                      <span className="fmq-label">{label}</span>
                      <p className="fmq-val">{val}</p>
                    </div>
                  ))}
                  <FlavorBritanniaFitBlock flavor={flavor} />
                  <FlavorProductExtensionsBlock flavor={flavor} />
                </div>

                <div className="flavor-modal-trend-chart">
                  <p className="flavor-modal-chart-label">
                    Conversation volume (K)
                    {trendUsesSheetData ? " · May '25 – May '26" : " · L1Y trend"}
                  </p>
                  <div className="flavor-modal-chart-slot">
                  <ResponsiveContainer width="100%" height={168}>
                    <LineChart data={trendData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid stroke="#E6E1D8" strokeDasharray="3 4" vertical={false} />
                      <XAxis
                        dataKey="month"
                        interval={trendUsesSheetData ? 1 : 0}
                        tick={{ fontSize: 9, fill: "#8A8478" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#8A8478" }}
                        axisLine={false}
                        tickLine={false}
                        width={44}
                        tickFormatter={trendUsesSheetData ? formatConvTrendK : formatTrendVolume}
                        domain={trendUsesSheetData ? ["auto", "auto"] : undefined}
                      />
                      <Tooltip
                        contentStyle={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [
                          trendUsesSheetData ? formatConvTrendK(Number(v)) : formatTrendVolume(Number(v)),
                          "Conv. volume",
                        ]}
                        labelFormatter={(label) => String(label)}
                      />
                      <Line type="monotone" dataKey={flavor.name} stroke="#B4232A" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="flavor-modal-right">
                <p className="flavor-modal-indices-label">
                  Flavor indices
                  <FlavorInfoTip text="Index definitions from BGPT Variable Definitions — hover each label for detail." />
                </p>
                {indices.map(([label, val, tip]) => (
                  <div key={label} className="flavor-modal-index-item">
                    <span className="fmi-val">{val ?? "—"}</span>
                    <span className="fmi-label">
                      {label}
                      <FlavorInfoTip text={tip} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className={"flavor-modal-panel flavor-modal-panel--insight " + (activeTab === "insight" ? "is-active" : "")}
            role="tabpanel"
            hidden={activeTab !== "insight" || !showKeyInsightTab}
          >
            <div className="flavor-modal-insight-pane">
              <p className="flavor-modal-insight-kicker">Key insight · BGPT</p>
              <p className="flavor-modal-insight-body">{keyInsightText || "—"}</p>
            </div>
          </div>
          <div
            className={"flavor-modal-panel flavor-modal-panel--verbatim " + (activeTab === "verbatim" ? "is-active" : "")}
            role="tabpanel"
            hidden={activeTab !== "verbatim" || !showVerbatimTab}
          >
            <div className="flavor-modal-verbatim-pane">
              <p className="flavor-modal-verbatim-intro">
                Consumer verbatim wall from Flavor Insights — same grid pattern as RRP.
              </p>
              <FlavorVerbatimWall flavorName={flavor.name} />
            </div>
          </div>
          </div>
        </div>

        <div className="flavor-modal-actions">
          {deliverables.map((d) => (
            <button
              key={d.actionId}
              type="button"
              className="flavor-modal-action-btn"
              disabled={busy}
              onClick={() => {
                if (d.pending) {
                  setShowPendingIntegrations(true);
                  return;
                }
                setPendingAction(d.actionId);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
        {pendingAction && (
          <DeliverableConfigDialog
            actionId={pendingAction}
            flavor={flavor}
            onClose={() => setPendingAction(null)}
            busy={busy}
            onConfirm={({ state, instructions }) => {
              onRunDeliverable?.({
                actionId: pendingAction,
                flavor: flavor.name,
                brandFit: flavor.brandFit,
                state,
                instructions,
              });
              setPendingAction(null);
              onClose();
            }}
          />
        )}
        {showPendingIntegrations && (
          <div className="flavor-pending-dialog-backdrop" onClick={() => setShowPendingIntegrations(false)}>
            <div
              className="flavor-pending-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pending-integrations-title"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="flavor-pending-dialog__close"
                aria-label="Close"
                onClick={() => setShowPendingIntegrations(false)}
              >
                ✕
              </button>
              <h3 id="pending-integrations-title">Pending Integrations</h3>
              <p>Please integrate your internal data to forecast this trend.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(modal, document.body);
};

const FLAVOR_TABLE_PAGE_SIZE = 10;

// Sweet/savory tags from state top-5 lists + national row metadata
const FLAVOR_CATEGORY_SETS: Record<string, Set<string>> = (() => {
  const map: Record<string, Set<string>> = {};
  DEMO_STATES.forEach((s) => {
    s.sweet.forEach((f) => { (map[f] ||= new Set()).add("sweet"); });
    s.savory.forEach((f) => { (map[f] ||= new Set()).add("savory"); });
  });

  const sweetHint =
    /sweet|mithai|jaggery|dessert|rabri|ladoo|halwa|jamun|katli|gur|doi|caramel|kesar|shrikhand|basundi|phirni|modak|honey|berry|saffron|cream|milk|fruit|papdi|barfi|rasgulla|malai|bebinca|soan|til jaggery|nolen|mishti|gajar|payasam|pradhaman/i;
  const savoryHint =
    /chilli|chili|masala|spice|pickle|podi|savoury|savory|ferment|mustard|garlic|pepper|achar|chatpata|tandoori|thecha|jhalmuri|namkeen|schezwan|gunpowder|tamarind|kokum|kasundi|bhut|chaat|panch phoron|sattu|recheado|xacuti|smoked|pod/i;

  NATIONAL_FLAVORS.forEach((f) => {
    if (map[f.name]?.size) return;
    const text = `${f.name} ${f.whyPopular || ""} ${f.extensions || ""}`.toLowerCase();
    if (sweetHint.test(text) && !savoryHint.test(text)) map[f.name] = new Set(["sweet"]);
    else if (savoryHint.test(text)) map[f.name] = new Set(["savory"]);
    else map[f.name] = new Set(["sweet", "savory"]);
  });

  return map;
})();

const STATE_TOKEN_TO_FULL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  Object.entries(STATE_ABBR).forEach(([full, abbr]) => {
    map[full.toLowerCase()] = full;
    map[abbr.toLowerCase()] = full;
  });
  map["west bengal"] = "West Bengal";
  map.wb = "West Bengal";
  return map;
})();

const STATE_FLAVOR_SETS: Record<string, Set<string>> = (() => {
  const map: Record<string, Set<string>> = {};
  DEMO_STATES.forEach((s) => { map[s.state] = new Set([...s.sweet, ...s.savory]); });
  return map;
})();

const flavorMatchesState = (flavor, stateFilter) => {
  if (!stateFilter || stateFilter === "All States") return true;
  if (STATE_FLAVOR_SETS[stateFilter]?.has(flavor.name)) return true;

  const target = stateFilter.toLowerCase();
  const tokens = String(flavor.states || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return tokens.some((token) => {
    const resolved = STATE_TOKEN_TO_FULL[token] || token;
    return resolved.toLowerCase() === target || token === target;
  });
};

const flavorMatchesCategory = (flavorName, categoryFilter) => {
  if (categoryFilter === "both") return true;
  const cats = FLAVOR_CATEGORY_SETS[flavorName];
  if (!cats) return true;
  return cats.has(categoryFilter);
};

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

const VERBATIM_FLAVOR_SET = new Set(FLAVORS_WITH_VERBATIM_WALL);

const FLAVOR_SCOPE_OPTIONS = [
  { id: "all", label: "All flavors" },
  { id: "verbatim", label: "Verbatim wall available" },
  { id: "cross_region", label: "Cross-region" },
  { id: "cross_category", label: "Cross-category" },
  { id: "emerging", label: "Emerging trend" },
  { id: "established", label: "Established trend" },
  { id: "seasonal", label: "Seasonal trend" },
];

const flavorMatchesScope = (flavor, scopeFilter) => {
  if (!scopeFilter || scopeFilter === "all") return true;
  const name = flavor.name;
  if (scopeFilter === "verbatim") return VERBATIM_FLAVOR_SET.has(name);
  if (scopeFilter === "cross_region") return isCrossRegion(flavor.states || "");
  if (scopeFilter === "cross_category") return CROSS_CATEGORY_FLAVORS.has(name);
  if (scopeFilter === "emerging") return flavor.trendType === "Emerging";
  if (scopeFilter === "established") return flavor.trendType === "Established";
  if (scopeFilter === "seasonal") return flavor.trendType === "Seasonal";
  return true;
};

const flavorMatchesSearch = (flavor, searchQuery) => {
  const q = String(searchQuery || "").trim().toLowerCase();
  if (!q) return true;
  return flavor.name.toLowerCase().includes(q);
};

const FlavorScopeSearchSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const selected =
    FLAVOR_SCOPE_OPTIONS.find((o) => o.id === value) || FLAVOR_SCOPE_OPTIONS[0];

  const visibleOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FLAVOR_SCOPE_OPTIONS;
    return FLAVOR_SCOPE_OPTIONS.filter((o) => o.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="matrix-filter-group flavor-scope-select" ref={rootRef}>
      <span className="matrix-filter-label">Filter flavors</span>
      <button
        type="button"
        className="flavor-scope-select__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{selected.label}</span>
        <span className="flavor-scope-select__chev" aria-hidden>{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="flavor-scope-select__panel" role="listbox">
          <input
            type="search"
            className="flavor-scope-select__search"
            placeholder="Search filters…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="flavor-scope-select__list">
            {visibleOptions.map((opt) => (
              <li key={opt.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === opt.id}
                  className={"flavor-scope-select__opt " + (value === opt.id ? "sel" : "")}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {opt.label}
                  {opt.id === "verbatim" && (
                    <span className="flavor-scope-select__meta">{VERBATIM_FLAVOR_SET.size}</span>
                  )}
                </button>
              </li>
            ))}
            {visibleOptions.length === 0 && (
              <li className="flavor-scope-select__empty">No matching filters</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Windowed page list with ellipses, e.g. [1, "…", 4, 5, 6, "…", 10]
const buildPageList = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set([1, total, current, current - 1, current + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  pages.forEach((p) => {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  });
  return out;
};

const FlavorAnalysisFilters = ({
  categoryFilter,
  stateFilter,
  scopeFilter,
  flavorSearch,
  onCategoryChange,
  onStateChange,
  onScopeChange,
  onFlavorSearchChange,
}) => (
  <div className="matrix-filters matrix-filters--centered flavor-analysis-filters">
    <div className="matrix-filter-group">
      <span className="matrix-filter-label">Sweet &amp; savory</span>
      <div className="matrix-filter-toggle">
        {["sweet", "savory", "both"].map((opt) => (
          <button
            key={opt}
            type="button"
            className={"matrix-filter-btn " + (categoryFilter === opt ? "sel" : "")}
            onClick={() => onCategoryChange(opt)}
          >
            {opt === "both" ? "Both" : opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>
    </div>
    <FlavorScopeSearchSelect value={scopeFilter} onChange={onScopeChange} />
    <div className="matrix-filter-group">
      <span className="matrix-filter-label">Select state</span>
      <select
        className="matrix-filter-select"
        value={stateFilter}
        onChange={(e) => onStateChange(e.target.value)}
      >
        <option value="All States">All States</option>
        {DEMO_STATES.map((s) => (
          <option key={s.state} value={s.state}>{s.state}</option>
        ))}
      </select>
    </div>
    <div className="matrix-filter-group matrix-filter-group--search">
      <span className="matrix-filter-label">Find flavor</span>
      <input
        type="search"
        className="flavor-name-search"
        placeholder="Type to search…"
        value={flavorSearch}
        onChange={(e) => onFlavorSearchChange(e.target.value)}
      />
    </div>
  </div>
);

const FlavorAnalysisTable = ({
  categoryFilter = "both",
  stateFilter = "All States",
  scopeFilter = "all",
  flavorSearch = "",
}) => {
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return NATIONAL_FLAVORS.filter(
      (f) =>
        flavorMatchesCategory(f.name, categoryFilter) &&
        flavorMatchesState(f, stateFilter) &&
        flavorMatchesScope(f, scopeFilter) &&
        flavorMatchesSearch(f, flavorSearch)
    );
  }, [categoryFilter, stateFilter, scopeFilter, flavorSearch]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    const indexKeys = ["diyIndex", "shareabilityIndex", "cravingIndex", "comfortIndex", "curiosityIndex", "giftingIndex"];
    const trendOrder = { Established: 0, "Regional Classic": 1, Seasonal: 2, Emerging: 3, Stable: 4, Fad: 5 };
    rows.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
      if (sortKey === "convVolume") return (parseNatVol(a.convVolume) - parseNatVol(b.convVolume)) * dir;
      if (sortKey === "engVolume") return (parseNatVol(a.engVolume) - parseNatVol(b.engVolume)) * dir;
      if (sortKey === "convGrowth") return (parsePct(a.convGrowth) - parsePct(b.convGrowth)) * dir;
      if (sortKey === "engGrowth") return (parsePct(a.engGrowth) - parsePct(b.engGrowth)) * dir;
      if (sortKey === "trendType") {
        return ((trendOrder[a.trendType] ?? 9) - (trendOrder[b.trendType] ?? 9)) * dir;
      }
      if (indexKeys.includes(sortKey)) return ((a[sortKey] || 0) - (b[sortKey] || 0)) * dir;
      return 0;
    });
    return rows;
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / FLAVOR_TABLE_PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = sorted.slice(
    (currentPage - 1) * FLAVOR_TABLE_PAGE_SIZE,
    currentPage * FLAVOR_TABLE_PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, stateFilter, scopeFilter, flavorSearch, sortKey, sortDir]);

  const onSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "desc" : "desc");
    }
  };

  const SortTh = ({ k, label }) => {
    const active = sortKey === k;
    return (
      <th>
        <button type="button" className="flavor-th-sort" onClick={() => onSort(k)}>
          {label}
          <span className={"flavor-th-sort-ind " + (active ? "active" : "")}>
            {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </button>
      </th>
    );
  };

  const pageList = buildPageList(currentPage, pageCount);
  const rangeStart = sorted.length === 0 ? 0 : (currentPage - 1) * FLAVOR_TABLE_PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * FLAVOR_TABLE_PAGE_SIZE, sorted.length);

  return (
    <div className="prioritize-table-wrap flavor-analysis-wrap">
      <div className="prioritize-table-head">
        <h4>Flavor Analysis</h4>
        <span className="tag">{sorted.length} flavors</span>
      </div>

      <div className="state-table-wrap">
        <table className="national-table prioritize-table flavor-analysis-table">
          <thead>
            <tr>
              <SortTh k="name" label="Flavor" />
              <SortTh k="convVolume" label="Conv. Volume" />
              <SortTh k="engVolume" label="Eng. Volume" />
              <SortTh k="convGrowth" label="Conv. Growth" />
              <SortTh k="engGrowth" label="Eng. Growth" />
              <SortTh k="diyIndex" label="DIY" />
              <SortTh k="shareabilityIndex" label="Shareability" />
              <SortTh k="cravingIndex" label="Consumption Intent" />
              <SortTh k="comfortIndex" label="Advocacy" />
              <SortTh k="curiosityIndex" label="Health–Indulgence" />
              <SortTh k="giftingIndex" label="Gifting" />
              <SortTh k="trendType" label="Trend" />
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="national-table-empty">No flavors match these filters.</td>
              </tr>
            ) : (
              pageRows.map((f) => {
                const isCrossCategory = CROSS_CATEGORY_FLAVORS.has(f.name);
                const crossRegion = isCrossRegion(f.states || "");
                return (
                  <tr key={f.name}>
                    <td><b>{f.name}</b></td>
                    <td>{f.convVolume || "—"}</td>
                    <td>{f.engVolume || "—"}</td>
                    <td>{f.convGrowth || "—"}</td>
                    <td>{f.engGrowth || "—"}</td>
                    <td><span className="national-index">{f.diyIndex ?? "—"}</span></td>
                    <td><span className="national-index">{f.shareabilityIndex ?? "—"}</span></td>
                    <td><span className="national-index">{f.cravingIndex ?? "—"}</span></td>
                    <td><span className="national-index">{f.comfortIndex ?? "—"}</span></td>
                    <td><span className="national-index">{f.curiosityIndex ?? "—"}</span></td>
                    <td><span className="national-index">{f.giftingIndex ?? "—"}</span></td>
                    <td>
                      <div className="prioritize-trend-tags">
                        <span>{f.trendType}</span>
                        {isCrossCategory && <span className="flavor-flag flavor-flag--cat">Cross-Category</span>}
                        {crossRegion && <span className="flavor-flag flavor-flag--reg">Cross-Region</span>}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flavor-table-foot">
        {sorted.length > 0 && (
          <p className="flavor-table-range">
            Showing {rangeStart}–{rangeEnd} of {sorted.length}
            {pageCount > 1 ? ` · page ${currentPage} of ${pageCount}` : ""}
          </p>
        )}
      {pageCount > 1 && (
        <div className="flavor-pager">
          <button
            type="button"
            className="flavor-pager__arrow"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            ‹
          </button>
          {pageList.map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="flavor-pager__gap">…</span>
            ) : (
              <button
                type="button"
                key={p}
                className={"flavor-pager__page " + (p === currentPage ? "sel" : "")}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            className="flavor-pager__arrow"
            disabled={currentPage === pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export const DocFlavorMatrixCard = ({ onRunDeliverable, busy }) => {
  const [hovered, setHovered] = useState(null);
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("both");
  const [stateFilter, setStateFilter] = useState("All States");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [flavorSearch, setFlavorSearch] = useState("");
  const hideTimerRef = useRef(null);
  const chartWrapRef = useRef(null);

  const flavorCat = useCallback((name) => {
    const cats = FLAVOR_CATEGORY_SETS[name];
    if (cats?.has("savory") && !cats.has("sweet")) return "savory";
    return "sweet";
  }, []);

  const plotData = useMemo(
    () =>
      NATIONAL_FLAVORS.map((p) => ({
        name: p.name,
        eng: parseNatVol(p.engVolume), // Y axis — engagement volume (K)
        agr: parsePct(p.engGrowth), // X axis — engagement growth rate (%)
        cat: flavorCat(p.name),
        raw: p,
      })),
    [flavorCat]
  );

  const filteredPlotData = useMemo(
    () =>
      plotData.filter(
        (d) =>
          flavorMatchesCategory(d.name, categoryFilter) &&
          flavorMatchesState(d.raw, stateFilter) &&
          flavorMatchesScope(d.raw, scopeFilter) &&
          flavorMatchesSearch(d.raw, flavorSearch)
      ),
    [plotData, categoryFilter, stateFilter, scopeFilter, flavorSearch]
  );

  const agrVals = plotData.map((d) => d.agr);
  const engVals = plotData.map((d) => d.eng);
  const avgAgr = meanVal(agrVals); // average engagement growth across all flavors
  const avgEng = meanVal(engVals); // average engagement volume across all flavors
  const minAgr = Math.min(...agrVals);
  const maxAgr = Math.max(...agrVals);
  const xDomain = [Math.floor(minAgr / 5) * 5, Math.ceil(maxAgr / 5) * 5];
  const maxEng = Math.ceil(Math.max(...engVals, 10) / 200) * 200;
  const engTicks = Array.from({ length: maxEng / 200 + 1 }, (_, i) => i * 200);


  const showHover = useCallback((info) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    const wrap = chartWrapRef.current;
    const width = wrap?.getBoundingClientRect().width || 760;
    const height = wrap?.getBoundingClientRect().height || 520;
    const tipWidth = 230;
    const tipHeight = 88;
    const gap = 16;
    const left = info.cx + gap + tipWidth > width
      ? Math.max(8, info.cx - tipWidth - gap)
      : info.cx + gap;
    const top = info.cy - 20 + tipHeight > height
      ? Math.max(8, info.cy - tipHeight - gap)
      : Math.max(8, info.cy - 20);

    setHovered({ ...info, left, top });
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setHovered(null), 220);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  return (
    <>
    <div className="card flavor-matrix-v2-card">
      <div className="card-h">
        <h3>Flavor Prioritization View</h3>
        <span className="tag">{filteredPlotData.length} of {NATIONAL_FLAVORS.length} flavors</span>
      </div>
      <div className="card-body">

        <FlavorAnalysisFilters
          categoryFilter={categoryFilter}
          stateFilter={stateFilter}
          scopeFilter={scopeFilter}
          flavorSearch={flavorSearch}
          onCategoryChange={setCategoryFilter}
          onStateChange={setStateFilter}
          onScopeChange={setScopeFilter}
          onFlavorSearchChange={setFlavorSearch}
        />

        <div ref={chartWrapRef} className="flavor-matrix-plot" style={{ position: "relative" }}>
          <div className="brit-priority-matrix__quadrants" aria-hidden>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--tl">Established</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--tr">Prioritize</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--br">Emerging</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--bl">Fading</span>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 28, right: 36, bottom: 56, left: 64 }}>
              <ReferenceLine x={avgAgr} stroke="#B0A899" strokeDasharray="5 4" strokeWidth={1.25} />
              <ReferenceLine y={avgEng} stroke="#B0A899" strokeDasharray="5 4" strokeWidth={1.25} />
              <XAxis
                type="number"
                dataKey="agr"
                domain={xDomain}
                allowDecimals={false}
                tick={{ fill: "#6F695E", fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={{ stroke: "#D2CCC0", strokeWidth: 1 }}
                tickLine={false}
                label={{ value: "AGR (%)", position: "insideBottom", offset: -18, fill: "#6F695E", fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                type="number"
                dataKey="eng"
                domain={[0, maxEng]}
                ticks={engTicks}
                tick={{ fill: "#6F695E", fontSize: 11 }}
                tickFormatter={(v) => `${v}K`}
                axisLine={{ stroke: "#D2CCC0", strokeWidth: 1 }}
                tickLine={false}
                width={56}
                label={{ value: "Engagement (K)", angle: -90, position: "insideLeft", offset: -28, fill: "#6F695E", fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip content={() => null} cursor={false} />
              <Scatter
                data={filteredPlotData}
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  if (cx == null || cy == null) return null;
                  return (
                    <g
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => showHover({ cx, cy, data: payload })}
                      onMouseLeave={scheduleHide}
                      onClick={() => {
                        setSelectedFlavor(payload.raw);
                        setHovered(null);
                      }}
                    >
                      <circle cx={cx} cy={cy} r={8} fill={FLAVOR_CAT_COLORS[payload.cat]} stroke="#fff" strokeWidth={2.5} opacity={0.92} />
                    </g>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>

          {hovered && (
            <div
              className="flavor-hover-tip"
              style={{ position: "absolute", left: hovered.left, top: hovered.top, zIndex: 20 }}
              onMouseEnter={cancelHide}
              onMouseLeave={scheduleHide}
            >
              <p className="flavor-hover-tip__name">{hovered.data.name}</p>
              <div className="flavor-hover-tip__metrics">
                <div><span>Engagement (K)</span> <b>{hovered.data.raw.engVolume}</b></div>
                <div><span>AGR (%)</span> <b>{hovered.data.raw.engGrowth}</b></div>
              </div>
            </div>
          )}
        </div>

        <div className="brit-priority-matrix__legend" style={{ marginTop: 12, marginBottom: 16 }}>
          <span className="brit-priority-matrix__legend-item">
            <i style={{ background: FLAVOR_CAT_COLORS.sweet }} />
            Sweet
          </span>
          <span className="brit-priority-matrix__legend-item">
            <i style={{ background: FLAVOR_CAT_COLORS.savory }} />
            Savory
          </span>
        </div>

        <FlavorAnalysisTable
          categoryFilter={categoryFilter}
          stateFilter={stateFilter}
          scopeFilter={scopeFilter}
          flavorSearch={flavorSearch}
        />
      </div>
    </div>
    {selectedFlavor && (
      <FlavorDetailModal
        flavor={selectedFlavor}
        onClose={() => setSelectedFlavor(null)}
        onRunDeliverable={onRunDeliverable}
        busy={busy}
      />
    )}
  </>
  );
};
