import React from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Skeleton,
  useTheme,
} from "@mui/material";
import { Menu, Download, Refresh, Description } from "@mui/icons-material";
import AppDrawer from "../../../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../../../constants/menuItems";
import { colors } from "../../../../constants/colors";
import { ReportDocument } from "./ReportDocument";
import { ReportPdfCaptureHost } from "./ReportPdfCaptureHost";
import "../ReportGeneration.css";

export function ReportGenerationPageView({ c }) {
  const theme = useTheme();
  const {
    drawerOpen,
    matchDownMD,
    handleDrawerToggle,
    handleLogout,
    isDomainsLoading,
    isReportLoading,
    isReportError,
    reportError,
    refetchReport,
    isSubmitted,
    report,
    pdfCaptureRefs,
    pdfCaptureActive,
    isGeneratingPdf,
    handleDownloadPdf,
  } = c;

  const showNotSubmitted = !isDomainsLoading && !isSubmitted;
  const showLoading = isDomainsLoading || (isSubmitted && isReportLoading);
  const showError = isSubmitted && isReportError && !isReportLoading;
  const showReport = isSubmitted && report?.isSubmitted && !isReportLoading;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <AppDrawer open={drawerOpen} handleDrawerToggle={handleDrawerToggle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          marginLeft: drawerOpen && !matchDownMD ? 4 : 0,
          [`@media (min-width:${theme.breakpoints.values.xl}px)`]: {
            marginLeft: drawerOpen && !matchDownMD ? 4 : 0,
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

            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mr: 2 }}>
              <Box
                sx={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(139, 92, 246, 0.35)",
                }}
              >
                <Description sx={{ color: "white", fontSize: "1.625rem" }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Report Generation
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.6875rem",
                    color: "#64748b",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    lineHeight: 1.4,
                    mt: 0.25,
                    display: "block",
                  }}
                >
                  School Accreditation Report
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
          sx={{ mt: { xs: 7, sm: 8 } }}
          className="report-generation-page-content"
          style={{ position: "relative", zIndex: 1, backgroundColor: "#f8fafc" }}
        >
          <Box
            sx={{
              pl: drawerOpen && !matchDownMD ? 0 : { xs: 1.5, sm: 2, md: 3 },
              pr: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 2, md: 3 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                justifyContent: "space-between",
                mb: { xs: 2, md: 3 },
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  School Accreditation Report
                </Typography>
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  Generate your school assessment report card after submitting the complete
                  self-assessment.
                </Typography>
              </Box>

              {showReport && (
                <Button
                  variant="contained"
                  startIcon={
                    isGeneratingPdf ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <Download />
                    )
                  }
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  sx={{
                    alignSelf: { xs: "stretch", sm: "center" },
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 600,
                    px: 3,
                    py: 1.25,
                    background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)",
                    },
                  }}
                >
                  Download PDF
                </Button>
              )}
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.25, sm: 2, md: 3 },
                borderRadius: { xs: 2, md: 3 },
                border: `1px solid ${colors.neutral.gray200}`,
                overflow: "hidden",
              }}
            >
              {showLoading && (
                <Box>
                  <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={420} />
                </Box>
              )}

              {showNotSubmitted && (
                <Alert severity="info">
                  Your assessment has not been submitted yet. Complete and submit the
                  self-assessment to generate the report.
                </Alert>
              )}

              {showError && (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      startIcon={<Refresh />}
                      onClick={() => refetchReport()}
                    >
                      Retry
                    </Button>
                  }
                >
                  {reportError?.response?.data?.message ||
                    reportError?.message ||
                    "Unable to load assessment report."}
                </Alert>
              )}

              {showReport && (
                <Box className="report-generation-preview report-screen-preview">
                  <ReportDocument report={report} screenPreview />
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>

      <ReportPdfCaptureHost
        report={report}
        pageRefs={pdfCaptureRefs}
        active={pdfCaptureActive}
      />
    </Box>
  );
}
