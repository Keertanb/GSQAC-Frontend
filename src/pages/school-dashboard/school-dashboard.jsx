import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Grid,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  School as SchoolIcon,
  Menu,
  Assessment,
  People,
  Settings,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import { useLogoutMutation } from "../../services/authService";
import AppDrawer from "../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../constants/menuItems";
import "./school-dashboard.css";

const SchoolDashboard = () => {
  const navigate = useNavigate();
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

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <AppDrawer open={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          marginLeft: drawerOpen && !matchDownMD ? 0 : 0,
          [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
            marginLeft: drawerOpen && !matchDownMD ? `${DRAWER_WIDTH.xl}px` : 0,
          },
          transition: theme.transitions.create(["margin-left"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <AppBar
          position="fixed"
          className="bg-white shadow-lg border-b border-gray-200 backdrop-blur-sm"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            height: "64px",
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
          <Toolbar className="h-16 px-6">
            <IconButton
              onClick={handleDrawerToggle}
              className="mr-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200"
              edge="start"
              sx={{
                color: "#4b5563",
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  transform: "scale(1.05)",
                },
              }}
            >
              <Menu />
            </IconButton>
            <Box className="flex items-center gap-3 mr-6">
              <Box
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
                sx={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)",
                }}
              >
                <SchoolIcon className="text-white text-lg" />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  className="font-bold text-gray-900"
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.01em",
                  }}
                >
                  GSQAC School
                </Typography>
                <Typography
                  variant="caption"
                  className="text-gray-500 text-xs"
                  sx={{
                    fontSize: "0.7rem",
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  Dashboard
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {user && (
              <Box className="flex items-center gap-4 mr-4">
                <Box className="text-right hidden sm:block">
                  <Typography
                    variant="body2"
                    className="font-semibold text-gray-900 text-sm"
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-gray-500 text-xs"
                    sx={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    School
                  </Typography>
                </Box>
                <Box
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105 cursor-pointer"
                  sx={{
                    background:
                      "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #4f46e5 100%)",
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "S"}
                </Box>
              </Box>
            )}
            <Button
              onClick={handleLogout}
              className="text-gray-700 hover:bg-red-50 hover:text-red-600 font-semibold px-5 py-2 rounded-xl transition-all duration-200 hover:scale-105"
              sx={{
                color: "#374151",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  transform: "scale(1.05)",
                },
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
            <Typography
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Welcome{user?.name ? `, ${user.name}` : ""} to School Dashboard
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent>
                    <Assessment
                      sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }}
                    />
                    <Typography variant="h6" gutterBottom>
                      Self-Assessment
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Complete your school's self-assessment across 5 key
                      domains
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent>
                    <People sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Student Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage student records and information
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: "100%",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  <CardContent>
                    <Settings sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure your school profile and preferences
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolDashboard;
