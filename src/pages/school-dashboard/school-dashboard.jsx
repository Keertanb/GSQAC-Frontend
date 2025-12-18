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
  School as SchoolIcon,
  ArrowBack,
  Assessment,
  People,
  Settings,
} from "@mui/icons-material";
import "./school-dashboard.css";

const SchoolDashboard = () => {
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
          <SchoolIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            School Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate("/login")}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Welcome to School Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Assessment sx={{ fontSize: 48, color: "#1e3a8a", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Self-Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Complete your school's self-assessment across 5 key domains
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
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
            <Card>
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
      </Container>
    </Box>
  );
};

export default SchoolDashboard;

