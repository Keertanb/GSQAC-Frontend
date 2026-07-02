import React, { useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Tabs,
  Tab,
  Stack,
} from "@mui/material";
import {
  CheckCircle,
  ArrowForward,
  Menu,
  Assessment,
  Class,
  Assignment,
  ExpandMore,
  ExpandLess,
  ChevronLeft,
  ChevronRight,
  Logout as LogoutIcon,
  WorkspacePremium,
  MenuBook,
  Groups,
  Business,
  School as SchoolIcon,
  Language,
  Create,
  LocationOn,
  AccountTree,
  PhotoCamera,
  Close,
} from "@mui/icons-material";
import { colors } from "../../../../constants/colors";
import AppDrawer from "../../../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../../../constants/menuItems";
import { SubmitFeedbackModal, countFeedbackWords } from "./SubmitFeedbackModal";
import { SubmitPreviewModal } from "./SubmitPreviewModal";
import { AssessmentNavProgressBar } from "../../../../components/AssessmentNavProgressBar/AssessmentNavProgressBar";
import { SelfAssessmentMobileStepper } from "./SelfAssessmentMobileStepper";
import { SubdomainQuestionFlow } from "./SubdomainQuestionFlow";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "../SelfAssessment.css";

export function SelfAssessmentLayout({ c }) {
  const {
    navigate,
    theme,
    matchDownMD,
    drawerOpen,
    setDrawerOpen,
    logout,
    user,
    userId,
    userName,
    t,
    i18n,
    currentLanguage,
    setCurrentLanguage,
    selectedDomain,
    setSelectedDomain,
    selectedSubdomain,
    setSelectedSubdomain,
    answers,
    setAnswers,
    subdomainAnswers,
    setSubdomainAnswers,
    subdomainTextAnswers,
    setSubdomainTextAnswers,
    classWiseAnswers,
    setClassWiseAnswers,
    classWiseTextAnswers,
    setClassWiseTextAnswers,
    selectedClassGroup,
    setSelectedClassGroup,
    selectedClass,
    setSelectedClass,
    selectedSection,
    setSelectedSection,
    selectedSubject,
    setSelectedSubject,
    textAnswers,
    setTextAnswers,
    expandedQuestions,
    setExpandedQuestions,
    showSubmitConfirmation,
    setShowSubmitConfirmation,
    showSubmitPreview,
    submitPreviewData,
    isLoadingSubmitPreview,
    submitPreviewError,
    submitPreviewAnswerCount,
    handleCloseSubmitPreview,
    handleConfirmSubmitPreview,
    submitFeedback,
    setSubmitFeedback,
    handleCloseSubmitFeedback,
    selectedQuestionTab,
    setSelectedQuestionTab,
    sessionId,
    selectedAssessmentId,
    setSelectedAssessmentId,
    chartDrilldownAssessmentId,
    setChartDrilldownAssessmentId,
    mcqQuestionImages,
    setMcqQuestionImages,
    mcqImageInputRef,
    pendingMcqImageSlot,
    setPendingMcqImageSlot,
    logoutMutation,
    handleDrawerToggle,
    handleLogout,
    languageCodeMap,
    languageCode,
    roleId,
    queryClient,
    domainsData,
    isLoadingDomains,
    isFetchingDomains,
    isErrorDomains,
    refetchDomains,
    allQuestionsData,
    hasSubjectWiseQuestions,
    questionsData,
    isLoadingQuestions,
    isErrorQuestions,
    refetchQuestions,
    schoolDataResponse,
    isLoadingSchoolData,
    schoolData,
    gradesData,
    isLoadingGrades,
    gradesCounts,
    lowerClass,
    upperClass,
    classOptions,
    filteredClassOptions,
    sectionsData,
    isLoadingSections,
    subjectsData,
    isLoadingSubjects,
    sections,
    subjects,
    assessments,
    selectedAssessment,
    domains,
    isPublished,
    endDate,
    isSubmitted,
    isEndDatePassed,
    isReadOnly,
    assessmentProgress,
    mapGroupRangeToApiFormat,
    getGroupFlagColor,
    getFlagColorValue,
    getTotalQuestionsFromGroupWise,
    getTotalQuestionsCount,
    allQuestionsForCount,
    allQuestions,
    singleChoiceQuestionsForCount,
    classroomObservationQuestionsForCount,
    subjectObservationQuestionsForCount,
    flnQuestionsForCount,
    generalQuestionsForCount,
    singleChoiceQuestions,
    classroomObservationQuestions,
    subjectObservationQuestions,
    flnQuestions,
    classBasedQuestions,
    generalQuestions,
    generalQuestionsTotalCount,
    classroomObservationQuestionsTotalCount,
    subjectObservationQuestionsTotalCount,
    flnQuestionsTotalCount,
    questionTabs,
    currentTab,
    flattenedQuestions,
    getSubdomainProgress,
    getDomainProgress,
    getDomainName,
    getSubdomainName,
    getProgressColor,
    getQuestionText,
    getOptionText,
    shouldShowApiAnswer,
    getDomainIcon,
    toggleQuestionExpansion,
    parseOptions,
    handleDomainSelect,
    handleSubdomainSelect,
    handleAssessmentSelect,
    handleAnswerChange,
    questionAllowsImageUpload,
    getMcqImagesForQuestion,
    getMcqImagePreviewSrc,
    getMcqImageLocation,
    getMcqImageFilesForQuestion,
    buildAttachedImagesForQuestion,
    uploadImagesToPresignedUrls,
    handleMcqImageCaptureClick,
    getAddressFromCoords,
    handleMcqImageFileChange,
    handleMcqImageRemove,
    handleTextAnswerChange,
    submitAnswerMutation,
    submitSubdomainWiseAnswersMutation,
    submitAssessmentMutation,
    handleOpenSubmitConfirmation,
    handleConfirmSubmit,
    allDomainsComplete,
    domainChartData,
    assessmentChartData,
    currentChartData,
    totalAnswered,
    totalQuestions,
    domainNumber,
    subdomainNumber,
    handleSubmitQuestion,
    handleSubmit,
  } = c;

  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [mobileStep, setMobileStep] = useState(0);
  const leftPanelWidth = 380;

  const scrollMobileToTop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleMobileDomainSelect = (domain) => {
    const isSame = selectedDomain?.domainId === domain.domainId;
    if (isSame) {
      setMobileStep(1);
      scrollMobileToTop();
      return;
    }
    handleDomainSelect(domain);
    if (matchDownMD) {
      setMobileStep(1);
      scrollMobileToTop();
    }
  };

  const handleMobileSubdomainSelect = (subdomain) => {
    handleSubdomainSelect(subdomain);
    if (matchDownMD) {
      setMobileStep(2);
      scrollMobileToTop();
    }
  };

  const handleMobileStepChange = (step) => {
    if (step === 0) {
      setMobileStep(0);
      setSelectedSubdomain(null);
      scrollMobileToTop();
      return;
    }
    if (step === 1 && selectedDomain) {
      setMobileStep(1);
      setSelectedSubdomain(null);
      scrollMobileToTop();
      return;
    }
    if (step === 2 && selectedSubdomain) {
      setMobileStep(2);
      scrollMobileToTop();
    }
  };

  const handleMobileStepBack = () => {
    if (mobileStep === 2) {
      setSelectedSubdomain(null);
      setAnswers({});
      setTextAnswers({});
      setMobileStep(1);
      scrollMobileToTop();
      return;
    }
    if (mobileStep === 1) {
      setMobileStep(0);
      setSelectedDomain(null);
      setSelectedSubdomain(null);
      scrollMobileToTop();
    }
  };

  const showMobileNavigation = matchDownMD;
  const showMobileSubdomainsPanel =
    matchDownMD && mobileStep === 1 && !!selectedDomain;
  const showMobileQuestionsPanel =
    selectedSubdomain && (!matchDownMD || mobileStep === 2);
  const showMobileNavPanel =
    matchDownMD && (mobileStep === 0 || mobileStep === 1);

  const renderOptionLabel = (option, optIndex) => (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        width: "100%",
      }}
    >
      <Chip
        label={t("selfAssessment.level", { level: optIndex })}
        size="small"
        sx={{
          height: 26,
          fontWeight: 700,
          fontSize: "0.6875rem",
          bgcolor: `${colors.primary.blue}14`,
          color: colors.primary.blue,
          border: `1px solid ${colors.primary.blue}30`,
          flexShrink: 0,
          mt: 0.125,
        }}
      />
      <Typography variant="body2" sx={{ lineHeight: 1.5, flex: 1 }}>
        {getOptionText(option)}
      </Typography>
    </Box>
  );

  const renderOverallProgress = (compact = false) => {
    if (assessmentProgress.totalQuestions <= 0) return null;

    return (
      <Box
        className="sa-overall-progress"
        sx={{
          p: compact ? { xs: 1.5, md: 2 } : { xs: 2, md: 2.5 },
          borderRadius: 2,
          bgcolor: "white",
          border: `1px solid ${colors.neutral.gray200}`,
          boxShadow: compact ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
          minWidth: compact ? { xs: "100%", md: 260 } : undefined,
          maxWidth: compact ? { md: 300 } : undefined,
          flex: compact ? { md: "0 0 280px" } : undefined,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant={compact ? "caption" : "subtitle2"}
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              fontSize: compact ? "0.75rem" : "0.9375rem",
              lineHeight: 1.3,
            }}
          >
            {t("selfAssessment.overallProgress")}
          </Typography>
          <Typography
            variant={compact ? "caption" : "subtitle2"}
            sx={{
              fontWeight: 700,
              color: getProgressColor(assessmentProgress.answerPercentage),
              fontSize: compact ? "0.8125rem" : "0.9375rem",
            }}
          >
            {assessmentProgress.displayPercentage}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={assessmentProgress.answerPercentage}
          sx={{
            height: compact ? 8 : 10,
            borderRadius: 5,
            bgcolor: colors.neutral.gray200,
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              bgcolor: getProgressColor(assessmentProgress.answerPercentage),
            },
          }}
        />
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 0.75,
            color: colors.text.secondary,
            fontWeight: 500,
            fontSize: compact ? "0.6875rem" : "0.75rem",
          }}
        >
          {t("selfAssessment.questionsAnswered", {
            answered: assessmentProgress.totalAnswer,
            total: assessmentProgress.totalQuestions,
          })}
        </Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", width: "100%" }}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={mcqImageInputRef}
        onChange={handleMcqImageFileChange}
        style={{ display: "none" }}
      />
      <AppDrawer open={drawerOpen} handleDrawerToggle={handleDrawerToggle} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          minHeight: 0,
          height: "100vh",
          maxHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
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
            className="sa-app-toolbar"
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
              sx={{
                color: "#64748b",
                borderRadius: "12px",
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                flexShrink: 0,
                backgroundColor: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(0,0,0,0.05)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                "&:hover": {
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  transform: "scale(1.05)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  borderColor: "rgba(59, 130, 246, 0.2)",
                },
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
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
                <Assessment
                  sx={{
                    color: "white",
                    fontSize: {
                      xs: "1.125rem",
                      sm: "1.375rem",
                      md: "1.625rem",
                    },
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  component="div"
                  noWrap
                  sx={{
                    fontSize: { xs: "0.9375rem", sm: "1rem", md: "1.125rem" },
                    fontWeight: 700,
                    color: "#0f172a",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t("selfAssessment.title")}
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
                    lineHeight: 1.4,
                    mt: 0.25,
                  }}
                >
                  {t("selfAssessment.appBarSubtitle")}
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
                  bgcolor: "rgba(255,255,255,0.9)",
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
            )}
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            mt: 8,
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          className="self-assessment-page-content app-page-below-header"
        >
          <Box
            sx={{
              pl: drawerOpen && !matchDownMD ? 0 : { xs: 1.5, sm: 2, md: 3 },
              pr: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 2, md: 3 },
              height: "calc(100dvh - var(--app-header-offset, 72px))",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                flexDirection: { sm: "row" },
                alignItems: { sm: "center" },
                justifyContent: "space-between",
                mb: 3,
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {t("selfAssessment.title")}
                  </Typography>
                  {/* Status Message */}
                  {endDate && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: isReadOnly
                          ? colors.semantic.error
                          : colors.semantic.warning,
                        fontWeight: 600,
                        fontSize: "0.875rem",
                      }}
                    >
                      {isReadOnly
                        ? t("selfAssessment.submissionClosedOn", {
                            date: endDate,
                          })
                        : t("selfAssessment.submitBefore", { date: endDate })}
                    </Typography>
                  )}
                </Box>
                {isErrorDomains && (
                  <Alert
                    severity="warning"
                    sx={{
                      mt: 1,
                      fontSize: "0.75rem",
                      py: 0.5,
                      "& .MuiAlert-message": {
                        fontSize: "0.75rem",
                      },
                    }}
                  >
                    {t("selfAssessment.failedToLoadAssessment")}
                  </Alert>
                )}
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {/* <Language sx={{ color: colors.primary.blue, fontSize: 20 }} /> */}
                <ToggleButtonGroup
                  value={currentLanguage}
                  exclusive
                  onChange={(e, newLanguage) => {
                    if (newLanguage !== null) {
                      setCurrentLanguage(newLanguage);
                      i18n.changeLanguage(newLanguage);
                    }
                  }}
                  size="small"
                  sx={{
                    "& .MuiToggleButton-root": {
                      px: 2,
                      py: 0.5,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      borderColor: colors.primary.blue + "40",
                      color: colors.text.secondary,
                      "&.Mui-selected": {
                        bgcolor: colors.primary.blue,
                        color: "white",
                        "&:hover": {
                          bgcolor: colors.primary.dark,
                        },
                      },
                      "&:hover": {
                        bgcolor: colors.primary.lightest,
                      },
                    },
                  }}
                >
                  <ToggleButton value="gu">ગુ</ToggleButton>
                  <ToggleButton value="en">EN</ToggleButton>
                  <ToggleButton value="hi">हिं</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>

            {/* Mobile: language + deadline only (title lives in AppBar) */}
            {matchDownMD && (
              <Box
                className="sa-mobile-page-toolbar"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  mb: 2,
                  flexWrap: "wrap",
                }}
              >
                {endDate ? (
                  <Typography
                    variant="caption"
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      color: isReadOnly
                        ? colors.semantic.error
                        : colors.semantic.warning,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      lineHeight: 1.4,
                    }}
                  >
                    {isReadOnly
                      ? t("selfAssessment.submissionClosedOn", {
                          date: endDate,
                        })
                      : t("selfAssessment.submitBefore", { date: endDate })}
                  </Typography>
                ) : (
                  <Box sx={{ flex: 1 }} />
                )}
                <ToggleButtonGroup
                  value={currentLanguage}
                  exclusive
                  onChange={(e, newLanguage) => {
                    if (newLanguage !== null) {
                      setCurrentLanguage(newLanguage);
                      i18n.changeLanguage(newLanguage);
                    }
                  }}
                  size="small"
                  sx={{
                    flexShrink: 0,
                    "& .MuiToggleButton-root": {
                      px: 1.25,
                      py: 0.35,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      borderColor: colors.primary.blue + "40",
                      color: colors.text.secondary,
                      "&.Mui-selected": {
                        bgcolor: colors.primary.blue,
                        color: "white",
                      },
                    },
                  }}
                >
                  <ToggleButton value="gu">ગુ</ToggleButton>
                  <ToggleButton value="en">EN</ToggleButton>
                  <ToggleButton value="hi">हिं</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {matchDownMD && isErrorDomains && (
              <Alert
                severity="warning"
                sx={{ mb: 2, fontSize: "0.75rem", py: 0.5 }}
              >
                {t("selfAssessment.failedToLoadAssessment")}
              </Alert>
            )}

            {showMobileNavigation && (
              <Box sx={{ mb: 2 }}>{renderOverallProgress(true)}</Box>
            )}

            {showMobileNavigation && (
              <SelfAssessmentMobileStepper
                activeStep={mobileStep}
                onStepChange={handleMobileStepChange}
                onBack={handleMobileStepBack}
                t={t}
                selectedDomain={selectedDomain}
                selectedSubdomain={selectedSubdomain}
                getDomainName={getDomainName}
                getSubdomainName={getSubdomainName}
              />
            )}

            {/* Main Content - Split Layout */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: { xs: 2, md: 0 },
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                overflow: "hidden",
                alignItems: "stretch",
              }}
            >
              {/* Left panel — collapses horizontally so questions expand */}
              <Box
                className={`sa-left-panel-shell${
                  isLeftPanelCollapsed ? " sa-left-panel-shell--collapsed" : ""
                }`}
                sx={{
                  flexShrink: 0,
                  width: {
                    xs: "100%",
                    md: isLeftPanelCollapsed ? 0 : leftPanelWidth,
                  },
                  minWidth: {
                    xs: 0,
                    md: isLeftPanelCollapsed ? 0 : leftPanelWidth,
                  },
                  maxWidth: {
                    xs: "100%",
                    md: isLeftPanelCollapsed ? 0 : leftPanelWidth,
                  },
                  overflow: "hidden",
                  transition:
                    "width 0.28s ease, min-width 0.28s ease, max-width 0.28s ease",
                  display: {
                    xs: showMobileNavPanel ? "block" : "none",
                    md: "block",
                  },
                }}
              >
                <Paper
                  className="sa-domains-panel"
                  sx={{
                    width: { xs: "100%", md: leftPanelWidth },
                    minWidth: { xs: 0, md: leftPanelWidth },
                    borderRadius: 3,
                    bgcolor: "white",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    maxHeight: { xs: "none", md: "calc(100vh - 200px)" },
                    minHeight: { xs: "auto", md: "auto" },
                    height: { md: "100%" },
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <Box
                    className="sa-panel-header"
                    sx={{
                      p: { xs: 2.5, md: 3 },
                      borderBottom: `2px solid ${colors.neutral.gray200}`,
                      bgcolor: colors.background.secondary,
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: colors.text.primary,
                            mb: 0.5,
                          }}
                        >
                          {showMobileSubdomainsPanel
                            ? t("selfAssessment.mobileStep.subdomains")
                            : t("selfAssessment.assessmentDomains")}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.8125rem" }}
                        >
                          {showMobileSubdomainsPanel && selectedDomain
                            ? getDomainName(selectedDomain)
                            : t("selfAssessment.navigateSubtitle")}
                        </Typography>
                      </Box>
                      {!matchDownMD && (
                        <IconButton
                          type="button"
                          size="small"
                          onClick={() => setIsLeftPanelCollapsed(true)}
                          aria-label="Collapse assessment domains panel"
                          sx={{
                            flexShrink: 0,
                            color: colors.primary.blue,
                            bgcolor: colors.primary.blue + "12",
                            "&:hover": { bgcolor: colors.primary.blue + "22" },
                          }}
                        >
                          <ChevronLeft fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    {assessments.length > 1 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{ color: colors.text.secondary, fontWeight: 600 }}
                        >
                          {t("selfAssessment.selectAssessment")}
                        </Typography>
                        <FormControl size="small" fullWidth sx={{ mt: 0.75 }}>
                          <Select
                            value={selectedAssessment?.assessmentId ?? ""}
                            onChange={(e) => {
                              const selectedId = Number(e.target.value);
                              const assessment = assessments.find(
                                (a) => Number(a.assessmentId) === selectedId,
                              );
                              if (assessment) {
                                handleAssessmentSelect(assessment);
                              }
                            }}
                          >
                            {assessments.map((assessment) => (
                              <MenuItem
                                key={assessment.assessmentId}
                                value={assessment.assessmentId}
                              >
                                {assessment.assessmentName ||
                                  t("selfAssessment.assessmentNameFallback", {
                                    id: assessment.assessmentId,
                                  })}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    )}
                  </Box>

                  {/* Domains/Subdomains List */}
                  <Box
                    className="sa-nav-list"
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      p: { xs: 2.5, md: 2.5 },
                    }}
                  >
                    {showMobileSubdomainsPanel ? (
                      selectedDomain?.subDomain?.length > 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: { xs: 2, md: 1.5 },
                          }}
                        >
                          {selectedDomain.subDomain.map(
                            (subdomain, subdomainIndex) => {
                              const subdomainId =
                                subdomain.subDomainId || subdomain.id;
                              const subdomainProgress =
                                getSubdomainProgress(subdomain);
                              const isSubdomainSelected =
                                selectedSubdomain?.subDomainId ===
                                  subdomainId ||
                                selectedSubdomain?.id === subdomainId;
                              const domainIdx = domains.findIndex(
                                (d) => d.domainId === selectedDomain.domainId,
                              );
                              const subdomainNumber = `${domainIdx + 1}.${
                                subdomainIndex + 1
                              }`;

                              return (
                                <Card
                                  className="sa-nav-card sa-nav-card--subdomain"
                                  key={subdomainId}
                                  onClick={() =>
                                    handleMobileSubdomainSelect(subdomain)
                                  }
                                  sx={{
                                    cursor: "pointer",
                                    transition: "all 0.3s ease",
                                    border: isSubdomainSelected
                                      ? "2px solid"
                                      : "1px solid",
                                    borderColor: isSubdomainSelected
                                      ? colors.primary.blue
                                      : colors.neutral.gray200,
                                    borderRadius: 2,
                                    bgcolor: isSubdomainSelected
                                      ? colors.primary.blue + "12"
                                      : "white",
                                    boxShadow: isSubdomainSelected
                                      ? `0 4px 12px ${colors.primary.blue}20`
                                      : "0 2px 8px rgba(0,0,0,0.04)",
                                    "&:active": {
                                      transform: "scale(0.99)",
                                    },
                                  }}
                                >
                                  <CardContent
                                    sx={{
                                      p: { xs: 2.5, md: 2 },
                                      "&:last-child": {
                                        pb: { xs: 2.5, md: 2 },
                                      },
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        mb: 1,
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: 1,
                                          bgcolor: colors.accent.green,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            color: "white",
                                            fontWeight: 700,
                                            fontSize: "0.75rem",
                                          }}
                                        >
                                          {String.fromCharCode(
                                            65 + (subdomainIndex % 26),
                                          )}
                                        </Typography>
                                      </Box>
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontWeight: 600,
                                          color: colors.text.primary,
                                          fontSize: "0.9375rem",
                                          lineHeight: 1.35,
                                        }}
                                      >
                                        {subdomainNumber}.{" "}
                                        {getSubdomainName(subdomain)}
                                      </Typography>
                                      {subdomainProgress === 100 && (
                                        <CheckCircle
                                          sx={{
                                            color: colors.accent.green,
                                            fontSize: 18,
                                            ml: "auto",
                                          }}
                                        />
                                      )}
                                    </Box>
                                    <AssessmentNavProgressBar
                                      progress={subdomainProgress}
                                      getProgressColor={getProgressColor}
                                      label={t("selfAssessment.progress")}
                                      mobile
                                    />
                                  </CardContent>
                                </Card>
                              );
                            },
                          )}
                        </Box>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textAlign: "center", py: 4 }}
                        >
                          {t("selfAssessment.mobileStep.selectSubdomain")}
                        </Typography>
                      )
                    ) : domains.length > 0 ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: { xs: 2, md: 1.5 },
                        }}
                      >
                        {domains.map((domain, domainIndex) => {
                          const progress = getDomainProgress(domain);
                          const isDomainSelected =
                            selectedDomain?.domainId === domain.domainId;
                          const DomainIcon = getDomainIcon(domain);
                          const domainNumber = domainIndex + 1;

                          return (
                            <Box key={domain.domainId}>
                              <Card
                                className="sa-nav-card sa-nav-card--domain"
                                onClick={() =>
                                  matchDownMD
                                    ? handleMobileDomainSelect(domain)
                                    : handleDomainSelect(domain)
                                }
                                sx={{
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  border: "1.5px solid",
                                  borderColor: isDomainSelected
                                    ? colors.primary.blue
                                    : "transparent",
                                  borderRadius: 2,
                                  bgcolor: isDomainSelected
                                    ? colors.primary.blue + "08"
                                    : colors.background.primary,
                                  boxShadow: isDomainSelected
                                    ? `0 4px 12px ${colors.primary.blue}15`
                                    : "0 2px 8px rgba(0,0,0,0.04)",
                                  "&:hover": {
                                    transform: "translateX(4px)",
                                    boxShadow: `0 6px 16px ${colors.primary.blue}25`,
                                    borderColor: colors.primary.blue,
                                  },
                                }}
                              >
                                <CardContent
                                  sx={{
                                    p: { xs: 2.5, md: 2 },
                                    "&:last-child": { pb: { xs: 2.5, md: 2 } },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1.5,
                                      mb: 1.5,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 1.5,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        color: isDomainSelected
                                          ? colors.primary.blue
                                          : colors.text.secondary,
                                      }}
                                    >
                                      {React.cloneElement(DomainIcon, {
                                        sx: { fontSize: 24 },
                                      })}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontWeight: 600,
                                          color: isDomainSelected
                                            ? colors.primary.blue
                                            : colors.text.primary,
                                          fontSize: "0.9375rem",
                                          mb: 0.25,
                                        }}
                                      >
                                        {domainNumber}. {getDomainName(domain)}
                                      </Typography>
                                    </Box>
                                    {progress === 100 && (
                                      <CheckCircle
                                        sx={{
                                          color: colors.accent.green,
                                          fontSize: 18,
                                        }}
                                      />
                                    )}
                                  </Box>
                                  {/* Progress Bar */}
                                  <Box sx={{ mt: 1 }}>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        mb: 0.5,
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: "0.7rem",
                                          color: colors.text.secondary,
                                          fontWeight: 500,
                                        }}
                                      >
                                        Progress
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: "0.7rem",
                                          color: getProgressColor(progress),
                                          fontWeight: 600,
                                        }}
                                      >
                                        {Math.round(progress)}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress
                                      variant="determinate"
                                      value={progress}
                                      sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        bgcolor: colors.neutral.gray200,
                                        "& .MuiLinearProgress-bar": {
                                          borderRadius: 3,
                                          bgcolor: getProgressColor(progress),
                                        },
                                      }}
                                    />
                                  </Box>
                                </CardContent>
                              </Card>

                              {/* Show Subdomains when domain is selected (desktop only) */}
                              {!matchDownMD &&
                                isDomainSelected &&
                                domain.subDomain &&
                                domain.subDomain.length > 0 && (
                                  <Box
                                    sx={{
                                      mt: 1.5,
                                      ml: 1.5,
                                      pl: 1.5,
                                      borderLeft: `2px solid ${colors.neutral.gray200}`,
                                    }}
                                  >
                                    {domain.subDomain.map(
                                      (subdomain, subdomainIndex) => {
                                        const subdomainId =
                                          subdomain.subDomainId || subdomain.id;
                                        const subdomainProgress =
                                          getSubdomainProgress(subdomain);
                                        const isSubdomainSelected =
                                          selectedSubdomain?.subDomainId ===
                                          subdomainId;
                                        const subdomainNumber = `${domainNumber}.${
                                          subdomainIndex + 1
                                        }`;

                                        return (
                                          <Card
                                            className="sa-nav-card sa-nav-card--subdomain"
                                            key={subdomainId}
                                            onClick={() =>
                                              handleSubdomainSelect(subdomain)
                                            }
                                            sx={{
                                              cursor: "pointer",
                                              mb: 1.5,
                                              transition: "all 0.3s ease",
                                              border: isSubdomainSelected
                                                ? "2px solid"
                                                : "1px solid",
                                              borderColor: isSubdomainSelected
                                                ? colors.primary.blue
                                                : colors.neutral.gray200,
                                              borderRadius: 1.2,
                                              bgcolor: isSubdomainSelected
                                                ? colors.primary.blue + "15"
                                                : "white",
                                              boxShadow: isSubdomainSelected
                                                ? `0 4px 12px ${colors.primary.blue}30`
                                                : "none",
                                              "&:hover": {
                                                borderColor:
                                                  colors.primary.blue,
                                                bgcolor:
                                                  colors.primary.blue + "08",
                                              },
                                            }}
                                          >
                                            <CardContent
                                              sx={{
                                                p: { xs: 2, md: 1.75 },
                                                "&:last-child": {
                                                  pb: { xs: 2, md: 1.75 },
                                                },
                                              }}
                                            >
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1,
                                                  mb: 0.8,
                                                }}
                                              >
                                                <Box
                                                  sx={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: 0.8,
                                                    bgcolor: isSubdomainSelected
                                                      ? colors.accent.green
                                                      : colors.accent.green +
                                                        "80",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                  }}
                                                >
                                                  <Typography
                                                    sx={{
                                                      color: "white",
                                                      fontWeight: 700,
                                                      fontSize: "0.6875rem",
                                                    }}
                                                  >
                                                    {String.fromCharCode(
                                                      65 +
                                                        (subdomainIndex % 26),
                                                    )}
                                                  </Typography>
                                                </Box>
                                                <Box
                                                  sx={{ flex: 1, minWidth: 0 }}
                                                >
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      fontWeight: 600,
                                                      color: isSubdomainSelected
                                                        ? colors.accent.green
                                                        : colors.text.primary,
                                                      fontSize: "0.75rem",
                                                      lineHeight: 1.3,
                                                    }}
                                                  >
                                                    {subdomainNumber}.{" "}
                                                    {getSubdomainName(
                                                      subdomain,
                                                    )}
                                                  </Typography>
                                                </Box>
                                                {isSubdomainSelected &&
                                                  subdomainProgress === 100 && (
                                                    <CheckCircle
                                                      sx={{
                                                        color:
                                                          colors.accent.green,
                                                        fontSize: 14,
                                                      }}
                                                    />
                                                  )}
                                              </Box>
                                              {/* Progress Bar */}
                                              <Box sx={{ mt: 0.6 }}>
                                                <Box
                                                  sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent:
                                                      "space-between",
                                                    mb: 0.3,
                                                  }}
                                                >
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      fontSize: "0.625rem",
                                                      color:
                                                        colors.text.secondary,
                                                      fontWeight: 500,
                                                    }}
                                                  >
                                                    Progress
                                                  </Typography>
                                                  <Typography
                                                    variant="caption"
                                                    sx={{
                                                      fontSize: "0.625rem",
                                                      color:
                                                        getProgressColor(
                                                          subdomainProgress,
                                                        ),
                                                      fontWeight: 600,
                                                    }}
                                                  >
                                                    {Math.round(
                                                      subdomainProgress,
                                                    )}
                                                    %
                                                  </Typography>
                                                </Box>
                                                <LinearProgress
                                                  variant="determinate"
                                                  value={subdomainProgress}
                                                  sx={{
                                                    height: 4,
                                                    borderRadius: 2,
                                                    bgcolor:
                                                      colors.neutral.gray200,
                                                    "& .MuiLinearProgress-bar":
                                                      {
                                                        borderRadius: 2,
                                                        bgcolor:
                                                          getProgressColor(
                                                            subdomainProgress,
                                                          ),
                                                      },
                                                  }}
                                                />
                                              </Box>
                                            </CardContent>
                                          </Card>
                                        );
                                      },
                                    )}
                                  </Box>
                                )}
                            </Box>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
                        <Assessment
                          sx={{
                            fontSize: 64,
                            color: colors.neutral.gray400,
                            mb: 2,
                          }}
                        />
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: colors.text.primary,
                            mb: 1,
                          }}
                        >
                          No Assessment Available
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          The assessment has not been published or created yet.
                          Please contact your administrator.
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Final Submit Button (desktop / mobile steps 0–1) */}
                  {isPublished &&
                    !isReadOnly &&
                    (!matchDownMD || mobileStep < 2) && (
                      <Box
                        sx={{
                          p: 2.5,
                          borderTop: `2px solid ${colors.neutral.gray200}`,
                          bgcolor: colors.background.secondary,
                        }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleOpenSubmitConfirmation}
                          disabled={
                            submitAssessmentMutation.isPending ||
                            !allDomainsComplete ||
                            isReadOnly
                          }
                          title={
                            !allDomainsComplete
                              ? "Please complete all domains (100%) before submitting"
                              : "Submit your assessment"
                          }
                          sx={{
                            bgcolor: colors.accent.green,
                            "&:hover": {
                              bgcolor: colors.accent.greenDark,
                              "&:disabled": {
                                bgcolor: colors.neutral.gray300,
                              },
                            },
                            "&:disabled": {
                              bgcolor: colors.neutral.gray300,
                              color: colors.neutral.gray600,
                              cursor: "not-allowed",
                            },
                            textTransform: "none",
                            fontWeight: 600,
                            py: 1.5,
                            borderRadius: 2,
                          }}
                        >
                          {submitAssessmentMutation.isPending
                            ? "Submitting..."
                            : !allDomainsComplete
                              ? "Final Submit"
                              : "Submit Assessment"}
                        </Button>
                      </Box>
                    )}
                </Paper>
              </Box>

              {!matchDownMD && (
                <Box
                  className="sa-left-panel-divider"
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    pt: 2,
                    borderLeft: isLeftPanelCollapsed
                      ? "none"
                      : `1px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <IconButton
                    type="button"
                    className="sa-left-panel-toggle"
                    onClick={() => setIsLeftPanelCollapsed((prev) => !prev)}
                    aria-expanded={!isLeftPanelCollapsed}
                    aria-label={
                      isLeftPanelCollapsed
                        ? "Expand assessment domains panel"
                        : "Collapse assessment domains panel"
                    }
                    title={
                      isLeftPanelCollapsed ? "Show domains" : "Hide domains"
                    }
                    sx={{
                      width: 28,
                      height: 48,
                      borderRadius: "0 8px 8px 0",
                      bgcolor: colors.primary.blue,
                      color: "#fff",
                      boxShadow: "0 2px 8px rgba(30, 58, 138, 0.25)",
                      "&:hover": { bgcolor: colors.primary.dark },
                    }}
                  >
                    {isLeftPanelCollapsed ? (
                      <ChevronRight fontSize="small" />
                    ) : (
                      <ChevronLeft fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              )}

              <Box
                className="sa-main-workspace"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 2, md: 0 },
                  overflow: "hidden",
                }}
              >
                {/* Right Panel - Questions */}
                {showMobileQuestionsPanel && (
                  <Paper
                    className="sa-questions-panel"
                    sx={{
                      flex: "1 1 0",
                      minHeight: 0,
                      height: { md: "100%" },
                      borderRadius: 3,
                      bgcolor: "white",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      minWidth: 0,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* <Box
                      className="sa-panel-header sa-panel-header--compact"
                      sx={{
                        p: { xs: 1.5, md: 2 },
                        borderBottom: `1px solid ${colors.neutral.gray200}`,
                        bgcolor: colors.background.secondary,
                        display: { xs: "none", md: "block" },
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: colors.text.primary }}
                      >
                        Answer questions one at a time
                      </Typography>
                    </Box> */}

                    {/* Questions Content */}
                    <Box
                      className="sa-questions-content sa-questions-content--wizard"
                      sx={{
                        flex: "1 1 0",
                        minHeight: 0,
                        overflow: "hidden",
                        p: { xs: 1.5, sm: 2, md: 3 },
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Loading State */}
                      {isLoadingQuestions && (
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
                      )}

                      {/* No Questions Message */}
                      {!isLoadingQuestions && allQuestions.length === 0 && (
                        <Box sx={{ textAlign: "center", py: 8, px: 3 }}>
                          <Assignment
                            sx={{
                              fontSize: 80,
                              color: colors.neutral.gray400,
                              mb: 3,
                            }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: colors.text.primary,
                              mb: 1.5,
                            }}
                          >
                            No Questions Added
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 400, mx: "auto" }}
                          >
                            There are no questions available for this subdomain
                            yet. Please contact your administrator to add
                            questions.
                          </Typography>
                        </Box>
                      )}

                      {!isLoadingQuestions &&
                        allQuestions.length > 0 &&
                        flattenedQuestions.length > 0 && (
                          <Box
                            sx={{
                              flex: "1 1 0",
                              minHeight: 0,
                              display: "flex",
                              flexDirection: "column",
                              overflow: "hidden",
                            }}
                          >
                            <SubdomainQuestionFlow
                              c={c}
                              matchDownMD={matchDownMD}
                              setMobileStep={setMobileStep}
                              scrollMobileToTop={scrollMobileToTop}
                            />
                          </Box>
                        )}
                    </Box>

                    {matchDownMD && isPublished && !isReadOnly && (
                      <Box
                        sx={{
                          p: 2,
                          borderTop: `2px solid ${colors.neutral.gray200}`,
                          bgcolor: colors.background.secondary,
                          flexShrink: 0,
                        }}
                      >
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={handleOpenSubmitConfirmation}
                          disabled={
                            submitAssessmentMutation.isPending ||
                            !allDomainsComplete ||
                            isReadOnly
                          }
                          sx={{
                            bgcolor: colors.accent.green,
                            textTransform: "none",
                            fontWeight: 600,
                            py: 1.5,
                            borderRadius: 2,
                            "&:hover": { bgcolor: colors.accent.greenDark },
                            "&:disabled": {
                              bgcolor: colors.neutral.gray300,
                              color: colors.neutral.gray600,
                            },
                          }}
                        >
                          {submitAssessmentMutation.isPending
                            ? "Submitting..."
                            : allDomainsComplete
                              ? "Submit Assessment"
                              : "Final Submit"}
                        </Button>
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Domain View - When Domain Selected but No Subdomain (desktop) */}
                {!matchDownMD &&
                  selectedDomain &&
                  !selectedSubdomain &&
                  (() => {
                    const domainIdx = domains.findIndex(
                      (d) => d.domainId === selectedDomain.domainId,
                    );
                    const currentDomainNumber = domainIdx + 1;

                    return (
                      <Paper
                        sx={{
                          flex: 1,
                          borderRadius: 3,
                          bgcolor: "white",
                          display: "flex",
                          flexDirection: "column",
                          overflow: "hidden",
                          maxHeight: "calc(100vh - 200px)",
                          minWidth: 0,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        }}
                      >
                        {/* Domain Header */}
                        <Box
                          sx={{
                            p: 3,
                            borderBottom: `2px solid ${colors.neutral.gray200}`,
                            bgcolor: colors.background.secondary,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              mb: 2,
                              pt: 3,
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="h5"
                                sx={{
                                  fontWeight: 700,
                                  color: colors.text.primary,
                                  mb: 0.5,
                                }}
                              >
                                {currentDomainNumber}.{" "}
                                {getDomainName(selectedDomain)}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: "0.875rem" }}
                              >
                                Assessment of{" "}
                                {(
                                  getDomainName(selectedDomain) || ""
                                ).toLowerCase()}
                              </Typography>
                            </Box>

                            {/* Domain Progress Card */}
                            <Card
                              sx={{
                                minWidth: 140,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: colors.background.primary,
                                border: `1px solid ${colors.neutral.gray200}`,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colors.text.secondary,
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  mb: 1,
                                  display: "block",
                                }}
                              >
                                Progress
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <CircularProgress
                                  variant="determinate"
                                  value={getDomainProgress(selectedDomain)}
                                  size={40}
                                  thickness={4}
                                  sx={{
                                    color: getProgressColor(
                                      getDomainProgress(selectedDomain),
                                    ),
                                  }}
                                />
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight: 700,
                                    color: colors.text.primary,
                                    fontSize: "1rem",
                                  }}
                                >
                                  {Math.round(
                                    getDomainProgress(selectedDomain),
                                  )}
                                  %
                                </Typography>
                              </Box>
                            </Card>
                          </Box>
                        </Box>

                        {/* Subdomains List */}
                        <Box
                          sx={{
                            flex: 1,
                            overflowY: "auto",
                            p: { xs: 2.5, md: 3.5 },
                          }}
                        >
                          {selectedDomain.subDomain &&
                          selectedDomain.subDomain.length > 0 ? (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 2.5,
                              }}
                            >
                              {selectedDomain.subDomain.map(
                                (subdomain, index) => {
                                  const subdomainId =
                                    subdomain.subDomainId || subdomain.id;
                                  const subdomainProgress =
                                    getSubdomainProgress(subdomain);
                                  const domainIdx = domains.findIndex(
                                    (d) =>
                                      d.domainId === selectedDomain.domainId,
                                  );
                                  const subdomainNumber = `${domainIdx + 1}.${
                                    index + 1
                                  }`;

                                  return (
                                    <Card
                                      key={subdomainId}
                                      onClick={() =>
                                        handleSubdomainSelect(subdomain)
                                      }
                                      sx={{
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        border: "1px solid",
                                        borderColor: colors.neutral.gray200,
                                        borderRadius: 2,
                                        bgcolor: colors.background.primary,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                        "&:hover": {
                                          transform: "translateY(-2px)",
                                          boxShadow:
                                            "0 4px 12px rgba(0,0,0,0.1)",
                                          borderColor: colors.primary.blue,
                                        },
                                      }}
                                    >
                                      <CardContent sx={{ p: 2.5 }}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            mb: 2,
                                          }}
                                        >
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 2,
                                              flex: 1,
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 1.5,
                                                bgcolor: colors.accent.green,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                              }}
                                            >
                                              <Typography
                                                sx={{
                                                  color: "white",
                                                  fontWeight: 700,
                                                  fontSize: "0.875rem",
                                                }}
                                              >
                                                {String.fromCharCode(
                                                  65 + (index % 26),
                                                )}
                                              </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                              <Typography
                                                variant="body1"
                                                sx={{
                                                  fontWeight: 600,
                                                  color: colors.text.primary,
                                                  fontSize: "0.9375rem",
                                                }}
                                              >
                                                {subdomainNumber}.{" "}
                                                {getSubdomainName(subdomain)}
                                              </Typography>
                                            </Box>
                                          </Box>
                                          <Box
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 2,
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                position: "relative",
                                                display: "inline-flex",
                                              }}
                                            >
                                              <CircularProgress
                                                variant="determinate"
                                                value={subdomainProgress}
                                                size={50}
                                                thickness={4}
                                                sx={{
                                                  color:
                                                    getProgressColor(
                                                      subdomainProgress,
                                                    ),
                                                }}
                                              />
                                              <Box
                                                sx={{
                                                  top: 0,
                                                  left: 0,
                                                  bottom: 0,
                                                  right: 0,
                                                  position: "absolute",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                }}
                                              >
                                                <Typography
                                                  variant="caption"
                                                  component="div"
                                                  sx={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    color: colors.text.primary,
                                                  }}
                                                >
                                                  {Math.round(
                                                    subdomainProgress,
                                                  )}
                                                  %
                                                </Typography>
                                              </Box>
                                            </Box>
                                          </Box>
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  );
                                },
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                              <Typography
                                variant="body1"
                                color="text.secondary"
                              >
                                No subdomains available for this domain
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Paper>
                    );
                  })()}

                {/* Domains Overview - No Domain Selected (desktop) */}
                {!matchDownMD && !selectedDomain && (
                  <Paper
                    elevation={2}
                    sx={{
                      flex: 1,
                      borderRadius: 3,
                      bgcolor: "white",
                      display: "flex",
                      flexDirection: "column",
                      maxHeight: "calc(100vh - 200px)",

                      overflow: "hidden",
                      minWidth: 0,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  >
                    {/* Header */}
                    <Box
                      sx={{
                        p: 3,
                        borderBottom: `2px solid ${colors.neutral.gray200}`,
                        bgcolor: colors.background.secondary,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 220 }}>
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: colors.text.primary,
                            mb: 0.5,
                          }}
                        >
                          {t("selfAssessment.assessmentOverview")}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          {t("selfAssessment.reviewSubtitle")}
                        </Typography>
                      </Box>
                      {renderOverallProgress(true)}
                    </Box>

                    {/* Bar Graph - Domains Progress */}
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        p: { xs: 2.5, md: 3.5 },
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {currentChartData.length > 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            height: "100%",
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              color: colors.text.primary,
                              mb: 1,
                            }}
                          >
                            {assessments.length > 1 &&
                            !chartDrilldownAssessmentId
                              ? "Assessment Progress Overview"
                              : "Domain Progress Overview"}
                          </Typography>
                          {assessments.length > 1 &&
                            chartDrilldownAssessmentId && (
                              <Button
                                size="small"
                                variant="text"
                                onClick={() =>
                                  setChartDrilldownAssessmentId(null)
                                }
                                sx={{
                                  alignSelf: "flex-start",
                                  textTransform: "none",
                                }}
                              >
                                Back to Assessments
                              </Button>
                            )}
                          <Box
                            sx={{
                              flex: 1,
                              minHeight: "400px",
                              width: "100%",
                            }}
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={currentChartData}
                                layout="vertical"
                                margin={{
                                  top: 20,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <XAxis
                                  type="number"
                                  domain={[0, 100]}
                                  tick={{
                                    fill: colors.text.secondary,
                                    fontSize: 12,
                                  }}
                                  stroke={colors.neutral.gray400}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  width={200}
                                  tick={{
                                    fill: colors.text.primary,
                                    fontSize: 12,
                                  }}
                                  stroke={colors.neutral.gray400}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: colors.background.primary,
                                    border: `1px solid ${colors.neutral.gray300}`,
                                    borderRadius: "8px",
                                    padding: "8px 12px",
                                  }}
                                  formatter={(value) => [
                                    `${value}%`,
                                    "Progress",
                                  ]}
                                  labelStyle={{
                                    color: colors.text.primary,
                                    fontWeight: 600,
                                    marginBottom: "4px",
                                  }}
                                />
                                <Bar
                                  dataKey="progress"
                                  radius={[0, 8, 8, 0]}
                                  onClick={(data) => {
                                    if (
                                      assessments.length > 1 &&
                                      !chartDrilldownAssessmentId
                                    ) {
                                      const assessment = assessments.find(
                                        (a) =>
                                          a.assessmentId === data.assessmentId,
                                      );
                                      if (assessment) {
                                        handleAssessmentSelect(assessment);
                                        setChartDrilldownAssessmentId(
                                          assessment.assessmentId,
                                        );
                                      }
                                      return;
                                    }

                                    const sourceDomains =
                                      chartDrilldownAssessmentId
                                        ? assessments.find(
                                            (a) =>
                                              a.assessmentId ===
                                              chartDrilldownAssessmentId,
                                          )?.domains || []
                                        : domains;

                                    const domain = sourceDomains.find(
                                      (d) => d.domainId === data.domainId,
                                    );
                                    if (domain) {
                                      handleDomainSelect(domain);
                                    }
                                  }}
                                  cursor="pointer"
                                >
                                  {currentChartData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.color}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: "center", py: 8, px: 3 }}>
                          <Assessment
                            sx={{
                              fontSize: 80,
                              color: colors.neutral.gray400,
                              mb: 3,
                            }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 700,
                              color: colors.text.primary,
                              mb: 1.5,
                            }}
                          >
                            No Assessment Available
                          </Typography>
                          <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ maxWidth: 400, mx: "auto" }}
                          >
                            The assessment has not been published or created
                            yet. Please contact your administrator to publish
                            the assessment.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Answer preview before final submit feedback */}
      <SubmitPreviewModal
        open={showSubmitPreview}
        onClose={handleCloseSubmitPreview}
        onConfirm={handleConfirmSubmitPreview}
        previewData={submitPreviewData}
        isLoading={isLoadingSubmitPreview}
        error={submitPreviewError}
        totalAnswered={submitPreviewAnswerCount}
        title={t("selfAssessment.submitPreview.title")}
        description={t("selfAssessment.submitPreview.description")}
        emptyMessage={t("selfAssessment.submitPreview.emptyMessage")}
        confirmText={t("selfAssessment.submitPreview.confirm")}
        cancelText={t("selfAssessment.submitPreview.cancel")}
      />

      {/* Confirmation Modal for Final Submit */}
      <SubmitFeedbackModal
        open={showSubmitConfirmation}
        onClose={handleCloseSubmitFeedback}
        onConfirm={handleConfirmSubmit}
        feedback={submitFeedback}
        onFeedbackChange={setSubmitFeedback}
        title={t("selfAssessment.submitFeedback.title")}
        description={t("selfAssessment.submitFeedback.description")}
        testingNotice={t("selfAssessment.submitFeedback.testingNotice")}
        testingNoticeTitle={t(
          "selfAssessment.submitFeedback.testingNoticeTitle",
        )}
        testingNoticePoints={t(
          "selfAssessment.submitFeedback.testingNoticePoints",
          {
            returnObjects: true,
          },
        )}
        placeholder={t("selfAssessment.submitFeedback.placeholder")}
        optionalHint={t("selfAssessment.submitFeedback.optionalHint")}
        wordLimitText={t("selfAssessment.submitFeedback.wordLimit", {
          count: countFeedbackWords(submitFeedback),
          max: 250,
        })}
        confirmText={t("selfAssessment.submitFeedback.confirm")}
        cancelText={t("selfAssessment.submitFeedback.cancel")}
        isLoading={isFetchingDomains || submitAssessmentMutation.isPending}
      />
    </Box>
  );
}
