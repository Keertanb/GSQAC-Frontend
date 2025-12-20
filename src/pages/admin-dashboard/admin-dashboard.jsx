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
import {
  ADMIN_DASHBOARD_URL,
  ADMIN_VERIFIER_URL,
  ADMIN_ASSESSMENT_MANAGEMENT_URL,
  ADMIN_SCHOOL_ALLOCATION_URL,
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
            backgroundColor: "#1e3a8a",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
            <AdminIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              GSQAC Admin Dashboard
            </Typography>
            {user && (
              <Typography variant="body2" sx={{ mr: 2, opacity: 0.9 }}>
                {user.name}
              </Typography>
            )}
            <Button color="inherit" onClick={handleLogout}>
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
