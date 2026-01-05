import React, { useState, useEffect } from "react";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
  useGetClustersByBlockIdQuery,
  useGetVerifiersQuery,
} from "../../../services/adminService";
import AppTable from "../../../components/AppTable/AppTable";
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
    clusterId: "",
  });

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

  // Fetch clusters when block is selected
  const { data: clustersData } = useGetClustersByBlockIdQuery(filters.blockId);
  const clusters = clustersData?.data || [];

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
    const matchesCluster =
      !filters.clusterId || school.cluster === filters.clusterId;

    return (
      matchesSchoolId &&
      matchesSchoolName &&
      matchesDistrict &&
      matchesBlock &&
      matchesCluster
    );
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [field]: value };
      // Reset dependent filters
      if (field === "districtId") {
        newFilters.blockId = "";
        newFilters.clusterId = "";
      }
      if (field === "blockId") {
        newFilters.clusterId = "";
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

  return (
    <div className="school-allocation-container">
      {/* Header */}
      <div className="allocation-header">
        <div>
          <h1 className="allocation-title">School Allocation</h1>
          <p className="allocation-subtitle">
            Manage school assignments and verifier allocations
          </p>
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
            <label className="filter-label">District</label>
            <select
              value={filters.districtId}
              onChange={(e) => handleFilterChange("districtId", e.target.value)}
              className="filter-select"
            >
              <option value="">All Districts</option>
              {districts.map((district) => (
                <option key={district.value} value={district.value}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Block</label>
            <select
              value={filters.blockId}
              onChange={(e) => handleFilterChange("blockId", e.target.value)}
              className="filter-select"
              disabled={!filters.districtId}
            >
              <option value="">All Blocks</option>
              {blocks.map((block) => (
                <option
                  key={block.value || block.blockId}
                  value={block.value || block.blockId}
                >
                  {block.name || block.blockName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Cluster</label>
            <select
              value={filters.clusterId}
              onChange={(e) => handleFilterChange("clusterId", e.target.value)}
              className="filter-select"
              disabled={!filters.blockId}
            >
              <option value="">All Clusters</option>
              {clusters.map((cluster) => (
                <option
                  key={cluster.value || cluster.clusterId}
                  value={cluster.value || cluster.clusterId}
                >
                  {cluster.name || cluster.clusterName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schools List */}
      <div className="schools-cards-container">
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
          filteredSchools.map((school) => {
            const assignment = schoolAssignments[school.schoolId] || {};
            return (
              <div key={school.schoolId} className="school-card">
                <div className="school-card-header">
                  <div className="school-card-title-section">
                    <h3 className="school-card-title">{school.schoolName}</h3>
                    <div className="school-card-meta">
                      <span className="school-meta-item">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          className="meta-icon"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                          />
                        </svg>
                        {school.udiseCode}
                      </span>
                      <span className="school-meta-item">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          className="meta-icon"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {school.district} / {school.block} / {school.cluster}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="school-card-content">
                  <div className="school-form-grid">
                    <div className="school-form-group">
                      <label className="school-form-label">
                        Verifier <span className="form-label-required">*</span>
                      </label>
                      <select
                        value={assignment.verifierId || ""}
                        onChange={(e) =>
                          handleAssignmentChange(
                            school.schoolId,
                            "verifierId",
                            e.target.value
                          )
                        }
                        className="school-form-select"
                      >
                        <option value="">Select Verifier</option>
                        {verifiers.map((verifier) => (
                          <option key={verifier.userId} value={verifier.userId}>
                            {verifier.userName} ({verifier.mobileNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="school-form-group">
                      <label className="school-form-label">Verifier Code</label>
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
                        className="school-form-input"
                        placeholder="Enter verifier code"
                      />
                    </div>

                    <div className="school-form-group">
                      <label className="school-form-label">
                        Assignment Date{" "}
                        <span className="form-label-required">*</span>
                      </label>
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
                        className="school-form-input"
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="school-form-group school-form-action">
                      <button
                        onClick={() => handleSaveAssignment(school.schoolId)}
                        className="school-save-button"
                        disabled={!assignment.verifierId || !assignment.date}
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          className="button-icon"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Assignment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SchoolAllocation;
