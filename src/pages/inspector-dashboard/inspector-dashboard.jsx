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
  VerifiedUser as InspectorIcon,
  ArrowBack,
  Assignment,
  CheckCircle,
  List,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import "./inspector-dashboard.css";

const InspectorDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box className="dashboard-wrapper">
      <AppBar position="static" sx={{ backgroundColor: "#10b981" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
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

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Welcome{user?.name ? `, ${user.name}` : ""} to Inspector Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
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
            <Card>
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
            <Card>
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
  );
};

export default InspectorDashboard;

