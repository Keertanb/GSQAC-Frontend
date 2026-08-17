import { useState } from "react";
import { enqueueSnackbar } from "notistack";
import {
  useGetSchoolLoginQuery,
  useResetSchoolPasswordMutation,
} from "../../../../services/adminService";

const PASSWORD_MIN = 4;
const PASSWORD_MAX = 50;

export function useSchoolPasswordReset() {
  const [schoolIdInput, setSchoolIdInput] = useState("");
  const [searchedSchoolId, setSearchedSchoolId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(true);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    data: loginResponse,
    isLoading: isLoadingLogin,
    isFetching: isFetchingLogin,
    isError: isLoginError,
    error: loginError,
    refetch: refetchLogin,
  } = useGetSchoolLoginQuery(searchedSchoolId, !!searchedSchoolId);

  const resetMutation = useResetSchoolPasswordMutation({
    onSuccess: (data) => {
      enqueueSnackbar(
        data?.message || "School password reset successfully.",
        { variant: "success" },
      );
      setNewPassword("");
      setConfirmPassword("");
      setConfirmOpen(false);
      refetchLogin();
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to reset school password.",
        { variant: "error" },
      );
    },
  });

  const payload = loginResponse?.data || loginResponse || null;
  const login = payload?.schoolId ? payload : null;
  const school = login?.school || {};

  const passwordError = (() => {
    const value = String(newPassword || "");
    if (!value) return "Enter a new password.";
    if (value.length < PASSWORD_MIN) {
      return `Password must be at least ${PASSWORD_MIN} characters.`;
    }
    if (value.length > PASSWORD_MAX) {
      return `Password cannot exceed ${PASSWORD_MAX} characters.`;
    }
    if (/\s/.test(value)) return "Password cannot contain spaces.";
    if (confirmPassword && value !== confirmPassword) {
      return "New password and confirm password do not match.";
    }
    return "";
  })();

  const canReset =
    Boolean(searchedSchoolId) &&
    Boolean(login?.schoolId) &&
    !passwordError &&
    Boolean(confirmPassword) &&
    !isLoadingLogin;

  const handleSearch = () => {
    const value = String(schoolIdInput || "").trim();
    if (!value) {
      enqueueSnackbar("Enter a School ID / UDISE code to search.", {
        variant: "warning",
      });
      return;
    }
    setSearchedSchoolId(value);
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(true);
  };

  const handleClear = () => {
    setSchoolIdInput("");
    setSearchedSchoolId("");
    setNewPassword("");
    setConfirmPassword("");
    setConfirmOpen(false);
  };

  const handleOpenResetConfirm = () => {
    if (!canReset) {
      enqueueSnackbar(passwordError || "Search a school and enter a valid new password.", {
        variant: "warning",
      });
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmReset = () => {
    if (!searchedSchoolId || passwordError) return;
    resetMutation.mutate({
      schoolId: searchedSchoolId,
      password: newPassword.trim(),
    });
  };

  return {
    schoolIdInput,
    setSchoolIdInput,
    searchedSchoolId,
    handleSearch,
    handleClear,
    isLoadingLogin: isLoadingLogin || isFetchingLogin,
    isLoginError,
    loginError,
    login,
    school,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    passwordError,
    canReset,
    confirmOpen,
    setConfirmOpen,
    handleOpenResetConfirm,
    handleConfirmReset,
    isResetting: resetMutation.isPending,
  };
}
