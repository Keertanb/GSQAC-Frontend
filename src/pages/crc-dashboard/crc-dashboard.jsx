import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Menu,
  AccountTreeOutlined,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import { useLogoutMutation } from "../../services/authService";
import AppDrawer from "../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../constants/menuItems";
import SchoolAssessment from "./school-assessment/SchoolAssessment";
import CRCAssessment from "./school-assessment/CRCAssessment";
import {
  CRC_DASHBOARD_URL,
  CRC_SCHOOL_ASSESSMENT_URL,
} from "../../routes/routeUrls";
import "./crc-dashboard.css";

const CRCDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const { logout, user } = useAuthStore();

  const logoutMutation = useLogoutMutation({
    onSuccess: () => {
      logout();
      navigate("/login");
    },
    onError: (error) => {
      console.error("Logout API error:", error);
      logout();
      navigate("/login");
    },
  });

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Determine current view based on URL
  const getCurrentView = () => {
    // Check if it's the assessment detail page (has schoolId param)
    const pathParts = location.pathname.split("/");
    const hasSchoolId = pathParts.length > 3 && pathParts[3] !== "school-assessment";
    
    if (hasSchoolId) {
      // This is the assessment detail page - render CRCAssessment component
      return "assessment-detail";
    }
    
    if (location.pathname === CRC_SCHOOL_ASSESSMENT_URL) {
      return "school-assessment";
    }
    return "dashboard";
  };

  const currentView = getCurrentView();

  // Redirect to school assessment if on base CRC dashboard
  useEffect(() => {
    if (location.pathname === CRC_DASHBOARD_URL) {
      navigate(CRC_SCHOOL_ASSESSMENT_URL, { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <AppDrawer open={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          marginLeft: drawerOpen && !matchDownMD ? `${DRAWER_WIDTH.xs}px` : 0,
          [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
            marginLeft: drawerOpen && !matchDownMD ? 5 : 0,
          },
          transition: theme.transitions.create(["margin-left"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <AppBar
          position="fixed"
          sx={{
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
              left: drawerOpen && !matchDownMD ? `${DRAWER_WIDTH.xl}px` : 0,
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
            },
            width:
              drawerOpen && !matchDownMD
                ? `calc(100% - ${DRAWER_WIDTH.xs}px)`
                : "100%",
            [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
              width:
                drawerOpen && !matchDownMD
                  ? `calc(100% - ${DRAWER_WIDTH.xl}px)`
                  : "100%",
            },
            transition: theme.transitions.create(["width", "left"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar
            sx={{
              height: "72px",
              minHeight: "72px !important",
              px: { xs: 2, sm: 3, md: 4 },
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <IconButton
              onClick={handleDrawerToggle}
              edge="start"
              sx={{
                color: "#64748b",
                borderRadius: "12px",
                width: "44px",
                height: "44px",
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                "&:hover": {
                  backgroundColor: "#ffffff",
                  color: "#8b5cf6",
                  transform: "scale(1.08)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  borderColor: "rgba(139, 92, 246, 0.2)",
                },
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <Menu />
            </IconButton>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2.5,
                mr: 2,
              }}
            >
              <Box
                sx={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(139, 92, 246, 0.35)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <AccountTreeOutlined
                  sx={{
                    color: "white",
                    fontSize: "1.625rem",
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    fontFamily:
                      "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                    background:
                      "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  GSQAC CRC
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.6875rem",
                    color: "#64748b",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    fontFamily:
                      "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                    lineHeight: 1.4,
                    mt: 0.25,
                    display: "block",
                  }}
                >
                  Dashboard
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              onClick={handleLogout}
              sx={{
                color: "#475569",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "12px",
                px: 3,
                py: 1.25,
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                fontFamily:
                  "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                letterSpacing: "-0.01em",
                "&:hover": {
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  borderColor: "#fecaca",
                  boxShadow: "0 4px 8px rgba(220, 38, 38, 0.15)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ mt: 9 }}>
          <Box
            sx={{
              pl: drawerOpen && !matchDownMD ? 0 : { xs: 2, sm: 2, md: 3 },
              pr: { xs: 2, sm: 2, md: 3 },
              py: 3,
              maxWidth: "xl",
              mx: "auto",
            }}
          >
            {/* Content based on current route */}
            {currentView === "school-assessment" && <SchoolAssessment />}
            {currentView === "assessment-detail" && <CRCAssessment />}
            {currentView === "dashboard" && (
              <Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  Welcome{user?.name ? `, ${user.name}` : ""} to CRC Dashboard
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Please select a section from the sidebar menu.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CRCDashboard;

