import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputAdornment,
  Paper,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  PersonOutline,
  SchoolOutlined,
  PeopleOutline,
  VerifiedUserOutlined,
  AdminPanelSettingsOutlined,
  LockOutlined,
  EmailOutlined,
  AccountTreeOutlined,
} from "@mui/icons-material";
import { colors } from "../../constants/colors";
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
  const [focusedInput, setFocusedInput] = useState("");
  const { setOtpUserId } = useAuthStore();

  // Check for role query parameter on mount and pre-select if present
  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam && roles.some((r) => r.value === roleParam)) {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  const sendOtpMutation = useSendOtpMutation({
    onSuccess: (data) => {
      console.log("Send OTP Success Response:", data);

      // Extract userId from various possible response structures
      // Handle: data.userId, data.data.userId, data.data[0].userId, data.data[0].id, etc.
      let apiUserId = null;

      // Try direct access
      if (data?.userId) {
        apiUserId = data.userId;
      }
      // Try nested object access
      else if (data?.data?.userId) {
        apiUserId = data.data.userId;
      }
      // Try array access (data.data is an array)
      else if (Array.isArray(data?.data) && data.data.length > 0) {
        const firstItem = data.data[0];
        apiUserId = firstItem?.userId || firstItem?.id || firstItem?.user?.id;
      }
      // Try deeply nested
      else if (data?.data?.data?.userId) {
        apiUserId = data.data.data.userId;
      }

      console.log("Extracted userId:", apiUserId, "Role:", selectedRole);
      console.log("Full response structure:", JSON.stringify(data, null, 2));
      console.log("Data array contents:", data?.data);

      // Only proceed if we have a userId
      if (!apiUserId) {
        console.error("No userId found in response. Full response:", data);
        setErrors({
          ...errors,
          userId: "Failed to get user ID from server. Please try again.",
        });
        return; // Don't navigate if no userId
      }

      // Set userId in store first (synchronous operation)
      setOtpUserId(apiUserId, selectedRole);
      console.log("UserId set in store:", apiUserId);

      // Navigate after a small delay to ensure store is updated
      setTimeout(() => {
        console.log("Navigating to OTP verify with:", {
          role: selectedRole,
          userId: apiUserId,
        });
        navigate("/otp-verify", {
          state: {
            role: selectedRole,
            userId: apiUserId,
          },
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
      school: <SchoolOutlined />,
      parent: <PeopleOutline />,
      inspector: <VerifiedUserOutlined />,
      admin: <AdminPanelSettingsOutlined />,
      crc: <AccountTreeOutlined />,
    };
    return iconMap[roleValue] || <PersonOutline />;
  };

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
    setErrors({ ...errors, role: "" });
  };

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setErrors({ ...errors, userId: "" });
  };

  const handleContinue = () => {
    const newErrors = { role: "", userId: "" };
    let hasError = false;

    if (!selectedRole) {
      newErrors.role = "Please select a role";
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

    // Get roleId from selected role
    const roleId = getRoleId(selectedRole);

    // Only mutate - navigation happens in onSuccess callback
    sendOtpMutation.mutate({
      userName: userId.trim(),
      roleId: roleId,
    });
  };

  const selectedRoleData = roles.find((r) => r.value === selectedRole);

  return (
    <Box className="login-container">
      <Box className="login-visual-panel">
        <Box className="visual-overlay" />

        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>

        <Box className="visual-content">
          <Box className="illustration-wrapper">
            <svg
              viewBox="0 0 500 500"
              xmlns="http://www.w3.org/2000/svg"
              className="floating-vector"
            >
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop
                    offset="0%"
                    style={{ stopColor: "#ffffff", stopOpacity: 0.8 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#ffffff", stopOpacity: 0.1 }}
                  />
                </linearGradient>
              </defs>

              <path
                d="M250 450 L100 350 L100 150 L250 50 L400 150 L400 350 Z"
                fill="url(#grad1)"
                opacity="0.1"
              />

              <g className="float-element-1">
                <rect
                  x="150"
                  y="200"
                  width="80"
                  height="100"
                  rx="10"
                  fill="#fbbf24"
                  opacity="0.9"
                />
                <rect
                  x="160"
                  y="210"
                  width="60"
                  height="80"
                  rx="5"
                  fill="#fff"
                  opacity="0.3"
                />
              </g>

              <g className="float-element-2">
                <circle cx="350" cy="180" r="50" fill="#f97316" opacity="0.9" />
                <path
                  d="M330 180 L350 200 L380 160"
                  stroke="white"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              <g className="float-element-3">
                <rect
                  x="200"
                  y="300"
                  width="140"
                  height="90"
                  rx="15"
                  fill="#3b82f6"
                  opacity="0.9"
                />
                <circle cx="270" cy="345" r="25" fill="white" opacity="0.2" />
              </g>

              {/* Connecting Lines */}
              <path
                d="M190 250 Q 250 250 270 300"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.5"
                fill="none"
              />
              <path
                d="M350 230 Q 320 280 270 300"
                stroke="white"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.5"
                fill="none"
              />
            </svg>
          </Box>

          <Box sx={{ position: "relative", zIndex: 2, mt: 4 }}>
            <Typography variant="h3" className="visual-title">
              Quality Assurance
              <br /> Simplified.
            </Typography>
            <Typography variant="body1" className="visual-subtitle">
              Empowering schools and inspectors with real-time insights and
              seamless management.
            </Typography>
          </Box>
        </Box>

        {/* Organic Curve Divider */}
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

      {/* RIGHT SECTION: Form */}
      <Box className="login-form-panel">
        <Paper elevation={0} className="login-card">
          <Box sx={{ mb: 5, textAlign: "center" }}>
            <Typography
              variant="h4"
              fontWeight="800"
              color="primary"
              sx={{ mb: 1, letterSpacing: "-0.5px" }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please enter your details to sign in
            </Typography>
          </Box>

          {/* Role Selector */}
          <FormControl
            fullWidth
            sx={{ mb: 3 }}
            variant="standard"
            error={!!errors.role}
          >
            <Select
              value={selectedRole}
              onChange={handleRoleChange}
              displayEmpty
              disableUnderline
              className={`custom-select ${selectedRole ? "active" : ""}`}
              MenuProps={{
                PaperProps: {
                  sx: {
                    borderRadius: 3,
                    mt: 1,
                    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                <span style={{ color: "#9ca3af" }}>Select your role</span>
              </MenuItem>
              {roles.map((role) => (
                <MenuItem
                  key={role.value}
                  value={role.value}
                  sx={{ py: 2, px: 2, gap: 2, borderRadius: 2, mx: 1, my: 0.5 }}
                >
                  <Box
                    className="role-icon-box"
                    sx={{ bgcolor: `${role.color}15`, color: role.color }}
                  >
                    {getRoleIcon(role.value)}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="600">
                      {role.label}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.role && (
              <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                {errors.role}
              </Typography>
            )}
          </FormControl>

          <Fade in={!!selectedRole} timeout={500}>
            <Box>
              <Box
                className={`custom-input-group ${
                  focusedInput === "userId" ? "focused" : ""
                } ${errors.userId ? "error" : ""}`}
              >
                <Typography variant="caption" className="input-label-text">
                  {selectedRoleData?.authMethod || "User ID"}
                </Typography>
                <TextField
                  fullWidth
                  variant="standard"
                  placeholder={`e.g. ${
                    selectedRole === "school" ? "SCH-2024-001" : "john@doe.com"
                  }`}
                  value={userId}
                  onChange={handleUserIdChange}
                  onFocus={() => setFocusedInput("userId")}
                  onBlur={() => setFocusedInput("")}
                  InputProps={{
                    disableUnderline: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline
                          sx={{
                            color:
                              focusedInput === "userId"
                                ? "primary.main"
                                : "text.disabled",
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              {errors.userId && (
                <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                  {errors.userId}
                </Typography>
              )}
            </Box>
          </Fade>

          <Box sx={{ mt: 6 }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleContinue}
              disabled={
                !selectedRole || !userId.trim() || sendOtpMutation.isPending
              }
              endIcon={
                sendOtpMutation.isPending ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <ArrowForward />
                )
              }
              className="login-btn"
              sx={{
                bgcolor:
                  selectedRoleData?.color || colors.primary?.blue || "#1e3a8a",
              }}
            >
              {sendOtpMutation.isPending
                ? "Sending OTP..."
                : "Continue Securely"}
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Having trouble? <span className="link-text">Contact Admin</span>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default Login;
