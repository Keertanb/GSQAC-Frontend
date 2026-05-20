import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import {
  ArrowForward,
  ArrowBack,
  PersonOutline,
  LockOutlined,
  SchoolOutlined,
  VerifiedUserOutlined,
  AdminPanelSettingsOutlined,
  AccountTreeOutlined,
  CheckCircle,
  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon,
  Shield as ShieldIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { enqueueSnackbar } from "notistack";
import { roles, getRoleId } from "../../constants/roles";
import {
  useResetPasswordMutation,
  useSendOtpMutation,
} from "../../services/authService";
import useAuthStore from "../../store/useAuthStore";
import "./login.css";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ role: "", userId: "", password: "" });
  const [resetErrors, setResetErrors] = useState({
    userId: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    form: "",
  });
  const [inputFocused, setInputFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [oldPasswordFocused, setOldPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { setUserData } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && roles.some((r) => r.value === roleParam)) {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const resetPasswordMutation = useResetPasswordMutation({
    onSuccess: (data) => {
      enqueueSnackbar(
        data?.message || "Password reset successfully",
        { variant: "success" },
      );
      setIsResetPasswordMode(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPassword("");
      setResetErrors({
        userId: "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
        form: "",
      });
    },
    onError: (error) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to reset password. Please try again.";
      setResetErrors((prev) => ({ ...prev, form: errorMessage }));
    },
  });

  const sendOtpMutation = useSendOtpMutation({
    onSuccess: (data) => {
      const firstItem = Array.isArray(data?.data) ? data.data[0] : null;
      const apiUserId =
        data?.userId ||
        data?.data?.userId ||
        firstItem?.userId ||
        firstItem?.id ||
        firstItem?.user?.id ||
        data?.data?.data?.userId;

      const token =
        firstItem?.token ||
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken;

      const apiUserName =
        firstItem?.userName ||
        data?.userName ||
        data?.data?.userName ||
        userId.trim();

      if (!apiUserId || !token) {
        console.error("Missing login details in response. Full response:", data);
        setErrors({
          ...errors,
          userId: "Login response is incomplete. Please try again.",
        });
        return;
      }

      const dashboardRoutes = {
        school: "/school-dashboard",
        parent: "/parent-dashboard",
        inspector: "/inspector-dashboard",
        admin: "/admin-dashboard",
        crc: "/crc-dashboard",
      };

      const dashboardRoute = dashboardRoutes[selectedRole] || "/";
      const normalizedUserId =
        typeof apiUserId === "string" && !Number.isNaN(Number(apiUserId))
          ? Number(apiUserId)
          : apiUserId;

      setUserData(
        {
          id: normalizedUserId,
          role: selectedRole,
          name: apiUserName,
          userName: apiUserName,
        },
        token,
        selectedRole,
        normalizedUserId,
        apiUserName,
      );

      navigate(dashboardRoute, { replace: true });
    },
    onError: (error) => {
      console.error("Send OTP Error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to send OTP. Please try again.";
      setErrors({ ...errors, userId: errorMessage });
    },
  });

  const getRoleIcon = (roleValue) => {
    const iconMap = {
      school: <SchoolOutlined fontSize="small" />,
      parent: <PersonOutline fontSize="small" />,
      inspector: <VerifiedUserOutlined fontSize="small" />,
      admin: <AdminPanelSettingsOutlined fontSize="small" />,
      crc: <AccountTreeOutlined fontSize="small" />,
    };
    return iconMap[roleValue] || <PersonOutline fontSize="small" />;
  };

  const clearResetPasswordState = () => {
    setIsResetPasswordMode(false);
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setResetErrors({
      userId: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      form: "",
    });
  };

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue);
    setErrors({ ...errors, role: "" });
    setUserId("");
    setPassword("");
    setShowPassword(false);
    clearResetPasswordState();
  };

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setErrors({ ...errors, userId: "" });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setErrors({ ...errors, password: "" });
  };

  const handleResetPassword = () => {
    const nextErrors = {
      userId: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      form: "",
    };
    let hasError = false;

    if (!userId.trim()) {
      nextErrors.userId = "Please enter your UDISE Code";
      hasError = true;
    }
    if (!oldPassword.trim()) {
      nextErrors.oldPassword = "Please enter your current password";
      hasError = true;
    }
    if (!newPassword.trim()) {
      nextErrors.newPassword = "Please enter a new password";
      hasError = true;
    }
    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your new password";
      hasError = true;
    }
    if (
      newPassword.trim() &&
      confirmPassword.trim() &&
      newPassword.trim() !== confirmPassword.trim()
    ) {
      nextErrors.confirmPassword = "Passwords do not match";
      hasError = true;
    }

    if (hasError) {
      setResetErrors(nextErrors);
      return;
    }

    resetPasswordMutation.mutate({
      userName: userId.trim(),
      roleId: getRoleId("school"),
      oldPassword: oldPassword.trim(),
      newPassword: newPassword.trim(),
      confirmPassword: confirmPassword.trim(),
    });
  };

  const handleContinue = () => {
    const newErrors = { role: "", userId: "", password: "" };
    let hasError = false;

    if (!selectedRole) {
      newErrors.role = "Please select a role to continue";
      hasError = true;
    }
    if (!userId.trim()) {
      newErrors.userId = "Please enter your User ID";
      hasError = true;
    }
    if (!password.trim()) {
      newErrors.password = "Please enter your password";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const roleId = getRoleId(selectedRole);
    sendOtpMutation.mutate({
      userName: userId.trim(),
      password: password.trim(),
      roleId,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleContinue();
  };

  const selectedRoleData = roles.find((r) => r.value === selectedRole);

  return (
    <div className="lp-container">
      {/* ── Left: Branding Panel ── */}
      <div className="lp-visual">
        <div className="lp-visual-pattern" />

        {/* Hero copy — mirrors dashboard Gunotsav 2.0 section */}
        <div className="lp-hero-copy">
          {/* <p className="lp-drive-pill">
            <StarIcon
              className="lp-drive-star"
              fontSize="small"
              aria-hidden="true"
            />
            Gujarat&apos;s school quality drive
          </p> */}

          <h1 className="lp-hero-title">
            Gunotsav <span className="lp-hero-accent">2.0</span>
          </h1>

          {/* <div className="lp-mini-cards">
            <article
              className="lp-mini-card lp-mini-card--gold"
              aria-label="GSQAC"
            >
              <EmojiEventsIcon
                className="lp-mini-icon lp-mini-icon--gold"
                aria-hidden="true"
              />
              <p className="lp-mini-kicker">Accreditation council</p>
              <h2 className="lp-mini-acronym">GSQAC</h2>
              <p className="lp-mini-desc">
                Gujarat State Quality Accreditation Council
              </p>
            </article>

            <article
              className="lp-mini-card lp-mini-card--blue"
              aria-label="SQAAF"
            >
              <ShieldIcon
                className="lp-mini-icon lp-mini-icon--blue"
                aria-hidden="true"
              />
              <h2 className="lp-mini-acronym">SQAAF</h2>
              <p className="lp-mini-desc">
                School Quality Assessment and Assurance Framework
              </p>
            </article>
          </div> */}
        </div>

        {/* Bottom accent bar — same orange/green as dashboard separator */}
        <div className="lp-sep">
          <div className="lp-sep-orange" />
          <div className="lp-sep-green" />
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="lp-form-panel">
        <div className="lp-form-inner">
          {/* Back to home */}
          <button className="lp-back-btn" onClick={() => navigate("/")}>
            <ArrowBack sx={{ fontSize: 16 }} />
            Back to Home
          </button>

          {/* ── Login card ── */}
          <div className="lp-card">
            <div className="lp-form-header">
              <h2 className="lp-form-title">
                {isResetPasswordMode ? "Reset Password" : "Welcome Back"}
              </h2>
              <p className="lp-form-subtitle">
                {isResetPasswordMode
                  ? "Update your school account password"
                  : "Select your role and sign in to continue"}
              </p>
            </div>

            {/* Role dropdown */}
            {!isResetPasswordMode && (
            <div className="lp-section">
              <span className="lp-section-label">Select your role</span>
              <div
                className={`lp-dropdown${dropdownOpen ? " lp-dropdown--open" : ""}${errors.role ? " lp-dropdown--error" : ""}`}
                ref={dropdownRef}
              >
                {/* Trigger */}
                <button
                  type="button"
                  className="lp-dropdown-trigger"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                >
                  {selectedRole ? (
                    <>
                      <span
                        className="lp-dd-icon"
                        style={{
                          background: `${selectedRoleData.color}18`,
                          color: selectedRoleData.color,
                        }}
                      >
                        {getRoleIcon(selectedRole)}
                      </span>
                      <span className="lp-dd-selected">
                        <span className="lp-dd-name">
                          {selectedRoleData.label}
                        </span>
                        <span className="lp-dd-desc">
                          {selectedRoleData.description}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="lp-dd-placeholder">Choose your role…</span>
                  )}
                  <ArrowDownIcon
                    className="lp-dd-arrow"
                    sx={{
                      fontSize: 20,
                      transition: "transform 0.2s",
                      transform: dropdownOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  />
                </button>

                {/* Options menu */}
                {dropdownOpen && (
                  <div className="lp-dropdown-menu" role="listbox">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        role="option"
                        aria-selected={selectedRole === role.value}
                        className={`lp-dd-option${selectedRole === role.value ? " lp-dd-option--active" : ""}`}
                        style={{ "--rc": role.color }}
                        onClick={() => {
                          handleRoleSelect(role.value);
                          setDropdownOpen(false);
                        }}
                      >
                        <span
                          className="lp-dd-icon"
                          style={{
                            background: `${role.color}18`,
                            color: role.color,
                          }}
                        >
                          {getRoleIcon(role.value)}
                        </span>
                        <span className="lp-dd-option-text">
                          <span className="lp-dd-name">{role.label}</span>
                          <span className="lp-dd-desc">{role.description}</span>
                        </span>
                        {selectedRole === role.value && (
                          <CheckCircle
                            sx={{
                              fontSize: 16,
                              color: role.color,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.role && <span className="lp-error">{errors.role}</span>}
            </div>
            )}

            {/* User ID / reset password fields */}
            <div
              className={`lp-input-section${
                selectedRole || isResetPasswordMode ? " lp-input-visible" : ""
              }${isResetPasswordMode ? " lp-input-visible--reset" : ""}`}
            >
              {isResetPasswordMode ? (
                <>
                  <span className="lp-section-label">UDISE Code</span>
                  <div
                    className={`lp-input-wrap${inputFocused ? " lp-input-focused" : ""}${resetErrors.userId ? " lp-input-error" : ""}`}
                  >
                    <PersonOutline className="lp-input-adorn" />
                    <input
                      className="lp-input"
                      type="text"
                      placeholder="Enter your UDISE Code"
                      value={userId}
                      onChange={(e) => {
                        handleUserIdChange(e);
                        setResetErrors((prev) => ({ ...prev, userId: "" }));
                      }}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      autoFocus
                    />
                  </div>
                  {resetErrors.userId && (
                    <span className="lp-error">{resetErrors.userId}</span>
                  )}
                  <div className="lp-field-gap" />
                  <span className="lp-section-label">Current Password</span>
                  <div
                    className={`lp-input-wrap${oldPasswordFocused ? " lp-input-focused" : ""}${resetErrors.oldPassword ? " lp-input-error" : ""}`}
                  >
                    <LockOutlined className="lp-input-adorn" />
                    <input
                      className="lp-input"
                      type="password"
                      placeholder="Enter your current password"
                      value={oldPassword}
                      onChange={(e) => {
                        setOldPassword(e.target.value);
                        setResetErrors((prev) => ({ ...prev, oldPassword: "" }));
                      }}
                      onFocus={() => setOldPasswordFocused(true)}
                      onBlur={() => setOldPasswordFocused(false)}
                    />
                  </div>
                  {resetErrors.oldPassword && (
                    <span className="lp-error">{resetErrors.oldPassword}</span>
                  )}
                  <div className="lp-field-gap" />
                  <span className="lp-section-label">New Password</span>
                  <div
                    className={`lp-input-wrap${newPasswordFocused ? " lp-input-focused" : ""}${resetErrors.newPassword ? " lp-input-error" : ""}`}
                  >
                    <LockOutlined className="lp-input-adorn" />
                    <input
                      className="lp-input"
                      type="password"
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setResetErrors((prev) => ({ ...prev, newPassword: "" }));
                      }}
                      onFocus={() => setNewPasswordFocused(true)}
                      onBlur={() => setNewPasswordFocused(false)}
                    />
                  </div>
                  {resetErrors.newPassword && (
                    <span className="lp-error">{resetErrors.newPassword}</span>
                  )}
                  <div className="lp-field-gap" />
                  <span className="lp-section-label">Confirm New Password</span>
                  <div
                    className={`lp-input-wrap${confirmPasswordFocused ? " lp-input-focused" : ""}${resetErrors.confirmPassword ? " lp-input-error" : ""}`}
                  >
                    <LockOutlined className="lp-input-adorn" />
                    <input
                      className="lp-input"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setResetErrors((prev) => ({
                          ...prev,
                          confirmPassword: "",
                        }));
                      }}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleResetPassword();
                      }}
                    />
                  </div>
                  {resetErrors.confirmPassword && (
                    <span className="lp-error">
                      {resetErrors.confirmPassword}
                    </span>
                  )}
                  {resetErrors.form && (
                    <span className="lp-error lp-error--form">
                      {resetErrors.form}
                    </span>
                  )}
                </>
              ) : selectedRole ? (
                <>
              <span className="lp-section-label">
                {selectedRoleData?.authMethod || "User ID"}
              </span>
              <div
                className={`lp-input-wrap${inputFocused ? " lp-input-focused" : ""}${errors.userId ? " lp-input-error" : ""}`}
              >
                <PersonOutline className="lp-input-adorn" />
                <input
                  className="lp-input"
                  type="text"
                  placeholder={`Enter your ${selectedRoleData?.authMethod || "User ID"}`}
                  value={userId}
                  onChange={handleUserIdChange}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onKeyDown={handleKeyDown}
                  autoFocus={!!selectedRole}
                />
              </div>
              {errors.userId && (
                <span className="lp-error">{errors.userId}</span>
              )}

              <div className="lp-field-gap" />

              <span className="lp-section-label">Password</span>
              <div
                className={`lp-input-wrap${passwordFocused ? " lp-input-focused" : ""}${errors.password ? " lp-input-error" : ""}`}
              >
                <LockOutlined className="lp-input-adorn" />
                <input
                  className="lp-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={handlePasswordChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onKeyDown={handleKeyDown}
                />
                <button
                  type="button"
                  className="lp-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <VisibilityOff sx={{ fontSize: 20 }} />
                  ) : (
                    <Visibility sx={{ fontSize: 20 }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="lp-error">{errors.password}</span>
              )}

                    {selectedRole === "school" && (
                      <button
                        type="button"
                        className="lp-reset-link"
                        onClick={() => {
                          setIsResetPasswordMode(true);
                          setErrors({ role: "", userId: "", password: "" });
                        }}
                      >
                        Reset password?
                      </button>
                    )}
                </>
              ) : null}
            </div>

            {isResetPasswordMode ? (
              <>
                <button
                  type="button"
                  className="lp-continue-btn"
                  onClick={handleResetPassword}
                  disabled={
                    !userId.trim() ||
                    !oldPassword.trim() ||
                    !newPassword.trim() ||
                    !confirmPassword.trim() ||
                    resetPasswordMutation.isPending
                  }
                  style={{ "--btn-c": "#1e3a8a" }}
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <CircularProgress size={18} color="inherit" />
                      <span>Resetting password…</span>
                    </>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowForward sx={{ fontSize: 18 }} />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="lp-back-login-btn"
                  onClick={clearResetPasswordState}
                  disabled={resetPasswordMutation.isPending}
                >
                  Back to login
                </button>
              </>
            ) : (
              <button
                className="lp-continue-btn"
                onClick={handleContinue}
                disabled={
                  !selectedRole ||
                  !userId.trim() ||
                  !password.trim() ||
                  sendOtpMutation.isPending
                }
                style={{ "--btn-c": selectedRoleData?.color || "#1e3a8a" }}
              >
                {sendOtpMutation.isPending ? (
                  <>
                    <CircularProgress size={18} color="inherit" />
                    <span>Sending OTP…</span>
                  </>
                ) : (
                  <>
                    <span>Continue Securely</span>
                    <ArrowForward sx={{ fontSize: 18 }} />
                  </>
                )}
              </button>
            )}

            {!isResetPasswordMode && (
            <div className="lp-footer">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secured with OTP verification
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
