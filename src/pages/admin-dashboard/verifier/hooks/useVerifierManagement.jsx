import React, { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetVerifiersQuery,
  useGetVerifierCountQuery,
  useUpsertVerifierMutation,
  useGetAllDistrictsQuery,
} from "../../../../services/adminService";
import { exportToExcel } from "../../../../utils/exportToExcel";

const MOBILE_NUMBER_MAX_LENGTH = 10;
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

const sanitizeMobileNumber = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, MOBILE_NUMBER_MAX_LENGTH);

const getMobileNumberError = (mobileNumber) => {
  const mobile = sanitizeMobileNumber(mobileNumber);
  if (!mobile) {
    return "Mobile number is required";
  }
  if (mobile.length !== MOBILE_NUMBER_MAX_LENGTH) {
    return "Mobile number must be exactly 10 digits";
  }
  if (!INDIAN_MOBILE_REGEX.test(mobile)) {
    return "Enter a valid 10-digit mobile number (must start with 6, 7, 8, or 9)";
  }
  return "";
};

const getPasswordError = (password, { required = true } = {}) => {
  if (!required) {
    return "";
  }
  const value = String(password ?? "");
  if (!value) {
    return "Password is required";
  }
  if (value.length <= 6) {
    return "Password must be more than 6 characters";
  }
  return "";
};

export function useVerifierManagement() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVerifier, setEditingVerifier] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    userId: null,
    userName: "",
    mobileNumber: "",
    password: "",
    isActive: 1,
    districts: [],
  });
  const [formErrors, setFormErrors] = useState({
    mobileNumber: "",
    password: "",
  });

  const queryClient = useQueryClient();
  const {
    data: verifiersData,
    isLoading,
    isError,
  } = useGetVerifiersQuery({
    page: currentPage,
    limit: itemsPerPage,
    search: searchQuery || undefined,
  });

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];
  const upsertMutation = useUpsertVerifierMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "verifiers"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "verifier-count"] });
      handleCloseModal();
    },
  });

  const { data: verifierCountData } = useGetVerifierCountQuery();
  const countData = verifierCountData?.data ?? null;

  const verifiers = useMemo(
    () => verifiersData?.data?.data || verifiersData?.data || [],
    [verifiersData]
  );

  // Search is handled by API; table should use server response directly.
  const filteredVerifiers = verifiers;

  // Total count from API for server-side pagination
  const totalCount = useMemo(
    () =>
      verifiersData?.data?.total ??
      verifiersData?.total ??
      (searchQuery
        ? verifiers.length
        : countData?.TOTAL_VERIFIER ??
          countData?.totalVerifier ??
          verifiers.length),
    [countData, searchQuery, verifiers, verifiersData]
  );

  const parseDistrictIds = useCallback((verifier) => {
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
  }, []);

  // Table columns definition
  const columns = useMemo(() => [
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
  ], [districts, parseDistrictIds]);

  // Render actions
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingVerifier(null);
    setFormData({
      userId: null,
      userName: "",
      mobileNumber: "",
      password: "",
      isActive: 1,
      districts: [],
    });
    setFormErrors({ mobileNumber: "", password: "" });
  }, []);

  const handleOpenModal = useCallback(() => {
    setEditingVerifier(null);
    setFormData({
      userId: null,
      userName: "",
      mobileNumber: "",
      password: "",
      isActive: 1,
      districts: [],
    });
    setFormErrors({ mobileNumber: "", password: "" });
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((verifier) => {
    setEditingVerifier(verifier);
    const districtArray = parseDistrictIds(verifier);
    setFormData({
      userId: verifier.userId,
      userName: verifier.userName || "",
      mobileNumber: sanitizeMobileNumber(verifier.mobileNumber),
      password: verifier.password ?? "",
      isActive: verifier.isActive === true || verifier.isActive === 1 ? 1 : 0,
      districts: districtArray,
    });
    setFormErrors({ mobileNumber: "", password: "" });
    setIsModalOpen(true);
  }, [parseDistrictIds]);

  const handleToggleStatus = useCallback((verifier) => {
    // Parse districtIds from verifier
    const districtIds = parseDistrictIds(verifier);

    const updatedData = {
      userId: verifier.userId,
      userName: verifier.userName,
      mobileNumber: verifier.mobileNumber,
      password: verifier.password ?? "",
      isActive: verifier.isActive === true || verifier.isActive === 1 ? 0 : 1,
      districtIds: districtIds,
    };
    upsertMutation.mutate(updatedData);
  }, [parseDistrictIds, upsertMutation]);

  const renderActions = useCallback((verifier) => {
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
  }, [handleEdit, handleToggleStatus]);

  const activeCount = useMemo(
    () => verifiers.filter((v) => v.isActive === true || v.isActive === 1).length,
    [verifiers]
  );
  const inactiveCount = useMemo(
    () => verifiers.filter((v) => v.isActive === false || v.isActive === 0).length,
    [verifiers]
  );

  // Card counts from API; fallback to list-derived counts when API not yet loaded
  const totalVerifierCount = useMemo(
    () => countData?.TOTAL_VERIFIER ?? countData?.totalVerifier ?? verifiers.length,
    [countData, verifiers.length]
  );
  const activeVerifierCount = useMemo(
    () => countData?.ACTIVE_VERIFIER ?? countData?.activeVerifier ?? activeCount,
    [activeCount, countData]
  );
  const inactiveVerifierCount = useMemo(
    () =>
      countData?.INACTIVE_VERIFIER ?? countData?.inactiveVerifier ?? inactiveCount,
    [countData, inactiveCount]
  );

  // Handle Excel export
  const handleExportToExcel = useCallback(() => {
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
  }, [districts, filteredVerifiers, parseDistrictIds]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    const mobileError = getMobileNumberError(formData.mobileNumber);
    const passwordError = getPasswordError(formData.password);

    if (mobileError || passwordError) {
      setFormErrors({
        mobileNumber: mobileError,
        password: passwordError,
      });
      return;
    }

    setFormErrors({ mobileNumber: "", password: "" });

    // Ensure districts is always an array
    const districtIds = Array.isArray(formData.districts)
      ? formData.districts
      : [];

    const payload = {
      userId: formData.userId || null,
      userName: formData.userName,
      mobileNumber: sanitizeMobileNumber(formData.mobileNumber),
      password: formData.password,
      isActive: formData.isActive,
      districtIds: districtIds,
    };

    upsertMutation.mutate(payload);
  }, [formData, upsertMutation]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleMobileNumberChange = useCallback((e) => {
    const sanitized = sanitizeMobileNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      mobileNumber: sanitized,
    }));
    setFormErrors((prev) => ({
      ...prev,
      mobileNumber: "",
    }));
  }, []);

  const handleMobileNumberBlur = useCallback(() => {
    setFormErrors((prev) => ({
      ...prev,
      mobileNumber: getMobileNumberError(formData.mobileNumber),
    }));
  }, [formData.mobileNumber]);

  const handlePasswordChange = useCallback((e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      password: value,
    }));
    setFormErrors((prev) => ({
      ...prev,
      password: "",
    }));
  }, []);

  const handlePasswordBlur = useCallback(() => {
    setFormErrors((prev) => ({
      ...prev,
      password: getPasswordError(formData.password),
    }));
  }, [formData.password]);

  return {
    isModalOpen,
    setIsModalOpen,
    editingVerifier,
    setEditingVerifier,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    formData,
    setFormData,
    queryClient,
    verifiersData,
    isLoading,
    isError,
    districtsData,
    districts,
    upsertMutation,
    verifierCountData,
    countData,
    verifiers,
    filteredVerifiers,
    totalCount,
    columns,
    renderActions,
    activeCount,
    inactiveCount,
    totalVerifierCount,
    activeVerifierCount,
    inactiveVerifierCount,
    handleExportToExcel,
    handleOpenModal,
    handleCloseModal,
    parseDistrictIds,
    handleEdit,
    handleToggleStatus,
    handleSubmit,
    handleInputChange,
    handleMobileNumberChange,
    handleMobileNumberBlur,
    handlePasswordChange,
    handlePasswordBlur,
    formErrors,
  };
}
