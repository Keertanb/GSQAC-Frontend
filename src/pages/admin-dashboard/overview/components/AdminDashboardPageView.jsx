import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import AppDropdown from "../../../../components/AppDropdown/AppDropdown";

const STATUS_COLORS = {
  Completed: "#10b981",
  Pending: "#f59e0b",
  "In Progress": "#3b82f6",
  "Not Allocated": "#ef4444",
};

function RingProgress({ value, size = 52, stroke = 5, color = "#4f46e5" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value, 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="ado-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={stroke}
      />
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
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        className="ado-ring-text"
      >
        {value}%
      </text>
    </svg>
  );
}

function StatCard({ label, value, sub, tone, icon, progress, badge }) {
  const toneColors = {
    indigo: "#6366f1",
    blue: "#3b82f6",
    green: "#10b981",
    amber: "#f59e0b",
  };

  return (
    <div className={`ado-stat-card ado-stat-${tone}`}>
      <div className="ado-stat-header">
        <div className="ado-stat-icon-wrap">{icon}</div>
        <div className="ado-stat-content">
          <p className="ado-stat-label">{label}</p>
          <p className="ado-stat-value">{value ?? 0}</p>
          {sub && <p className="ado-stat-sub">{sub}</p>}
        </div>
        {badge && (
          <span className={`ado-stat-badge ado-badge-${badge.type}`}>
            {badge.text}
          </span>
        )}
      </div>
      {progress != null && (
        <div className="ado-stat-progress-row">
          <RingProgress value={progress} color={toneColors[tone] || toneColors.indigo} />
          <div className="ado-stat-progress-text">
            <span className="ado-stat-progress-value">{progress}%</span>
            <span className="ado-stat-progress-label">Completion rate</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, subtitle, badge, children, className = "" }) {
  return (
    <div className={`ado-chart-card ${className}`}>
      <div className="ado-chart-header">
        <div>
          <h3 className="ado-chart-title">{title}</h3>
          {subtitle && <p className="ado-chart-subtitle">{subtitle}</p>}
        </div>
        {badge && <span className="ado-chart-badge">{badge}</span>}
      </div>
      <div className="ado-chart-body">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
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

function DonutCenter({ total, label }) {
  return (
    <div className="ado-donut-center">
      <span className="ado-donut-total">{total}</span>
      <span className="ado-donut-label">{label}</span>
    </div>
  );
}

export function AdminDashboardPageView({ c }) {
  const navigate = useNavigate();
  const {
    districtId,
    districts,
    selectedDistrict,
    overview,
    verificationStatus,
    assessmentStatus,
    districtChartData,
    blockChartData,
    blockBreakdown,
    verifierChartData,
    verifierWorkload,
    insights,
    isLoading,
    isError,
    isFetching,
    lastUpdated,
    refetch,
    handleDistrictChange,
    quickLinks,
  } = c;

  if (isLoading) {
    return (
      <div className="ado-loading">
        <div className="ado-loading-card">
          <div className="ado-spinner" />
          <p className="ado-loading-title">Loading dashboard</p>
          <p className="ado-loading-sub">Fetching schools & verifier insights…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ado-error">
        <div className="ado-error-icon">!</div>
        <p>Could not load dashboard data.</p>
        <button type="button" className="ado-btn-primary" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const verificationTotal = verificationStatus.reduce((s, i) => s + i.value, 0);
  const assessmentTotal = assessmentStatus.reduce((s, i) => s + i.value, 0);
  const hasVerificationData = verificationTotal > 0;
  const hasAssessmentData = assessmentTotal > 0;

  const verificationTrend = districtChartData.map((d, i) => ({
    name: d.fullName?.slice(0, 8) || `D${i + 1}`,
    rate: d.allocated > 0 ? Math.round((d.completed / d.allocated) * 100) : 0,
    completed: d.completed,
  }));

  return (
    <div className="admin-dashboard-overview">
      {/* Hero */}
      <section className="ado-hero">
        <div className="ado-hero-bg" aria-hidden />
        <div className="ado-hero-content">
          <div className="ado-hero-text">
            <div className="ado-hero-eyebrow">
              <span className={`ado-live-dot ${isFetching ? "ado-live-pulse" : ""}`} />
              GSQAC Command Center
              {lastUpdated && <span className="ado-updated">Updated {lastUpdated}</span>}
            </div>
            <h1 className="ado-hero-title">
              {selectedDistrict ? selectedDistrict.name : "Statewide Overview"}
            </h1>
            <p className="ado-hero-desc">
              {selectedDistrict
                ? `Monitoring ${insights.blocksWithData} blocks · ${overview.totalSchools ?? 0} schools · ${overview.activeVerifiers ?? 0} active verifiers`
                : `Tracking ${insights.districtsWithData} districts · ${overview.allocatedSchools ?? 0} allocated schools · ${overview.totalVerifiers ?? 0} verifiers`}
            </p>
          </div>
          <div className="ado-hero-actions">
            <div className="ado-filter-wrap">
              <label className="ado-filter-label">Filter by district</label>
              <AppDropdown
                label=""
                options={[
                  { value: "", label: "All Districts (Statewide)" },
                  ...districts.map((d) => ({
                    value: String(d.value),
                    label: d.name,
                  })),
                ]}
                value={districtId}
                onChange={handleDistrictChange}
                placeholder="All Districts"
                valueKey="value"
                labelKey="label"
                className="ado-district-filter"
              />
            </div>
            <button
              type="button"
              className="ado-refresh-btn"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={isFetching ? "ado-spin-icon" : ""}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isFetching ? "Syncing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* KPI strip inside hero */}
        <div className="ado-kpi-strip">
          <div className="ado-kpi">
            <span className="ado-kpi-value">{insights.verificationRate}%</span>
            <span className="ado-kpi-label">Verification completion</span>
          </div>
          <div className="ado-kpi">
            <span className="ado-kpi-value">
              {districtId ? `${insights.assessmentRate}%` : insights.districtsWithData}
            </span>
            <span className="ado-kpi-label">
              {districtId ? "Assessment completion" : "Districts tracked"}
            </span>
          </div>
          <div className="ado-kpi">
            <span className="ado-kpi-value">{insights.avgSchoolsPerVerifier}</span>
            <span className="ado-kpi-label">Avg schools / verifier</span>
          </div>
          <div className="ado-kpi">
            <span className="ado-kpi-value">{verifierWorkload.length}</span>
            <span className="ado-kpi-label">Verifiers with allocations</span>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <div className="ado-stats-grid">
        <StatCard
          label="Total Verifiers"
          value={overview.totalVerifiers}
          sub={`${overview.activeVerifiers ?? 0} active · ${overview.inactiveVerifiers ?? 0} inactive`}
          tone="indigo"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
        <StatCard
          label="Allocated Schools"
          value={overview.allocatedSchools}
          sub={
            overview.totalSchools != null
              ? `${overview.totalSchools} total in district`
              : `${overview.totalTrackedSchools ?? 0} tracked in system`
          }
          tone="blue"
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="PC Verified"
          value={overview.completedVerification}
          sub={`of ${insights.verificationTotal} allocated`}
          tone="green"
          progress={insights.verificationRate}
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Verification Pending"
          value={overview.pendingVerification}
          sub="Awaiting verifier visit"
          tone="amber"
          badge={
            (overview.pendingVerification ?? 0) > 0
              ? { type: "warn", text: "Action needed" }
              : { type: "ok", text: "Clear" }
          }
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      <div className="ado-main-grid">
        {/* Left column */}
        <div className="ado-main-col">
          {/* Quick actions */}
          <div className="ado-quick-section">
            <h2 className="ado-section-heading">Quick Actions</h2>
            <div className="ado-quick-links">
              {quickLinks.map((link) => (
                <button
                  key={link.url}
                  type="button"
                  className={`ado-quick-card ado-quick-${link.tone}`}
                  onClick={() => navigate(link.url)}
                >
                  <div className="ado-quick-card-top">
                    <span className="ado-quick-stat">{link.stat}</span>
                    <svg className="ado-quick-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <span className="ado-quick-label">{link.label}</span>
                  <span className="ado-quick-desc">{link.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Charts row */}
          <div className="ado-charts-row">
            <ChartCard
              title="Verification Status"
              subtitle="Physical verification (PC) breakdown"
              badge={`${verificationTotal} schools`}
            >
              {hasVerificationData ? (
                <div className="ado-donut-wrap">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={verificationStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={88}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {verificationStatus.map((entry) => (
                          <Cell key={entry.name} fill={entry.color || STATUS_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <DonutCenter total={verificationTotal} label="Total" />
                  <div className="ado-legend-list">
                    {verificationStatus.map((s) => (
                      <div key={s.name} className="ado-legend-item">
                        <span className="ado-legend-dot" style={{ background: s.color }} />
                        <span>{s.name}</span>
                        <strong>{s.value}</strong>
                        <span className="ado-legend-pct">
                          ({pct(s.value, verificationTotal)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ado-chart-empty">
                  <span className="ado-empty-icon">📊</span>
                  No verification data for this scope
                </div>
              )}
            </ChartCard>

            {(districtId || hasAssessmentData) && (
              <ChartCard
                title="Assessment Progress"
                subtitle={districtId ? "District-wide assessment status" : "Select a district to view"}
                badge={hasAssessmentData ? `${assessmentTotal} schools` : null}
              >
                {hasAssessmentData ? (
                  <div className="ado-donut-wrap">
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie
                          data={assessmentStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={4}
                          strokeWidth={0}
                        >
                          {assessmentStatus.map((entry) => (
                            <Cell key={entry.name} fill={entry.color || STATUS_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <DonutCenter total={assessmentTotal} label="Schools" />
                    <div className="ado-legend-list">
                      {assessmentStatus.map((s) => (
                        <div key={s.name} className="ado-legend-item">
                          <span className="ado-legend-dot" style={{ background: s.color }} />
                          <span>{s.name}</span>
                          <strong>{s.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="ado-chart-empty">
                    <span className="ado-empty-icon">🎯</span>
                    Select a district to see assessment breakdown
                  </div>
                )}
              </ChartCard>
            )}
          </div>

          {/* Main bar chart */}
          <ChartCard
            title={districtId ? "Block-wise School Status" : "District-wise Performance"}
            subtitle={
              districtId
                ? "Stacked assessment status across blocks"
                : "Completed vs pending verifications by district"
            }
            className="ado-chart-full"
          >
            {(districtId ? blockChartData : districtChartData).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={districtId ? blockChartData : districtChartData}
                  margin={{ top: 12, right: 12, left: -8, bottom: 56 }}
                  barCategoryGap="20%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    angle={-30}
                    textAnchor="end"
                    height={56}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  {districtId ? (
                    <>
                      <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
                      <Bar dataKey="notAllocated" name="Not Allocated" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
                      <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="ado-chart-empty">
                <span className="ado-empty-icon">📍</span>
                {districtId ? "No block data for this district" : "No district data available yet"}
              </div>
            )}
          </ChartCard>

          {/* Verifier workload chart */}
          {verifierChartData.length > 0 && (
            <ChartCard
              title="Verifier Workload"
              subtitle="Completed vs pending schools per verifier"
              badge={`Top ${verifierChartData.length}`}
              className="ado-chart-full"
            >
              <ResponsiveContainer width="100%" height={Math.max(220, verifierChartData.length * 44)}>
                <BarChart
                  data={verifierChartData}
                  layout="vertical"
                  margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
                  barCategoryGap="28%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="completed" name="Completed" stackId="v" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="pending" name="Pending" stackId="v" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="ado-sidebar">
          {/* Attention panel */}
          <div className="ado-panel ado-panel-attention">
            <h2 className="ado-panel-title">
              <span className="ado-panel-icon">⚡</span>
              Needs Attention
            </h2>
            {insights.attentionItems.length > 0 ? (
              <ul className="ado-attention-list">
                {insights.attentionItems.map((item) => (
                  <li key={item.id} className={`ado-attention-item ado-attention-${item.type}`}>
                    <p className="ado-attention-title">{item.title}</p>
                    <p className="ado-attention-detail">{item.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ado-all-clear">
                <span>✓</span>
                <p>All clear — no urgent items</p>
              </div>
            )}
          </div>

          {/* Top performers / districts */}
          <div className="ado-panel">
            <h2 className="ado-panel-title">
              <span className="ado-panel-icon">🏆</span>
              {districtId ? "Blocks Needing Focus" : "Top Districts"}
            </h2>
            <ul className="ado-rank-list">
              {(districtId ? insights.blocksNeedingAttention : insights.topDistricts).map((item, i) => {
                const rate = item.completionRate ?? 0;
                const name = districtId ? item.blockName : item.districtName;
                const total = districtId ? item.total : item.allocatedSchools;
                const done = districtId ? item.completed : item.completedVerification;
                return (
                  <li key={item.blockId || item.districtId || i} className="ado-rank-item">
                    <span className="ado-rank-num">{i + 1}</span>
                    <div className="ado-rank-body">
                      <div className="ado-rank-row">
                        <span className="ado-rank-name">{name}</span>
                        <span className="ado-rank-pct">{rate}%</span>
                      </div>
                      <div className="ado-rank-track">
                        <div className="ado-rank-fill" style={{ width: `${rate}%` }} />
                      </div>
                      <span className="ado-rank-meta">{done}/{total} completed</span>
                    </div>
                  </li>
                );
              })}
              {(districtId ? insights.blocksNeedingAttention : insights.topDistricts).length === 0 && (
                <li className="ado-rank-empty">No data to rank yet</li>
              )}
            </ul>
          </div>

          {/* Top verifiers */}
          {insights.topVerifiers.length > 0 && (
            <div className="ado-panel">
              <h2 className="ado-panel-title">
                <span className="ado-panel-icon">👤</span>
                Top Verifiers
              </h2>
              <ul className="ado-verifier-list">
                {insights.topVerifiers.map((v) => (
                  <li key={v.verifierUserId} className="ado-verifier-item">
                    <div className="ado-verifier-avatar">
                      {(v.verifierUserName || "V").charAt(0).toUpperCase()}
                    </div>
                    <div className="ado-verifier-info">
                      <span className="ado-verifier-name">{v.verifierUserName}</span>
                      <span className="ado-verifier-meta">
                        {v.completedSchools}/{v.totalSchools} schools · {v.completionRate}%
                      </span>
                    </div>
                    <span className={`ado-verifier-badge ${v.completionRate >= 70 ? "ado-vb-green" : "ado-vb-amber"}`}>
                      {v.completionRate}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* District completion trend */}
          {!districtId && verificationTrend.length > 1 && (
            <div className="ado-panel">
              <h2 className="ado-panel-title">
                <span className="ado-panel-icon">📈</span>
                Completion Trend
              </h2>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={verificationTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}%`, "Completion"]} />
                  <Area type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} fill="url(#adoGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </aside>
      </div>

      {/* Block cards grid (district view) */}
      {districtId && blockBreakdown.length > 0 && (
        <section className="ado-blocks-section">
          <div className="ado-section-header">
            <h2 className="ado-section-heading">Block Overview</h2>
            <span className="ado-section-count">{blockBreakdown.length} blocks</span>
          </div>
          <div className="ado-block-cards">
            {blockBreakdown.map((block) => {
              const rate = pct(block.completed, block.total);
              return (
                <div key={block.blockId} className="ado-block-card">
                  <div className="ado-block-card-header">
                    <h3 className="ado-block-card-name">{block.blockName}</h3>
                    <span className={`ado-block-rate ${rate >= 70 ? "ado-rate-good" : rate >= 40 ? "ado-rate-mid" : "ado-rate-low"}`}>
                      {rate}%
                    </span>
                  </div>
                  <div className="ado-block-card-bar">
                    <div className="ado-block-card-fill" style={{ width: `${rate}%` }} />
                  </div>
                  <div className="ado-block-card-stats">
                    <div className="ado-bcs-item">
                      <span className="ado-bcs-val">{block.total}</span>
                      <span className="ado-bcs-lbl">Total</span>
                    </div>
                    <div className="ado-bcs-item ado-bcs-green">
                      <span className="ado-bcs-val">{block.completed}</span>
                      <span className="ado-bcs-lbl">Done</span>
                    </div>
                    <div className="ado-bcs-item ado-bcs-blue">
                      <span className="ado-bcs-val">{block.inProgress}</span>
                      <span className="ado-bcs-lbl">Active</span>
                    </div>
                    <div className="ado-bcs-item ado-bcs-amber">
                      <span className="ado-bcs-val">{block.pending}</span>
                      <span className="ado-bcs-lbl">Pending</span>
                    </div>
                    <div className="ado-bcs-item ado-bcs-red">
                      <span className="ado-bcs-val">{block.notAllocated}</span>
                      <span className="ado-bcs-lbl">Unalloc.</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function pct(num, den) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}
