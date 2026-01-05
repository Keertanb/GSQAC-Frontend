import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { AdminPanelSettings as AdminIcon, Menu } from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import { useLogoutMutation } from "../../services/authService";
import AppDrawer from "../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../constants/menuItems";
import AssessmentManagement from "./assessment-management/AssessmentManagement";
import Verifier from "./verifier/Verifier";
import SchoolAllocation from "./school-allocation/SchoolAllocation";
import DistrictNodalOfficers from "./district-nodal-officers/DistrictNodalOfficers";
import {
  ADMIN_DASHBOARD_URL,
  ADMIN_VERIFIER_URL,
  ADMIN_ASSESSMENT_MANAGEMENT_URL,
  ADMIN_SCHOOL_ALLOCATION_URL,
  ADMIN_DISTRICT_NODAL_OFFICERS_URL,
} from "../../routes/routeUrls";
import "./admin-dashboard.css";

const AdminDashboard = () => {
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
    if (location.pathname === ADMIN_VERIFIER_URL) {
      return "verifier";
    } else if (location.pathname === ADMIN_ASSESSMENT_MANAGEMENT_URL) {
      return "assessment";
    } else if (location.pathname === ADMIN_SCHOOL_ALLOCATION_URL) {
      return "allocation";
    } else if (location.pathname === ADMIN_DISTRICT_NODAL_OFFICERS_URL) {
      return "district-nodal-officers";
    }
    return "dashboard";
  };

  const currentView = getCurrentView();

  // Redirect to assessment management if on base admin dashboard
  useEffect(() => {
    if (location.pathname === ADMIN_DASHBOARD_URL) {
      navigate(ADMIN_ASSESSMENT_MANAGEMENT_URL, { replace: true });
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
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            backdropFilter: "blur(10px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            height: "64px",
            // position: "relative",
            // "&::before": {
            //   content: '""',
            //   position: "absolute",
            //   top: 0,
            //   left: 0,
            //   right: 0,
            //   height: "3px",
            //   background: "linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #3b82f6 100%)",
            // },
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
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar
            sx={{
              height: "64px",
              minHeight: "64px !important",
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
                color: "#4b5563",
                borderRadius: "12px",
                width: "40px",
                height: "40px",
                backgroundColor: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                "&:hover": {
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  transform: "scale(1.05)",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
                },
                transition: "all 0.2s ease",
              }}
            >
              <Menu />
            </IconButton>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mr: 2,
              }}
            >
              <Box
                sx={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05) rotate(5deg)",
                    boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
                  },
                }}
              >
                <AdminIcon
                  sx={{
                    color: "white",
                    fontSize: "1.5rem",
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 800,
                    color: "#111827",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #111827 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  GSQAC Admin
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.7rem",
                    color: "#6b7280",
                    fontWeight: 500,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Dashboard
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {user && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mr: 2,
                }}
              >
                <Box
                  sx={{
                    textAlign: "right",
                    display: { xs: "none", sm: "block" },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#111827",
                      lineHeight: 1.2,
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    Administrator
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    background:
                      "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #4f46e5 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 6px 16px rgba(59, 130, 246, 0.4)",
                    },
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "A"}
                </Box>
              </Box>
            )}
            <Button
              onClick={handleLogout}
              sx={{
                color: "#374151",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "12px",
                px: 2.5,
                py: 1,
                backgroundColor: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                "&:hover": {
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  borderColor: "#fecaca",
                  transform: "scale(1.05)",
                  boxShadow: "0 4px 8px rgba(220, 38, 38, 0.15)",
                },
                transition: "all 0.2s ease",
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ mt: 8 }}>
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
            {currentView === "verifier" && <Verifier />}
            {currentView === "assessment" && <AssessmentManagement />}
            {currentView === "allocation" && <SchoolAllocation />}
            {currentView === "district-nodal-officers" && (
              <DistrictNodalOfficers />
            )}
            {currentView === "dashboard" && (
              <Box>
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{ fontWeight: 700, mb: 3 }}
                >
                  Welcome{user?.name ? `, ${user.name}` : ""} to Admin Dashboard
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

export default AdminDashboard;
