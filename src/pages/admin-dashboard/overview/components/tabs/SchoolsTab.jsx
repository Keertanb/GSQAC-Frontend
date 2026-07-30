import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, ComposedChart, Line } from "recharts";
import { ChartCard, CustomTooltip, EntityCard } from "../shared/chartPrimitives";

export function SchoolsTab({ c }) {
  const { districtId, blockChartData, districtPerformanceData, blockBreakdown, statewideDistrictBreakdown } = c;

  const cards = districtId
    ? blockBreakdown.map((b) => ({
        key: b.blockId,
        name: b.blockName,
        total: b.total,
        completed: b.completed,
        inProgress: b.inProgress,
        pending: b.pending,
        notAllocated: b.notAllocated,
      }))
    : statewideDistrictBreakdown.map((d) => ({
        key: d.districtId,
        name: d.districtName,
        total: d.allocatedSchools ?? 0,
        completed: d.completedVerification ?? 0,
        inProgress: 0,
        pending: d.pendingVerification ?? 0,
        notAllocated: 0,
      }));

  return (
    <div className="ado-tab-panel-inner">
      <ChartCard
        title={districtId ? "Block-wise School Status" : "District-wise Performance"}
        subtitle={
          districtId
            ? "Stacked assessment status across blocks"
            : "Completed vs pending verifications with completion rate trend"
        }
        className="ado-chart-full"
        accent="indigo"
        icon="📊"
      >
        {(districtId ? blockChartData : districtPerformanceData).length > 0 ? (
          districtId ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={blockChartData} margin={{ top: 12, right: 12, left: -8, bottom: 56 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} angle={-30} textAnchor="end" height={56} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#3b82f6" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="notAllocated" name="Not Allocated" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart data={districtPerformanceData} margin={{ top: 12, right: 12, left: -8, bottom: 56 }} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} angle={-30} textAnchor="end" height={56} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: "#4338ca" }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar yAxisId="left" dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar yAxisId="left" dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="rate" name="Completion %" stroke="#4338ca" strokeWidth={2.5} dot={{ r: 3, fill: "#4338ca" }} />
              </ComposedChart>
            </ResponsiveContainer>
          )
        ) : (
          <div className="ado-chart-empty">
            <span className="ado-empty-icon" aria-hidden>📍</span>
            {districtId ? "No block data for this district" : "No district data available yet"}
          </div>
        )}
      </ChartCard>

      {cards.length > 0 && (
        <section className="ado-blocks-section">
          <div className="ado-section-header">
            <h2 className="ado-section-heading">{districtId ? "Block Overview" : "District Overview"}</h2>
            <span className="ado-section-count">{cards.length} {districtId ? "blocks" : "districts"}</span>
          </div>
          <div className="ado-block-cards">
            {cards.map((card) => (
              <EntityCard key={card.key} {...card} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
