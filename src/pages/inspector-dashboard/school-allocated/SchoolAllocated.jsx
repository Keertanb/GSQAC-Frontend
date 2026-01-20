import React, { useState } from "react";
import AppTable from "../../../components/AppTable/AppTable";
import { useGetAllocatedSchoolsQuery } from "../../../services/inspectorService";
import useAuthStore from "../../../store/useAuthStore";
import "./SchoolAllocated.css";

const SchoolAllocated = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  // Get districtId from auth store
  const { districtId, user } = useAuthStore();
  
  // Use districtId from store or from user object
  const userDistrictId = districtId || user?.districtId;

  // Fetch allocated schools
  const {
    data: schoolsData,
    isLoading,
    isError,
  } = useGetAllocatedSchoolsQuery({
    districtId: userDistrictId,
    enabled: !!userDistrictId,
  });

  // Get schools from API response or use empty array
  const staticSchoolsData = schoolsData?.data || [];

  // Filter schools based on search query
  const filteredSchools = staticSchoolsData.filter((school) => {
    const matchesSearch =
      school.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.schoolCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.principal.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  // Count statistics
  const stats = {
    total: staticSchoolsData.length,
    pending: staticSchoolsData.filter((s) => s.status === "pending").length,
    inProgress: staticSchoolsData.filter((s) => s.status === "in_progress")
      .length,
    completed: staticSchoolsData.filter((s) => s.status === "completed").length,
  };

  // Table columns definition
  const columns = [
    {
      id: "schoolName",
      label: "School Name",
      render: (school) => (
        <div className="cell-name">
          <div className="name-avatar">
            {school.schoolName?.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div>
            <span className="name-text">{school.schoolName}</span>
            <span className="school-code-badge">{school.schoolCode}</span>
          </div>
        </div>
      ),
    },
    {
      id: "principal",
      label: "Principal",
      render: (school) => school.principal,
    },
    {
      id: "district",
      label: "District",
      render: (school) => (
        <span className="district-badge">{school.district}</span>
      ),
    },
    {
      id: "students",
      label: "Students",
      render: (school) => <span className="stat-badge">{school.students}</span>,
    },
    {
      id: "teachers",
      label: "Teachers",
      render: (school) => <span className="stat-badge">{school.teachers}</span>,
    },
    {
      id: "status",
      label: "Status",
      render: (school) => {
        const isCompleted = school.status === "completed";
        const isInProgress = school.status === "in_progress";
        return (
          <span
            className={`status-badge ${
              isCompleted
                ? "status-badge-active"
                : isInProgress
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
            ) : isInProgress ? (
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
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
            {getStatusLabel(school.status)}
          </span>
        );
      },
    },
  ];

  // Render actions
  const renderActions = (school) => {
    const isCompleted = school.status === "completed";
    return (
      <>
        <button
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
        </button>
        <button
          onClick={() => handleStartVerification(school)}
          className={`table-action-button ${
            isCompleted ? "table-action-edit" : "table-action-activate"
          }`}
          title={isCompleted ? "View Report" : "Start Verification"}
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

  const handleStartVerification = (school) => {
    console.log("Start verification:", school);
    // Navigate to verification page
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
          </div>

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
          rowKey="id"
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
