import React from "react";
import AppDropdown from "../../../../components/AppDropdown/AppDropdown";

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
}) {
  return (
    <header className="ado-header">
      <div className="ado-header-top">
        <div className="ado-header-scope">
          <div className="ado-header-eyebrow">
            <span className={`ado-live-dot ${isFetching ? "ado-live-pulse" : ""}`} aria-hidden />
            <span>GSQAC Admin</span>
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
                options={[
                  { value: "", label: "All Districts" },
                  ...districts.map((d) => ({ value: String(d.value), label: d.name })),
                ]}
                value={districtId}
                onChange={onDistrictChange}
                placeholder="All Districts"
                valueKey="value"
                labelKey="label"
                className="ado-scope-filter"
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
          <button
            type="button"
            className="ado-refresh-btn"
            onClick={onRefresh}
            disabled={isFetching}
            aria-label="Refresh dashboard data"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className={isFetching ? "ado-spin-icon" : ""} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isFetching ? "Syncing…" : "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );
}
