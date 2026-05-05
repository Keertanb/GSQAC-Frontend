import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGetSchoolListQuery } from "../../../../services/crcService";
import useAuthStore from "../../../../store/useAuthStore";
import { colors } from "../../../../constants/colors";

export function useSchoolAssessment() {

  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // AppTable uses 1-based pagination
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { userName } = useAuthStore();

  // Fetch schools using clusterId (loggedInUsername)
  // API uses 0-based pagination, so convert from 1-based (AppTable) to 0-based (API)
  const {
    data: schoolsData,
    isLoading,
    isError,
  } = useGetSchoolListQuery(
    {
      clusterId: userName || undefined,
      page: currentPage - 1, // Convert to 0-based for API
      limit: itemsPerPage,
    },
    !!userName
  );

  // Get schools from API response - API returns data.rows
  const schools = schoolsData?.data?.rows || [];
  const totalCount = schoolsData?.data?.total || 0;
  const summary = schoolsData?.data?.summary || { completed: 0, pending: 0 };

  // Filter schools based on search query (client-side filtering)
  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schools;
    const query = searchQuery.toLowerCase();
    return schools.filter((school) => {
      return (
        school.schoolName?.toLowerCase().includes(query) ||
        school.schoolId?.toLowerCase().includes(query) ||
        school.districtName?.toLowerCase().includes(query) ||
        school.blockName?.toLowerCase().includes(query) ||
        school.clusterName?.toLowerCase().includes(query) ||
        school.villageName?.toLowerCase().includes(query)
      );
    });
  }, [schools, searchQuery]);

  // Calculate statistics - use summary from API when no search query, otherwise calculate from filtered results
  const totalSchools = totalCount;
  const completedSchools = searchQuery
    ? filteredSchools.filter((s) => s.status === "Completed" || s.isSubmitted === 1).length
    : summary.completed || 0;
  const pendingSchools = searchQuery
    ? filteredSchools.filter((s) => s.status === "Pending" || (s.isSubmitted !== 1 && s.status !== "Completed")).length
    : summary.pending || 0;

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleStartAssessment = (school) => {
    // Navigate to assessment screen with school info
    // Use schoolId from API response
    const schoolId = school.schoolId;
    navigate(`/crc-dashboard/school-assessment/${schoolId}`, {
      state: { school },
    });
  };

  // Define table columns
  const columns = [
    {
      id: "schoolId",
      label: "School ID",
      render: (school) => (
        <span style={{ fontWeight: 600, color: colors.text.primary }}>
          {school.schoolId || "-"}
        </span>
      ),
    },
    {
      id: "schoolName",
      label: "School Name",
      render: (school) => (
        <span style={{ color: colors.text.primary }}>
          {school.schoolName || "-"}
        </span>
      ),
    },
    {
      id: "districtName",
      label: "District",
      render: (school) => school.districtName || "-",
    },
    {
      id: "blockName",
      label: "Block",
      render: (school) => school.blockName || "-",
    },
    {
      id: "clusterName",
      label: "Cluster",
      render: (school) => school.clusterName || "-",
    },
    {
      id: "villageName",
      label: "Village",
      render: (school) => school.villageName || "-",
    },
    {
      id: "status",
      label: "Status",
      render: (school) => {
        const status = school.status || "";
        const statusLower = status.toLowerCase();
        const isCompleted = statusLower === "completed" || statusLower === "done";
        const isPending = statusLower === "pending" || !status;
        
        return (
          <span
            className={`status-badge ${
              isCompleted
                ? "status-badge-active"
                : isPending
                ? "status-badge-warning"
                : "status-badge-inactive"
            }`}
          >
            {isCompleted ? (
              <svg
                className="status-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                className="status-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {status || "Pending"}
          </span>
        );
      },
    },
  ];

  return {
    navigate,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    userName,
    schoolsData,
    isLoading,
    isError,
    schools,
    totalCount,
    summary,
    filteredSchools,
    totalSchools,
    completedSchools,
    pendingSchools,
    handleStartAssessment,
    columns,
  };
}
