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
          sx={{
            // backgroundColor: "#1e3a8a",
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
            <SchoolIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              School Dashboard
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
