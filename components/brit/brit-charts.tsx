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
  ZAxis,
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

export const NationalScatterChart = ({ points, onSelect }) => {
  const data = points.map((p) => ({
    name: p.name,
    conv: parseFloat(String(p.convGrowth).replace("%", "")) || 0,
    eng: parseFloat(String(p.engGrowth).replace("%", "")) || 0,
    raw: p,
  }));

  return (
    <div className="brit-chart-wrap brit-chart-wrap--scatter">
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid stroke={CHART_THEME.grid} strokeDasharray="3 4" />
          <XAxis type="number" dataKey="conv" name="Conv. growth" unit="%" tick={{ fill: CHART_THEME.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis type="number" dataKey="eng" name="Eng. growth" unit="%" tick={{ fill: CHART_THEME.muted, fontSize: 10 }} axisLine={false} tickLine={false} />
          <ZAxis range={[80, 80]} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(v, name) => [`${v}%`, name === "conv" ? "Conv. growth" : "Eng. growth"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.name}
          />
          <Scatter
            data={data}
            fill={CHART_THEME.red}
            onClick={(d) => onSelect?.(d.raw)}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="brit-chart-axis-hint">
        <span>→ Conversation growth</span>
        <span>↑ Engagement growth</span>
      </div>
    </div>
  );
};
