import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
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
  VerifiedUser as InspectorIcon,
  Menu,
  Assignment,
  CheckCircle,
  List,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import { useLogoutMutation } from "../../services/authService";
import AppDrawer from "../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../constants/menuItems";
import "./inspector-dashboard.css";

const InspectorDashboard = () => {
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
          transition: theme.transitions.create(["margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: drawerOpen && !matchDownMD ? `${DRAWER_WIDTH.xs}px` : 0,
          [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
            marginLeft: drawerOpen && !matchDownMD ? `${DRAWER_WIDTH.xl}px` : 0,
          },
        }}
      >
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: "#10b981",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            width: drawerOpen && !matchDownMD ? `calc(100% - ${DRAWER_WIDTH.xs}px)` : "100%",
            [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
              width: drawerOpen && !matchDownMD ? `calc(100% - ${DRAWER_WIDTH.xl}px)` : "100%",
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
            <InspectorIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              School Inspector Dashboard
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

        <Box sx={{ mt: 8, p: 3 }}>
          <Container maxWidth="xl">
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Welcome{user?.name ? `, ${user.name}` : ""} to Inspector Dashboard
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <CardContent>
                    <List sx={{ fontSize: 48, color: "#10b981", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Pending Inspections
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View and manage pending school inspections
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <CardContent>
                    <Assignment sx={{ fontSize: 48, color: "#10b981", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Verification Tasks
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Complete on-site validation and verification
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                  <CardContent>
                    <CheckCircle sx={{ fontSize: 48, color: "#10b981", mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Completed Reports
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View your completed inspection reports
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default InspectorDashboard;
