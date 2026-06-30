import React from "react";
import AppDropdown from "../../../../components/AppDropdown/AppDropdown";
import AppTable from "../../../../components/AppTable/AppTable";
import { SchoolAssessmentReportPanel } from "./SchoolAssessmentReportPanel";

const STATUS_COLORS = {
  Completed: "status-chip-completed",
  "In Progress": "status-chip-in-progress",
  Pending: "status-chip-pending",
  "Not Allocated": "status-chip-not-allocated",
  Submitted: "status-chip-completed",
  "Not Started": "status-chip-pending",
  "Not Published": "status-chip-not-allocated",
};

function StatusChip({ status }) {
  const cls = STATUS_COLORS[status] || "status-chip-pending";
  return <span className={`status-chip ${cls}`}>{status || "Pending"}</span>;
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`sas-stat-card sas-stat-${tone}`}>
      <span className="sas-stat-value">{value}</span>
      <span className="sas-stat-label">{label}</span>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="sas-detail-row">
      <span className="sas-detail-label">{label}</span>
      <span className="sas-detail-value">{value ?? "-"}</span>
    </div>
  );
}

function RoleProgress({ label, completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="sas-role-progress">
      <div className="sas-role-progress-header">
        <span>{label}</span>
        <span>
          {completed}/{total}
        </span>
      </div>
      <div className="sas-progress-track">
        <div className="sas-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SchoolDetailView({
  school,
  selectedSchool,
  selectedSchoolId,
  schoolDetail,
  isLoadingDetail,
  progressOverview,
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
  const assessments = schoolDetail?.assessments || [];

  const assessmentsByRole = assessments.reduce((acc, item) => {
    const key = item.roleName || `Role ${item.roleId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (isLoadingDetail) {
    return (
      <div className="sas-main-panel">
        <div className="sas-loading-panel">
          <div className="sas-spinner" />
          <p>Loading school details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sas-main-panel sas-detail-panel-full">
      <div className="sas-detail-toolbar">
        <button type="button" className="sas-back-btn" onClick={onBack}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to school list
        </button>
      </div>

      <div className="sas-detail-content">
        <div className="sas-detail-header">
          <div>
            <h2 className="sas-detail-title">
              {school.schoolName || selectedSchool?.schoolName}
            </h2>
            <p className="sas-detail-udise">
              UDISE: {school.schoolId || selectedSchoolId}
            </p>
          </div>
          <StatusChip
            status={
              selectedSchool?.overallStatus || schoolDetail?.allocationStatus
            }
          />
        </div>

        <div className="sas-detail-layout">
          <div className="sas-detail-card">
            <div className="sas-detail-section sas-detail-section--flush">
              <h3 className="sas-section-title">Basic Information</h3>
              <div className="sas-detail-grid">
                <DetailRow
                  label="District"
                  value={school.districtName || selectedSchool?.districtName}
                />
                <DetailRow
                  label="Block"
                  value={school.blockName || selectedSchool?.blockName}
                />
                <DetailRow
                  label="Cluster"
                  value={school.clusterName || selectedSchool?.clusterName}
                />
                <DetailRow
                  label="Village"
                  value={school.villageName || selectedSchool?.villageName}
                />
                <DetailRow
                  label="Management"
                  value={school.schoolManagementName}
                />
                <DetailRow
                  label="Category"
                  value={school.schoolCategoryName}
                />
              </div>
            </div>

            <div className="sas-detail-section sas-detail-section--flush sas-detail-section--divider">
              <h3 className="sas-section-title">Verifier Allocation</h3>
              <div className="sas-detail-grid">
                <DetailRow
                  label="Status"
                  value={schoolDetail?.allocationStatus || "Pending"}
                />
                <DetailRow
                  label="Verifier"
                  value={schoolDetail?.verifierUserName || "-"}
                />
                <DetailRow
                  label="Allocated Date"
                  value={schoolDetail?.allocatedDate || "-"}
                />
                <DetailRow
                  label="PC Status"
                  value={schoolDetail?.verifierPcStatus || "-"}
                />
              </div>
            </div>

            {(schoolDetail?.drinkingWater != null ||
              schoolDetail?.puccaBuilding != null) && (
              <div className="sas-detail-section sas-detail-section--flush sas-detail-section--divider">
                <h3 className="sas-section-title">Infrastructure Details</h3>
                <div className="sas-detail-grid">
                  <DetailRow
                    label="Drinking Water"
                    value={schoolDetail?.drinkingWater === 1 ? "Yes" : "No"}
                  />
                  <DetailRow
                    label="Pucca Building"
                    value={schoolDetail?.puccaBuilding === 1 ? "Yes" : "No"}
                  />
                  <DetailRow
                    label="Electricity"
                    value={schoolDetail?.electricity === 1 ? "Yes" : "No"}
                  />
                  <DetailRow
                    label="Functional Toilets"
                    value={
                      schoolDetail?.functionalToilets === 1 ? "Yes" : "No"
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="sas-detail-card">
            <div className="sas-detail-section sas-detail-section--flush">
              <h3 className="sas-section-title">Progress Overview</h3>
              <div className="sas-progress-overview">
                <RoleProgress
                  label="School Self-Assessment"
                  completed={progressOverview.schoolSelf.completed}
                  total={progressOverview.schoolSelf.total}
                />
                <RoleProgress
                  label="Verifier Assessment"
                  completed={progressOverview.verifier.completed}
                  total={progressOverview.verifier.total}
                />
                {/* <RoleProgress
                  label="CRC Assessment"
                  completed={progressOverview.crc.completed}
                  total={progressOverview.crc.total}
                /> */}
              </div>
            </div>
          </div>

          <div className="sas-detail-card sas-detail-card--report">
            <SchoolAssessmentReportPanel
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
          </div>

          <div className="sas-detail-card">
            <div className="sas-detail-section sas-detail-section--flush">
              <h3 className="sas-section-title">Assessment Breakdown</h3>
              {assessments.length === 0 ? (
                <p className="sas-no-assessments">
                  No assessments configured for this school.
                </p>
              ) : (
                Object.entries(assessmentsByRole).map(([roleName, items]) => (
                  <div key={roleName} className="sas-role-group">
                    <h4 className="sas-role-title">{roleName}</h4>
                    <div className="sas-assessment-list">
                      {items.map((item) => (
                        <div
                          key={`${item.roleId}-${item.assessmentId}`}
                          className="sas-assessment-card"
                        >
                          <div className="sas-assessment-card-header">
                            <span className="sas-assessment-name">
                              {item.assessmentName || item.assessmentNameGu}
                            </span>
                            <StatusChip status={item.status} />
                          </div>
                          <div className="sas-assessment-meta">
                            <span>
                              {item.startDate} – {item.endDate}
                            </span>
                            {item.lastUpdatedAt && (
                              <span>Updated: {item.lastUpdatedAt}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SchoolAssessmentStatusPageView({ c }) {
  const {
    filters,
    districts,
    blocks,
    schools,
    totalSchools,
    summary,
    isLoadingList,
    selectedSchoolId,
    selectedSchool,
    schoolDetail,
    isLoadingDetail,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleFilterChange,
    handleSchoolSelect,
    handleBackToList,
    handleItemsPerPageChange,
    progressOverview,
    report,
    isReportLoading,
    isReportError,
    reportError,
    refetchReport,
    pdfCaptureRefs,
    pdfCaptureActive,
    isGeneratingPdf,
    handleDownloadPdf,
  } = c;

  const school = schoolDetail?.school || selectedSchool || {};
  const showingDetail = !!selectedSchoolId;

  return (
    <div className="school-assessment-status-container">
      <div className="sas-header">
        <div>
          <h1 className="sas-title">School Assessment Status</h1>
          <p className="sas-subtitle">
            {showingDetail
              ? "School assessment details and progress"
              : "Track assessment progress across schools by district and block"}
          </p>
        </div>
      </div>

      {!showingDetail && (
        <>
          <div className="sas-filters">
            <div className="sas-filters-grid">
              <AppDropdown
                label="District"
                options={[
                  { value: "", label: "Select District" },
                  ...districts.map((d) => ({
                    value: String(d.value),
                    label: d.name,
                  })),
                ]}
                value={filters.districtId ? String(filters.districtId) : ""}
                onChange={(value) => handleFilterChange("districtId", value)}
                placeholder="Select District"
                valueKey="value"
                labelKey="label"
              />
              <AppDropdown
                label="Block"
                options={[
                  { value: "", label: "Select Block" },
                  ...blocks.map((b) => ({
                    value: String(b.value || b.blockId),
                    label: b.name || b.blockName,
                  })),
                ]}
                value={filters.blockId ? String(filters.blockId) : ""}
                onChange={(value) => handleFilterChange("blockId", value)}
                placeholder="Select Block"
                disabled={!filters.districtId}
                valueKey="value"
                labelKey="label"
              />
              <div className="sas-search-group">
                <label className="sas-search-label">Search School</label>
                <input
                  type="text"
                  className="sas-search-input"
                  placeholder="School name or UDISE code"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  disabled={!filters.blockId}
                />
              </div>
            </div>
          </div>

          {filters.blockId && (
            <div className="sas-stats-row">
              <StatCard label="Total Schools" value={summary.total} tone="total" />
              <StatCard label="Completed" value={summary.completed} tone="completed" />
              <StatCard label="In Progress" value={summary.inProgress} tone="progress" />
              <StatCard label="Pending" value={summary.pending} tone="pending" />
              <StatCard
                label="Not Allocated"
                value={summary.notAllocated}
                tone="not-allocated"
              />
            </div>
          )}
        </>
      )}

      <div className="sas-content sas-content-full">
        {showingDetail ? (
          <SchoolDetailView
            school={school}
            selectedSchool={selectedSchool}
            selectedSchoolId={selectedSchoolId}
            schoolDetail={schoolDetail}
            isLoadingDetail={isLoadingDetail}
            progressOverview={progressOverview}
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
        ) : (
          <div className="sas-main-panel sas-school-list-panel">
            {!filters.blockId ? (
              <div className="sas-empty-panel">
                <div className="sas-empty-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <p className="sas-empty-title">Select a district and block</p>
                <p className="sas-empty-subtitle">
                  Choose filters above to load the school list
                </p>
              </div>
            ) : (
              <AppTable
                columns={[
                  {
                    id: "schoolName",
                    label: "School",
                    render: (row) => (
                      <div className="sas-school-cell">
                        <div className="sas-school-name">{row.schoolName}</div>
                        <div className="sas-school-id">{row.schoolId}</div>
                      </div>
                    ),
                  },
                  {
                    id: "districtName",
                    label: "District",
                    render: (row) => row.districtName || "-",
                  },
                  {
                    id: "blockName",
                    label: "Block",
                    render: (row) => row.blockName || "-",
                  },
                  {
                    id: "allocationStatus",
                    label: "Allocation",
                    render: (row) => (
                      <StatusChip status={row.allocationStatus} />
                    ),
                  },
                  {
                    id: "verifier",
                    label: "Verifier",
                    render: (row) => row.verifierUserName || "-",
                  },
                  {
                    id: "overallStatus",
                    label: "Assessment",
                    render: (row) => (
                      <StatusChip status={row.overallStatus} />
                    ),
                  },
                ]}
                data={schools}
                rowKey="schoolId"
                loading={isLoadingList}
                isError={false}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage + 1}
                onPageChange={(page) => setCurrentPage(page - 1)}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalCount={totalSchools}
                serverSidePagination
                renderActions={(row) => (
                  <button
                    type="button"
                    className="sas-view-btn"
                    onClick={() => handleSchoolSelect(row.schoolId)}
                  >
                    View
                  </button>
                )}
                emptyTitle="No schools found"
                emptySubtitle="Try adjusting your search or filters"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
