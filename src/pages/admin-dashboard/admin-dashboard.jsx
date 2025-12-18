import React from "react";
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
} from "@mui/material";
import {
  AdminPanelSettings as AdminIcon,
  ArrowBack,
  Dashboard,
  People,
  Settings,
  Assessment,
} from "@mui/icons-material";
import "./admin-dashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <Box className="dashboard-wrapper">
      <AppBar position="static" sx={{ backgroundColor: "#1e3a8a" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <AdminIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GSQAC Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate("/login")}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Welcome to Admin Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Dashboard sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  System Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View system statistics and analytics
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <People sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  User Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage users, roles, and permissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Assessment sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Accreditation Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage school accreditations and reports
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Settings sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  System Settings
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Configure system parameters and settings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;

