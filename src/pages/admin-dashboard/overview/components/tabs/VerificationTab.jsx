import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import {
  ChartCard,
  CustomTooltip,
  RateTooltip,
  DonutCenter,
  FunnelStep,
} from "../shared/chartPrimitives";
import { STATUS_COLORS, getRateColor, pct } from "../shared/dashboardUtils";

export function VerificationTab({ c }) {
  const {
    districtId,
    selectedDistrict,
    verificationStatus,
    assessmentStatus,
    allocationFunnel,
    completionRateChartData,
    comparisonChartData,
  } = c;

  const verificationTotal = verificationStatus.reduce((s, i) => s + i.value, 0);
  const assessmentTotal = assessmentStatus.reduce((s, i) => s + i.value, 0);
  const hasVerificationData = verificationTotal > 0;
  const hasAssessmentData = assessmentTotal > 0;

  return (
    <div className="ado-tab-panel-inner">
      {districtId && selectedDistrict && (
        <div className="ado-district-drill-banner">
          <span className="ado-district-drill-icon" aria-hidden>📍</span>
          <div>
            <h3>{selectedDistrict.name} drill-down</h3>
            <p>Verification and assessment charts below reflect this district only.</p>
          </div>
        </div>
      )}

      <div className="ado-charts-row">
        <ChartCard
          title="Verification Status"
          subtitle="Physical verification (PC) breakdown"
          badge={`${verificationTotal} schools`}
          accent="green"
          icon="🛡️"
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
                    <span className="ado-legend-pct">({pct(s.value, verificationTotal)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="ado-chart-empty">
              <span className="ado-empty-icon" aria-hidden>📊</span>
              No verification data for this scope
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Assessment Progress"
          subtitle={districtId ? "District-wide assessment status" : "Select a district in Geography to drill down"}
          badge={hasAssessmentData ? `${assessmentTotal} schools` : null}
          accent="blue"
          icon="📋"
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
              <span className="ado-empty-icon" aria-hidden>🎯</span>
              Select a district to see assessment breakdown
            </div>
          )}
        </ChartCard>
      </div>

      {districtId && (hasVerificationData || hasAssessmentData) && (
        <ChartCard
          title="Verification vs Assessment"
          subtitle="Side-by-side progress comparison for this district"
          accent="violet"
          icon="⚖️"
          className="ado-chart-full"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={comparisonChartData} margin={{ top: 12, right: 12, left: -8, bottom: 8 }} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={56} />
              <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={56} />
              <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {!districtId && (
        <div className="ado-charts-row">
          <ChartCard title="Allocation Pipeline" subtitle="Schools tracked → allocated → verified" accent="cyan" icon="🔀">
            {allocationFunnel.tracked > 0 ? (
              <div className="ado-funnel">
                <FunnelStep label="Tracked schools" value={allocationFunnel.tracked} rate={100} color="#4338ca" />
                <FunnelStep label="Allocated to verifiers" value={allocationFunnel.allocated} rate={allocationFunnel.allocationRate} color="#2563eb" />
                <FunnelStep label="PC verified" value={allocationFunnel.verified} rate={allocationFunnel.verificationRate} color="#059669" isLast />
                {allocationFunnel.pending > 0 && (
                  <p className="ado-funnel-note">{allocationFunnel.pending} schools still awaiting verification</p>
                )}
              </div>
            ) : (
              <div className="ado-chart-empty">
                <span className="ado-empty-icon" aria-hidden>📈</span>
                No allocation data yet
              </div>
            )}
          </ChartCard>

          <ChartCard
            title="District Completion Rates"
            subtitle="Sorted highest to lowest"
            badge={`${completionRateChartData.length} districts`}
            accent="green"
            icon="📊"
          >
            {completionRateChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.min(320, completionRateChartData.length * 28 + 40)}>
                <BarChart
                  data={completionRateChartData.slice(0, 12)}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 4, bottom: 4 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10, fill: "#475569", fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RateTooltip />} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
                  <Bar dataKey="rate" name="Completion %" radius={[0, 6, 6, 0]} maxBarSize={16}>
                    {completionRateChartData.slice(0, 12).map((entry) => (
                      <Cell key={entry.fullName} fill={getRateColor(entry.rate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="ado-chart-empty">
                <span className="ado-empty-icon" aria-hidden>📍</span>
                No district completion data
              </div>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
