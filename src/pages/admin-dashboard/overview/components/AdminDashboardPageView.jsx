import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardTabs } from "./DashboardTabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { VerificationTab } from "./tabs/VerificationTab";
import { SchoolsTab } from "./tabs/SchoolsTab";
import { VerifiersTab } from "./tabs/VerifiersTab";
import { SelfAssessmentTab } from "./tabs/SelfAssessmentTab";
import { GeographyTab } from "./tabs/GeographyTab";

const TABS = [
  { id: "overview", label: "Overview", Component: OverviewTab },
  { id: "verification", label: "Verification", Component: VerificationTab },
  { id: "schools", label: "Schools & Blocks", Component: SchoolsTab },
  { id: "verifiers", label: "Verifiers", Component: VerifiersTab },
  { id: "self-assessment", label: "Self-Assessment", Component: SelfAssessmentTab },
  { id: "geography", label: "Geography", Component: GeographyTab },
];
const TAB_IDS = TABS.map((t) => t.id);

export function AdminDashboardPageView({ c }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = TAB_IDS.includes(requestedTab) ? requestedTab : "overview";

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
    insights,
    verifierWorkload,
    isLoading,
    isError,
    isFetching,
    lastUpdated,
    refetch,
    handleDistrictChange,
    handleBlockChange,
    handleSchoolChange,
  } = c;

  const handleTabChange = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    if (nextTab === "overview") next.delete("tab");
    else next.set("tab", nextTab);
    setSearchParams(next, { replace: false });
  };

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
        ? `Monitoring ${insights.blocksWithData} blocks · ${overview.totalSchools ?? 0} schools · ${overview.activeVerifiers ?? 0} active verifiers`
        : `Tracking ${insights.districtsWithData} districts · ${overview.allocatedSchools ?? 0} allocated schools · ${overview.totalVerifiers ?? 0} verifiers`;

  const tabBadges = useMemo(
    () => ({
      verifiers: verifierWorkload.length || undefined,
    }),
    [verifierWorkload.length],
  );

  if (isLoading) {
    return (
      <div className="ado-loading">
        <div className="ado-loading-card">
          <div className="ado-spinner" />
          <p className="ado-loading-title">Loading dashboard</p>
          <p className="ado-loading-sub">Fetching schools & verifier insights…</p>
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

  const ActiveTab = TABS.find((t) => t.id === activeTab)?.Component || OverviewTab;

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
          tabs={TABS.map((tab) => ({
            id: tab.id,
            label: tab.label,
            badge: tab.id === "verifiers" ? tabBadges.verifiers : undefined,
          }))}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <div
        className="ado-tab-panel"
        role="tabpanel"
        id={`ado-tabpanel-${activeTab}`}
        aria-labelledby={`ado-tab-${activeTab}`}
        tabIndex={0}
      >
        <ActiveTab c={c} />
      </div>
    </div>
  );
}
