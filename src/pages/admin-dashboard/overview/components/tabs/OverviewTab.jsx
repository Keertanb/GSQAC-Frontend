import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import {
  StatCard,
  ChartCard,
  InsightCard,
  RadarPanel,
  HeatmapGrid,
} from "../shared/chartPrimitives";
import { getRateColor } from "../shared/dashboardUtils";

const STAT_ICONS = {
  verifiers: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  schools: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  check: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function OverviewTab({ c }) {
  const {
    districtId,
    overview,
    insights,
    insightCards,
    districtChartData,
    blockChartData,
    districtRadarData,
    blockRadarData,
    blockHeatmapData,
    completionRateChartData,
    laggingDistricts,
  } = c;

  const trendScopeLabel = districtId ? "Spread across blocks" : "Spread across districts";
  const totalVerifiersTrend = districtId ? null : districtChartData;
  const allocatedSchoolsTrend = districtId
    ? blockChartData.map((b) => ({ ...b, allocated: b.total }))
    : districtChartData;
  const verifiedTrend = districtId ? blockChartData : districtChartData;
  const pendingTrend = districtId ? blockChartData : districtChartData;

  const trendSource = districtId ? blockChartData : districtChartData;
  const completionTrend = trendSource.map((d, i) => ({
    name: d.fullName?.slice(0, 8) || `#${i + 1}`,
    rate: (d.allocated ?? d.total) > 0 ? Math.round((d.completed / (d.allocated ?? d.total)) * 100) : 0,
  }));

  const radarData = districtId ? blockRadarData : districtRadarData;
  const heatmapCells = districtId ? blockHeatmapData : completionRateChartData;
  const rankingList = districtId ? insights.blocksNeedingAttention : insights.topDistricts;
  const rankingTitle = districtId ? "Blocks Needing Focus" : "Top Districts";

  return (
    <div className="ado-tab-panel-inner">
      <section className="ado-stats-grid" aria-label="Key metrics">
        <StatCard
          label="Total Verifiers"
          value={overview.totalVerifiers}
          sub={`${overview.activeVerifiers ?? 0} active · ${overview.inactiveVerifiers ?? 0} inactive`}
          tone="indigo"
          trendData={totalVerifiersTrend}
          trendKey="verifiers"
          trendLabel={trendScopeLabel}
          icon={STAT_ICONS.verifiers}
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
          trendData={allocatedSchoolsTrend}
          trendKey="allocated"
          trendLabel={trendScopeLabel}
          icon={STAT_ICONS.schools}
        />
        <StatCard
          label="PC Verified"
          value={overview.completedVerification}
          sub={`of ${insights.verificationTotal} allocated`}
          tone="green"
          progress={insights.verificationRate}
          trendData={verifiedTrend}
          trendKey="completed"
          trendLabel={trendScopeLabel}
          icon={STAT_ICONS.check}
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
          trendData={pendingTrend}
          trendKey="pending"
          trendLabel={trendScopeLabel}
          icon={STAT_ICONS.clock}
        />
      </section>

      <section className="ado-insights-band" aria-label="Key insights">
        <InsightCard
          tone="blue"
          icon="📌"
          label="Allocation coverage"
          value={`${insightCards.allocationCoverage}%`}
          sub={
            insightCards.unallocatedSchools > 0
              ? `${insightCards.unallocatedSchools} schools not yet allocated`
              : "All tracked schools allocated"
          }
        />
        <InsightCard
          tone="amber"
          icon="⏳"
          label="Verification backlog"
          value={insightCards.totalPending}
          sub={`~${insightCards.avgPendingPerVerifier} pending per active verifier`}
        />
        {!districtId ? (
          <InsightCard
            tone="red"
            icon="⚠️"
            label="Districts below 50%"
            value={insightCards.districtsBelow50}
            sub="Need focused verification push"
          />
        ) : (
          <InsightCard
            tone="green"
            icon="📋"
            label="Assessment completion"
            value={`${insights.assessmentRate}%`}
            sub={`${insights.assessmentTotal} schools in scope`}
          />
        )}
        <InsightCard
          tone="violet"
          icon="👥"
          label="Verifier capacity"
          value={overview.activeVerifiers ?? 0}
          sub={`${overview.inactiveVerifiers ?? 0} inactive · ${insights.avgSchoolsPerVerifier} schools each`}
        />
      </section>

      <div className="ado-overview-grid">
        <div className="ado-overview-main">
          {completionTrend.length > 1 && (
            <ChartCard
              title="Completion Trend"
              subtitle={districtId ? "Verification rate by block" : "Verification rate by district"}
              accent="indigo"
              icon="📈"
            >
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={completionTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adoOverviewTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4338ca" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#4338ca" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => [`${v}%`, "Completion"]} />
                  <Area type="monotone" dataKey="rate" stroke="#4338ca" strokeWidth={2} fill="url(#adoOverviewTrend)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <div className="ado-charts-row">
            <ChartCard
              title={districtId ? "Block Radar" : "District Radar"}
              subtitle="Multi-metric comparison, top 5"
              accent="violet"
              icon="📡"
            >
              <RadarPanel entities={radarData.entities} axes={radarData.axes} />
            </ChartCard>
            <ChartCard
              title="Completion Heatmap"
              subtitle={districtId ? "Blocks sorted by completion rate" : "Districts sorted by completion rate"}
              accent="green"
              icon="🧩"
            >
              <HeatmapGrid cells={heatmapCells} />
            </ChartCard>
          </div>
        </div>

        <aside className="ado-sidebar">
          <div className="ado-panel ado-panel-attention">
            <h2 className="ado-panel-title">
              <span className="ado-panel-icon ado-panel-icon--warn" aria-hidden>⚡</span>
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

          <div className="ado-panel ado-panel-rank">
            <h2 className="ado-panel-title">
              <span className="ado-panel-icon ado-panel-icon--gold" aria-hidden>🏆</span>
              {rankingTitle}
            </h2>
            <ul className="ado-rank-list">
              {rankingList.map((item, i) => {
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
                        <div className="ado-rank-fill" style={{ width: `${rate}%`, background: getRateColor(rate) }} />
                      </div>
                      <span className="ado-rank-meta">{done}/{total} completed</span>
                    </div>
                  </li>
                );
              })}
              {rankingList.length === 0 && <li className="ado-rank-empty">No data to rank yet</li>}
            </ul>
          </div>

          {!districtId && laggingDistricts.length > 0 && (
            <div className="ado-panel ado-panel-rank ado-panel-lagging">
              <h2 className="ado-panel-title">
                <span className="ado-panel-icon ado-panel-icon--warn" aria-hidden>📉</span>
                Needs Improvement
              </h2>
              <ul className="ado-rank-list">
                {laggingDistricts.map((item, i) => (
                  <li key={item.districtId || i} className="ado-rank-item">
                    <span className="ado-rank-num ado-rank-num--warn">{i + 1}</span>
                    <div className="ado-rank-body">
                      <div className="ado-rank-row">
                        <span className="ado-rank-name">{item.districtName}</span>
                        <span className="ado-rank-pct ado-rank-pct--low">{item.completionRate}%</span>
                      </div>
                      <div className="ado-rank-track">
                        <div
                          className="ado-rank-fill"
                          style={{ width: `${item.completionRate}%`, background: getRateColor(item.completionRate) }}
                        />
                      </div>
                      <span className="ado-rank-meta">
                        {item.completedVerification}/{item.allocatedSchools} · {item.pendingVerification} pending
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
