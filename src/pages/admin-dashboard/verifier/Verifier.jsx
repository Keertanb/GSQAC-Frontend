import React, { useState } from "react";
import {
  useGetVerifiersQuery,
  useUpsertVerifierMutation,
  useGetAllDistrictsQuery,
} from "../../../services/adminService";
import { useQueryClient } from "@tanstack/react-query";
import AppTable from "../../../components/AppTable/AppTable";
import AppButton from "../../../components/AppButton/AppButton";
import { exportToExcel } from "../../../utils/exportToExcel";
import "./Verifier.css";

const Verifier = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVerifier, setEditingVerifier] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    userId: null,
    userName: "",
    mobileNumber: "",
    isActive: 1,
    districts: [],
  });

  const queryClient = useQueryClient();
  const {
    data: verifiersData,
    isLoading,
    isError,
  } = useGetVerifiersQuery({
    page: currentPage,
    limit: itemsPerPage,
  });

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];
  const upsertMutation = useUpsertVerifierMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verifiers"] });
      handleCloseModal();
    },
  });

  const verifiers = verifiersData?.data?.data || verifiersData?.data || [];

  const filteredVerifiers = verifiers.filter(
    (verifier) =>
      verifier.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      verifier.mobileNumber?.includes(searchQuery)
  );

  // Use filtered count for client-side pagination
  const totalCount = filteredVerifiers.length;

  // Table columns definition
  const columns = [
    {
      id: "userName",
      label: "Name",
      render: (verifier) => (
        <div className="cell-name">
          <div className="name-avatar">
            {verifier.userName?.charAt(0)?.toUpperCase() || "V"}
          </div>
          <span className="name-text">{verifier.userName}</span>
        </div>
      ),
    },
    {
      id: "mobileNumber",
      label: "Mobile",
      render: (verifier) => verifier.mobileNumber,
    },
    {
      id: "district",
      label: "Districts",
      render: (verifier) => {
        const districtArray = parseDistrictIds(verifier);
        if (districtArray.length > 0) {
          return (
            <div className="district-badges-container">
              {districtArray.map((districtValue) => {
                const district = districts.find(
                  (d) => d.value === districtValue
                );
                return district ? (
                  <span key={districtValue} className="district-badge">
                    {district.name}
                  </span>
                ) : null;
              })}
            </div>
          );
        } else if (verifier.districtId) {
          // Backward compatibility for single districtId
          const district = districts.find(
            (d) => d.value === verifier.districtId
          );
          return district ? (
            <span className="district-badge">{district.name}</span>
          ) : (
            "-"
          );
        }
        return <span className="text-muted">-</span>;
      },
    },
    {
      id: "status",
      label: "Status",
      render: (verifier) => {
        const isActive = verifier.isActive === true || verifier.isActive === 1;
        return (
          <span
            className={`status-badge ${
              isActive ? "status-badge-active" : "status-badge-inactive"
            }`}
          >
            {isActive ? (
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
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  // Render actions
  const renderActions = (verifier) => {
    const isActive = verifier.isActive === true || verifier.isActive === 1;
    return (
      <>
        <button
          onClick={() => handleEdit(verifier)}
          className="table-action-button table-action-edit"
          title="Edit"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={() => handleToggleStatus(verifier)}
          className={`table-action-button ${
            isActive ? "table-action-deactivate" : "table-action-activate"
          }`}
          title={isActive ? "Deactivate" : "Activate"}
        >
          {isActive ? (
            <svg
              className="action-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="action-icon"
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
          )}
        </button>
      </>
    );
  };

  const activeCount = verifiers.filter(
    (v) => v.isActive === true || v.isActive === 1
  ).length;
  const inactiveCount = verifiers.filter(
    (v) => v.isActive === false || v.isActive === 0
  ).length;

  // Handle Excel export
  const handleExportToExcel = () => {
    if (filteredVerifiers.length === 0) {
      alert("No data to export");
      return;
    }

    // Prepare columns for export
    const exportColumns = [
      { key: "userName", label: "Name" },
      { key: "mobileNumber", label: "Mobile Number" },
      { key: "districts", label: "Districts" },
      { key: "status", label: "Status" },
    ];

    // Transform data for export
    const exportData = filteredVerifiers.map((verifier) => {
      const districtArray = parseDistrictIds(verifier);
      const districtNames =
        districtArray.length > 0
          ? districtArray
              .map((districtValue) => {
                const district = districts.find(
                  (d) => d.value === districtValue
                );
                return district ? district.name : null;
              })
              .filter(Boolean)
              .join(", ")
          : verifier.districtId
          ? (() => {
              const district = districts.find(
                (d) => d.value === verifier.districtId
              );
              return district?.name || "-";
            })()
          : "-";
      return {
        userName: verifier.userName || "-",
        mobileNumber: verifier.mobileNumber || "-",
        districts: districtNames,
        status:
          verifier.isActive === true || verifier.isActive === 1
            ? "Active"
            : "Inactive",
      };
    });

    exportToExcel(exportData, exportColumns, "verifiers", "Verifiers");
  };

  const handleOpenModal = () => {
    setEditingVerifier(null);
    setFormData({
      userId: null,
      userName: "",
      mobileNumber: "",
      isActive: 1,
      districts: [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVerifier(null);
    setFormData({
      userId: null,
      userName: "",
      mobileNumber: "",
      isActive: 1,
      districts: [],
    });
  };

  // Helper function to parse districtIds
  const parseDistrictIds = (verifier) => {
    let districtArray = [];
    if (typeof verifier.districtIds === "string") {
      try {
        const parsed = JSON.parse(verifier.districtIds);
        if (Array.isArray(parsed)) {
          districtArray = parsed
            .map((item) => (typeof item === "object" ? item.districtId : item))
            .filter((id) => id !== undefined && id !== null);
        }
      } catch {
        // If parsing fails, try other formats
      }
    } else if (Array.isArray(verifier.districtIds)) {
      if (
        verifier.districtIds.length > 0 &&
        typeof verifier.districtIds[0] === "object" &&
        verifier.districtIds[0].districtId !== undefined
      ) {
        districtArray = verifier.districtIds.map((item) => item.districtId);
      } else {
        districtArray = verifier.districtIds;
      }
    } else if (verifier.districtId) {
      // Single districtId (for backward compatibility)
      districtArray = [Number(verifier.districtId)];
    } else if (Array.isArray(verifier.districts)) {
      districtArray = verifier.districts;
    }
    return districtArray.map((id) => Number(id));
  };

  const handleEdit = (verifier) => {
    setEditingVerifier(verifier);
    const districtArray = parseDistrictIds(verifier);
    setFormData({
      userId: verifier.userId,
      userName: verifier.userName || "",
      mobileNumber: verifier.mobileNumber || "",
      isActive: verifier.isActive === true || verifier.isActive === 1 ? 1 : 0,
      districts: districtArray,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (verifier) => {
    // Parse districtIds from verifier
    const districtIds = parseDistrictIds(verifier);

    const updatedData = {
      userId: verifier.userId,
      userName: verifier.userName,
      mobileNumber: verifier.mobileNumber,
      isActive: verifier.isActive === true || verifier.isActive === 1 ? 0 : 1,
      districtIds: districtIds,
    };
    upsertMutation.mutate(updatedData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ensure districts is always an array
    const districtIds = Array.isArray(formData.districts)
      ? formData.districts
      : [];

    const payload = {
      userId: formData.userId || null,
      userName: formData.userName,
      mobileNumber: formData.mobileNumber,
      isActive: formData.isActive,
      districtIds: districtIds,
    };

    upsertMutation.mutate(payload);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="verifier-container">
      {/* Header Section */}
      <div className="verifier-header-section">
        <div className="verifier-header-content">
          <div>
            <h1 className="verifier-header-title">Verifier Management</h1>
            <p className="verifier-header-subtitle">
              Manage verifiers and their assignments
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
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
            <AppButton
              variant="blue"
              size="sm"
              onClick={handleOpenModal}
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              }
            >
              Add Verifier
            </AppButton>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="verifier-stats-grid">
          <div className="verifier-stat-card verifier-stat-card-blue">
            <div>
              <p className="verifier-stat-label verifier-stat-label-blue">
                Total Verifiers
              </p>
              <p className="verifier-stat-value verifier-stat-value-blue">
                {verifiers.length}
              </p>
            </div>
            <div className="verifier-stat-icon verifier-stat-icon-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>

          <div className="verifier-stat-card verifier-stat-card-green">
            <div>
              <p className="verifier-stat-label verifier-stat-label-green">
                Active Verifiers
              </p>
              <p className="verifier-stat-value verifier-stat-value-green">
                {activeCount}
              </p>
            </div>
            <div className="verifier-stat-icon verifier-stat-icon-green">
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

          <div className="verifier-stat-card verifier-stat-card-orange">
            <div>
              <p className="verifier-stat-label verifier-stat-label-orange">
                Inactive Verifiers
              </p>
              <p className="verifier-stat-value verifier-stat-value-orange">
                {inactiveCount}
              </p>
            </div>
            <div className="verifier-stat-icon verifier-stat-icon-orange">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="verifier-search-container">
          <svg
            className="verifier-search-icon"
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
            placeholder="Search by name or mobile number..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0); // Reset to first page when search changes
            }}
            className="verifier-search-input"
          />
        </div>
      </div>

      {/* Verifiers List */}
      {isLoading ? (
        <div className="verifier-loading-container">
          <div className="verifier-loading-spinner"></div>
        </div>
      ) : isError ? (
        <div className="verifier-error-container">
          <p className="verifier-error-message">
            Failed to load verifiers. Please try again.
          </p>
        </div>
      ) : filteredVerifiers.length === 0 ? (
        <div className="verifier-empty-container">
          <div className="verifier-empty-icon-container">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <p className="verifier-empty-title">No verifiers found</p>
          <p className="verifier-empty-subtitle">
            {searchQuery
              ? "Try adjusting your search query"
              : "Click 'Add Verifier' to get started"}
          </p>
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filteredVerifiers}
          rowKey="userId"
          loading={isLoading}
          isError={isError}
          renderActions={renderActions}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage + 1}
          onPageChange={(page) => setCurrentPage(page - 1)}
          totalCount={totalCount}
          serverSidePagination={false}
          emptyTitle="No verifiers found"
          emptySubtitle={
            searchQuery
              ? "Try adjusting your search query"
              : "Click 'Add Verifier' to get started"
          }
          emptyIcon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          }
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="verifier-modal-overlay">
          <div className="verifier-modal-content">
            <div className="verifier-modal-header">
              <h2 className="verifier-modal-title">
                {editingVerifier ? "Edit Verifier" : "Add Verifier"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="verifier-modal-close-button"
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="verifier-modal-form">
              <div className="verifier-form-group">
                <label className="verifier-form-label">
                  User Name{" "}
                  <span className="verifier-form-label-required">*</span>
                </label>
                <input
                  type="text"
                  name="userName"
                  value={formData.userName}
                  onChange={handleInputChange}
                  required
                  className="verifier-form-input"
                  placeholder="Enter user name"
                />
              </div>

              <div className="verifier-form-group">
                <label className="verifier-form-label">
                  Mobile Number{" "}
                  <span className="verifier-form-label-required">*</span>
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  required
                  className="verifier-form-input"
                  placeholder="Enter mobile number"
                />
              </div>

              <div className="verifier-form-group">
                <div className="verifier-form-label-container">
                  <label className="verifier-form-label">
                    Districts{" "}
                    <span className="verifier-form-label-required">*</span>
                  </label>
                  {formData.districts?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          districts: [],
                        }));
                      }}
                      className="verifier-clear-districts-button"
                      title="Clear all districts"
                    >
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {districts.length === 0 ? (
                  <div className="verifier-form-loading">
                    Loading districts...
                  </div>
                ) : (
                  <div className="district-multiselect-container">
                    <div className="district-multiselect">
                      {districts.map((district) => {
                        const isSelected = formData.districts?.includes(
                          Number(district.value)
                        );
                        return (
                          <label
                            key={district.value}
                            className={`district-checkbox-label ${
                              isSelected ? "district-checkbox-selected" : ""
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const districtValueNum = Number(district.value);
                                const currentDistricts =
                                  formData.districts || [];
                                const isSelected =
                                  currentDistricts.includes(districtValueNum);

                                if (isSelected) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    districts: currentDistricts.filter(
                                      (id) => id !== districtValueNum
                                    ),
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    districts: [
                                      ...currentDistricts,
                                      districtValueNum,
                                    ],
                                  }));
                                }
                              }}
                              className="district-checkbox"
                            />
                            <span className="district-checkbox-text">
                              {district.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {formData.districts?.length > 0 && (
                      <div className="selected-districts-info">
                        {formData.districts.length} district
                        {formData.districts.length > 1 ? "s" : ""} selected
                      </div>
                    )}
                    {formData.districts?.length === 0 && (
                      <div className="verifier-form-error">
                        At least one district must be selected
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="verifier-form-group">
                <label className="verifier-form-label">Status</label>
                <select
                  name="isActive"
                  value={formData.isActive}
                  onChange={handleInputChange}
                  className="verifier-form-select"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div className="verifier-modal-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="verifier-modal-button verifier-modal-button-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="verifier-modal-button verifier-modal-button-submit"
                >
                  {upsertMutation.isPending
                    ? "Saving..."
                    : editingVerifier
                    ? "Update"
                    : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verifier;
