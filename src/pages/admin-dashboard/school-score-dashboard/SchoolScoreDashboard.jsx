import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useSchoolScoreDashboard } from "./hooks/useSchoolScoreDashboard";
import "./SchoolScoreDashboard.css";

function Stars({ count }) {
  if (!count) return null;
  return (
    <span aria-hidden="true" style={{ letterSpacing: 1 }}>
      {"★".repeat(count)}
    </span>
  );
}

function ScoreTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div
      style={{
        background: "#0f172a",
        color: "#fff",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <div style={{ fontWeight: 700 }}>{row.band || row.gradeLabel}</div>
      <div>{row.schoolCount || 0} schools</div>
    </div>
  );
}

export default function SchoolScoreDashboard() {
  const c = useSchoolScoreDashboard();
  const maxDistrictAvg = Math.max(
    ...c.districtAverages.map((d) => Number(d.averageScore) || 0),
    1,
  );

  if (c.isLoading) {
    return (
      <div className="school-score-dashboard">
        <div className="ssd-loading">Loading school score dashboard…</div>
      </div>
    );
  }

  if (c.isError) {
    return (
      <div className="school-score-dashboard">
        <div className="ssd-error">
          <p>Could not load school score data.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            {c.error?.response?.data?.message || c.error?.message || ""}
          </p>
          <button className="ssd-btn" type="button" onClick={() => c.refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="school-score-dashboard">
      <section className="ssd-hero">
        <div className="ssd-hero-top">
          <div>
            <p className="ssd-eyebrow">Completed school reports</p>
            <h1 className="ssd-title">School Score Dashboard</h1>
            <p className="ssd-subtitle">
              Average report marks, grade mix, and score-band distribution for
              schools that have submitted their self-assessment.
            </p>
          </div>
          <div className="ssd-actions">
            {!c.isNodal && (
              <select
                className="ssd-select"
                value={c.districtId}
                onChange={(e) => c.setDistrictId(e.target.value)}
                aria-label="Filter by district"
              >
                <option value="">All districts</option>
                {c.districts.map((d) => (
                  <option
                    key={d.value ?? d.districtId}
                    value={d.value ?? d.districtId}
                  >
                    {d.name ?? d.districtName}
                  </option>
                ))}
              </select>
            )}
            <button
              className="ssd-btn"
              type="button"
              onClick={() => c.refetch()}
              disabled={c.isFetching}
            >
              {c.isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
        {c.lastUpdatedLabel ? (
          <p className="ssd-meta">Updated {c.lastUpdatedLabel}</p>
        ) : null}
      </section>

      <section className="ssd-stats">
        <article className="ssd-stat">
          <p className="ssd-stat-label">Scored schools</p>
          <p className="ssd-stat-value">{c.summary.scoredSchools || 0}</p>
        </article>
        <article className="ssd-stat ssd-stat--score">
          <p className="ssd-stat-label">Average score</p>
          <p className="ssd-stat-value">
            {Number(c.summary.averageScore || 0).toFixed(1)}%
          </p>
          <p className="ssd-stat-sub">
            Range {Number(c.summary.minScore || 0).toFixed(1)}–
            {Number(c.summary.maxScore || 0).toFixed(1)}%
          </p>
        </article>
        <article className="ssd-stat ssd-stat--grade">
          <p className="ssd-stat-label">Average grade</p>
          <p className="ssd-stat-value">
            {c.averageGradeInfo.grade}
            {c.averageGradeInfo.stars > 0 ? (
              <span style={{ fontSize: "1rem", marginLeft: 8 }}>
                <Stars count={c.averageGradeInfo.stars} />
              </span>
            ) : null}
          </p>
          <p className="ssd-stat-sub">
            Band {c.averageGradeInfo.legendLabel}
          </p>
        </article>
        <article className="ssd-stat">
          <p className="ssd-stat-label">Most common grade</p>
          <p className="ssd-stat-value">
            {c.summary.dominantGradeLabel || "—"}
          </p>
          <p className="ssd-stat-sub">Across scored schools</p>
        </article>
      </section>

      {!c.summary.scoredSchools ? (
        <div className="ssd-empty">
          No completed school reports with scores yet for this scope.
        </div>
      ) : (
        <>
          <section className="ssd-grid">
            <article className="ssd-card">
              <h2 className="ssd-card-title">Score band distribution</h2>
              <p className="ssd-card-desc">
                How many schools fall in each 10-point score range (0–100).
              </p>
              <div className="ssd-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={c.bandChartData}
                    margin={{ top: 8, right: 8, left: -8, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="band"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<ScoreTooltip />} cursor={{ fill: "rgba(15,118,110,0.06)" }} />
                    <Bar dataKey="schoolCount" radius={[8, 8, 0, 0]} maxBarSize={42}>
                      {c.bandChartData.map((entry) => (
                        <Cell key={entry.band} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="ssd-card">
              <h2 className="ssd-card-title">Grade distribution</h2>
              <p className="ssd-card-desc">
                School counts by report grade (A+ / A / B / C / D).
              </p>
              <div className="ssd-chart" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={c.gradeChartData.filter((g) => g.schoolCount > 0)}
                      dataKey="schoolCount"
                      nameKey="gradeLabel"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {c.gradeChartData
                        .filter((g) => g.schoolCount > 0)
                        .map((entry) => (
                          <Cell key={entry.gradeLabel} fill={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip content={<ScoreTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ssd-grade-list">
                {c.gradeChartData.map((row) => (
                  <div className="ssd-grade-item" key={row.gradeLabel}>
                    <div className="ssd-grade-left">
                      <span
                        className="ssd-grade-swatch"
                        style={{ background: row.fill }}
                      />
                      <div>
                        <p className="ssd-grade-name">
                          {row.grade}{" "}
                          <Stars count={row.stars} />
                        </p>
                        <p className="ssd-grade-meta">{row.gradeLabel}</p>
                      </div>
                    </div>
                    <div className="ssd-grade-count">{row.schoolCount}</div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          {!c.districtId && c.districtAverages.length > 0 ? (
            <section className="ssd-card">
              <h2 className="ssd-card-title">District average scores</h2>
              <p className="ssd-card-desc">
                Average report score of completed schools by district.
              </p>
              <div className="ssd-table-wrap">
                <table className="ssd-table">
                  <thead>
                    <tr>
                      <th>District</th>
                      <th>Schools</th>
                      <th>Average score</th>
                      <th>Relative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.districtAverages.map((row) => (
                      <tr key={`${row.districtId}-${row.districtName}`}>
                        <td>{row.districtName}</td>
                        <td>{row.scoredSchools}</td>
                        <td>{Number(row.averageScore || 0).toFixed(1)}%</td>
                        <td>
                          <div className="ssd-bar">
                            <span
                              style={{
                                width: `${Math.max(
                                  4,
                                  (Number(row.averageScore || 0) / maxDistrictAvg) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
