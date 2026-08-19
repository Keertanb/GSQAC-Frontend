import React from "react";
import AppDropdown from "../../../../components/AppDropdown/AppDropdown";
import { useExportDashboard } from "../hooks/useExportDashboard";

export function DashboardHeader({
  scopeTitle,
  scopeLabel,
  scopeDesc,
  isDistrictScope,
  isFetching,
  lastUpdated,
  districtId,
  blockId,
  schoolId,
  districts,
  blocks,
  schools,
  onDistrictChange,
  onBlockChange,
  onSchoolChange,
  onRefresh,
  isDistrictLocked = false,
  eyebrowLabel = "GSQAC Admin",
}) {
  const {
    exportToXlsx,
    isExporting,
    exportProgress,
    exportManagementCategoryToXlsx,
    isMgmtCategoryExporting,
    mgmtCategoryExportProgress,
  } = useExportDashboard({
    districtId: isDistrictLocked ? districtId : undefined,
  });

  return (
    <header className="ado-header">
      <div className="ado-header-top">
        <div className="ado-header-scope">
          <div className="ado-header-eyebrow">
            <span className={`ado-live-dot ${isFetching ? "ado-live-pulse" : ""}`} aria-hidden />
            <span> {eyebrowLabel}</span>
            {lastUpdated && <span className="ado-updated">Updated {lastUpdated}</span>}
          </div>
          <div className="ado-header-title-row">
            <h1 className="ado-header-title">{scopeTitle}</h1>
            <span className={`ado-scope-badge ${isDistrictScope ? "ado-scope-badge--district" : ""}`}>
              {scopeLabel}
            </span>
          </div>
          {scopeDesc && <p className="ado-header-desc">{scopeDesc}</p>}
        </div>

        <div className="ado-header-actions">
          <div className="ado-header-filters">
            <div className="ado-filter-wrap">
              <span className="ado-filter-label">District</span>
              <AppDropdown
                label=""
                options={
                  isDistrictLocked
                    ? districts.map((d) => ({
                        value: String(d.value ?? d.districtId),
                        label: d.name || d.districtName || `District ${d.value ?? d.districtId}`,
                      }))
                    : [
                        { value: "", label: "All Districts" },
                        ...districts.map((d) => ({
                          value: String(d.value),
                          label: d.name,
                        })),
                      ]
                }
                value={districtId}
                onChange={onDistrictChange}
                placeholder={isDistrictLocked ? "Your district" : "All Districts"}
                valueKey="value"
                labelKey="label"
                className="ado-scope-filter"
                disabled={isDistrictLocked}
              />
            </div>
            <div className="ado-filter-wrap">
              <span className="ado-filter-label">Block</span>
              <AppDropdown
                label=""
                options={[
                  { value: "", label: "All Blocks" },
                  ...blocks.map((b) => ({ value: String(b.value ?? b.blockId), label: b.name || b.blockName })),
                ]}
                value={blockId}
                onChange={onBlockChange}
                placeholder="All Blocks"
                disabled={!districtId}
                valueKey="value"
                labelKey="label"
                className="ado-scope-filter"
              />
            </div>
            <div className="ado-filter-wrap">
              <span className="ado-filter-label">School</span>
              <AppDropdown
                label=""
                options={[
                  { value: "", label: "All Schools" },
                  ...schools.map((s) => ({ value: String(s.schoolId), label: s.schoolName || s.schoolId })),
                ]}
                value={schoolId}
                onChange={onSchoolChange}
                placeholder="All Schools"
                disabled={!blockId}
                valueKey="value"
                labelKey="label"
                className="ado-scope-filter ado-scope-filter--school"
              />
            </div>
          </div>
          <div className="ado-header-btn-group">
            <button
              type="button"
              className="ado-download-btn"
              onClick={exportManagementCategoryToXlsx}
              disabled={isMgmtCategoryExporting}
              aria-label="Download district management and category report"
              title="Download district-wise primary/secondary + management status report"
            >
              {isMgmtCategoryExporting ? (
                <>
                  <svg
                    className="ado-spin-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {mgmtCategoryExportProgress || "Preparing…"}
                </>
              ) : (
                <>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Mgmt+Category
                </>
              )}
            </button>

            <button
              id="admin-dashboard-download-report-btn"
              type="button"
              className="ado-download-btn"
              onClick={exportToXlsx}
              disabled={isExporting}
              aria-label="Download dashboard report as Excel"
              title="Download XLSX report (District · Block · Cluster · School)"
            >
              {isExporting ? (
                <>
                  <svg
                    className="ado-spin-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {exportProgress || "Preparing…"}
                </>
              ) : (
                <>
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Report
                </>
              )}
            </button>

            <button
              type="button"
              className="ado-refresh-btn"
              onClick={onRefresh}
              disabled={isFetching}
              aria-label="Refresh dashboard data"
            >
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className={isFetching ? "ado-spin-icon" : ""}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isFetching ? "Syncing…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
