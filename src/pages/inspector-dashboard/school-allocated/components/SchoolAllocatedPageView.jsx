import React from "react";
import AppTable from "../../../../components/AppTable/AppTable";
import AppDropdown from "../../../../components/AppDropdown/AppDropdown";
import "../SchoolAllocated.css";

export function SchoolAllocatedPageView({ c }) {
  const {
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleItemsPerPageChange,
    totalCount,
    selectedDistrictId,
    districts,
    isLoadingDistricts,
    isErrorDistricts,
    isLoading,
    isError,
    handleDistrictChange,
    filteredSchools,
    stats,
    columns,
    renderActions,
  } = c;

  return (
    <div className="district-nodal-officers-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div>
            <h1 className="header-title">Allocated Schools</h1>
            <p className="header-subtitle">
              Manage and verify schools assigned to you for quality assessment
            </p>
          </div>
        </div>

        {true && (
          <div style={{ marginBottom: "1.5rem", maxWidth: "400px" }}>
            {isLoadingDistricts ? (
              <div style={{ padding: "0.75rem", color: "#6b7280" }}>
                Loading districts...
              </div>
            ) : isErrorDistricts ? (
              <div
                style={{
                  padding: "0.75rem",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                }}
              >
                Error loading districts. Please try again.
              </div>
            ) : districts.length > 0 ? (
              <AppDropdown
                label="Select District"
                options={[
                  { value: "all", label: "All" },
                  ...districts.map((district) => ({
                    value: String(district.districtId),
                    label:
                      district.districtName ||
                      `District ${district.districtId}`,
                  })),
                ]}
                value={selectedDistrictId}
                onChange={handleDistrictChange}
                placeholder="Select District"
                className="district-dropdown"
              />
            ) : (
              <div
                style={{
                  padding: "0.75rem",
                  color: "#ef4444",
                  fontSize: "0.875rem",
                }}
              >
                No districts available
              </div>
            )}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div>
              <p className="stat-label stat-label-blue">Total Schools</p>
              <p className="stat-value stat-value-blue">{stats.total}</p>
            </div>
            <div className="stat-icon stat-icon-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>

          <div className="stat-card stat-card-red">
            <div>
              <p className="stat-label stat-label-red">Pending</p>
              <p className="stat-value stat-value-red">{stats.pending}</p>
            </div>
            <div className="stat-icon stat-icon-red">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
          {/* 
          <div className="stat-card stat-card-orange">
            <div>
              <p className="stat-label stat-label-orange">In Progress</p>
              <p className="stat-value stat-value-orange">{stats.inProgress}</p>
            </div>
            <div className="stat-icon stat-icon-orange">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div> */}

          <div className="stat-card stat-card-green">
            <div>
              <p className="stat-label stat-label-green">Completed</p>
              <p className="stat-value stat-value-green">{stats.completed}</p>
            </div>
            <div className="stat-icon stat-icon-green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <svg
            className="search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by school name, code, district, or principal..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0);
            }}
            className="search-input"
          />
        </div>
      </div>

      {/* Schools Table */}
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : isError ? (
        <div className="error-container">
          <p className="error-message">
            Failed to load schools. Please try again.
          </p>
        </div>
      ) : filteredSchools.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon-container">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <p className="empty-title">No schools found</p>
          <p className="empty-subtitle">
            {searchQuery
              ? "Try adjusting your search query"
              : "No schools have been allocated to you"}
          </p>
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filteredSchools}
          rowKey={(row) => row.schoolId || row.id || Math.random()}
          loading={isLoading}
          isError={isError}
          renderActions={renderActions}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage + 1}
          onPageChange={(page) => setCurrentPage(page - 1)}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalCount={searchQuery ? filteredSchools.length : totalCount}
          serverSidePagination={!searchQuery}
          emptyTitle="No schools found"
          emptySubtitle={
            searchQuery
              ? "Try adjusting your search query"
              : "No schools have been allocated to you"
          }
          emptyIcon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />
      )}
    </div>
  );
}
