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
  People as PeopleIcon,
  ArrowBack,
  Feedback,
  ReportProblem,
  School,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import "./parent-dashboard.css";

const ParentDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Box className="dashboard-wrapper">
      <AppBar position="static" sx={{ backgroundColor: "#f97316" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/")}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <PeopleIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Parent/Guardian Dashboard
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
          Welcome{user?.name ? `, ${user.name}` : ""} to Parent/Guardian Portal
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <School sx={{ fontSize: 48, color: "#f97316", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  School Information
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View your child's school details and accreditation status
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Feedback sx={{ fontSize: 48, color: "#f97316", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Feedback
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Submit feedback about your child's school
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ReportProblem sx={{ fontSize: 48, color: "#f97316", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Grievance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  File a grievance or complaint
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ParentDashboard;

