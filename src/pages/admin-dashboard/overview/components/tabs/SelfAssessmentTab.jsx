import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { StatCard, ChartCard, CustomTooltip, DonutCenter } from "../shared/chartPrimitives";

export function SelfAssessmentTab({ c }) {
  const { selfAssessmentCounts } = c;

  const selfAssessmentTotal = selfAssessmentCounts.totalEligibleSchools ?? 0;
  const selfAssessmentRequired = selfAssessmentCounts.requiredAssessmentsPerSchool ?? 0;
  const selfAssessmentSlotTotal = selfAssessmentCounts.totalAssessmentSlots ?? 0;
  const hasSelfAssessmentData = selfAssessmentTotal > 0 || selfAssessmentSlotTotal > 0;
  const selfAssessmentChartData = selfAssessmentCounts.chartData || [];

  return (
    <div className="ado-tab-panel-inner">
      <div className="ado-section-heading-row">
        <div>
          <h2 className="ado-section-title">School Self-Assessment</h2>
          <p className="ado-section-desc">
            Distinct schools from assessment_session
            {selfAssessmentRequired > 0
              ? ` · each school may have up to ${selfAssessmentRequired} assessment session${
                  selfAssessmentRequired > 1 ? "s" : ""
                } (e.g. Administrative & Academic)`
              : ""}
          </p>
        </div>
        {hasSelfAssessmentData && (
          <span className="ado-section-badge">
            {selfAssessmentCounts.distinctStartedSchools ?? 0}/{selfAssessmentTotal} schools started
          </span>
        )}
      </div>

      <div className="ado-self-assessment-band">
        <div className="ado-stats-grid ado-stats-grid--self-assessment">
          <StatCard
            label="Schools Completed"
            value={selfAssessmentCounts.completedSchools ?? 0}
            sub={`Distinct schools · submitted all ${selfAssessmentRequired || 2} assessments`}
            tone="green"
            progress={selfAssessmentCounts.completionRate}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Schools Started"
            value={selfAssessmentCounts.distinctStartedSchools ?? 0}
            sub={`Distinct school IDs in assessment_session · ${selfAssessmentCounts.startedSchools ?? 0} in progress · ${selfAssessmentCounts.completedSchools ?? 0} completed`}
            tone="blue"
            progress={selfAssessmentCounts.startedRate}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Schools Remaining"
            value={selfAssessmentCounts.notStartedSchools ?? 0}
            sub={`No assessment_session row yet · of ${selfAssessmentTotal} allocated schools`}
            tone="amber"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {hasSelfAssessmentData && selfAssessmentChartData.length > 0 && (
          <ChartCard
            title="School breakdown"
            subtitle={`${selfAssessmentTotal} allocated schools · ${selfAssessmentCounts.submittedSessions ?? 0} submitted / ${selfAssessmentCounts.inProgressSessions ?? 0} in-progress sessions`}
            className="ado-self-assessment-chart"
            accent="cyan"
            icon="📊"
          >
            <div className="ado-donut-wrap ado-self-assessment-chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={selfAssessmentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {selfAssessmentChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <DonutCenter total={selfAssessmentTotal} label="Schools" />
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
