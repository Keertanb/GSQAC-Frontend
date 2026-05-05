import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import {
  useGetRolesQuery,
  useUpdateRoleStatusMutation,
} from "../../../../services/adminService";

export function useRoleManagement() {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage] = useState(10);

  const queryClient = useQueryClient();
  const { data: rolesData, isLoading, isError } = useGetRolesQuery();
  const roles = rolesData?.data || [];

  const updateMutation = useUpdateRoleStatusMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      enqueueSnackbar(data?.message || "Role status updated successfully", {
        variant: "success",
      });
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to update role status",
        { variant: "error" },
      );
    },
  });

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRoles = roles.slice(startIndex, endIndex);

  const handleToggleStatus = useCallback(
    (role) => {
      const newStatus = role.isActive === 1 || role.isActive === true ? 0 : 1;
      updateMutation.mutate({
        roleId: role.roleId,
        isActive: newStatus,
      });
    },
    [updateMutation],
  );

  const columns = useMemo(
    () => [
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
        render: (role) => <span className="name-text">{role.roleName}</span>,
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
    ],
    [],
  );

  const renderActions = useCallback(
    (role) => {
      const isActive = role.isActive === 1 || role.isActive === true;
      return (
        <button
          type="button"
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
      );
    },
    [handleToggleStatus, updateMutation.isPending],
  );

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    roles,
    paginatedRoles,
    isLoading,
    isError,
    columns,
    renderActions,
  };
}
