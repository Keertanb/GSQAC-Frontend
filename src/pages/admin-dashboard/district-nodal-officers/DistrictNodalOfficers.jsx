import React, { useState } from "react";
import {
  useGetDistrictNodalOfficersQuery,
  useUpsertDistrictNodalOfficerMutation,
  useGetAllDistrictsQuery,
} from "../../../services/adminService";
import { useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import FormikWrapper from "../../../components/FormikWrapper/FormikWrapper";
import FormikField from "../../../components/FormikWrapper/FormikField";
import AppTable from "../../../components/AppTable/AppTable";
import AppButton from "../../../components/AppButton/AppButton";
import { exportToExcel } from "../../../utils/exportToExcel";
import "./DistrictNodalOfficers.css";

const DistrictNodalOfficers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  const queryClient = useQueryClient();
  const {
    data: officersData,
    isLoading,
    isError,
  } = useGetDistrictNodalOfficersQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery || undefined,
  });
  const officers = officersData?.data?.data || officersData?.data || [];

  const upsertMutation = useUpsertDistrictNodalOfficerMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "nodal-officers"] });
      handleCloseModal();
    },
  });
  // Validation Schema
  const validationSchema = Yup.object().shape({
    userName: Yup.string()
      .required("User name is required")
      .min(2, "User name must be at least 2 characters")
      .max(50, "User name must not exceed 50 characters"),
    mobileNumber: Yup.string()
      .required("Mobile number is required")
      .matches(/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"),
    districts: Yup.array()
      .min(1, "At least one district must be selected")
      .required("At least one district is required"),
    isActive: Yup.number().oneOf([0, 1], "Invalid status"),
  });

  // Initial form values
  const getInitialValues = () => {
    // Ensure districts is always an array
    let districtsArray = [];
    if (editingOfficer) {
      // Check if districtIds is a string (JSON string from API)
      if (typeof editingOfficer.districtIds === "string") {
        try {
          const parsed = JSON.parse(editingOfficer.districtIds);
          if (Array.isArray(parsed)) {
            // Extract districtId values from the array of objects
            districtsArray = parsed
              .map((item) => item.districtId)
              .filter((id) => id !== undefined && id !== null);
          }
        } catch (e) {
          console.error("Error parsing districtIds:", e);
        }
      } else if (Array.isArray(editingOfficer.districtIds)) {
        // If it's already an array, check if it contains objects with districtId
        if (
          editingOfficer.districtIds.length > 0 &&
          typeof editingOfficer.districtIds[0] === "object" &&
          editingOfficer.districtIds[0].districtId !== undefined
        ) {
          districtsArray = editingOfficer.districtIds.map(
            (item) => item.districtId
          );
        } else {
          districtsArray = editingOfficer.districtIds;
        }
      } else if (Array.isArray(editingOfficer.districts)) {
        districtsArray = editingOfficer.districts;
      } else if (editingOfficer.district) {
        // If district is a string, try to find the district ID
        const district = districts.find(
          (d) => d.name === editingOfficer.district
        );
        districtsArray = district ? [district.value] : [];
      }
    }

    return {
      userId: editingOfficer?.userId || null,
      userName: editingOfficer?.userName || "",
      mobileNumber: editingOfficer?.mobileNumber || "",
      districts: districtsArray,
      isActive:
        editingOfficer?.isActive === true || editingOfficer?.isActive === 1
          ? 1
          : 0,
    };
  };

  const { data: districtsData, isLoading: districtsLoading } =
    useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  // Get total count from API response for server-side pagination
  const totalCount =
    officersData?.data?.total || officersData?.total || officers.length;

  // Since API handles search, we use officers directly (no client-side filtering)
  // If API doesn't support search, we can add client-side filtering back
  const filteredOfficers = officers;

  // Helper function to parse districtIds
  const parseDistrictIds = (officer) => {
    let districtArray = [];
    
    // Try districtIds first (various formats)
    if (typeof officer.districtIds === "string") {
      try {
        const parsed = JSON.parse(officer.districtIds);
        if (Array.isArray(parsed)) {
          districtArray = parsed
            .map((item) => {
              // Handle both object format {districtId: X} and direct value
              return typeof item === "object" && item.districtId !== undefined
                ? item.districtId
                : item;
            })
            .filter((id) => id !== undefined && id !== null);
        }
      } catch (e) {
        console.warn("Failed to parse districtIds string:", e);
      }
    } else if (Array.isArray(officer.districtIds)) {
      if (
        officer.districtIds.length > 0 &&
        typeof officer.districtIds[0] === "object" &&
        officer.districtIds[0].districtId !== undefined
      ) {
        // Array of objects with districtId property
        districtArray = officer.districtIds.map((item) => item.districtId);
      } else {
        // Array of direct values
        districtArray = officer.districtIds;
      }
    }
    
    // Fallback to districts array if districtIds is empty
    if (districtArray.length === 0 && Array.isArray(officer.districts)) {
      districtArray = officer.districts;
    }
    
    // Ensure all values are numbers and filter out invalid ones
    districtArray = districtArray
      .map((id) => Number(id))
      .filter((id) => !isNaN(id) && id > 0);
    
    return districtArray;
  };

  // Table columns definition
  const columns = [
    {
      id: "userName",
      label: "Name",
      render: (officer) => (
        <div className="cell-name">
          <div className="name-avatar">
            {officer.userName?.charAt(0)?.toUpperCase() || "N"}
          </div>
          <span className="name-text">{officer.userName}</span>
        </div>
      ),
    },
    {
      id: "mobileNumber",
      label: "Mobile",
      render: (officer) => officer.mobileNumber,
    },
    {
      id: "districts",
      label: "Districts",
      render: (officer) => {
        const districtArray = parseDistrictIds(officer);
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
        } else if (officer.district) {
          return (
            <div className="district-badges-container">
              <span className="district-badge">{officer.district}</span>
            </div>
          );
        }
        return <span className="text-muted">-</span>;
      },
    },
    {
      id: "status",
      label: "Status",
      render: (officer) => {
        const isActive = officer.isActive === true || officer.isActive === 1;
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
  const renderActions = (officer) => {
    const isActive = officer.isActive === true || officer.isActive === 1;
    return (
      <>
        <button
          onClick={() => handleEdit(officer)}
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
          onClick={() => handleToggleStatus(officer)}
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

  const activeCount = officers.filter(
    (o) => o.isActive === true || o.isActive === 1
  ).length;
  const inactiveCount = officers.filter(
    (o) => o.isActive === false || o.isActive === 0
  ).length;

  // Handle Excel export
  const handleExportToExcel = () => {
    if (filteredOfficers.length === 0) {
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
    const exportData = filteredOfficers.map((officer) => {
      const districtArray = parseDistrictIds(officer);
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
          : officer.district || "-";

      return {
        userName: officer.userName || "-",
        mobileNumber: officer.mobileNumber || "-",
        districts: districtNames,
        status:
          officer.isActive === true || officer.isActive === 1
            ? "Active"
            : "Inactive",
      };
    });

    exportToExcel(
      exportData,
      exportColumns,
      "district-nodal-officers",
      "Nodal Officers"
    );
  };

  const handleOpenModal = () => {
    setEditingOfficer(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOfficer(null);
  };

  const handleEdit = (officer) => {
    setEditingOfficer(officer);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (officer) => {
    // Use the parseDistrictIds helper function to properly extract district IDs
    let districtIds = parseDistrictIds(officer);
    
    // If parseDistrictIds returns empty and we have a district string, try to find it
    if (districtIds.length === 0 && officer.district) {
      const district = districts.find((d) => d.name === officer.district);
      districtIds = district ? [Number(district.value)] : [];
    }

    // Ensure districtIds is an array of numbers (not strings)
    districtIds = Array.isArray(districtIds) 
      ? districtIds.map(id => Number(id)).filter(id => !isNaN(id) && id > 0)
      : [];

    // If still empty after all attempts, this is a problem - but send empty array to avoid API error
    if (districtIds.length === 0) {
      console.error("Warning: No districtIds found for officer when toggling status. Officer data:", {
        userId: officer.userId,
        userName: officer.userName,
        districtIds: officer.districtIds,
        districts: officer.districts,
        district: officer.district
      });
    }

    const updatedData = {
      userId: officer.userId,
      userName: officer.userName,
      mobileNumber: officer.mobileNumber,
      isActive: officer.isActive === true || officer.isActive === 1 ? 0 : 1,
      districtIds: districtIds, // Always send as array, even if empty
    };
    
    upsertMutation.mutate(updatedData);
  };

  const handleFormSubmit = (values, { setSubmitting }) => {
    const districtIds = Array.isArray(values.districts) ? values.districts : [];

    const payload = {
      userId: values.userId || null,
      userName: values.userName,
      mobileNumber: values.mobileNumber,
      isActive: values.isActive,
      districtIds: districtIds,
    };

    upsertMutation.mutate(payload, {
      onSettled: () => {
        setSubmitting(false);
      },
    });
  };

  return (
    <div className="district-nodal-officers-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div>
            <h1 className="header-title">District Nodal Officers</h1>
            <p className="header-subtitle">
              Manage district nodal officers and their details
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
              Add Nodal Officer
            </AppButton>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div>
              <p className="stat-label stat-label-blue">Total Officers</p>
              <p className="stat-value stat-value-blue">{officers.length}</p>
            </div>
            <div className="stat-icon stat-icon-blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          <div className="stat-card stat-card-green">
            <div>
              <p className="stat-label stat-label-green">Active Officers</p>
              <p className="stat-value stat-value-green">{activeCount}</p>
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

          <div className="stat-card stat-card-red">
            <div>
              <p className="stat-label stat-label-red">Inactive Officers</p>
              <p className="stat-value stat-value-red">{inactiveCount}</p>
            </div>
            <div className="stat-icon stat-icon-red">
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
            placeholder="Search by name, mobile, or district..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(0); // Reset to first page when search changes
            }}
            className="search-input"
          />
        </div>
      </div>

      {/* Officers List */}
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : isError ? (
        <div className="error-container">
          <p className="error-message">
            Failed to load district nodal officers. Please try again.
          </p>
        </div>
      ) : filteredOfficers.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon-container">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="empty-title">No district nodal officers found</p>
          <p className="empty-subtitle">
            {searchQuery
              ? "Try adjusting your search query"
              : "Click 'Add Nodal Officer' to get started"}
          </p>
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={filteredOfficers}
          rowKey="userId"
          loading={isLoading}
          isError={isError}
          renderActions={renderActions}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage + 1}
          onPageChange={(page) => setCurrentPage(page - 1)}
          totalCount={totalCount}
          serverSidePagination={true}
          emptyTitle="No district nodal officers found"
          emptySubtitle={
            searchQuery
              ? "Try adjusting your search query"
              : "Click 'Add Nodal Officer' to get started"
          }
          emptyIcon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingOfficer ? "Edit Nodal Officer" : "Add Nodal Officer"}
              </h2>
              <button onClick={handleCloseModal} className="modal-close-button">
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

            <FormikWrapper
              initialValues={getInitialValues()}
              validationSchema={validationSchema}
              onSubmit={handleFormSubmit}
              enableReinitialize={true}
              formProps={{ className: "modal-form" }}
            >
              {(formik) => (
                <>
                  <FormikField
                    name="userName"
                    label="User Name"
                    required
                    placeholder="Enter user name"
                  />

                  <FormikField
                    name="mobileNumber"
                    label="Mobile Number"
                    type="tel"
                    required
                    placeholder="Enter mobile number"
                  />

                  <div className="form-group">
                    <div className="form-label-container">
                    <label className="form-label">
                      Districts <span className="form-label-required">*</span>
                    </label>
                        {formik.values.districts?.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                            formik.setFieldValue("districts", []);
                                    }}
                          className="clear-districts-button"
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
                    {districtsLoading ? (
                      <div className="form-loading">Loading districts...</div>
                    ) : (
                      <div className="district-multiselect-container">
                        <div className="district-multiselect">
                          {districts.map((district) => {
                            const isSelected =
                              formik.values.districts?.includes(district.value);
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
                                    const districtValueNum = Number(
                                      district.value
                                    );
                                    const currentDistricts =
                                      formik.values.districts || [];
                                    const isSelected =
                                      currentDistricts.includes(
                                        districtValueNum
                                      );

                                    if (isSelected) {
                                      formik.setFieldValue(
                                        "districts",
                                        currentDistricts.filter(
                                          (id) => id !== districtValueNum
                                        )
                                      );
                                    } else {
                                      formik.setFieldValue("districts", [
                                        ...currentDistricts,
                                        districtValueNum,
                                      ]);
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
                        {formik.values.districts?.length > 0 && (
                          <div className="selected-districts-info">
                            {formik.values.districts.length} district
                            {formik.values.districts.length > 1 ? "s" : ""}{" "}
                            selected
                          </div>
                        )}
                        {formik.touched.districts &&
                          formik.errors.districts && (
                            <div className="form-error">
                              {formik.errors.districts}
                            </div>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      name="isActive"
                      value={formik.values.isActive}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="form-select"
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="modal-button modal-button-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formik.isSubmitting || upsertMutation.isPending}
                      className="modal-button modal-button-submit"
                    >
                      {formik.isSubmitting || upsertMutation.isPending
                        ? "Saving..."
                        : editingOfficer
                        ? "Update"
                        : "Add"}
                    </button>
                  </div>
                </>
              )}
            </FormikWrapper>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistrictNodalOfficers;
