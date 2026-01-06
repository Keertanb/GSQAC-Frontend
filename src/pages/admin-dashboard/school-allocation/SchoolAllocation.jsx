import React, { useState } from "react";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
  useGetVerifiersQuery,
} from "../../../services/adminService";
import AppTable from "../../../components/AppTable/AppTable";
import AppButton from "../../../components/AppButton/AppButton";
import AppDropdown from "../../../components/AppDropdown/AppDropdown";
import { exportToExcel } from "../../../utils/exportToExcel";
import "./SchoolAllocation.css";

// Static data for now
const staticSchools = [
  {
    schoolId: 1,
    schoolName: "ABC Primary School",
    udiseCode: "240701001",
    district: "AHMEDABAD",
    block: "AHMEDABAD CITY",
    cluster: "CLUSTER 1",
  },
  {
    schoolId: 2,
    schoolName: "XYZ High School",
    udiseCode: "240701002",
    district: "AHMEDABAD",
    block: "AHMEDABAD CITY",
    cluster: "CLUSTER 1",
  },
  {
    schoolId: 3,
    schoolName: "DEF Secondary School",
    udiseCode: "240701003",
    district: "AHMEDABAD",
    block: "AHMEDABAD CITY",
    cluster: "CLUSTER 2",
  },
  {
    schoolId: 4,
    schoolName: "GHI Primary School",
    udiseCode: "240701004",
    district: "SURAT",
    block: "SURAT CITY",
    cluster: "CLUSTER 1",
  },
  {
    schoolId: 5,
    schoolName: "JKL High School",
    udiseCode: "240701005",
    district: "SURAT",
    block: "SURAT CITY",
    cluster: "CLUSTER 1",
  },
];

const SchoolAllocation = () => {
  const [filters, setFilters] = useState({
    schoolId: "",
    schoolName: "",
    districtId: "",
    blockId: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Store assignments for each school: { schoolId: { verifierId, verifierCode, date } }
  const [schoolAssignments, setSchoolAssignments] = useState({});

  // Fetch districts
  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  // Fetch blocks when district is selected
  const { data: blocksData } = useGetDistrictWiseBlocksQuery(
    filters.districtId
  );
  const blocks = blocksData?.data || [];

  // Fetch verifiers with pagination
  const { data: verifiersData } = useGetVerifiersQuery({
    page: currentPage,
    limit: itemsPerPage,
  });
  const verifiers = verifiersData?.data?.data || verifiersData?.data || [];

  // Filter schools based on filters
  const filteredSchools = staticSchools.filter((school) => {
    const matchesSchoolId =
      !filters.schoolId ||
      school.schoolId.toString().includes(filters.schoolId) ||
      school.udiseCode.includes(filters.schoolId);
    const matchesSchoolName =
      !filters.schoolName ||
      school.schoolName
        .toLowerCase()
        .includes(filters.schoolName.toLowerCase());
    const matchesDistrict =
      !filters.districtId || school.district === filters.districtId;
    const matchesBlock = !filters.blockId || school.block === filters.blockId;

    return (
      matchesSchoolId && matchesSchoolName && matchesDistrict && matchesBlock
    );
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // Reset dependent filters
      if (field === "districtId") {
        newFilters.blockId = "";
      }
      return newFilters;
    });
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
    // API call will be added here
    console.log("Saving assignment for school:", {
      schoolId,
      ...assignment,
    });
    alert("Assignment saved successfully!");
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
      { key: "udiseCode", label: "UDISE Code" },
      { key: "district", label: "District" },
      { key: "block", label: "Block" },
      { key: "verifier", label: "Verifier" },
      { key: "verifierCode", label: "Verifier Code" },
      { key: "assignmentDate", label: "Assignment Date" },
    ];

    // Transform data for export
    const exportData = filteredSchools.map((school) => {
      const assignment = schoolAssignments[school.schoolId] || {};
      const verifier = verifiers.find(
        (v) => v.userId === assignment.verifierId
      );
      return {
        schoolName: school.schoolName || "-",
        udiseCode: school.udiseCode || "-",
        district: school.district || "-",
        block: school.block || "-",
        verifier: verifier
          ? `${verifier.userName} (${verifier.mobileNumber})`
          : "-",
        verifierCode: assignment.verifierCode || "-",
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
            {filters.schoolId || filters.schoolName || filters.districtId
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
                  <div className="school-udise-code">{school.udiseCode}</div>
                </div>
              ),
            },
            {
              id: "district",
              label: "District",
              render: (school) => (
                <div className="school-district-cell">{school.district}</div>
              ),
            },
            {
              id: "block",
              label: "Block",
              render: (school) => (
                <div className="school-block-cell">{school.block}</div>
              ),
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
                        label: `${verifier.userName} (${verifier.mobileNumber})`,
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
                  />
                );
              },
            },
            {
              id: "verifierCode",
              label: "Verifier Code",
              render: (school) => {
                const assignment = schoolAssignments[school.schoolId] || {};
                return (
                  <input
                    type="text"
                    value={assignment.verifierCode || ""}
                    onChange={(e) =>
                      handleAssignmentChange(
                        school.schoolId,
                        "verifierCode",
                        e.target.value
                      )
                    }
                    className="table-input"
                    placeholder="Enter code"
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
                return (
                  <button
                    onClick={() => handleSaveAssignment(school.schoolId)}
                    className="table-save-button"
                    disabled={!assignment.verifierId || !assignment.date}
                    title={
                      !assignment.verifierId || !assignment.date
                        ? "Please select verifier and date"
                        : "Save assignment"
                    }
                  >
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
                    Save
                  </button>
                );
              },
            },
          ]}
          data={filteredSchools}
          rowKey="schoolId"
          loading={false}
          isError={false}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalCount={filteredSchools.length}
          serverSidePagination={false}
          emptyTitle="No schools found"
          emptySubtitle={
            filters.schoolId || filters.schoolName || filters.districtId
              ? "Try adjusting your filters"
              : "No schools available"
          }
        />
      )}
    </div>
  );
};

export default SchoolAllocation;
