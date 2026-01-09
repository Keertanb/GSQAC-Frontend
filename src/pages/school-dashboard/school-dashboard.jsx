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
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
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
                  color: "#2563eb",
                  transform: "scale(1.08)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  borderColor: "rgba(59, 130, 246, 0.2)",
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
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(59, 130, 246, 0.35)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                <SchoolIcon
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
                      "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  GSQAC School
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
            {/* Welcome Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#0f172a",
                  mb: 1,
                  fontSize: { xs: "1.75rem", md: "2.125rem" },
                }}
              >
                Welcome{user?.name ? `, ${user.name}` : ""}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#64748b",
                  fontSize: "1rem",
                }}
              >
                Manage your school's quality assessment and information
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Self-Assessment Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(59, 130, 246, 0.15)",
                      borderColor: "#3b82f6",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    },
                  }}
                  onClick={() => navigate("/school-dashboard/self-assessment")}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2.5,
                        boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <Assessment sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        mb: 1,
                        fontSize: "1.125rem",
                      }}
                    >
                      Self-Assessment
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        mb: 2,
                      }}
                    >
                      Complete your school's quality assessment across multiple
                      domains and subdomains
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        pt: 2,
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#3b82f6" }}
                        >
                          5
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontSize: "0.75rem" }}
                        >
                          Domains
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "1px",
                          height: "40px",
                          bgcolor: "#e2e8f0",
                        }}
                      />
                      <Box
                        sx={{
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#10b981" }}
                        >
                          0%
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontSize: "0.75rem" }}
                        >
                          Complete
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* School Details Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(16, 185, 129, 0.15)",
                      borderColor: "#10b981",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    },
                  }}
                  onClick={() => navigate("/school-dashboard/school-details")}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background:
                          "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2.5,
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <SchoolIcon sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        mb: 1,
                        fontSize: "1.125rem",
                      }}
                    >
                      School Details
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        mb: 2,
                      }}
                    >
                      View and update your school's profile, contact information
                      and basic details
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        pt: 2,
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#10b981" }}
                        >
                          -
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontSize: "0.75rem" }}
                        >
                          Students
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "1px",
                          height: "40px",
                          bgcolor: "#e2e8f0",
                        }}
                      />
                      <Box
                        sx={{
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#10b981" }}
                        >
                          -
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontSize: "0.75rem" }}
                        >
                          Teachers
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Settings Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(139, 92, 246, 0.15)",
                      borderColor: "#8b5cf6",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "4px",
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        background:
                          "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2.5,
                        boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      <Settings sx={{ fontSize: 32, color: "white" }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        mb: 1,
                        fontSize: "1.125rem",
                      }}
                    >
                      Settings
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                        mb: 2,
                      }}
                    >
                      Configure your school profile, preferences, and manage
                      account settings
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        pt: 2,
                        borderTop: "1px solid #e2e8f0",
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#8b5cf6" }}
                        >
                          <Settings sx={{ fontSize: 24 }} />
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontSize: "0.75rem" }}
                        >
                          Configure
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "1px",
                          height: "40px",
                          bgcolor: "#e2e8f0",
                        }}
                      />
                      <Box
                        sx={{
                          flex: 1,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "#8b5cf6" }}
                        >
                          <People sx={{ fontSize: 24 }} />
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontSize: "0.75rem" }}
                        >
                          Manage
                        </Typography>
                      </Box>
                    </Box>
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
