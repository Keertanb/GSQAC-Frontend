import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { ChartCard, CustomTooltip, DonutCenter, HeatmapGrid } from "../shared/chartPrimitives";
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

  const formProgressData = useMemo(() => {
    const submitted = selfAssessmentCounts.submittedSessions ?? 0;
    const inProgress = selfAssessmentCounts.inProgressSessions ?? 0;
    const remaining = Math.max(
      0,
      (selfAssessmentCounts.notStartedSlots ?? 0) ||
        (selfAssessmentCounts.totalAssessmentSlots ?? 0) - submitted - inProgress,
    );
    return [
      { name: "Submitted", value: submitted, color: "#10b981" },
      { name: "In progress", value: inProgress, color: "#3b82f6" },
      { name: "Not started", value: remaining, color: "#f59e0b" },
    ].filter((item) => item.value > 0);
  }, [selfAssessmentCounts]);

  const formProgressTotal = useMemo(
    () => formProgressData.reduce((sum, item) => sum + item.value, 0),
    [formProgressData],
  );

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

  const hasBlockCharts = Boolean(districtId && blockChartData.length > 0);
  const hasManagementCharts = Boolean(districtId && managementChartData.length > 0);
  const hasCategoryCharts = Boolean(districtId && categoryChartData.length > 0);
  const hasFormProgress = formProgressData.length > 0;

  return (
    <div className="ado-tab-panel-inner">
      <section className="ado-self-assessment-overview" aria-label="School self-assessment status">
        <SchoolSelfAssessmentStatusSection
          c={c}
          heading="School Self-Assessment Status"
        />
      </section>

      {(hasFormProgress || hasManagementCharts) && (
        <div className="ado-charts-row">
          {hasFormProgress && (
            <ChartCard
              title="Required forms"
              subtitle="Across schools in this view — not a 6-form total"
              accent="green"
              icon="📋"
            >
              <div className="ado-donut-wrap">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={formProgressData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {formProgressData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <DonutCenter total={formProgressTotal} label="Forms" />
              </div>
            </ChartCard>
          )}

          {hasManagementCharts && (
            <ChartCard
              title="By school management"
              subtitle={`Government, Grant-in-Aid and Private in ${selectedDistrict?.name || "this district"}`}
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
            subtitle="Each school counted once against the forms it must fill"
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
              subtitle="Share of schools that finished every required form"
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
          subtitle="Lowest completion first — schools that still have pending forms"
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

      {!districtId && (
        <p className="ado-section-desc" style={{ marginTop: "0.25rem" }}>
          Select a district to see block, management, category charts, and open Geography
          for the satellite map with school details.
        </p>
      )}
    </div>
  );
}
