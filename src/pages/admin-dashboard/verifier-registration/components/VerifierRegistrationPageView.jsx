import React from "react";
import AppTable from "../../../../components/AppTable/AppTable";
import AppButton from "../../../../components/AppButton/AppButton";
import { VerifierRegistrationDetailModal } from "./VerifierRegistrationDetailModal";
import { VerifierRegistrationDashboardView } from "./VerifierRegistrationDashboardView";

export function VerifierRegistrationPageView({
  c,
  activeTab = "dashboard",
  onTabChange,
  analytics,
}) {
  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    selectedRow,
    rows,
    totalCount,
    columns,
    isLoading,
    isError,
    exporting,
    handleSearch,
    handleViewDetails,
    handleCloseModal,
    handleExportToExcel,
    refetch,
  } = c;

  const renderActions = (row) => (
    <button
      type="button"
      className="vr-reg-admin-view-btn"
      onClick={() => handleViewDetails(row)}
    >
      View
    </button>
  );

  return (
    <div className="vr-reg-admin-container">
      <div className="vr-reg-admin-header">
        <div>
          <h1 className="vr-reg-admin-title">Verifier Registration</h1>
          <p className="vr-reg-admin-subtitle">
            Insights and applications from the public verifier registration form
          </p>
        </div>
        {activeTab === "applications" ? (
          <div className="vr-reg-admin-header-actions">
            <AppButton
              variant="plain"
              size="sm"
              onClick={handleExportToExcel}
              disabled={exporting || isLoading}
              title="Download Excel"
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
            >
              {exporting ? "Exporting..." : "Download Excel"}
            </AppButton>
          </div>
        ) : null}
      </div>

      <div className="vr-reg-admin-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "dashboard"}
          className={`vr-reg-admin-tab${
            activeTab === "dashboard" ? " is-active" : ""
          }`}
          onClick={() => onTabChange?.("dashboard")}
        >
          Dashboard
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "applications"}
          className={`vr-reg-admin-tab${
            activeTab === "applications" ? " is-active" : ""
          }`}
          onClick={() => onTabChange?.("applications")}
        >
          Applications
        </button>
      </div>

      {activeTab === "dashboard" ? (
        <VerifierRegistrationDashboardView
          analytics={analytics?.analytics}
          isLoading={analytics?.isLoading}
          isError={analytics?.isError}
          refetch={analytics?.refetch}
        />
      ) : (
        <>
          <div className="vr-reg-admin-toolbar">
            <div className="vr-reg-admin-search">
              <input
                type="search"
                placeholder="Search by name, mobile, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <AppButton variant="blue" size="sm" onClick={handleSearch}>
                Search
              </AppButton>
            </div>
            <p className="vr-reg-admin-count">
              Total registrations: <strong>{totalCount}</strong>
            </p>
          </div>

          <div className="vr-reg-admin-table-panel">
            {isError ? (
              <div className="vr-reg-admin-error">
                <p>Failed to load registrations.</p>
                <AppButton variant="blue" size="sm" onClick={() => refetch()}>
                  Retry
                </AppButton>
              </div>
            ) : (
              <AppTable
                columns={columns}
                data={rows}
                rowKey="registrationId"
                loading={isLoading}
                renderActions={renderActions}
                currentPage={currentPage + 1}
                onPageChange={(page) => setCurrentPage(page - 1)}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={(limit) => {
                  setItemsPerPage(limit);
                  setCurrentPage(0);
                }}
                totalCount={totalCount}
                serverSidePagination
                emptyTitle="No verifier registrations"
                emptySubtitle="Registrations from the public form will appear here"
              />
            )}
          </div>
        </>
      )}

      {selectedRow && (
        <VerifierRegistrationDetailModal
          row={selectedRow}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
