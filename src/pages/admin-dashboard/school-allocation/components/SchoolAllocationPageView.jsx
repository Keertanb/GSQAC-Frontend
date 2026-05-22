import React from "react";
import AppTable from "../../../../components/AppTable/AppTable";
import AppButton from "../../../../components/AppButton/AppButton";
import AppDropdown from "../../../../components/AppDropdown/AppDropdown";

export function SchoolAllocationPageView({ c }) {
  const {
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    schoolAssignments,
    setSchoolAssignments,
    originalAssignments,
    setOriginalAssignments,
    saveAllocationMutation,
    districtsData,
    districts,
    blocksData,
    blocks,
    schoolsData,
    isLoadingSchools,
    schools,
    totalSchools,
    selectedDistrictId,
    verifiersData,
    verifiers,
    filteredSchools,
    handleFilterChange,
    handleItemsPerPageChange,
    handleAssignmentChange,
    handleSaveAssignment,
    handleExportToExcel,
  } = c;

  return (
    <div className="school-allocation-container">
      {/* Header */}
      <div className="allocation-header">
        <div className="allocation-header-content">
          <div>
            <h1 className="allocation-title">School Allocation</h1>
            <p className="allocation-subtitle">
              Manage school assignments and verifier allocations
            </p>
          </div>
          <AppButton
            variant="plain"
            size="icon"
            iconOnly
            onClick={handleExportToExcel}
            title="Export to Excel"
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
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <AppDropdown
              label="District"
              options={[
                { value: "", label: "All Districts" },
                ...districts.map((district) => ({
                  value: String(district.value),
                  label: district.name,
                })),
              ]}
              value={filters.districtId ? String(filters.districtId) : ""}
              onChange={(value) => handleFilterChange("districtId", value)}
              placeholder="All Districts"
              valueKey="value"
              labelKey="label"
            />
          </div>

          <div className="filter-group">
            <AppDropdown
              label="Block"
              options={[
                { value: "", label: "All Blocks" },
                ...blocks.map((block) => ({
                  value: String(block.value || block.blockId),
                  label: block.name || block.blockName,
                })),
              ]}
              value={filters.blockId ? String(filters.blockId) : ""}
              onChange={(value) => handleFilterChange("blockId", value)}
              placeholder="All Blocks"
              disabled={!filters.districtId}
              valueKey="value"
              labelKey="label"
            />
          </div>

          <div className="filter-group">
            <AppDropdown
              label="Status"
              options={[
                { value: "", label: "All Status" },
                { value: "Pending", label: "Pending" },
                { value: "Allocated", label: "Allocated" },
              ]}
              value={filters.status || ""}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="All Status"
              valueKey="value"
              labelKey="label"
            />
          </div>
          <div className="filter-group">
            <label className="filter-label">School ID / UDISE Code</label>
            <input
              type="text"
              value={filters.schoolId}
              onChange={(e) => handleFilterChange("schoolId", e.target.value)}
              className="filter-input"
              placeholder="Enter school ID or UDISE code"
            />
          </div>

          {/* <div className="filter-group">
            <label className="filter-label">School Name</label>
            <input
              type="text"
              value={filters.schoolName}
              onChange={(e) => handleFilterChange("schoolName", e.target.value)}
              className="filter-input"
              placeholder="Enter school name"
            />
          </div> */}
        </div>
      </div>

      {/* Schools Table */}
      {filteredSchools.length === 0 ? (
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
            {filters.schoolId ||
            filters.schoolName ||
            filters.districtId ||
            filters.blockId
              ? "Try adjusting your filters"
              : "No schools available"}
          </p>
        </div>
      ) : (
        <AppTable
          columns={[
            {
              id: "schoolName",
              label: "School Name",
              render: (school) => (
                <div className="school-name-cell">
                  <div className="school-name-text">{school.schoolName}</div>
                  <div className="school-udise-code">{school.schoolId}</div>
                </div>
              ),
            },
            {
              id: "district",
              label: "District",
              render: (school) => {
                const district = districts.find(
                  (d) => d.value === school.districtId,
                );
                return (
                  <div className="school-district-cell">
                    {district?.name || school.districtName || "-"}
                  </div>
                );
              },
            },
            {
              id: "block",
              label: "Block",
              render: (school) => (
                <div className="school-block-cell">
                  {school.blockName || "-"}
                </div>
              ),
            },
            {
              id: "status",
              label: "Status",
              render: (school) => {
                const assignment = schoolAssignments[school.schoolId] || {};
                const status = assignment.status || school.status || "Pending";
                const isAllocated = status === "Allocated";
                return (
                  <span
                    className={`status-chip ${
                      isAllocated
                        ? "status-chip-allocated"
                        : "status-chip-pending"
                    }`}
                  >
                    {status}
                  </span>
                );
              },
            },
            {
              id: "verifier",
              label: "Verifier",
              render: (school) => {
                const assignment = schoolAssignments[school.schoolId] || {};
                return (
                  <AppDropdown
                    options={[
                      { value: "", label: "Select Verifier" },
                      ...verifiers.map((verifier) => ({
                        value: String(verifier.userId),
                        label: verifier.userName || `User ${verifier.userId}`,
                      })),
                    ]}
                    value={
                      assignment.verifierId ? String(assignment.verifierId) : ""
                    }
                    onChange={(value) =>
                      handleAssignmentChange(
                        school.schoolId,
                        "verifierId",
                        value,
                      )
                    }
                    placeholder="Select Verifier"
                    valueKey="value"
                    labelKey="label"
                    className="table-dropdown"
                    disabled={!selectedDistrictId}
                  />
                );
              },
            },
            {
              id: "assignmentDate",
              label: "Assignment Date",
              render: (school) => {
                const assignment = schoolAssignments[school.schoolId] || {};
                return (
                  <input
                    type="date"
                    value={assignment.date || ""}
                    onChange={(e) =>
                      handleAssignmentChange(
                        school.schoolId,
                        "date",
                        e.target.value,
                      )
                    }
                    className="table-input"
                    min={new Date().toISOString().split("T")[0]}
                  />
                );
              },
            },
            {
              id: "actions",
              label: "Actions",
              render: (school) => {
                const assignment = schoolAssignments[school.schoolId] || {};
                const originalAssignment =
                  originalAssignments[school.schoolId] || {};
                const isSaving = saveAllocationMutation.isPending;

                // Check if assignment has required fields
                const hasRequiredFields =
                  assignment.verifierId && assignment.date;

                // Check if values have changed from original
                const hasChanged =
                  assignment.verifierId !== originalAssignment.verifierId ||
                  assignment.date !== originalAssignment.date;

                // Disable if:
                // 1. Missing required fields
                // 2. Currently saving
                // 3. Status is "Allocated" AND no changes were made
                const isDisabled =
                  !hasRequiredFields ||
                  isSaving ||
                  (assignment.status === "Allocated" && !hasChanged);

                return (
                  <button
                    onClick={() => handleSaveAssignment(school.schoolId)}
                    className="table-save-icon-button"
                    disabled={isDisabled}
                    title={
                      !assignment.verifierId || !assignment.date
                        ? "Please select verifier and date"
                        : assignment.status === "Allocated" && !hasChanged
                          ? "No changes to save"
                          : assignment.id
                            ? "Update assignment"
                            : "Save assignment"
                    }
                  >
                    {isSaving ? (
                      <svg
                        className="save-icon save-icon-spinner"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    ) : (
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        className="save-icon"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              },
            },
          ]}
          data={filteredSchools}
          rowKey="schoolId"
          loading={isLoadingSchools}
          isError={false}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage + 1}
          onPageChange={(page) => setCurrentPage(page - 1)}
          onItemsPerPageChange={handleItemsPerPageChange}
          totalCount={
            filters.schoolId || filters.schoolName
              ? filteredSchools.length
              : totalSchools
          }
          serverSidePagination={!(filters.schoolId || filters.schoolName)}
          emptyTitle="No schools found"
          emptySubtitle={
            filters.schoolId ||
            filters.schoolName ||
            filters.districtId ||
            filters.blockId
              ? "Try adjusting your filters"
              : "No schools available"
          }
        />
      )}
    </div>
  );
}
