import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChartCard,
  CustomTooltip,
  HeatmapGrid,
  FunnelStep,
} from "../shared/chartPrimitives";
import { SchoolSelfAssessmentStatusSection } from "./SelfAssessmentTab";

function formatBlockLabel(name) {
  const value = name || "Block";
  return value.length > 14 ? `${value.slice(0, 12)}…` : value;
}

export function OverviewTab({ c }) {
  const {
    districtId,
    selectedDistrict,
    selfAssessmentCounts = {},
    districtPerformanceData = [],
    completionRateChartData = [],
    laggingDistricts = [],
    blockBreakdown = [],
    managementBreakdown = [],
    categoryBreakdown = [],
  } = c;

  const blockChartData = useMemo(
    () =>
      (blockBreakdown || []).map((block) => ({
        name: formatBlockLabel(block.blockName),
        fullName: block.blockName,
        completed: block.completed ?? 0,
        started: block.inProgress ?? block.started ?? 0,
        pending: block.pending ?? block.notStarted ?? 0,
        total: block.total ?? 0,
      })),
    [blockBreakdown],
  );

  const managementChartData = useMemo(
    () =>
      (managementBreakdown || []).map((item) => ({
        name: item.managementName,
        completed: item.completed ?? 0,
        started: item.started ?? 0,
        pending: item.pending ?? 0,
        total: item.total ?? 0,
      })),
    [managementBreakdown],
  );

  const categoryChartData = useMemo(
    () =>
      (categoryBreakdown || []).map((item) => ({
        name:
          (item.categoryName || "Other").length > 18
            ? `${item.categoryName.slice(0, 16)}…`
            : item.categoryName || "Other",
        fullName: item.categoryName,
        completed: item.completed ?? 0,
        started: item.started ?? 0,
        pending: item.pending ?? 0,
        total: item.total ?? 0,
      })),
    [categoryBreakdown],
  );

  const followUp = useMemo(() => {
    const total = selfAssessmentCounts.totalEligibleSchools ?? 0;
    const completed = selfAssessmentCounts.completedSchools ?? 0;
    const started = selfAssessmentCounts.startedSchools ?? 0;
    const pending = selfAssessmentCounts.notStartedSchools ?? 0;
    return {
      total,
      completed,
      started,
      pending,
      completionRate:
        selfAssessmentCounts.completionRate ??
        (total > 0 ? Math.round((completed / total) * 100) : 0),
      startedRate:
        selfAssessmentCounts.startedRate ??
        (total > 0 ? Math.round(((completed + started) / total) * 100) : 0),
    };
  }, [selfAssessmentCounts]);

  const heatmapCells = useMemo(
    () =>
      [...blockChartData]
        .filter((block) => block.total > 0)
        .map((block) => ({
          name: block.name,
          fullName: block.fullName,
          rate: block.total > 0 ? Math.round((block.completed / block.total) * 100) : 0,
          completed: block.completed,
          total: block.total,
        }))
        .sort((a, b) => b.rate - a.rate),
    [blockChartData],
  );

  const laggingBlocks = useMemo(
    () =>
      [...blockChartData]
        .filter((block) => block.total > 0 && block.completed < block.total)
        .map((block) => ({
          ...block,
          completionRate:
            block.total > 0 ? Math.round((block.completed / block.total) * 100) : 0,
        }))
        .sort((a, b) => a.completionRate - b.completionRate)
        .slice(0, 6),
    [blockChartData],
  );

  const districtHeatmapCells = useMemo(
    () =>
      [...districtPerformanceData]
        .filter((d) => (d.total ?? 0) > 0)
        .map((d) => ({
          name: d.name,
          fullName: d.fullName,
          rate: d.rate ?? 0,
          completed: d.completed,
          total: d.total,
        }))
        .sort((a, b) => b.rate - a.rate),
    [districtPerformanceData],
  );

  const funnelSteps = useMemo(() => {
    const total = followUp.total;
    const moving = followUp.completed + followUp.started;
    return [
      { label: "Total schools", value: total, rate: 100, color: "#4338ca" },
      {
        label: "Started or completed",
        value: moving,
        rate: total > 0 ? Math.round((moving / total) * 100) : 0,
        color: "#2563eb",
      },
      {
        label: "Fully completed",
        value: followUp.completed,
        rate: total > 0 ? Math.round((followUp.completed / total) * 100) : 0,
        color: "#059669",
      },
    ];
  }, [followUp]);

  const managementPieData = useMemo(
    () =>
      managementChartData.map((item) => ({
        name: item.name,
        value: item.total,
        color:
          item.name === "Government"
            ? "#2563eb"
            : item.name === "Private"
              ? "#7c3aed"
              : "#f59e0b",
      })),
    [managementChartData],
  );

  const rateChartHeight = Math.max(320, completionRateChartData.length * 26);

  const hasBlockCharts = Boolean(districtId && blockChartData.length > 0);
  const hasDistrictWiseChart = Boolean(!districtId && districtPerformanceData.length > 0);
  const hasManagementCharts = managementChartData.length > 0;
  const hasCategoryCharts = categoryChartData.length > 0;
  const hasFollowUp = followUp.total > 0;
  const priorityBlocks = laggingBlocks.slice(0, 3);

  return (
    <div className="ado-tab-panel-inner">
      <section className="ado-self-assessment-overview" aria-label="School self-assessment status">
        <SchoolSelfAssessmentStatusSection
          c={c}
          heading="School Self-Assessment Status"
        />
      </section>

      {(hasFollowUp || hasManagementCharts) && (
        <div className="ado-charts-row">
          {hasFollowUp && (
            <ChartCard
              title="Follow-up at a glance"
              subtitle={
                districtId
                  ? `Schools still to finish in ${selectedDistrict?.name || "this district"}`
                  : "Which schools still need outreach vs already moving"
              }
              accent="amber"
              icon="🎯"
            >
              <div className="ado-followup">
                <div className="ado-followup-metrics">
                  <div className="ado-followup-metric ado-followup-metric--amber">
                    <span className="ado-followup-metric-value">{followUp.pending}</span>
                    <span className="ado-followup-metric-label">Pending schools</span>
                    <span className="ado-followup-metric-hint">Not started yet — first contact</span>
                  </div>
                  <div className="ado-followup-metric ado-followup-metric--blue">
                    <span className="ado-followup-metric-value">{followUp.started}</span>
                    <span className="ado-followup-metric-label">Started</span>
                    <span className="ado-followup-metric-hint">Remind to complete and submit</span>
                  </div>
                  <div className="ado-followup-metric ado-followup-metric--green">
                    <span className="ado-followup-metric-value">{followUp.completed}</span>
                    <span className="ado-followup-metric-label">Completed</span>
                    <span className="ado-followup-metric-hint">All matching assessments submitted</span>
                  </div>
                </div>

                <div className="ado-followup-rates">
                  <div className="ado-followup-rate">
                    <div className="ado-followup-rate-head">
                      <span>Completion rate</span>
                      <strong>{followUp.completionRate}%</strong>
                    </div>
                    <div className="ado-followup-bar" aria-hidden>
                      <span
                        className="ado-followup-bar-fill ado-followup-bar-fill--green"
                        style={{ width: `${followUp.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="ado-followup-rate">
                    <div className="ado-followup-rate-head">
                      <span>Schools that have started</span>
                      <strong>{followUp.startedRate}%</strong>
                    </div>
                    <div className="ado-followup-bar" aria-hidden>
                      <span
                        className="ado-followup-bar-fill ado-followup-bar-fill--blue"
                        style={{ width: `${followUp.startedRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {priorityBlocks.length > 0 && (
                  <ul className="ado-attention-list ado-followup-blocks">
                    {priorityBlocks.map((block) => (
                      <li
                        key={block.fullName}
                        className={`ado-attention-item ${
                          block.completionRate < 30
                            ? "ado-attention-danger"
                            : "ado-attention-warning"
                        }`}
                      >
                        <p className="ado-attention-title">
                          {block.fullName} · {block.completionRate}% complete
                        </p>
                        <p className="ado-attention-detail">
                          {block.pending} pending · {block.started} started · {block.completed}/{block.total} done
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ChartCard>
          )}

          {hasManagementCharts && (
            <ChartCard
              title="By school management"
              subtitle={
                districtId
                  ? `Government, Grant-in-Aid and Private in ${selectedDistrict?.name || "this district"}`
                  : "Government, Grant-in-Aid and Private across Gujarat"
              }
              accent="violet"
              icon="🏫"
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={managementChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                  <Bar dataKey="started" name="Started" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {hasBlockCharts && (
        <div className="ado-charts-row">
          <ChartCard
            title="Block-wise school status"
            subtitle="Each school counted once by self-assessment status"
            className="ado-chart-full"
            accent="indigo"
            icon="📊"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={blockChartData} margin={{ top: 12, right: 12, left: -8, bottom: 48 }}>
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
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                <Legend />
                <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                <Bar dataKey="started" name="Started" stackId="a" fill="#3b82f6" />
                <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {hasDistrictWiseChart && (
        <>
          <div className="ado-charts-row">
            <ChartCard
              title="Progress funnel"
              subtitle="How many school logins have started, and how many have finished"
              accent="blue"
              icon="🔻"
            >
              <div className="ado-funnel">
                {funnelSteps.map((step, index) => (
                  <FunnelStep
                    key={step.label}
                    label={step.label}
                    value={step.value}
                    rate={step.rate}
                    color={step.color}
                    isLast={index === funnelSteps.length - 1}
                  />
                ))}
              </div>
            </ChartCard>

            {managementPieData.length > 0 && (
              <ChartCard
                title="Schools by management"
                subtitle="Share of school logins by management type"
                accent="violet"
                icon="🏫"
              >
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={managementPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {managementPieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          <div className="ado-charts-row">
            <ChartCard
              title="District-wise school status"
              subtitle="Completed, started, and pending school logins in each district"
              className="ado-chart-full"
              accent="indigo"
              icon="🗺️"
            >
              <ResponsiveContainer width="100%" height={360}>
                <BarChart
                  data={districtPerformanceData}
                  margin={{ top: 12, right: 12, left: -8, bottom: 64 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    angle={-35}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                  <Bar dataKey="started" name="Started" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <div className="ado-charts-row">
            <ChartCard
              title="District completion rate"
              subtitle="Share of schools that submitted every required form"
              accent="green"
              icon="📈"
            >
              <div className="ado-chart-scroll">
              <ResponsiveContainer width="100%" height={rateChartHeight}>
                <BarChart
                  layout="vertical"
                  data={completionRateChartData}
                  margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    unit="%"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={108}
                    tick={{ fontSize: 11, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
                  <Bar dataKey="rate" name="Completion %" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </ChartCard>

            {districtHeatmapCells.length > 0 && (
              <ChartCard
                title="District completion heatmap"
                subtitle="Green is higher completion · click Geography for the map"
                accent="cyan"
                icon="🧩"
              >
                <HeatmapGrid cells={districtHeatmapCells} unit="schools" />
              </ChartCard>
            )}
          </div>
        </>
      )}

      {(hasCategoryCharts || heatmapCells.length > 0) && (
        <div className="ado-charts-row">
          {hasCategoryCharts && (
            <ChartCard
              title="By school category"
              subtitle="How Primary, Upper Primary and other categories are progressing"
              accent="cyan"
              icon="📚"
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryChartData} margin={{ top: 12, right: 12, left: -8, bottom: 48 }}>
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
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(6,182,212,0.06)" }} />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" />
                  <Bar dataKey="started" name="Started" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {heatmapCells.length > 0 && (
            <ChartCard
              title="Block completion heatmap"
              subtitle="Share of schools that finished their self-assessment"
              accent="green"
              icon="🧩"
            >
              <HeatmapGrid cells={heatmapCells} unit="schools" />
            </ChartCard>
          )}
        </div>
      )}

      {laggingBlocks.length > 0 && (
        <ChartCard
          title="Blocks needing attention"
          subtitle="Lowest completion first — schools still pending or only started"
          accent="amber"
          icon="⚠️"
        >
          <ul className="ado-attention-list">
            {laggingBlocks.map((block) => (
              <li
                key={block.fullName}
                className={`ado-attention-item ${
                  block.completionRate < 30 ? "ado-attention-danger" : "ado-attention-warning"
                }`}
              >
                <p className="ado-attention-title">
                  {block.fullName} · {block.completionRate}%
                </p>
                <p className="ado-attention-detail">
                  {block.completed}/{block.total} completed · {block.started} started · {block.pending} pending
                </p>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      {laggingDistricts.length > 0 && !districtId && (
        <ChartCard
          title="Districts needing attention"
          subtitle="Lowest completion first — school logins still pending or only started"
          accent="amber"
          icon="⚠️"
        >
          <ul className="ado-attention-list">
            {laggingDistricts.map((district) => (
              <li
                key={district.fullName}
                className={`ado-attention-item ${
                  district.rate < 30 ? "ado-attention-danger" : "ado-attention-warning"
                }`}
              >
                <p className="ado-attention-title">
                  {district.fullName} · {district.rate}%
                </p>
                <p className="ado-attention-detail">
                  {district.completed}/{district.total} completed · {district.started} started · {district.pending} pending
                </p>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}
    </div>
  );
}
