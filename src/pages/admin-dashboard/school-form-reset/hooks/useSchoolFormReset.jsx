import { useState, useMemo } from "react";
import { enqueueSnackbar } from "notistack";
import {
  useGetSchoolAssessmentStatusDetailQuery,
  useResetSchoolAssessmentFormMutation,
} from "../../../../services/adminService";

export function useSchoolFormReset() {
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [searchedSchoolId, setSearchedSchoolId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: detailResponse,
    isLoading: isLoadingDetail,
    isFetching: isFetchingDetail,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useGetSchoolAssessmentStatusDetailQuery(searchedSchoolId, !!searchedSchoolId);

  const resetMutation = useResetSchoolAssessmentFormMutation({
    onSuccess: (data) => {
      const deleted = data?.data?.deleted || data?.deleted || {};
      enqueueSnackbar(
        data?.message ||
          `Form reset complete. Answers: ${deleted.answers || 0}, Evidence: ${(deleted.questionEvidence || 0) + (deleted.subdomainEvidence || 0)}, Sessions: ${deleted.sessions || 0}, Hostel: ${deleted.hostelFacility || 0}.`,
        { variant: "success" },
      );
      setConfirmOpen(false);
      refetchDetail();
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to reset school assessment form.",
        { variant: "error" },
      );
    },
  });

  const detail = detailResponse?.data || detailResponse || null;
  const school = detail?.school || null;
  const assessments = Array.isArray(detail?.assessments) ? detail.assessments : [];

  const hasSchoolUser = Boolean(detail?.schoolUserId);
  const canReset = Boolean(searchedSchoolId) && hasSchoolUser && !isLoadingDetail;

  const assessmentSummary = useMemo(() => {
    const submitted = assessments.filter(
      (a) => Number(a.isSubmitted) === 1 || a.isSubmitted === true,
    ).length;
    return {
      total: assessments.length,
      submitted,
      inProgress: Math.max(0, assessments.length - submitted),
    };
  }, [assessments]);

  const handleSearch = () => {
    const value = String(schoolIdInput || "").trim();
    if (!value) {
      enqueueSnackbar("Enter a School ID / UDISE code to search.", {
        variant: "warning",
      });
      return;
    }
    setSearchedSchoolId(value);
  };

  const handleClear = () => {
    setSchoolIdInput("");
    setSearchedSchoolId("");
    setConfirmOpen(false);
  };

  const handleOpenResetConfirm = () => {
    if (!canReset) {
      enqueueSnackbar("Search a valid school with a login account first.", {
        variant: "warning",
      });
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    if (!searchedSchoolId) return;
    resetMutation.mutate({ schoolId: searchedSchoolId });
  };

  return {
    schoolIdInput,
    setSchoolIdInput,
    searchedSchoolId,
    handleSearch,
    handleClear,
    isLoadingDetail: isLoadingDetail || isFetchingDetail,
    isDetailError,
    detailError,
    detail,
    school,
    assessments,
    assessmentSummary,
    hasSchoolUser,
    canReset,
    confirmOpen,
    setConfirmOpen,
    handleOpenResetConfirm,
    handleConfirmReset,
    isResetting: resetMutation.isPending,
  };
}
