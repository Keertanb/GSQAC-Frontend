import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import {
  ArrowForward,
  ArrowBack,
  PersonOutline,
  SchoolOutlined,
  VerifiedUserOutlined,
  AdminPanelSettingsOutlined,
  AccountTreeOutlined,
  CheckCircle,
  Star as StarIcon,
  EmojiEvents as EmojiEventsIcon,
  Shield as ShieldIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from "@mui/icons-material";
import { roles, getRoleId } from "../../constants/roles";
import { useSendOtpMutation } from "../../services/authService";
import useAuthStore from "../../store/useAuthStore";
import "./login.css";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState("");
  const [userId, setUserId] = useState("");
  const [errors, setErrors] = useState({ role: "", userId: "" });
  const [inputFocused, setInputFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { setOtpUserId } = useAuthStore();

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

  const sendOtpMutation = useSendOtpMutation({
    onSuccess: (data) => {
      let apiUserId = null;
      if (data?.userId) {
        apiUserId = data.userId;
      } else if (data?.data?.userId) {
        apiUserId = data.data.userId;
      } else if (Array.isArray(data?.data) && data.data.length > 0) {
        const firstItem = data.data[0];
        apiUserId = firstItem?.userId || firstItem?.id || firstItem?.user?.id;
      } else if (data?.data?.data?.userId) {
        apiUserId = data.data.data.userId;
      }

      if (!apiUserId) {
        console.error("No userId found in response. Full response:", data);
        setErrors({
          ...errors,
          userId: "Failed to get user ID from server. Please try again.",
        });
        return;
      }

      setOtpUserId(apiUserId, selectedRole);
      setTimeout(() => {
        navigate("/otp-verify", {
          state: { role: selectedRole, userId: apiUserId },
          replace: false,
        });
      }, 50);
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

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue);
    setErrors({ ...errors, role: "" });
    setUserId("");
  };

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setErrors({ ...errors, userId: "" });
  };

  const handleContinue = () => {
    const newErrors = { role: "", userId: "" };
    let hasError = false;

    if (!selectedRole) {
      newErrors.role = "Please select a role to continue";
      hasError = true;
    }
    if (!userId.trim()) {
      newErrors.userId = "Please enter your User ID";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const roleId = getRoleId(selectedRole);
    sendOtpMutation.mutate({ userName: userId.trim(), roleId });
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
          <p className="lp-drive-pill">
            <StarIcon
              className="lp-drive-star"
              fontSize="small"
              aria-hidden="true"
            />
            Gujarat&apos;s school quality drive
          </p>

          <h1 className="lp-hero-title">
            Gunotsav <span className="lp-hero-accent">2.0</span>
          </h1>

          <div className="lp-mini-cards">
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
          </div>
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
              <h2 className="lp-form-title">Welcome Back</h2>
              <p className="lp-form-subtitle">
                Select your role and sign in to continue
              </p>
            </div>

            {/* Role dropdown */}
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

            {/* User ID input — animates in when role is selected */}
            <div
              className={`lp-input-section${selectedRole ? " lp-input-visible" : ""}`}
            >
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
            </div>

            {/* Continue button */}
            <button
              className="lp-continue-btn"
              onClick={handleContinue}
              disabled={
                !selectedRole || !userId.trim() || sendOtpMutation.isPending
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
