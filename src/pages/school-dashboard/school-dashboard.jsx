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
  LinearProgress,
  Chip,
  Paper,
  Skeleton,
} from "@mui/material";
import {
  School as SchoolIcon,
  Menu,
  Assessment,
  People,
  Settings,
  ArrowForward,
  CheckCircle,
  PersonOutline,
  Logout as LogoutIcon,
  LocationOn,
  Class as ClassIcon,
  Description,
} from "@mui/icons-material";
import useAuthStore from "../../store/useAuthStore";
import { useLogoutMutation } from "../../services/authService";
import { useGetSchoolDataQuery } from "../../services/schoolService";
import AppDrawer from "../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../constants/menuItems";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { colors } from "../../constants/colors";
import "./school-dashboard.css";

function StatCard({ icon, label, value, hint, accent }) {
  return (
    <Paper className="sd-stat-card" elevation={0}>
      <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1.5,
          }}
        >
          <Box
            sx={{
              width: { xs: 44, sm: 48 },
              height: { xs: 44, sm: 48 },
              borderRadius: "14px",
              background: accent.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: accent.shadow,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography
          variant="caption"
          sx={{
            color: colors.text.secondary,
            fontSize: "0.6875rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: colors.text.primary,
            fontSize: { xs: "1.75rem", sm: "2rem" },
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </Typography>
        {hint && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              mt: 1,
              color: colors.text.secondary,
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {hint}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  accent,
  onClick,
  footer,
  disabled = false,
}) {
  return (
    <Card
      className="sd-action-card"
      elevation={0}
      onClick={disabled ? undefined : onClick}
      sx={disabled ? { opacity: 0.72, cursor: "default" } : undefined}
    >
      <CardContent sx={{ p: { xs: 2.25, sm: 3 } }}>
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
              width: { xs: 52, sm: 56 },
              height: { xs: 52, sm: 56 },
              borderRadius: "16px",
              bgcolor: accent.light,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
          <ArrowForward
            className="sd-action-arrow"
            sx={{ fontSize: 22, color: colors.neutral.gray400, mt: 0.5 }}
          />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: colors.text.primary,
            mb: 0.75,
            fontSize: { xs: "1rem", sm: "1.0625rem" },
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.text.secondary,
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            lineHeight: 1.55,
            mb: 2,
            minHeight: { xs: "auto", sm: 44 },
          }}
        >
          {description}
        </Typography>
        {footer}
      </CardContent>
    </Card>
  );
}

const SchoolDashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const matchDownSM = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const { logout, user, userName } = useAuthStore();

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

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleLogout = () => setLogoutModalOpen(true);
  const confirmLogout = () => {
    setLogoutModalOpen(false);
    logoutMutation.mutate();
  };

  const classRange = `${schoolData.lowerClass || 1}–${schoolData.upperClass || 12}`;
  const welcomeName = user?.name?.split(" ")[0] || "there";

  return (
    <Box className="school-dashboard-page" sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <AppDrawer open={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          marginLeft: drawerOpen && !matchDownMD ? 5 : 0,
          transition: theme.transitions.create(["margin-left"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <AppBar
          position="fixed"
          sx={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
            transition: theme.transitions.create(["width"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar
            className="sd-app-toolbar"
            sx={{
              height: { xs: 56, sm: 64, md: 72 },
              minHeight: {
                xs: "56px !important",
                sm: "64px !important",
                md: "72px !important",
              },
              px: { xs: 1.25, sm: 2, md: 4 },
              display: "flex",
              alignItems: "center",
              gap: { xs: 1, md: 2 },
            }}
          >
            <IconButton
              onClick={handleDrawerToggle}
              edge="start"
              aria-label="Open menu"
              sx={{
                color: "#64748b",
                borderRadius: "12px",
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                flexShrink: 0,
                bgcolor: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                "&:hover": {
                  bgcolor: "#fff",
                  color: colors.primary.light,
                  borderColor: "rgba(59, 130, 246, 0.25)",
                },
              }}
            >
              <Menu sx={{ fontSize: { xs: 22, md: 24 } }} />
            </IconButton>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.25, md: 2.5 },
              }}
            >
              <Box
                sx={{
                  width: { xs: 36, sm: 40, md: 48 },
                  height: { xs: 36, sm: 40, md: 48 },
                  borderRadius: { xs: "10px", md: "14px" },
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(59, 130, 246, 0.28)",
                  flexShrink: 0,
                }}
              >
                <SchoolIcon
                  sx={{
                    color: "white",
                    fontSize: { xs: "1.125rem", sm: "1.375rem", md: "1.625rem" },
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    fontSize: { xs: "0.9375rem", sm: "1rem", md: "1.125rem" },
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
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
                  noWrap
                  sx={{
                    display: { xs: "none", sm: "block" },
                    fontSize: "0.6875rem",
                    color: "#64748b",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    mt: 0.25,
                  }}
                >
                  Dashboard
                </Typography>
              </Box>
            </Box>

            {matchDownMD ? (
              <IconButton
                onClick={handleLogout}
                aria-label="Logout"
                sx={{
                  flexShrink: 0,
                  color: "#64748b",
                  borderRadius: "12px",
                  width: 40,
                  height: 40,
                  border: "1px solid rgba(0,0,0,0.06)",
                  bgcolor: "rgba(255,255,255,0.95)",
                  "&:hover": {
                    bgcolor: "#fef2f2",
                    color: "#dc2626",
                    borderColor: "#fecaca",
                  },
                }}
              >
                <LogoutIcon sx={{ fontSize: 20 }} />
              </IconButton>
            ) : (
              <Button
                onClick={handleLogout}
                sx={{
                  flexShrink: 0,
                  color: "#475569",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  borderRadius: "12px",
                  px: 3,
                  py: 1.25,
                  bgcolor: "rgba(255,255,255,0.95)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  "&:hover": {
                    bgcolor: "#fef2f2",
                    color: "#dc2626",
                    borderColor: "#fecaca",
                  },
                }}
              >
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box
          className="school-dashboard-main"
          sx={{
            mt: { xs: 7, sm: 8, md: 9 },
            minHeight: { md: "calc(100vh - 72px)" },
          }}
        >
          <Box
            className="school-dashboard-content"
            sx={{
              pl: drawerOpen && !matchDownMD ? 0 : { xs: 2, sm: 2.5, md: 3 },
              pr: { xs: 2, sm: 2.5, md: 3 },
              py: { xs: 2.5, sm: 3, md: 4 },
              maxWidth: "xl",
              mx: "auto",
            }}
          >
            {isLoadingSchoolData ? (
              <Box>
                <Skeleton
                  variant="rounded"
                  height={matchDownSM ? 140 : 160}
                  sx={{ mb: 3, borderRadius: 3 }}
                />
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <Grid item xs={6} md={3} key={i}>
                      <Skeleton variant="rounded" height={120} sx={{ borderRadius: 2 }} />
                    </Grid>
                  ))}
                </Grid>
                <Skeleton variant="rounded" height={28} width={160} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {[1, 2, 3].map((i) => (
                    <Grid item xs={12} md={4} key={i}>
                      <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <>
                {/* Hero */}
                <Paper className="sd-hero" elevation={0} sx={{ mb: { xs: 2.5, md: 4 }, p: 0 }}>
                  <Box sx={{ position: "relative", zIndex: 1, p: { xs: 2.25, sm: 3, md: 4 } }}>
                    <Typography
                      variant="overline"
                      sx={{
                        color: "rgba(255,255,255,0.85)",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        fontSize: "0.6875rem",
                        display: "block",
                        mb: 1,
                      }}
                    >
                      Welcome back, {welcomeName}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: { xs: 1.5, sm: 2 },
                        flexWrap: "wrap",
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: 52, sm: 64 },
                          height: { xs: 52, sm: 64 },
                          borderRadius: "16px",
                          bgcolor: "rgba(255,255,255,0.18)",
                          backdropFilter: "blur(12px)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: "1px solid rgba(255,255,255,0.22)",
                        }}
                      >
                        <SchoolIcon sx={{ fontSize: { xs: 28, sm: 34 }, color: "white" }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            color: "white",
                            mb: 1,
                            fontSize: { xs: "1.375rem", sm: "1.75rem", md: "2rem" },
                            lineHeight: 1.2,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {schoolData.schoolName || "School Dashboard"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {schoolData.districtName && (
                            <Chip
                              icon={<LocationOn sx={{ fontSize: "14px !important", color: "white !important" }} />}
                              label={schoolData.districtName}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.16)",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                border: "1px solid rgba(255,255,255,0.2)",
                                "& .MuiChip-icon": { color: "white" },
                              }}
                            />
                          )}
                          {schoolData.schoolCategoryName && (
                            <Chip
                              label={schoolData.schoolCategoryName}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.16)",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                                border: "1px solid rgba(255,255,255,0.2)",
                              }}
                            />
                          )}
                          {schoolData.blockName && matchDownMD && (
                            <Chip
                              label={schoolData.blockName}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.95)",
                                fontWeight: 600,
                                fontSize: "0.75rem",
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Paper>

                {/* Stats */}
                <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 3, md: 4 } }}>
                  <Grid item xs={6} md={3}>
                    <StatCard
                      label="Students"
                      value={schoolData.studentCount ?? "—"}
                      hint="Active enrollment"
                      accent={{
                        bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        shadow: "0 4px 12px rgba(59, 130, 246, 0.28)",
                      }}
                      icon={<People sx={{ fontSize: 24, color: "white" }} />}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <StatCard
                      label="Teachers"
                      value={schoolData.teacherCount ?? "—"}
                      hint="Teaching staff"
                      accent={{
                        bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        shadow: "0 4px 12px rgba(16, 185, 129, 0.28)",
                      }}
                      icon={<PersonOutline sx={{ fontSize: 24, color: "white" }} />}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <StatCard
                      label="Class range"
                      value={classRange}
                      hint="Grade levels"
                      accent={{
                        bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        shadow: "0 4px 12px rgba(245, 158, 11, 0.28)",
                      }}
                      icon={<ClassIcon sx={{ fontSize: 24, color: "white" }} />}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <StatCard
                      label="Assessment"
                      value="0%"
                      hint="Not started"
                      accent={{
                        bg: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                        shadow: "0 4px 12px rgba(99, 102, 241, 0.28)",
                      }}
                      icon={<CheckCircle sx={{ fontSize: 24, color: "white" }} />}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {/* Quick Actions */}
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: colors.text.primary,
                  fontSize: { xs: "1.0625rem", md: "1.125rem" },
                  letterSpacing: "-0.02em",
                  mb: 0.5,
                }}
              >
                Quick Actions
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.text.secondary,
                  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                  mb: { xs: 2, md: 2.5 },
                }}
              >
                Jump to key tasks for your school
              </Typography>
            </Box>

            <Grid container spacing={{ xs: 2, md: 3 }}>
              <Grid item xs={12} sm={6} lg={4}>
                <QuickActionCard
                  title="Self-Assessment"
                  description="Complete quality assessment across all domains"
                  accent={{ light: colors.primary.lightest }}
                  icon={<Assessment sx={{ fontSize: 28, color: colors.primary.light }} />}
                  onClick={() => navigate("/school-dashboard/self-assessment")}
                  footer={
                    <Box
                      sx={{
                        bgcolor: colors.background.secondary,
                        borderRadius: "12px",
                        p: 1.5,
                        border: `1px solid ${colors.neutral.gray200}`,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: colors.text.secondary, fontWeight: 600 }}>
                          Progress
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.primary.light, fontWeight: 700 }}>
                          0%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: colors.neutral.gray200,
                          "& .MuiLinearProgress-bar": {
                            bgcolor: colors.primary.light,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={4}>
                <QuickActionCard
                  title="School Details"
                  description="View profile, contact info and infrastructure"
                  accent={{ light: "#d1fae5" }}
                  icon={<SchoolIcon sx={{ fontSize: 28, color: colors.accent.green }} />}
                  onClick={() => navigate("/school-dashboard/school-details")}
                  footer={
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      {[
                        { label: "Students", value: schoolData.studentCount ?? "—" },
                        { label: "Teachers", value: schoolData.teacherCount ?? "—" },
                      ].map((item) => (
                        <Box
                          key={item.label}
                          sx={{
                            flex: 1,
                            bgcolor: colors.background.secondary,
                            borderRadius: "12px",
                            p: 1.5,
                            textAlign: "center",
                            border: `1px solid ${colors.neutral.gray200}`,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              color: colors.accent.green,
                              fontSize: "1.25rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {item.value}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: colors.text.secondary, fontWeight: 600, fontSize: "0.6875rem" }}
                          >
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6} lg={4}>
                <QuickActionCard
                  title="Report Generation"
                  description="Download your school accreditation report card as PDF"
                  accent={{ light: "#ede9fe" }}
                  icon={<Description sx={{ fontSize: 28, color: "#8b5cf6" }} />}
                  onClick={() => navigate("/school-dashboard/report-generation")}
                  footer={
                    <Typography
                      variant="caption"
                      sx={{ color: colors.text.secondary, fontWeight: 600, fontSize: "0.75rem" }}
                    >
                      Available after assessment submission
                    </Typography>
                  }
                />
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
