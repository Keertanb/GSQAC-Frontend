import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";
import { pct, getRateColor } from "./dashboardUtils";

export function RingProgress({ value, size = 52, stroke = 5, color = "#4338ca" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="ado-ring" role="img" aria-label={`${value}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="ado-ring-text">
        {value}%
      </text>
    </svg>
  );
}

export function Sparkline({ data, dataKey, color = "#4338ca", label }) {
  if (!data || data.length < 2) return null;
  const gradId = `ado-spark-${dataKey}-${color.replace("#", "")}`;
  return (
    <div className="ado-sparkline">
      <div className="ado-sparkline-head">
        <span>{label}</span>
      </div>
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${gradId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const STAT_TONE_COLORS = {
  indigo: "#4338ca",
  blue: "#2563eb",
  green: "#059669",
  amber: "#b45309",
};

export function StatCard({ label, value, sub, tone, icon, progress, badge, trendData, trendKey, trendLabel }) {
  const color = STAT_TONE_COLORS[tone] || STAT_TONE_COLORS.indigo;

  return (
    <div className={`ado-stat-card ado-stat-${tone}`}>
      <div className="ado-stat-header">
        <div className="ado-stat-icon-wrap" aria-hidden>{icon}</div>
        <div className="ado-stat-content">
          <p className="ado-stat-label">{label}</p>
          <p className="ado-stat-value">{value ?? 0}</p>
          {sub && <p className="ado-stat-sub">{sub}</p>}
        </div>
        {badge && <span className={`ado-stat-badge ado-badge-${badge.type}`}>{badge.text}</span>}
      </div>
      {progress != null && (
        <div className="ado-stat-progress-row">
          <RingProgress value={progress} color={color} />
          <div className="ado-stat-progress-text">
            <span className="ado-stat-progress-value">{progress}%</span>
            <span className="ado-stat-progress-label">Completion rate</span>
          </div>
        </div>
      )}
      {progress == null && trendData && trendKey && (
        <Sparkline data={trendData} dataKey={trendKey} color={color} label={trendLabel} />
      )}
    </div>
  );
}

export function ChartCard({ title, subtitle, badge, children, className = "", accent = "indigo", icon, actions }) {
  return (
    <div className={`ado-chart-card ado-chart-accent-${accent} ${className}`}>
      <div className="ado-chart-header">
        <div className="ado-chart-header-main">
          {icon ? <span className={`ado-chart-icon ado-chart-icon--${accent}`} aria-hidden>{icon}</span> : null}
          <div>
            <h3 className="ado-chart-title">{title}</h3>
            {subtitle && <p className="ado-chart-subtitle">{subtitle}</p>}
          </div>
        </div>
        {badge && <span className="ado-chart-badge">{badge}</span>}
        {actions}
      </div>
      <div className="ado-chart-body">{children}</div>
    </div>
  );
}

export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName;
  return (
    <div className="ado-tooltip">
      <p className="ado-tooltip-label">{fullName || label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="ado-tooltip-row">
          <span className="ado-tooltip-dot" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
};

export const RateTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="ado-tooltip">
      <p className="ado-tooltip-label">{data?.fullName}</p>
      <div className="ado-tooltip-row">
        <span className="ado-tooltip-dot" style={{ background: getRateColor(data?.rate) }} />
        <span>Completion</span>
        <strong>{data?.rate}%</strong>
      </div>
      <div className="ado-tooltip-row">
        <span>Completed</span>
        <strong>{data?.completed}</strong>
      </div>
      <div className="ado-tooltip-row">
        <span>Pending</span>
        <strong>{data?.pending}</strong>
      </div>
    </div>
  );
};

export function DonutCenter({ total, label }) {
  return (
    <div className="ado-donut-center">
      <span className="ado-donut-total">{total}</span>
      <span className="ado-donut-label">{label}</span>
    </div>
  );
}

export function InsightCard({ label, value, sub, tone = "indigo", icon }) {
  return (
    <div className={`ado-insight-card ado-insight-${tone}`}>
      <span className="ado-insight-icon" aria-hidden>{icon}</span>
      <div>
        <p className="ado-insight-label">{label}</p>
        <p className="ado-insight-value">{value}</p>
        {sub ? <p className="ado-insight-sub">{sub}</p> : null}
      </div>
    </div>
  );
}

export function FunnelStep({ label, value, rate, color, isLast }) {
  return (
    <div className={`ado-funnel-step ${isLast ? "ado-funnel-step--last" : ""}`}>
      <div className="ado-funnel-step-bar" style={{ background: color, width: `${Math.max(rate, 8)}%` }} />
      <div className="ado-funnel-step-meta">
        <span className="ado-funnel-step-label">{label}</span>
        <strong className="ado-funnel-step-value">{value}</strong>
        <span className="ado-funnel-step-rate">{rate}%</span>
      </div>
    </div>
  );
}

export function RadarPanel({ entities, axes }) {
  if (!entities?.length || !axes?.length) {
    return (
      <div className="ado-chart-empty">
        <span className="ado-empty-icon" aria-hidden>📡</span>
        Not enough data to compare yet
      </div>
    );
  }
  return (
    <div className="ado-radar-wrap">
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={axes} outerRadius="72%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} />
          {entities.map((e) => (
            <Radar key={e.key} name={e.key} dataKey={e.key} stroke={e.color} fill={e.color} fillOpacity={0.08} strokeWidth={2} />
          ))}
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
      <div className="ado-radar-legend">
        {entities.map((e) => (
          <div key={e.key} className="ado-radar-legend-item">
            <span className="ado-radar-legend-dot" style={{ background: e.color }} />
            <span>{e.key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EntityCard({ name, total, completed, inProgress = 0, pending = 0, notAllocated = 0 }) {
  const rate = pct(completed, total);
  return (
    <div className="ado-block-card">
      <div className="ado-block-card-header">
        <h3 className="ado-block-card-name">{name}</h3>
        <span className={`ado-block-rate ${rate >= 70 ? "ado-rate-good" : rate >= 40 ? "ado-rate-mid" : "ado-rate-low"}`}>
          {rate}%
        </span>
      </div>
      <div className="ado-block-card-bar">
        <div className="ado-block-card-fill" style={{ width: `${rate}%` }} />
      </div>
      <div className="ado-block-card-stats">
        <div className="ado-bcs-item">
          <span className="ado-bcs-val">{total}</span>
          <span className="ado-bcs-lbl">Total</span>
        </div>
        <div className="ado-bcs-item ado-bcs-green">
          <span className="ado-bcs-val">{completed}</span>
          <span className="ado-bcs-lbl">Done</span>
        </div>
        <div className="ado-bcs-item ado-bcs-blue">
          <span className="ado-bcs-val">{inProgress}</span>
          <span className="ado-bcs-lbl">Active</span>
        </div>
        <div className="ado-bcs-item ado-bcs-amber">
          <span className="ado-bcs-val">{pending}</span>
          <span className="ado-bcs-lbl">Pending</span>
        </div>
        <div className="ado-bcs-item ado-bcs-red">
          <span className="ado-bcs-val">{notAllocated}</span>
          <span className="ado-bcs-lbl">Unalloc.</span>
        </div>
      </div>
    </div>
  );
}

export function HeatmapGrid({ cells, unit = "schools" }) {
  if (!cells?.length) {
    return (
      <div className="ado-chart-empty">
        <span className="ado-empty-icon" aria-hidden>🗺️</span>
        No completion data yet
      </div>
    );
  }
  return (
    <div className="ado-heatmap-grid">
      {cells.map((c) => (
        <div
          key={c.name}
          className="ado-heatmap-cell"
          style={{ background: `${getRateColor(c.rate)}1a`, borderColor: `${getRateColor(c.rate)}40` }}
          title={`${c.fullName || c.name}: ${c.completed ?? c.rate}/${c.total ?? c.allocated ?? ""} ${unit} · ${c.rate}%`}
        >
          <span className="ado-heatmap-cell-rate" style={{ color: getRateColor(c.rate) }}>{c.rate}%</span>
          <span className="ado-heatmap-cell-name">{c.name}</span>
        </div>
      ))}
    </div>
  );
}
