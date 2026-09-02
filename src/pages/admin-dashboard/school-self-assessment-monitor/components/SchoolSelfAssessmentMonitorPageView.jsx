import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  School,
  CheckCircle,
  HourglassEmpty,
  PlayCircle,
  TrendingUp,
  Visibility,
  ArrowBack,
  Refresh,
} from "@mui/icons-material";
import AppDropdown from "../../../../components/AppDropdown/AppDropdown";
import AppTable from "../../../../components/AppTable/AppTable";
import { AdminMonitorReportPanel } from "./AdminMonitorReportPanel";
import "../../school-assessment-status/SchoolAssessmentStatus.css";
import "../SchoolSelfAssessmentMonitor.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "pending", label: "In Progress" },
  { value: "not_started", label: "Not Started" },
];

const STATUS_CHIP_CLASS = {
  Submitted: "ssam-chip ssam-chip--submitted",
  "In Progress": "ssam-chip ssam-chip--pending",
  "Not Started": "ssam-chip ssam-chip--not-started",
};

function StatCard({ label, value, sub, tone, icon }) {
  return (
    <div className={`ssam-stat-card ssam-stat-card--${tone}`}>
      <div className="ssam-stat-icon">{icon}</div>
      <div>
        <div className="ssam-stat-value">{value}</div>
        <div className="ssam-stat-label">{label}</div>
        {sub ? <div className="ssam-stat-sub">{sub}</div> : null}
      </div>
    </div>
  );
}

function StatusChip({ status }) {
  const cls = STATUS_CHIP_CLASS[status] || "ssam-chip ssam-chip--not-started";
  return <span className={cls}>{status || "Not Started"}</span>;
}

function SchoolDetailPanel({
  school,
  schoolDetail,
  schoolSelfAssessments,
  isLoadingDetail,
  report,
  isReportLoading,
  isReportError,
  reportError,
  refetchReport,
  pdfCaptureRefs,
  pdfCaptureActive,
  isGeneratingPdf,
  onDownloadPdf,
  onBack,
}) {
  const info = schoolDetail?.school || school || {};

  return (
    <div className="ssam-detail">
      <button type="button" className="ssam-back-btn" onClick={onBack}>
        <ArrowBack fontSize="small" />
        Back to schools
      </button>

      <div className="ssam-detail-hero">
        <div>
          <p className="ssam-detail-kicker">School self-assessment</p>
          <h2 className="ssam-detail-title">{info.schoolName || school?.schoolName}</h2>
          <p className="ssam-detail-meta">
            {info.schoolId || school?.schoolId} · {info.districtName || school?.districtName} ·{" "}
            {info.blockName || school?.blockName}
          </p>
        </div>
        <StatusChip status={school?.selfAssessmentStatus} />
      </div>

      <div className="ssam-detail-grid">
        <div className="ssam-detail-card">
          <h3 className="ssam-section-title">Assessment status</h3>
          {isLoadingDetail ? (
            <div className="ssam-inline-loading">Loading assessment details...</div>
          ) : schoolSelfAssessments.length > 0 ? (
            <div className="ssam-assessment-list">
              {schoolSelfAssessments.map((item) => (
                <div key={`${item.assessmentId}-${item.roleId}`} className="ssam-assessment-item">
                  <div>
                    <div className="ssam-assessment-name">
                      {item.assessmentNameGu || item.assessmentName}
                    </div>
                    <div className="ssam-assessment-meta">
                      {item.startDate} – {item.endDate}
                    </div>
                  </div>
                  <StatusChip status={item.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="ssam-empty-copy">No published self-assessment found for this school.</p>
          )}
        </div>

        <div className="ssam-detail-card">
          <h3 className="ssam-section-title">School profile</h3>
          <div className="ssam-info-grid">
            <div>
              <span className="ssam-info-label">UDISE code</span>
              <span className="ssam-info-value">{info.schoolId || school?.schoolId || "-"}</span>
            </div>
            <div>
              <span className="ssam-info-label">District</span>
              <span className="ssam-info-value">{info.districtName || school?.districtName || "-"}</span>
            </div>
            <div>
              <span className="ssam-info-label">Block</span>
              <span className="ssam-info-value">{info.blockName || school?.blockName || "-"}</span>
            </div>
            <div>
              <span className="ssam-info-label">Last updated</span>
              <span className="ssam-info-value">
                {school?.selfAssessmentLastUpdated || "-"}
              </span>
            </div>
            <div>
              <span className="ssam-info-label">School account</span>
              <span className="ssam-info-value">
                {school?.hasSchoolAccount ? "Registered" : "Not registered"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {school?.selfAssessmentIsSubmitted === 1 ? (
        <AdminMonitorReportPanel
          report={report}
          isLoading={isReportLoading}
          isError={isReportError}
          reportError={reportError}
          onRetry={refetchReport}
          pdfCaptureRefs={pdfCaptureRefs}
          pdfCaptureActive={pdfCaptureActive}
          isGeneratingPdf={isGeneratingPdf}
          onDownloadPdf={onDownloadPdf}
        />
      ) : (
        <div className="ssam-report-placeholder">
          <Visibility fontSize="small" />
          <p>Submitted assessment report will be available here once the school completes submission.</p>
        </div>
      )}
    </div>
  );
}

export function SchoolSelfAssessmentMonitorPageView({ c }) {
  const {
    filters,
    districts,
    blocks,
    schools,
    totalSchools,
    summary,
    blockBreakdown,
    isLoadingList,
    isFetching,
    queryEnabled,
    selectedSchoolId,
    selectedSchool,
    schoolDetail,
    schoolSelfAssessments,
    isLoadingDetail,
    report,
    isReportLoading,
    isReportError,
    reportError,
    refetchReport,
    pdfCaptureRefs,
    pdfCaptureActive,
    isGeneratingPdf,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    handleFilterChange,
    handleSelectSchool,
    handleBackToList,
    handleDownloadPdf,
  } = c;

  if (selectedSchoolId) {
    return (
      <SchoolDetailPanel
        school={selectedSchool}
        schoolDetail={schoolDetail}
        schoolSelfAssessments={schoolSelfAssessments}
        isLoadingDetail={isLoadingDetail}
        report={report}
        isReportLoading={isReportLoading}
        isReportError={isReportError}
        reportError={reportError}
        refetchReport={refetchReport}
        pdfCaptureRefs={pdfCaptureRefs}
        pdfCaptureActive={pdfCaptureActive}
        isGeneratingPdf={isGeneratingPdf}
        onDownloadPdf={handleDownloadPdf}
        onBack={handleBackToList}
      />
    );
  }

  const columns = [
    {
      id: "schoolId",
      label: "UDISE",
      minWidth: 110,
      render: (row) => <span className="ssam-table-code">{row.schoolId}</span>,
    },
    {
      id: "schoolName",
      label: "School",
      minWidth: 220,
      render: (row) => (
        <div className="ssam-school-cell">
          <span className="ssam-school-name">{row.schoolName}</span>
          <span className="ssam-school-meta">
            {row.districtName}
            {row.blockName ? ` · ${row.blockName}` : ""}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      label: "Status",
      minWidth: 130,
      render: (row) => <StatusChip status={row.selfAssessmentStatus} />,
    },
    {
      id: "forms",
      label: "Required forms",
      minWidth: 110,
      render: (row) =>
        `${row.selfAssessmentsCompleted ?? 0}/${row.selfAssessmentsTotal ?? 0}`,
    },
    {
      id: "lastUpdated",
      label: "Last activity",
      minWidth: 140,
      render: (row) => row.selfAssessmentLastUpdated || "—",
    },
    {
      id: "account",
      label: "Account",
      minWidth: 110,
      render: (row) => (
        <span className={`ssam-account-pill ${row.hasSchoolAccount ? "is-yes" : ""}`}>
          {row.hasSchoolAccount ? "Yes" : "No"}
        </span>
      ),
    },
    {
      id: "actions",
      label: "",
      minWidth: 100,
      align: "right",
      render: (row) =>
        row.selfAssessmentIsSubmitted === 1 ? (
          <button
            type="button"
            className="ssam-view-btn"
            onClick={() => handleSelectSchool(row.schoolId)}
          >
            <Visibility fontSize="small" />
            View
          </button>
        ) : (
          <button
            type="button"
            className="ssam-view-btn ssam-view-btn--muted"
            onClick={() => handleSelectSchool(row.schoolId)}
          >
            Details
          </button>
        ),
    },
  ];

  const barData = blockBreakdown.slice(0, 8).map((block) => ({
    name: block.blockName?.length > 16 ? `${block.blockName.slice(0, 14)}…` : block.blockName,
    Submitted: block.submitted,
    "In Progress": block.pending,
    "Not Started": block.notStarted,
  }));

  return (
    <div className="ssam-page">
      <section className="ssam-hero">
        <div>
          <p className="ssam-kicker">Pilot monitoring</p>
          <h1 className="ssam-title">School Self-Assessment Monitor</h1>
          <p className="ssam-lede">
            Track school self-assessment progress without verifier allocation. Monitor submission
            status, activity, and view submitted reports.
          </p>
        </div>
        {isFetching && !isLoadingList ? (
          <div className="ssam-refreshing">
            <Refresh fontSize="small" />
            Refreshing
          </div>
        ) : null}
      </section>

      <section className="ssam-filters">
        <AppDropdown
          label="District"
          placeholder="Select district"
          options={districts.map((d) => ({
            value: String(d.value ?? d.districtId),
            label: d.name || d.districtName,
          }))}
          value={filters.districtId}
          onChange={(value) => handleFilterChange("districtId", value)}
        />
        <AppDropdown
          label="Block"
          placeholder="All blocks"
          options={[
            { value: "", label: "All blocks in district" },
            ...blocks.map((b) => ({
              value: String(b.value ?? b.blockId),
              label: b.name || b.blockName,
            })),
          ]}
          value={filters.blockId}
          onChange={(value) => handleFilterChange("blockId", value)}
          disabled={!filters.districtId}
        />
        <AppDropdown
          label="Assessment status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => handleFilterChange("status", value)}
        />
        <div className="ssam-search-wrap">
          <label className="ssam-search-label" htmlFor="ssam-search">
            Search
          </label>
          <input
            id="ssam-search"
            className="ssam-search-input"
            placeholder="School name or UDISE"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            disabled={!queryEnabled}
          />
        </div>
      </section>

      {!queryEnabled ? (
        <div className="ssam-empty-state">
          <School fontSize="large" />
          <h3>Select a district to begin</h3>
          <p>Choose a district to load schools and monitor self-assessment progress.</p>
        </div>
      ) : (
        <>
          <section className="ssam-stats-grid">
            <StatCard
              tone="indigo"
              icon={<School />}
              label="Total schools"
              value={summary.total}
            />
            <StatCard
              tone="green"
              icon={<CheckCircle />}
              label="Completed"
              value={summary.submitted}
              sub={`${summary.submissionRate}% filled all required forms`}
            />
            <StatCard
              tone="blue"
              icon={<HourglassEmpty />}
              label="In progress"
              value={summary.pending}
            />
            <StatCard
              tone="slate"
              icon={<PlayCircle />}
              label="Not started"
              value={summary.notStarted}
            />
            <StatCard
              tone="amber"
              icon={<TrendingUp />}
              label="Active (7 days)"
              value={summary.recentlyActive}
              sub="Schools with recent activity"
            />
          </section>

          <section className="ssam-charts">
            <div className="ssam-chart-card">
              <h3 className="ssam-section-title">Status distribution</h3>
              <div className="ssam-chart-body">
                {summary.chartData?.some((item) => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={summary.chartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={3}
                      >
                        {summary.chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="ssam-chart-empty">No school data for selected filters.</div>
                )}
              </div>
            </div>

            <div className="ssam-chart-card">
              <h3 className="ssam-section-title">Block-wise progress</h3>
              <div className="ssam-chart-body">
                {barData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={barData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Submitted" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="In Progress" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="Not Started" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="ssam-chart-empty">Block breakdown appears when schools are loaded.</div>
                )}
              </div>
            </div>
          </section>

          <section className="ssam-table-section">
            <div className="ssam-table-head">
              <div>
                <h3 className="ssam-section-title">Schools</h3>
                <p className="ssam-table-sub">
                  {totalSchools} school{totalSchools === 1 ? "" : "s"} in current view
                </p>
              </div>
            </div>
            <AppTable
              columns={columns}
              data={schools}
              rowKey="schoolId"
              loading={isLoadingList}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage + 1}
              onPageChange={(page) => setCurrentPage(page - 1)}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(value);
                setCurrentPage(0);
              }}
              totalCount={totalSchools}
              serverSidePagination
              emptyTitle="No schools found"
              emptySubtitle="Try adjusting your search or status filter."
            />
          </section>
        </>
      )}
    </div>
  );
}
