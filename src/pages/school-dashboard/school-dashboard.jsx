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
  CircularProgress,
  LinearProgress,
  Chip,
  Paper,
} from "@mui/material";
import {
  School as SchoolIcon,
  Menu,
  Assessment,
  People,
  Settings,
  ArrowForward,
  CheckCircle,
  TrendingUp,
  Description,
  PersonOutline,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import { useLogoutMutation } from "../../services/authService";
import { useGetSchoolDataQuery } from "../../services/schoolService";
import AppDrawer from "../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../constants/menuItems";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import "./school-dashboard.css";

const SchoolDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { logout, user, userName } = useAuthStore();

  // Fetch school data
  const { data: schoolDataResponse, isLoading: isLoadingSchoolData } =
    useGetSchoolDataQuery({
      schoolId: userName || undefined,
      enabled: !!userName,
    });

  const schoolData = schoolDataResponse?.data || {};

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
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setLogoutModalOpen(false);
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
          marginLeft: drawerOpen && !matchDownMD ? 5 : 0,
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

        <Box
          sx={{ mt: 9, bgcolor: "#f8fafc", minHeight: "calc(100vh - 72px)" }}
        >
          <Box
            sx={{
              pl: drawerOpen && !matchDownMD ? 0 : { xs: 2, sm: 2, md: 3 },
              pr: { xs: 2, sm: 2, md: 3 },
              py: 4,
              maxWidth: "xl",
              mx: "auto",
            }}
          >
            {isLoadingSchoolData ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "400px",
                }}
              >
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Welcome Section with School Info */}
                <Paper
                  elevation={0}
                  sx={{
                    mb: 4,
                    p: 4,
                    borderRadius: 3,
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: -100,
                      right: -100,
                      width: 300,
                      height: 300,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.1)",
                    },
                  }}
                >
                  <Box sx={{ position: "relative", zIndex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 2,
                          bgcolor: "rgba(255,255,255,0.2)",
                          backdropFilter: "blur(10px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: 36, color: "white" }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            color: "white",
                            mb: 0.5,
                            fontSize: { xs: "1.5rem", md: "2rem" },
                          }}
                        >
                          {schoolData.schoolName || "School Dashboard"}
                        </Typography>
                        <Box
                          sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}
                        >
                          <Chip
                            label={schoolData.districtName || "District"}
                            size="small"
                            sx={{
                              bgcolor: "rgba(255,255,255,0.2)",
                              color: "white",
                              fontWeight: 600,
                              backdropFilter: "blur(10px)",
                            }}
                          />
                          <Chip
                            label={schoolData.schoolCategoryName || "Category"}
                            size="small"
                            sx={{
                              bgcolor: "rgba(255,255,255,0.2)",
                              color: "white",
                              fontWeight: 600,
                              backdropFilter: "blur(10px)",
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                {/* Quick Stats */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3} lg={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        borderRadius: 3,
                        overflow: "hidden",
                        position: "relative",
                        border: "1px solid #e2e8f0",
                        bgcolor: "white",
                        transition: "all 0.3s ease",
                        height: "100%",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 28px rgba(59, 130, 246, 0.15)",
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
                            "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                        },
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                            }}
                          >
                            <People sx={{ fontSize: 26, color: "white" }} />
                          </Box>
                          <TrendingUp sx={{ fontSize: 20, color: "#10b981" }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Total Students
                        </Typography>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: "2.25rem",
                            lineHeight: 1.2,
                          }}
                        >
                          {schoolData.studentCount || "-"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 3,
                          py: 1.5,
                          bgcolor: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#10b981",
                            }}
                          />
                          Active Enrollment
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} lg={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        borderRadius: 3,
                        overflow: "hidden",
                        position: "relative",
                        border: "1px solid #e2e8f0",
                        bgcolor: "white",
                        transition: "all 0.3s ease",
                        height: "100%",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 28px rgba(16, 185, 129, 0.15)",
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
                            "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                        },
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            <PersonOutline
                              sx={{ fontSize: 26, color: "white" }}
                            />
                          </Box>
                          <TrendingUp sx={{ fontSize: 20, color: "#10b981" }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Total Teachers
                        </Typography>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: "2.25rem",
                            lineHeight: 1.2,
                          }}
                        >
                          {schoolData.teacherCount || "-"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 3,
                          py: 1.5,
                          bgcolor: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#10b981",
                            }}
                          />
                          Teaching Staff
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} lg={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        borderRadius: 3,
                        overflow: "hidden",
                        position: "relative",
                        border: "1px solid #e2e8f0",
                        bgcolor: "white",
                        transition: "all 0.3s ease",
                        height: "100%",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 28px rgba(245, 158, 11, 0.15)",
                          borderColor: "#f59e0b",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background:
                            "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
                        },
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                            }}
                          >
                            <Description
                              sx={{ fontSize: 26, color: "white" }}
                            />
                          </Box>
                          <Assessment sx={{ fontSize: 20, color: "#f59e0b" }} />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Class Range
                        </Typography>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: "2.25rem",
                            lineHeight: 1.2,
                          }}
                        >
                          {`${schoolData.lowerClass || 1}-${schoolData.upperClass || 12}`}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 3,
                          py: 1.5,
                          bgcolor: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#f59e0b",
                            }}
                          />
                          Grade Levels
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3} lg={3}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        borderRadius: 3,
                        overflow: "hidden",
                        position: "relative",
                        border: "1px solid #e2e8f0",
                        bgcolor: "white",
                        transition: "all 0.3s ease",
                        height: "100%",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 12px 28px rgba(99, 102, 241, 0.15)",
                          borderColor: "#6366f1",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background:
                            "linear-gradient(90deg, #6366f1 0%, #818cf8 100%)",
                        },
                      }}
                    >
                      <Box sx={{ p: 3 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 2.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              background:
                                "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                            }}
                          >
                            <CheckCircle
                              sx={{ fontSize: 26, color: "white" }}
                            />
                          </Box>
                          <Box
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: "#fef3c7",
                              border: "1px solid #fde68a",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#f59e0b",
                                fontSize: "0.625rem",
                                fontWeight: 700,
                              }}
                            >
                              PENDING
                            </Typography>
                          </Box>
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            display: "block",
                            mb: 0.5,
                          }}
                        >
                          Assessment
                        </Typography>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: "2.25rem",
                            lineHeight: 1.2,
                          }}
                        >
                          0%
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 3,
                          py: 1.5,
                          bgcolor: "#f8fafc",
                          borderTop: "1px solid #e2e8f0",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              bgcolor: "#ef4444",
                            }}
                          />
                          Not Started
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}

            {/* Action Cards */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                mb: 2.5,
                fontSize: "1.125rem",
              }}
            >
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              {/* Self-Assessment Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 2.5,
                    border: "1px solid #e2e8f0",
                    bgcolor: "white",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 28px rgba(59, 130, 246, 0.12)",
                      borderColor: "#3b82f6",
                      "& .action-arrow": {
                        transform: "translateX(4px)",
                      },
                    },
                  }}
                  onClick={() => navigate("/school-dashboard/self-assessment")}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: "#dbeafe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Assessment sx={{ fontSize: 28, color: "#3b82f6" }} />
                      </Box>
                      <ArrowForward
                        className="action-arrow"
                        sx={{
                          fontSize: 20,
                          color: "#94a3b8",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        mb: 1,
                        fontSize: "1rem",
                      }}
                    >
                      Self-Assessment
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: "0.8125rem",
                        lineHeight: 1.6,
                        mb: 2.5,
                        minHeight: 40,
                      }}
                    >
                      Complete quality assessment across 5 domains
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: "#f8fafc",
                        borderRadius: 1.5,
                        p: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "#64748b", fontWeight: 600 }}
                        >
                          Progress
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#3b82f6", fontWeight: 700 }}
                        >
                          0%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={0}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: "#3b82f6",
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* School Details Card */}
              <Grid item xs={12} md={6} lg={4}>
                <Card
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 2.5,
                    border: "1px solid #e2e8f0",
                    bgcolor: "white",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 28px rgba(16, 185, 129, 0.12)",
                      borderColor: "#10b981",
                      "& .action-arrow": {
                        transform: "translateX(4px)",
                      },
                    },
                  }}
                  onClick={() => navigate("/school-dashboard/school-details")}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: "#d1fae5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: 28, color: "#10b981" }} />
                      </Box>
                      <ArrowForward
                        className="action-arrow"
                        sx={{
                          fontSize: 20,
                          color: "#94a3b8",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        mb: 1,
                        fontSize: "1rem",
                      }}
                    >
                      School Details
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: "0.8125rem",
                        lineHeight: 1.6,
                        mb: 2.5,
                        minHeight: 40,
                      }}
                    >
                      View profile, contact info and infrastructure details
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#f8fafc",
                          borderRadius: 1.5,
                          p: 1.5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#10b981",
                            fontSize: "1.25rem",
                          }}
                        >
                          {schoolData.studentCount || "-"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                          }}
                        >
                          Students
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#f8fafc",
                          borderRadius: 1.5,
                          p: 1.5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: "#10b981",
                            fontSize: "1.25rem",
                          }}
                        >
                          {schoolData.teacherCount || "-"}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                          }}
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
                  elevation={0}
                  sx={{
                    height: "100%",
                    borderRadius: 2.5,
                    border: "1px solid #e2e8f0",
                    bgcolor: "white",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 28px rgba(139, 92, 246, 0.12)",
                      borderColor: "#8b5cf6",
                      "& .action-arrow": {
                        transform: "translateX(4px)",
                      },
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: "#ede9fe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Settings sx={{ fontSize: 28, color: "#8b5cf6" }} />
                      </Box>
                      <ArrowForward
                        className="action-arrow"
                        sx={{
                          fontSize: 20,
                          color: "#94a3b8",
                          transition: "transform 0.3s ease",
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#0f172a",
                        mb: 1,
                        fontSize: "1rem",
                      }}
                    >
                      Settings
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#64748b",
                        fontSize: "0.8125rem",
                        lineHeight: 1.6,
                        mb: 2.5,
                        minHeight: 40,
                      }}
                    >
                      Configure profile, preferences and account settings
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#f8fafc",
                          borderRadius: 1.5,
                          p: 1.5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Settings sx={{ fontSize: 24, color: "#8b5cf6" }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                          }}
                        >
                          Configure
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          bgcolor: "#f8fafc",
                          borderRadius: 1.5,
                          p: 1.5,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <People sx={{ fontSize: 24, color: "#8b5cf6" }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: "#64748b",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                          }}
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

      <ConfirmationModal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Yes"
        cancelText="Cancel"
        variant="warning"
        isLoading={logoutMutation.isPending}
      />
    </Box>
  );
};

export default SchoolDashboard;
