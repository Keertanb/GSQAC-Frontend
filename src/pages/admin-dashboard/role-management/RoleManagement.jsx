import React, { useState } from "react";
import {
  useGetRolesQuery,
  useUpdateRoleStatusMutation,
} from "../../../services/adminService";
import { useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import AppTable from "../../../components/AppTable/AppTable";
import "./RoleManagement.css";

const RoleManagement = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  const queryClient = useQueryClient();
  const { data: rolesData, isLoading, isError } = useGetRolesQuery();
  const roles = rolesData?.data || [];

  const updateMutation = useUpdateRoleStatusMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      enqueueSnackbar(
        data?.message || "Role status updated successfully",
        { variant: "success" }
      );
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to update role status",
        { variant: "error" }
      );
    },
  });

  // Pagination
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = roles.slice(startIndex, endIndex);

  // Table columns definition
  const columns = [
    {
      id: "roleId",
      label: "Role ID",
      render: (role) => (
        <div className="cell-id">
          <span className="id-badge">{role.roleId}</span>
        </div>
      ),
    },
    {
      id: "roleName",
      label: "Role Name",
      render: (role) => (
        <span className="name-text">{role.roleName}</span>
      ),
    },
    {
      id: "status",
      label: "Status",
      render: (role) => {
        const isActive = role.isActive === 1 || role.isActive === true;
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
    {
      id: "updatedAt",
      label: "Updated At",
      render: (role) =>
        role.updatedAt
          ? new Date(role.updatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-",
    },
  ];

  // Render actions
  const renderActions = (role) => {
    const isActive = role.isActive === 1 || role.isActive === true;
    return (
      <>
        <button
          onClick={() => handleToggleStatus(role)}
          className={`table-action-button ${
            isActive ? "table-action-deactivate" : "table-action-activate"
          }`}
          title={isActive ? "Deactivate" : "Activate"}
          disabled={updateMutation.isPending}
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

  const handleToggleStatus = (role) => {
    const newStatus = role.isActive === 1 || role.isActive === true ? 0 : 1;
    updateMutation.mutate({
      roleId: role.roleId,
      isActive: newStatus,
    });
  };

  return (
    <div className="role-management-container">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div>
            <h1 className="header-title">Role Management</h1>
            <p className="header-subtitle">
              Manage system roles and their active status
            </p>
          </div>
        </div>
      </div>

      {/* Roles Table */}
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : isError ? (
        <div className="error-container">
          <p className="error-message">
            Failed to load roles. Please try again.
          </p>
        </div>
      ) : roles.length === 0 ? (
        <div className="empty-container">
          <div className="empty-icon-container">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="empty-title">No roles found</p>
          <p className="empty-subtitle">
            No roles available in the system
          </p>
        </div>
      ) : (
        <AppTable
          columns={columns}
          data={paginatedRoles}
          rowKey="roleId"
          loading={isLoading}
          isError={isError}
          renderActions={renderActions}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage + 1}
          onPageChange={(page) => setCurrentPage(page - 1)}
          totalCount={roles.length}
          emptyTitle="No roles found"
          emptySubtitle="No roles available"
          emptyIcon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
        />
      )}
    </div>
  );
};

export default RoleManagement;

