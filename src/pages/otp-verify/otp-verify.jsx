import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, ArrowForward, LockOutlined } from "@mui/icons-material";
import { colors } from "../../constants/colors";
import useAuthStore from "../../store/useAuthStore";
import { useVerifyOtpMutation } from "../../services/authService";
import "./otp-verify.css";

const OTP_VERIFY = "123456";

const OtpVerify = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role: locationRole } = location.state || {};
  const { setUserData, userId, role } = useAuthStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(null);
  const inputRefs = useRef([]);

  const currentRole = role || locationRole;

  const getRoleLabel = () => {
    const roleLabels = {
      school: "School",
      parent: "Parent/Guardian",
      inspector: "School Inspector",
      admin: "GSQAC Admin",
    };
    return roleLabels[currentRole] || "User";
  };

  const verifyOtpMutation = useVerifyOtpMutation();

  useEffect(() => {
    if (!currentRole || !userId) {
      navigate("/login");
    }
  }, [currentRole, userId, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    setError("");
  };

  const handleVerify = () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      setError("Please enter complete OTP");
      return;
    }

    if (!userId) {
      setError("User ID not found. Please login again.");
      navigate("/login");
      return;
    }

    const userIdNumber =
      typeof userId === "string" ? parseInt(userId, 10) : userId;

    verifyOtpMutation.mutate(
      {
        userId: userIdNumber,
        otp: otpString,
      },
      {
        onSuccess: (data) => {
          const token =
            data?.token ||
            data?.accessToken ||
            data?.data?.token ||
            `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const userData = data?.user ||
            data?.data?.user || {
              id: userId,
              role: currentRole,
              name: getRoleLabel(),
            };

          setUserData(userData, token, currentRole, userId);

          const dashboardRoutes = {
            school: "/school-dashboard",
            parent: "/parent-dashboard",
            inspector: "/inspector-dashboard",
            admin: "/admin-dashboard",
          };

          navigate(dashboardRoutes[currentRole] || "/");
        },
        onError: (error) => {
          console.error("OTP verification error:", error);
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            "Invalid OTP. Please try again.";
          setError(errorMessage);
        },
      }
    );
  };

  if (!currentRole || !userId) {
    return null;
  }

  return (
    <Box className="otp-page-container">
      <Box className="otp-visual-panel">
        <Box className="visual-overlay" />

        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>

        <IconButton
          onClick={() => navigate("/login")}
          sx={{
            position: "absolute",
            top: "2rem",
            left: "2rem",
            color: "white",
            zIndex: 30,
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <ArrowBack />
        </IconButton>

        <Box className="visual-content">
          <Box className="illustration-wrapper">
            <svg
              viewBox="0 0 400 400"
              xmlns="http://www.w3.org/2000/svg"
              className="verification-vector"
            >
              <defs>
                <linearGradient
                  id="verifyGrad"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "#ffffff", stopOpacity: 0.9 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#ffffff", stopOpacity: 0.2 }}
                  />
                </linearGradient>
              </defs>

              <g className="shield-group">
                <path
                  d="M200 50 L120 80 L120 180 Q120 250 200 320 Q280 250 280 180 L280 80 Z"
                  fill="url(#verifyGrad)"
                  opacity="0.3"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="80"
                  fill="url(#verifyGrad)"
                  opacity="0.2"
                />
                <path
                  d="M170 200 L190 220 L230 180"
                  stroke="white"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </g>

              <g className="float-element-1">
                <circle cx="100" cy="150" r="20" fill="#fbbf24" opacity="0.8">
                  <animate
                    attributeName="opacity"
                    values="0.4;0.8;0.4"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>

              <g className="float-element-2">
                <rect
                  x="300"
                  y="120"
                  width="40"
                  height="40"
                  rx="8"
                  fill="#3b82f6"
                  opacity="0.7"
                >
                  <animate
                    attributeName="opacity"
                    values="0.4;0.7;0.4"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </rect>
              </g>

              <g className="float-element-3">
                <circle cx="320" cy="280" r="15" fill="#10b981" opacity="0.8">
                  <animate
                    attributeName="opacity"
                    values="0.4;0.8;0.4"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>

              <path
                d="M120 200 Q 160 180 200 200 Q 240 220 280 200"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.4"
                fill="none"
              />
            </svg>
          </Box>

          <Box sx={{ position: "relative", zIndex: 2, mt: 4 }}>
            <Typography variant="h3" className="visual-title">
              Verify Your Identity
            </Typography>
            <Typography variant="body1" className="visual-subtitle">
              We've sent a verification code to your registered contact. Please
              enter it below to continue.
            </Typography>
          </Box>
        </Box>
        <div className="custom-shape-divider-y">
          <svg
            data-name="Layer 1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="shape-fill"
            ></path>
          </svg>
        </div>
      </Box>

      <Box className="otp-form-panel">
        <Paper elevation={0} className="otp-card">
          <Box sx={{ mb: 5, textAlign: "center" }}>
            <Typography
              variant="h4"
              fontWeight="800"
              color="primary"
              sx={{ mb: 1, letterSpacing: "-0.5px" }}
            >
              Enter OTP
            </Typography>
            <Typography variant="body2" color="text.secondary">
              OTP has been sent to your{" "}
              {currentRole === "parent" ? "mobile number" : "registered ID"}
            </Typography>
          </Box>

          <Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
            <Chip
              icon={<LockOutlined />}
              label={`${getRoleLabel()} • ${userId}`}
              sx={{
                backgroundColor: "#f3f4f6",
                color: "#6b7280",
                fontWeight: 500,
                padding: "8px 16px",
                height: "auto",
                "& .MuiChip-icon": {
                  color: colors.primary.blue,
                },
              }}
            />
          </Box>

          <Box className="otp-input-section">
            <Typography variant="caption" className="field-label">
              ENTER VERIFICATION CODE
            </Typography>
            <Box className="otp-input-container">
              {otp.map((digit, index) => (
                <Box
                  key={index}
                  className={`otp-input-box ${
                    focusedIndex === index ? "focused" : ""
                  } ${digit ? "filled" : ""} ${error ? "error" : ""}`}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                >
                  <TextField
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: "center",
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        padding: 0,
                      },
                    }}
                    variant="standard"
                    InputProps={{
                      disableUnderline: true,
                    }}
                    sx={{
                      width: "100%",
                      "& .MuiInputBase-root": {
                        height: "100%",
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
            {error && (
              <Typography
                variant="caption"
                color="error"
                sx={{ display: "block", mt: 1.5, textAlign: "center" }}
              >
                {error}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              mt: 3,
              mb: 2,
              p: 1.5,
              backgroundColor: "#f9fafb",
              borderRadius: 2,
              textAlign: "center",
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", fontSize: "0.875rem" }}
            >
              Use OTP:{" "}
              <strong style={{ color: colors.primary.blue }}>123456</strong> for
              testing
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleVerify}
            disabled={verifyOtpMutation.isPending}
            endIcon={
              verifyOtpMutation.isPending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ArrowForward />
              )
            }
            className="verify-btn"
            sx={{
              py: 1.5,
              fontSize: "1rem",
              fontWeight: 700,
              backgroundColor: colors.primary.blue,
              borderRadius: 2,
              textTransform: "none",
              mt: 1,
            }}
          >
            {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
          </Button>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Button
              variant="text"
              onClick={() => {
                setError("");
                setOtp(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
              }}
              sx={{
                color: colors.primary.blue,
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "rgba(30, 58, 138, 0.08)",
                },
              }}
            >
              Resend OTP
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Didn't receive the code?{" "}
              <span className="link-text">Contact Support</span>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default OtpVerify;
