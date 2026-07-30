import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { ChartCard, CustomTooltip, DonutCenter } from "../shared/chartPrimitives";

export function VerifiersTab({ c }) {
  const { overview, verifierStatusChart, workloadBuckets, verifierChartData, insights } = c;

  return (
    <div className="ado-tab-panel-inner">
      <div className="ado-charts-row">
        {verifierStatusChart.length > 0 && (
          <ChartCard
            title="Verifier Accounts"
            subtitle="Active vs inactive verifiers"
            badge={`${overview.totalVerifiers ?? 0} total`}
            accent="indigo"
            icon="🛡️"
          >
            <div className="ado-donut-wrap ado-donut-wrap--compact">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={verifierStatusChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {verifierStatusChart.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenter total={overview.totalVerifiers ?? 0} label="Verifiers" />
              <div className="ado-legend-list">
                {verifierStatusChart.map((s) => (
                  <div key={s.name} className="ado-legend-item">
                    <span className="ado-legend-dot" style={{ background: s.color }} />
                    <span>{s.name}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}

        {workloadBuckets.length > 0 && (
          <ChartCard title="Workload Distribution" subtitle="Verifier backlog health" accent="amber" icon="📦">
            <div className="ado-workload-buckets">
              {workloadBuckets.map((bucket) => {
                const total = workloadBuckets.reduce((s, b) => s + b.value, 0);
                const share = total > 0 ? Math.round((bucket.value / total) * 100) : 0;
                return (
                  <div key={bucket.name} className="ado-workload-bucket">
                    <div className="ado-workload-bucket-head">
                      <span className="ado-workload-dot" style={{ background: bucket.color }} />
                      <span className="ado-workload-name">{bucket.name}</span>
                      <strong>{bucket.value}</strong>
                      <span className="ado-workload-pct">{share}%</span>
                    </div>
                    <div className="ado-workload-track">
                      <div className="ado-workload-fill" style={{ width: `${share}%`, background: bucket.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        )}
      </div>

      {verifierChartData.length > 0 && (
        <ChartCard
          title="Verifier Workload"
          subtitle="Completed vs pending schools per verifier"
          badge={`Top ${verifierChartData.length}`}
          className="ado-chart-full"
          accent="amber"
          icon="👤"
        >
          <ResponsiveContainer width="100%" height={Math.max(220, verifierChartData.length * 44)}>
            <BarChart data={verifierChartData} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 4 }} barCategoryGap="28%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" name="Completed" stackId="v" fill="#10b981" />
              <Bar dataKey="pending" name="Pending" stackId="v" fill="#f59e0b" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {insights.topVerifiers.length > 0 && (
        <div className="ado-panel ado-panel-verifiers ado-panel--wide">
          <h2 className="ado-panel-title">
            <span className="ado-panel-icon ado-panel-icon--indigo" aria-hidden>👤</span>
            Top Verifiers
          </h2>
          <ul className="ado-verifier-list ado-verifier-list--grid">
            {insights.topVerifiers.map((v) => (
              <li key={v.verifierUserId} className="ado-verifier-item">
                <div className="ado-verifier-avatar">{(v.verifierUserName || "V").charAt(0).toUpperCase()}</div>
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
    </div>
  );
}
