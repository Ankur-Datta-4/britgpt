// @ts-nocheck
"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Line,
  LineChart,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";

export const CHART_THEME = {
  red: "#B4232A",
  redDeep: "#8F1A20",
  redSoft: "#F4E4E5",
  cream: "#F9F7F2",
  grid: "#E6E1D8",
  muted: "#8A8478",
  gold: "#C9A227",
  green: "#2D6A4F",
  neutral: "#9A9488",
};

const tooltipStyle = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--fg)",
  boxShadow: "var(--shadow-card)",
};

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const RegionBarChart = ({ data, onSelect }) => {
  const [active, setActive] = useState(null);
  const rows = data.map((d) => ({ name: d.lbl, value: d.val }));

  return (
    <div className="brit-chart-wrap brit-chart-wrap--region">
      <ResponsiveContainer width="100%" height={Math.max(220, rows.length * 36)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: CHART_THEME.muted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <YAxis type="category" dataKey="name" width={108} tick={{ fill: "var(--fg)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: CHART_THEME.redSoft }}
            contentStyle={tooltipStyle}
            formatter={(v) => [`${v}%`, "Share"]}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            barSize={18}
            onClick={(_, i) => {
              setActive(i);
              onSelect?.(data[i], i);
            }}
          >
            {rows.map((_, i) => (
              <Cell
                key={i}
                fill={active === i ? CHART_THEME.redDeep : CHART_THEME.red}
                opacity={active === null || active === i ? 1 : 0.55}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const SENTIMENT_COLORS = [CHART_THEME.green, CHART_THEME.neutral, CHART_THEME.red];

export const SentimentDonutChart = ({ segments, center, onSelect }) => {
  const [active, setActive] = useState(null);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="brit-donut-shell">
      <PieChart width={size} height={size} className="brit-donut-chart">
        <Pie
          data={segments}
          dataKey="v"
          nameKey="lbl"
          cx={cx}
          cy={cy}
          innerRadius={68}
          outerRadius={88}
          startAngle={90}
          endAngle={-270}
          paddingAngle={3}
          stroke="var(--panel)"
          strokeWidth={2}
          onClick={(_, i) => {
            setActive(i);
            onSelect?.(segments[i], i);
          }}
        >
          {segments.map((s, i) => (
            <Cell
              key={s.lbl}
              fill={SENTIMENT_COLORS[i] ?? CHART_THEME.red}
              opacity={active === null || active === i ? 1 : 0.45}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [`${v}%`, name]} />
      </PieChart>
      <div className="brit-chart-donut-center">
        <div className="num">{center}</div>
        <div className="lbl">Positive %</div>
      </div>
    </div>
  );
};

export const TrendLineChart = ({ months, data, data2, primaryName, secondaryName, onSelect }) => {
  const [active, setActive] = useState(null);
  const rows = months.map((m, i) => ({
    month: m,
    primary: data[i],
    secondary: data2[i],
  }));

  return (
    <div className="brit-chart-wrap brit-chart-wrap--trend">
      <div className="chart-legend brit-chart-legend">
        <span><i className="leg-solid" /> {primaryName}</span>
        <span><i className="leg-dash" /> {secondaryName}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={rows}
          margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
          onClick={(e) => {
            if (e?.activeTooltipIndex != null) {
              setActive(e.activeTooltipIndex);
              onSelect?.(rows[e.activeTooltipIndex], e.activeTooltipIndex);
            }
          }}
        >
          <defs>
            <linearGradient id="britAreaRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_THEME.red} stopOpacity={0.22} />
              <stop offset="100%" stopColor={CHART_THEME.red} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 4" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: CHART_THEME.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: CHART_THEME.muted, fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="primary" stroke={CHART_THEME.red} fill="url(#britAreaRed)" strokeWidth={2} dot={false} name={primaryName} />
          <Line type="monotone" dataKey="secondary" stroke={CHART_THEME.gold} strokeWidth={1.5} strokeDasharray="4 4" dot={false} name={secondaryName} />
        </AreaChart>
      </ResponsiveContainer>
      {active != null && (
        <div className="chart-tooltip">
          {rows[active].month}: {rows[active].primary}% ({primaryName}) · {rows[active].secondary}% ({secondaryName})
        </div>
      )}
    </div>
  );
};

export const FlavorGrowthChart = ({ flavours, onSelect }) => {
  const rows = flavours.map((f) => ({
    name: f.name.length > 14 ? `${f.name.slice(0, 12)}…` : f.name,
    fullName: f.name,
    growth: parseFloat(String(f.grow).replace(/[^0-9.-]/g, "")) || 0,
    spark: f.bars?.[f.bars.length - 1] ?? 4,
    down: f.down,
  }));

  return (
    <div className="brit-chart-wrap brit-chart-wrap--flavor">
      <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 32)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }}>
          <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 4" horizontal={false} />
          <XAxis type="number" tick={{ fill: CHART_THEME.muted, fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
          <YAxis type="category" dataKey="name" width={100} tick={{ fill: "var(--fg)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v, _, item) => [`+${v}%`, item.payload.fullName]}
          />
          <Bar
            dataKey="growth"
            radius={[0, 5, 5, 0]}
            barSize={14}
            onClick={(_, i) => onSelect?.(flavours[i], i)}
          >
            {rows.map((r, i) => (
              <Cell key={i} fill={r.down ? CHART_THEME.neutral : CHART_THEME.red} opacity={0.85 + (i % 3) * 0.05} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const MATRIX_TREND_COLORS = {
  Established: "#5B8DEF",
  Emerging: "#3DDC84",
  Seasonal: "#F0A04B",
  "Regional Classic": "#A78BFA",
  Fad: "#F05252",
  Stable: "#7A808A",
};

const matrixTrendColor = (trendType) =>
  MATRIX_TREND_COLORS[trendType] || MATRIX_TREND_COLORS.Stable;

const PrioritizationDot = ({ cx, cy, payload, onSelect }) => {
  if (cx == null || cy == null || !payload) return null;
  const color = matrixTrendColor(payload.trendType);

  return (
    <g
      style={{ cursor: "pointer" }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(payload.raw);
      }}
    >
      <circle cx={cx} cy={cy} r={7} fill={color} stroke={CHART_THEME.cream} strokeWidth={2} />
    </g>
  );
};

const MatrixTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const first = payload[0] || {};
  const p = first?.payload;
  if (!p) return null;
  const raw = p.raw || {};
  const flavor =
    raw.name ||
    p.name ||
    p.flavor ||
    first?.name ||
    label ||
    "Unknown flavor";
  const trendType = raw.trendType || p.trendType || "—";
  const convVolume = raw.convVolume ? String(raw.convVolume) : "—";
  const states = raw.states ? String(raw.states) : "—";
  const brandFit = raw.brandFit ? String(raw.brandFit) : "—";
  const extensionPreview = raw.extensions
    ? String(raw.extensions).split(",").map((x) => x.trim()).filter(Boolean).slice(0, 2).join(", ")
    : "—";

  return (
    <div className="brit-matrix-tooltip">
      <div className="brit-matrix-tooltip__title" title={flavor}>
        <span style={{ color: "var(--fg-dim)", fontWeight: 600, marginRight: 6 }}>Flavor:</span>
        {flavor}
      </div>
      <div className="brit-matrix-tooltip__metrics">
        <span>Conversation growth: {p.conv}%</span>
        <span>Conversation volume: {convVolume}</span>
        <span>Engagement growth: {p.eng}%</span>
      </div>
      <div className="brit-matrix-tooltip__grid">
        <div>
          <span>Trend</span>
          <b>{trendType}</b>
        </div>
        <div>
          <span>Brand fit</span>
          <b>{brandFit}</b>
        </div>
        <div>
          <span>States</span>
          <b title={states}>{states}</b>
        </div>
        <div>
          <span>Extensions</span>
          <b title={raw.extensions || extensionPreview}>{extensionPreview}</b>
        </div>
      </div>
    </div>
  );
};

export const NationalPrioritizationMatrix = ({ points, onSelect }) => {
  const data = points.map((p) => ({
    name: p.name,
    conv: parseFloat(String(p.convVolume).replace("K", "")) || 0,
    eng: parseFloat(String(p.engVolume).replace("K", "")) || 0,
    trendType: p.trendType,
    raw: p,
  }));

  const convs = data.map((d) => d.conv);
  const engs = data.map((d) => d.eng);
  const pad = 4;
  const maxConv = Math.ceil(Math.max(...convs, 10) + pad);
  const maxEng = Math.ceil(Math.max(...engs, 10) + pad);
  const midConv = median(convs);
  const midEng = median(engs);

  const plotData = data;

  return (
    <div className="brit-priority-matrix">
      <div className="brit-priority-matrix__plot">
        <div className="brit-priority-matrix__chart-area">
          <div className="brit-priority-matrix__quadrants" aria-hidden>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--tl">Build momentum</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--tr">Prioritize</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--bl">Fading / fad</span>
            <span className="brit-priority-matrix__q brit-priority-matrix__q--br">Niche loyal</span>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 36, left: 28 }}>
              <ReferenceLine x={midEng} stroke={CHART_THEME.muted} strokeDasharray="4 4" strokeOpacity={0.3} />
              <ReferenceLine y={midConv} stroke={CHART_THEME.muted} strokeDasharray="4 4" strokeOpacity={0.3} />
              <XAxis
                type="number"
                dataKey="eng"
                domain={[0, maxEng]}
                tick={{ fill: "#6F695E", fontSize: 11 }}
                tickFormatter={(v) => `${v}K`}
                axisLine={{ stroke: "#D2CCC0", strokeWidth: 1 }}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="conv"
                domain={[0, maxConv]}
                tick={{ fill: "#6F695E", fontSize: 11 }}
                tickFormatter={(v) => `${v}K`}
                axisLine={{ stroke: "#D2CCC0", strokeWidth: 1 }}
                tickLine={false}
                width={44}
              />
              <Tooltip
                content={<MatrixTooltip />}
                allowEscapeViewBox={{ x: false, y: false }}
                wrapperStyle={{ zIndex: 30 }}
                cursor={false}
              />
              <Scatter
                data={plotData}
                shape={(props) => <PrioritizationDot {...props} onSelect={onSelect} />}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="brit-priority-matrix__x-label">Engagement volume</div>
        </div>
      </div>
      <div className="brit-priority-matrix__legend">
        {[
          ["Established", MATRIX_TREND_COLORS.Established],
          ["Emerging", MATRIX_TREND_COLORS.Emerging],
          ["Seasonal", MATRIX_TREND_COLORS.Seasonal],
          ["Regional classic", MATRIX_TREND_COLORS["Regional Classic"]],
          ["Fad", MATRIX_TREND_COLORS.Fad],
          ["Stable", MATRIX_TREND_COLORS.Stable],
        ].map(([label, color]) => (
          <span key={label} className="brit-priority-matrix__legend-item">
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

/** @deprecated use NationalPrioritizationMatrix */
export const NationalScatterChart = NationalPrioritizationMatrix;
