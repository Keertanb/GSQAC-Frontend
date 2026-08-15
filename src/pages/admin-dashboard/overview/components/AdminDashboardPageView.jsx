import React from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardTabs } from "./DashboardTabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { GeographyTab } from "./tabs/GeographyTab";

const TABS = [
  { id: "overview", label: "Overview", Component: OverviewTab },
  { id: "geography", label: "Geography", Component: GeographyTab },
];
const TAB_IDS = TABS.map((t) => t.id);

export function AdminDashboardPageView({ c }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TAB_IDS.includes(requestedTab) ? requestedTab : "overview";
  const ActiveTab = TABS.find((tab) => tab.id === activeTab)?.Component || OverviewTab;

  const {
    districtId,
    blockId,
    schoolId,
    districts,
    blocks,
    schools,
    selectedDistrict,
    selectedBlock,
    selectedSchool,
    overview,
    isLoading,
    isError,
    isFetching,
    lastUpdated,
    refetch,
    handleDistrictChange,
    handleBlockChange,
    handleSchoolChange,
  } = c;

  const scopeTitle = selectedSchool
    ? selectedSchool.schoolName
    : selectedBlock
      ? selectedBlock.name || selectedBlock.blockName
      : selectedDistrict
        ? selectedDistrict.name
        : "Statewide Overview";

  const scopeLabel = selectedSchool
    ? "School view"
    : selectedBlock
      ? "Block view"
      : selectedDistrict
        ? "District view"
        : "All districts";

  const scopeDesc = selectedSchool
    ? `${selectedBlock?.name || selectedBlock?.blockName || "Block"} · ${selectedDistrict?.name || "District"}`
    : selectedBlock
      ? `Monitoring schools in ${selectedBlock.name || selectedBlock.blockName} · ${selectedDistrict?.name || "district"}`
      : selectedDistrict
        ? `Monitoring ${blocks.length} blocks · ${overview.totalSchools ?? 0} schools`
        : `Tracking ${districts.length} districts · ${overview.totalSchools ?? overview.totalTrackedSchools ?? 0} schools`;

  if (isLoading) {
    return (
      <div className="ado-loading">
        <div className="ado-loading-card">
          <div className="ado-spinner" />
          <p className="ado-loading-title">Loading dashboard</p>
          <p className="ado-loading-sub">Fetching school self-assessment status…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ado-error">
        <div className="ado-error-icon">!</div>
        <p>Could not load dashboard data.</p>
        <button type="button" className="ado-btn-primary" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-overview">
      <div className="ado-sticky-nav">
        <DashboardHeader
          scopeTitle={scopeTitle}
          scopeLabel={scopeLabel}
          scopeDesc={scopeDesc}
          isDistrictScope={Boolean(districtId)}
          isFetching={isFetching}
          lastUpdated={lastUpdated}
          districtId={districtId}
          blockId={blockId}
          schoolId={schoolId}
          districts={districts}
          blocks={blocks}
          schools={schools}
          onDistrictChange={handleDistrictChange}
          onBlockChange={handleBlockChange}
          onSchoolChange={handleSchoolChange}
          onRefresh={() => refetch()}
        />
        <DashboardTabs
          tabs={TABS}
          value={activeTab}
          onChange={(next) => {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("tab", next);
            setSearchParams(nextParams);
          }}
        />
      </div>

      <div
        className="ado-tab-panel"
        tabIndex={0}
        role="tabpanel"
        id={`ado-tabpanel-${activeTab}`}
        aria-labelledby={`ado-tab-${activeTab}`}
      >
        <ActiveTab c={c} />
      </div>
    </div>
  );
}
