import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../config/queryClient";
import AppTable from "../../../components/AppTable/AppTable";
import AppDropdown from "../../../components/AppDropdown/AppDropdown";
import {
  useGetVerifierAllocatedSchoolsQuery,
  useGetDistrictsByVerifierQuery,
  useGetVerifierDashboardQuery,
} from "../../../services/verifierService";
import useAuthStore from "../../../store/useAuthStore";
import { INSPECTOR_SCHOOL_VERIFICATION_URL } from "../../../routes/routeUrls";
import "./SchoolAllocated.css";

const SchoolAllocated = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedDistrictId, setSelectedDistrictId] = useState("all");

  // Get districtId, userId, and role from auth store
  const { districtId, user, role, roleId, userId } = useAuthStore();

  // Use districtId from store or from user object
  const userDistrictId = districtId || user?.districtId;

  // Check if user is a verifier (by role value or roleId - verifiers typically have roleId 5)
  // Note: Adjust roleId check if verifiers use a different roleId
  const isVerifier = role === "verifier" || roleId === 5;

  // Fetch districts for verifier
  // Temporarily enabled for all to test - change back to isVerifier when working
  const {
    data: districtsData,
    isLoading: isLoadingDistricts,
    isError: isErrorDistricts,
  } = useGetDistrictsByVerifierQuery({
    enabled: true, // Temporarily enabled for all users to test
  });

  // Handle API response - check if data is directly an array or wrapped in data property
  // API returns: { message: "Success", data: [...] } or directly [...]
  let districts = [];
  if (districtsData) {
    if (Array.isArray(districtsData?.data)) {
      districts = districtsData.data;
    } else if (Array.isArray(districtsData)) {
      districts = districtsData;
    }
  }

  // Debug log to see what we're getting
  useEffect(() => {
    console.log("Districts Debug:", {
      districtsData,
      districts,
      districtsLength: districts.length,
      isLoadingDistricts,
      isErrorDistricts,
      isVerifier,
      rawDistrictsData: districtsData,
    });
  }, [
    districtsData,
    districts,
    isLoadingDistricts,
    isErrorDistricts,
    isVerifier,
  ]);

  // Ensure "All" is selected by default for verifiers
  useEffect(() => {
    if (
      isVerifier &&
      districts.length > 0 &&
      (!selectedDistrictId || selectedDistrictId === "")
    ) {
      setSelectedDistrictId("all");
    }
  }, [isVerifier, districts, selectedDistrictId]);

  // Use selected district from dropdown if available, otherwise fallback to userDistrictId
  // If "all" is selected, send null to API
  // Always prioritize the dropdown selection if it exists
  const districtIdForAPI = (() => {
    // If "all" is selected, always return null
    if (selectedDistrictId === "all" || selectedDistrictId === "") {
      return null;
    }
    // If dropdown has a selection (and it's not "all"), use it
    if (
      selectedDistrictId &&
      selectedDistrictId !== undefined &&
      selectedDistrictId !== "all"
    ) {
      return Number(selectedDistrictId);
    }
    // Otherwise, fallback to userDistrictId
    return userDistrictId ? Number(userDistrictId) : null;
  })();

  // Fetch dashboard counts using verifier API
  // When "All" is selected, districtId is null and API is called without district param.
  const { data: dashboardData, refetch: refetchDashboard } =
    useGetVerifierDashboardQuery({
      districtId: districtIdForAPI,
      enabled: true,
    });

  // Fetch allocated schools using verifier API
  // Always use districtIdForAPI which comes from dropdown selection or userDistrictId
  const {
    data: schoolsData,
    isLoading,
    isError,
    refetch: refetchSchools,
  } = useGetVerifierAllocatedSchoolsQuery({
    districtId: districtIdForAPI, // Will be null when "All" is selected, or a number for specific district
    userId: userId ? Number(userId) : undefined,
    enabled: true, // Always enabled - React Query will handle refetching when districtId changes
  });

  // Debug: Log what's being sent to API
  useEffect(() => {
    console.log("SchoolAllocated - districtId being sent to API:", {
      selectedDistrictId,
      districtIdForAPI,
      isNull: districtIdForAPI === null,
      type: typeof districtIdForAPI,
    });
  }, [selectedDistrictId, districtIdForAPI]);

  // Handle district dropdown change and refetch APIs
  const handleDistrictChange = (value) => {
    setSelectedDistrictId(value);
    setCurrentPage(0); // Reset to first page when district changes

    // Calculate new districtIdForAPI immediately - send null when "All" is selected
    const newDistrictIdForAPI =
      value === "all" || value === "" ? null : value ? Number(value) : null;

    // Invalidate queries to mark them as stale
    queryClient.invalidateQueries({
      queryKey: ["verifier", "allocated-schools"],
    });
    queryClient.invalidateQueries({
      queryKey: ["verifier", "dashboard"],
    });

    // Refetch with the new districtId - React Query will use the new query key
    // which includes the new districtId, ensuring it's sent in the API call
    setTimeout(() => {
      // Refetch schools with new districtId (always defined, can be null)
      queryClient.refetchQueries({
        queryKey: queryKeys.verifier.allocatedSchools(newDistrictIdForAPI),
        exact: false, // Refetch all matching queries
      });

      // Refetch dashboard for selected district (or All with null districtId)
      queryClient.refetchQueries({
        queryKey: queryKeys.verifier.dashboard(newDistrictIdForAPI),
        exact: false,
      });
    }, 0);
  };

  // Debug: Log API call parameters
  useEffect(() => {
    if (isVerifier) {
      console.log("Verifier API Call Debug:", {
        selectedDistrictId,
        districtIdForAPI,
        userId,
        willCallAPI: districtIdForAPI !== undefined,
        apiUrl:
          districtIdForAPI !== null && districtIdForAPI !== undefined
            ? `/verifier/get-school-allocated-verifier?districtId=${districtIdForAPI}`
            : districtIdForAPI === null
            ? `/verifier/get-school-allocated-verifier?districtId=null`
            : "Not called - no districtId",
      });
    }
  }, [selectedDistrictId, districtIdForAPI, userId, isVerifier]);

  // useEffect(() => {
  //   console.log("SchoolAllocated - API Call Debug:", {
  //     userDistrictId,
  //     selectedDistrictId,
  //     districtIdForAPI,
  //     userId,
  //     role,
  //     roleId,
  //     isVerifier,
  //     districtId,
  //     userDistrictIdFromUser: user?.districtId,
  //     districtsCount: districts.length,
  //     willCallVerifierAPI: !!districtIdForAPI && isVerifier,
  //     willCallInspectorAPI: !!districtIdForAPI && !isVerifier,
  //   });
  // }, [
  //   userDistrictId,
  //   selectedDistrictId,
  //   districtIdForAPI,
  //   userId,
  //   role,
  //   roleId,
  //   isVerifier,
  //   districtId,
  //   user,
  //   districts,
  // ]);

  // Get schools from API response or use empty array
  const staticSchoolsData = schoolsData?.data || [];

  // Filter schools based on search query
  const filteredSchools = staticSchoolsData.filter((school) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (school.schoolId?.toLowerCase() || "").includes(query) ||
      (school.schoolName?.toLowerCase() || "").includes(query) ||
      (school.schoolCode?.toLowerCase() || "").includes(query) ||
      (school.district?.toLowerCase() || "").includes(query) ||
      (school.principal?.toLowerCase() || "").includes(query) ||
      (String(school.districtId) || "").includes(query);

    return matchesSearch;
  });

  const getStatusLabel = (status) => {
    if (!status) return "Pending";
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "completed":
      case "completed":
        return "Completed";
      case "in_progress":
      case "in progress":
        return "In Progress";
      case "pending":
      case "allocated":
        return "Allocated";
      default:
        return status;
    }
  };

  // Count statistics - use dashboard API data if available, otherwise calculate from schools
  const dashboardStats = dashboardData?.data || {};
  const stats = {
    total: dashboardStats.totalAllocatedSchool ?? staticSchoolsData.length,
    pending:
      dashboardStats.totalPendingSchool ??
      staticSchoolsData.filter(
        (s) => s.pcStatus === "pending" || s.pcStatus === "Allocated"
      ).length,
    inProgress: staticSchoolsData.filter(
      (s) => s.pcStatus === "in_progress" || s.pcStatus === "In Progress"
    ).length,
    completed:
      dashboardStats.totalCompletedSchool ??
      staticSchoolsData.filter(
        (s) =>
          s.pcStatus === "completed" ||
          s.pcStatus === "Completed" ||
          s.isSubmitted === 1
      ).length,
  };

  // Table columns definition
  const columns = [
    {
      id: "schoolId",
      label: "School ID",
      render: (school) => (
        <div className="cell-name">
          <div>
            <span className="name-text">
              {school.schoolId || school.schoolName || "N/A"}
            </span>
            {school.schoolCode && (
              <span className="school-code-badge">{school.schoolCode}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "districtId",
      label: "District",
      render: (school) => {
        // Try to find district name from districts array
        const district = districts.find(
          (d) => d.districtId === school.districtId
        );
        return (
          <span className="district-badge">
            {district?.districtName || `District ${school.districtId || "N/A"}`}
          </span>
        );
      },
    },
    {
      id: "allocatedDate",
      label: "Allocated Date",
      render: (school) => {
        if (!school.allocatedDate) return "-";
        const date = new Date(school.allocatedDate);
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      },
    },
    {
      id: "status",
      label: "Status",
      render: (school) => {
        const pcStatus = school.pcStatus || "";
        const statusLower = pcStatus.toLowerCase();
        const isCompleted = statusLower === "completed" || school.isSubmitted === 1;
        const isPending = statusLower === "pending" || statusLower === "allocated" || !pcStatus;
        
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
            {pcStatus || "Pending"}
          </span>
        );
      },
    },
  ];

  // Render actions
  const renderActions = (school) => {
    if (!school) return null;

    const isCompleted =
      school.pcStatus === "completed" ||
      school.pcStatus === "Completed" ||
      school.isSubmitted === 1;

    return (
      <>
        {/* <button
          onClick={() => handleViewDetails(school)}
          className="table-action-button table-action-view"
          title="View Details"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button> */}
        <button
          onClick={() => handleStartAssessment(school)}
          className={`table-action-button ${
            isCompleted ? "table-action-edit" : "table-action-activate"
          }`}
          title={isCompleted ? "View Assessment" : "Start Assessment"}
        >
          {isCompleted ? (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          )}
        </button>
      </>
    );
  };

  const handleViewDetails = (school) => {
    console.log("View details:", school);
    // Navigate to school details page
  };

  const handleStartAssessment = (school) => {
    console.log("Start assessment:", school);
    // Navigate to SchoolVerification page with schoolId
    navigate(INSPECTOR_SCHOOL_VERIFICATION_URL, {
      state: {
        school: {
          schoolId: school.schoolId,
          schoolName: school.schoolName,
          schoolCode: school.schoolCode,
        },
      },
    });
  };

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

        {/* District Dropdown for Verifiers */}
        {/* Temporarily showing for all users to test - change back to isVerifier when working */}
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
          totalCount={filteredSchools.length}
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
};

export default SchoolAllocated;
