import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as Yup from "yup";
import {
  useGetDistrictNodalOfficersQuery,
  useUpsertDistrictNodalOfficerMutation,
  useGetAllDistrictsQuery,
} from "../../../../services/adminService";
import { exportToExcel } from "../../../../utils/exportToExcel";
import {
  parseDistrictIds,
  getNodalOfficerFormInitialValues,
} from "../utils/districtNodalOfficersUtils";

export function useDistrictNodalOfficers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const queryClient = useQueryClient();

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingOfficer(null);
  }, []);

  const upsertMutation = useUpsertDistrictNodalOfficerMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "nodal-officers"] });
      handleCloseModal();
    },
  });

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

  const { data: districtsData, isLoading: districtsLoading } =
    useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  const validationSchema = useMemo(
    () =>
      Yup.object().shape({
        userName: Yup.string()
          .required("User name is required")
          .min(2, "User name must be at least 2 characters")
          .max(50, "User name must not exceed 50 characters"),
        mobileNumber: Yup.string()
          .required("Mobile number is required")
          .matches(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
        districts: Yup.array()
          .min(1, "At least one district must be selected")
          .required("At least one district is required"),
        isActive: Yup.number().oneOf([0, 1], "Invalid status"),
      }),
    [],
  );

  const getInitialValues = useCallback(
    () => getNodalOfficerFormInitialValues(editingOfficer, districts),
    [editingOfficer, districts],
  );

  const totalCount =
    officersData?.data?.total ??
    officersData?.total ??
    (searchQuery
      ? officers.length
      : officersData?.data?.totalCount ??
        officersData?.totalCount ??
        officersData?.data?.count ??
        officersData?.count ??
        officersData?.data?.totalRecords ??
        officersData?.totalRecords ??
        officersData?.data?.pagination?.total ??
        officersData?.pagination?.total ??
        officersData?.data?.meta?.total ??
        officersData?.meta?.total ??
        officersData?.data?.meta?.totalItems ??
        officersData?.meta?.totalItems ??
        officers.length);

  const filteredOfficers = officers;

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(totalCount / itemsPerPage) - 1);
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [totalCount, itemsPerPage, currentPage]);

  const columns = useMemo(
    () => [
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
                  const district = districts.find((d) => d.value === districtValue);
                  return district ? (
                    <span key={districtValue} className="district-badge">
                      {district.name}
                    </span>
                  ) : null;
                })}
              </div>
            );
          }
          if (officer.district) {
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
          const isActive =
            officer.isActive === true || officer.isActive === 1;
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
    ],
    [districts],
  );

  const handleEdit = useCallback((officer) => {
    setEditingOfficer(officer);
    setIsModalOpen(true);
  }, []);

  const handleToggleStatus = useCallback(
    (officer) => {
      let districtIds = parseDistrictIds(officer);

      if (districtIds.length === 0 && officer.district) {
        const district = districts.find((d) => d.name === officer.district);
        districtIds = district ? [Number(district.value)] : [];
      }

      districtIds = Array.isArray(districtIds)
        ? districtIds.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0)
        : [];

      if (districtIds.length === 0) {
        console.error(
          "Warning: No districtIds found for officer when toggling status. Officer data:",
          {
            userId: officer.userId,
            userName: officer.userName,
            districtIds: officer.districtIds,
            districts: officer.districts,
            district: officer.district,
          },
        );
      }

      const updatedData = {
        userId: officer.userId,
        userName: officer.userName,
        mobileNumber: officer.mobileNumber,
        isActive:
          officer.isActive === true || officer.isActive === 1 ? 0 : 1,
        districtIds,
      };

      upsertMutation.mutate(updatedData);
    },
    [districts, upsertMutation],
  );

  const renderActions = useCallback(
    (officer) => {
      const isActive = officer.isActive === true || officer.isActive === 1;
      return (
        <>
          <button
            type="button"
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
            type="button"
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
    },
    [handleEdit, handleToggleStatus],
  );

  const activeCount = officers.filter(
    (o) => o.isActive === true || o.isActive === 1,
  ).length;
  const inactiveCount = officers.filter(
    (o) => o.isActive === false || o.isActive === 0,
  ).length;

  const handleExportToExcel = useCallback(() => {
    if (filteredOfficers.length === 0) {
      alert("No data to export");
      return;
    }

    const exportColumns = [
      { key: "userName", label: "Name" },
      { key: "mobileNumber", label: "Mobile Number" },
      { key: "districts", label: "Districts" },
      { key: "status", label: "Status" },
    ];

    const exportData = filteredOfficers.map((officer) => {
      const districtArray = parseDistrictIds(officer);
      const districtNames =
        districtArray.length > 0
          ? districtArray
              .map((districtValue) => {
                const district = districts.find((d) => d.value === districtValue);
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
      "Nodal Officers",
    );
  }, [filteredOfficers, districts]);

  const handleOpenModal = useCallback(() => {
    setEditingOfficer(null);
    setIsModalOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    (values, { setSubmitting }) => {
      const districtIds = Array.isArray(values.districts) ? values.districts : [];

      const payload = {
        userId: values.userId || null,
        userName: values.userName,
        mobileNumber: values.mobileNumber,
        isActive: values.isActive,
        districtIds,
      };

      upsertMutation.mutate(payload, {
        onSettled: () => {
          setSubmitting(false);
        },
      });
    },
    [upsertMutation],
  );

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    setCurrentPage(0);
  }, []);

  return {
    isModalOpen,
    editingOfficer,
    searchQuery,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    officersData,
    isLoading,
    isError,
    officers,
    districts,
    districtsLoading,
    validationSchema,
    getInitialValues,
    totalCount,
    filteredOfficers,
    columns,
    renderActions,
    activeCount,
    inactiveCount,
    handleExportToExcel,
    handleOpenModal,
    handleCloseModal,
    handleFormSubmit,
    handleSearchChange,
    upsertMutation,
  };
}
