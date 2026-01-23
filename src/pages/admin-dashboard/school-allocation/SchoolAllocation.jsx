import React, { useState, useMemo, useEffect } from "react";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
  useGetSchoolListQuery,
  useGetVerifiersByDistrictQuery,
  useSaveSchoolAllocationMutation,
} from "../../../services/adminService";
import AppTable from "../../../components/AppTable/AppTable";
import AppButton from "../../../components/AppButton/AppButton";
import AppDropdown from "../../../components/AppDropdown/AppDropdown";
import { exportToExcel } from "../../../utils/exportToExcel";
import "./SchoolAllocation.css";

const SchoolAllocation = () => {
  const [filters, setFilters] = useState({
    schoolId: "",
    schoolName: "",
    districtId: "",
    blockId: "",
    clusterId: "",
    villageId: "",
    status: "",
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Store assignments for each school: { schoolId: { id, verifierId, verifierCode, date, status } }
  const [schoolAssignments, setSchoolAssignments] = useState({});

  // Mutation for saving school allocation
  const saveAllocationMutation = useSaveSchoolAllocationMutation({
    onSuccess: (data, payload) => {
      // Update the assignment with the returned id and status if available
      const returnedId = data?.data?.id || data?.data?.allocationId || data?.id;
      if (payload?.schoolId) {
        setSchoolAssignments((prev) => ({
          ...prev,
          [payload.schoolId]: {
            ...prev[payload.schoolId],
            id: returnedId || prev[payload.schoolId]?.id,
            status: payload.status || "Allocated",
          },
        }));
      }
    },
  });

  // Fetch districts
  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  // Fetch blocks when district is selected
  const { data: blocksData } = useGetDistrictWiseBlocksQuery(
    filters.districtId
  );
  const blocks = blocksData?.data || [];

  // Fetch schools based on filters
  const { data: schoolsData, isLoading: isLoadingSchools } =
    useGetSchoolListQuery(
      {
        blockId: filters.blockId ? Number(filters.blockId) : undefined,
        clusterId: filters.clusterId || undefined,
        villageId: filters.villageId ? Number(filters.villageId) : undefined,
        status: filters.status || undefined,
        page: currentPage,
        limit: itemsPerPage,
      },
      true
    );

  const schools = schoolsData?.data?.rows || [];
  const totalSchools = schoolsData?.data?.total || 0;

  // Initialize school assignments from API data when schools are loaded
  useEffect(() => {
    if (schools.length > 0) {
      setSchoolAssignments((prev) => {
        const updated = { ...prev };
        schools.forEach((school) => {
          // If school has allocation data (status is "Allocated"), pre-fill the assignment
          if (
            school.status === "Allocated" &&
            school.userId &&
            school.allocatedDate
          ) {
            // Check if we need to update (only if not manually edited or if data changed)
            const existingAssignment = updated[school.schoolId];
            const shouldUpdate =
              !existingAssignment ||
              existingAssignment.verifierId !== String(school.userId) ||
              existingAssignment.date !== school.allocatedDate;

            if (shouldUpdate) {
              updated[school.schoolId] = {
                verifierId: String(school.userId),
                date: school.allocatedDate,
                status: school.status,
                // If there's an id field in the response, include it
                id:
                  school.id ||
                  school.allocationId ||
                  existingAssignment?.id ||
                  null,
              };
            } else {
              // Preserve existing assignment but ensure status is set
              updated[school.schoolId] = {
                ...existingAssignment,
                status: school.status,
              };
            }
          } else if (school.status === "Pending" || !school.status) {
            // Set status to Pending if not allocated
            const existingAssignment = updated[school.schoolId];
            if (!existingAssignment) {
              updated[school.schoolId] = {
                status: "Pending",
              };
            } else if (!existingAssignment.status) {
              updated[school.schoolId] = {
                ...existingAssignment,
                status: "Pending",
              };
            }
          }
        });
        return updated;
      });
    }
  }, [schools]);

  // Get district ID from selected district filter
  const selectedDistrictId = useMemo(() => {
    if (!filters.districtId) return null;
    const district = districts.find(
      (d) => String(d.value) === String(filters.districtId)
    );
    return district?.value || null;
  }, [filters.districtId, districts]);

  // Fetch verifiers by district
  const { data: verifiersData } =
    useGetVerifiersByDistrictQuery(selectedDistrictId);
  const verifiers = verifiersData?.data || [];

  // Filter schools based on client-side filters (schoolId, schoolName, status)
  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      const matchesSchoolId =
        !filters.schoolId ||
        school.schoolId.toString().includes(filters.schoolId) ||
        school.schoolId.includes(filters.schoolId);
      const matchesSchoolName =
        !filters.schoolName ||
        school.schoolName
          .toLowerCase()
          .includes(filters.schoolName.toLowerCase());

      // Filter by status
      const assignment = schoolAssignments[school.schoolId] || {};
      const schoolStatus = assignment.status || school.status || "Pending";
      const matchesStatus = !filters.status || schoolStatus === filters.status;

      return matchesSchoolId && matchesSchoolName && matchesStatus;
    });
  }, [
    schools,
    filters.schoolId,
    filters.schoolName,
    filters.status,
    schoolAssignments,
  ]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // Reset dependent filters
      if (field === "districtId") {
        newFilters.blockId = "";
        newFilters.clusterId = "";
        newFilters.villageId = "";
      }
      if (field === "blockId") {
        newFilters.clusterId = "";
        newFilters.villageId = "";
      }
      // Reset to first page when filters change
      setCurrentPage(0);
      return newFilters;
    });
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(0); // Reset to first page when changing items per page
  };

  const handleAssignmentChange = (schoolId, field, value) => {
    setSchoolAssignments((prev) => ({
      ...prev,
      [schoolId]: {
        ...prev[schoolId],
        [field]: value,
      },
    }));
  };

  const handleSaveAssignment = (schoolId) => {
    const assignment = schoolAssignments[schoolId];
    if (!assignment?.verifierId || !assignment?.date) {
      alert("Please select verifier and assignment date");
      return;
    }

    // Prepare payload according to API specification
    const payload = {
      id: assignment.id || null,
      schoolId: schoolId,
      userId: Number(assignment.verifierId),
      status: "Allocated",
      allocatedDate: assignment.date,
    };

    // Call the API
    saveAllocationMutation.mutate(payload);
  };

  // Handle Excel export
  const handleExportToExcel = () => {
    if (filteredSchools.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare columns for export
    const exportColumns = [
      { key: "schoolName", label: "School Name" },
      { key: "schoolId", label: "School ID" },
      { key: "district", label: "District" },
      { key: "block", label: "Block" },
      { key: "verifier", label: "Verifier" },
      { key: "assignmentDate", label: "Assignment Date" },
    ];

    // Transform data for export
    const exportData = filteredSchools.map((school) => {
      const assignment = schoolAssignments[school.schoolId] || {};
      const verifier = verifiers.find(
        (v) => String(v.userId) === String(assignment.verifierId)
      );
      return {
        schoolName: school.schoolName || "-",
        schoolId: school.schoolId || "-",
        district: school.districtName || "-",
        block: school.blockName || "-",
        verifier: verifier ? verifier.userName : "-",
        assignmentDate: assignment.date || "-",
      };
    });

    exportToExcel(
      exportData,
      exportColumns,
      "school-allocation",
      "School Allocation"
    );
  };

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

          <div className="filter-group">
            <label className="filter-label">School Name</label>
            <input
              type="text"
              value={filters.schoolName}
              onChange={(e) => handleFilterChange("schoolName", e.target.value)}
              className="filter-input"
              placeholder="Enter school name"
            />
          </div>
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
                  (d) => d.value === school.districtId
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
                        value
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
                        e.target.value
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
                const isSaving = saveAllocationMutation.isPending;
                const isDisabled =
                  !assignment.verifierId || !assignment.date || isSaving;
                return (
                  <button
                    onClick={() => handleSaveAssignment(school.schoolId)}
                    className="table-save-icon-button"
                    disabled={isDisabled}
                    title={
                      !assignment.verifierId || !assignment.date
                        ? "Please select verifier and date"
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
};

export default SchoolAllocation;
