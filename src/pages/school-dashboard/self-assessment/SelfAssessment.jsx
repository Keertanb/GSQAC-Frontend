import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
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
  WorkspacePremium,
  MenuBook,
  Groups,
  Business,
  School as SchoolIcon,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import {
  useGetDomainsQuery,
  useGetSubdomainQuestionsQuery,
  useSubmitAnswerMutation,
} from "../../../services/adminService";
import { getRoleId } from "../../../constants/roles";
import AppDrawer from "../../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../../constants/menuItems";
import useAuthStore from "../../../store/useAuthStore";
import { useLogoutMutation } from "../../../services/authService";
import { enqueueSnackbar } from "notistack";
import {
  useGetSchoolDataQuery,
  useGetClassWiseSectionsQuery,
  useSubmitSubdomainWiseAnswersMutation,
} from "../../../services/schoolService";

const SelfAssessment = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const { logout, user, userId, userName } = useAuthStore();
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [answers, setAnswers] = useState({});
  const [subdomainAnswers, setSubdomainAnswers] = useState({});
  const [questionBatch, setQuestionBatch] = useState(0);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

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

  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  const roleId = getRoleId("school");

  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isError: isErrorDomains,
  } = useGetDomainsQuery({
    roleId,
    languageCode,
    enabled: true,
  });

  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
    isError: isErrorQuestions,
  } = useGetSubdomainQuestionsQuery({
    subDomainId: selectedSubdomain?.subDomainId || selectedSubdomain?.id,
    roleId,
    languageCode,
    userId: userId ? Number(userId) : undefined,
    enabled: !!selectedSubdomain,
  });

  const { data: schoolDataResponse, isLoading: isLoadingSchoolData } =
    useGetSchoolDataQuery({
      schoolId: userName || undefined,
    });

  const schoolData = schoolDataResponse?.data || {};
  const lowerClass = schoolData.lowerClass
    ? Number(schoolData.lowerClass)
    : null;
  const upperClass = schoolData.upperClass
    ? Number(schoolData.upperClass)
    : null;

  const classOptions = useMemo(() => {
    if (
      lowerClass !== null &&
      upperClass !== null &&
      lowerClass <= upperClass
    ) {
      return Array.from(
        { length: upperClass - lowerClass + 1 },
        (_, i) => lowerClass + i
      );
    }
    return [];
  }, [lowerClass, upperClass]);

  // Fetch class-wise sections when class is selected
  const { data: sectionsData, isLoading: isLoadingSections } =
    useGetClassWiseSectionsQuery({
      userId: userId ? Number(userId) : undefined,
      class: selectedClass ? Number(selectedClass) : undefined,
      enabled: !!userId && !!selectedClass && questionBatch === 0,
    });

  // Extract sections from API response - handle both array and object formats
  const sections = useMemo(() => {
    if (!sectionsData) return [];
    // If data is an array, return it directly
    if (Array.isArray(sectionsData.data)) {
      return sectionsData.data;
    }
    // If data is an object with a data property that's an array
    if (sectionsData.data && Array.isArray(sectionsData.data)) {
      return sectionsData.data;
    }
    // If data itself is an array
    if (Array.isArray(sectionsData)) {
      return sectionsData;
    }
    return [];
  }, [sectionsData]);

  const staticDomains = [
    {
      domainId: 1,
      domainNameEn: "Teaching and Learning",
      domainNameHi: "शिक्षण और सीखना",
      domainNameGu: "શિક્ષણ અને શીખવું",
      roleId: 2,
      subDomain: [
        {
          subDomainId: 1,
          subDomainNameEn: "Curriculum Planning",
          subDomainNameHi: "पाठ्यक्रम योजना",
          subDomainNameGu: "પાઠ્યક્રમ આયોજન",
        },
        {
          subDomainId: 2,
          subDomainNameEn: "Instructional Methods",
          subDomainNameHi: "शिक्षण विधियाँ",
          subDomainNameGu: "શિક્ષણ પદ્ધતિઓ",
        },
      ],
    },
    {
      domainId: 2,
      domainNameEn: "Student Assessment",
      domainNameHi: "छात्र मूल्यांकन",
      domainNameGu: "વિદ્યાર્થી મૂલ્યાંકન",
      roleId: 2,
      subDomain: [
        {
          subDomainId: 3,
          subDomainNameEn: "Formative Assessment",
          subDomainNameHi: "रचनात्मक मूल्यांकन",
          subDomainNameGu: "રચનાત્મક મૂલ્યાંકન",
        },
        {
          subDomainId: 4,
          subDomainNameEn: "Summative Assessment",
          subDomainNameHi: "योगात्मक मूल्यांकन",
          subDomainNameGu: "યોગાત્મક મૂલ્યાંકન",
        },
      ],
    },
    {
      domainId: 3,
      domainNameEn: "Infrastructure and Facilities",
      domainNameHi: "अवसंरचना और सुविधाएं",
      domainNameGu: "ઇન્ફ્રાસ્ટ્રક્ચર અને સુવિધાઓ",
      roleId: 2,
      subDomain: [
        {
          subDomainId: 5,
          subDomainNameEn: "Classroom Facilities",
          subDomainNameHi: "कक्षा सुविधाएं",
          subDomainNameGu: "વર્ગખંડ સુવિધાઓ",
        },
        {
          subDomainId: 6,
          subDomainNameEn: "Library and Labs",
          subDomainNameHi: "पुस्तकालय और प्रयोगशालाएं",
          subDomainNameGu: "પુસ્તકાલય અને પ્રયોગશાળાઓ",
        },
      ],
    },
  ];

  const domains =
    isErrorDomains || !domainsData?.data || domainsData?.data?.length === 0
      ? staticDomains
      : domainsData.data;

  const allQuestions = useMemo(() => {
    if (questionsData?.data?.data && Array.isArray(questionsData.data.data)) {
      return questionsData.data.data;
    }
    if (questionsData?.data && Array.isArray(questionsData.data)) {
      return questionsData.data;
    }
    return [];
  }, [questionsData?.data]);

  const classBasedQuestions = allQuestions.filter(
    (q) => q.isClassroomObservation === 1
  );
  const generalQuestions = allQuestions.filter(
    (q) => q.isClassroomObservation !== 1 || q.isClassroomObservation == null
  );

  const currentQuestions =
    questionBatch === 0 ? classBasedQuestions : generalQuestions;

  const getSubdomainProgress = (subdomain) => {
    const subdomainId = subdomain.subDomainId || subdomain.id;
    const subdomainIdKey = subdomainId;

    // If subdomain has answerPercentage from API, use it
    if (
      subdomain.answerPercentage !== undefined &&
      subdomain.answerPercentage !== null
    ) {
      return subdomain.answerPercentage;
    }

    // If this is the currently selected subdomain, calculate from current answers
    if (
      selectedSubdomain &&
      (selectedSubdomain.subDomainId || selectedSubdomain.id) === subdomainId
    ) {
      const totalQuestions = allQuestions.length;
      if (totalQuestions === 0) return 0;
      const answeredQuestions = allQuestions.filter(
        (q) => answers[q.questionId]
      ).length;
      return (answeredQuestions / totalQuestions) * 100;
    }

    // Otherwise, check if we have saved answers for this subdomain
    const subdomainAnswersData = subdomainAnswers[subdomainIdKey] || {};
    const answeredCount = Object.keys(subdomainAnswersData).length;

    // If we have saved answers but no API percentage, return 0 (will be updated when API data loads)
    return 0;
  };

  const getDomainProgress = (domain) => {
    // If domain has answerPercentage from API, use it
    if (
      domain.answerPercentage !== undefined &&
      domain.answerPercentage !== null
    ) {
      return domain.answerPercentage;
    }

    if (!domain.subDomain || domain.subDomain.length === 0) return 0;

    // Calculate average progress from subdomains
    let totalProgress = 0;
    let subdomainCount = 0;

    domain.subDomain.forEach((subdomain) => {
      const subdomainProgress = getSubdomainProgress(subdomain);
      totalProgress += subdomainProgress;
      subdomainCount++;
    });

    return subdomainCount > 0 ? totalProgress / subdomainCount : 0;
  };

  // Get domain name based on language
  const getDomainName = (domain) => {
    if (languageCode === "EN") {
      return domain.domainNameEn || domain.domainName;
    } else if (languageCode === "HI") {
      return domain.domainNameHi || domain.domainName;
    } else {
      return domain.domainNameGu || domain.domainName;
    }
  };

  // Get subdomain name based on language
  const getSubdomainName = (subdomain) => {
    if (languageCode === "EN") {
      return subdomain.subDomainNameEn || subdomain.subDomainName;
    } else if (languageCode === "HI") {
      return subdomain.subDomainNameHi || subdomain.subDomainName;
    } else {
      return subdomain.subDomainNameGu || subdomain.subDomainName;
    }
  };

  // Get progress color based on percentage
  const getProgressColor = (progress) => {
    if (progress === 100) {
      return colors.accent.green; // Green for completed
    } else if (progress === 0) {
      return colors.semantic.error; // Red for not started
    } else {
      return colors.semantic.warning; // Yellow for in progress
    }
  };

  // Get question text
  const getQuestionText = (question) => {
    return question.questionText || "";
  };

  // Get option text
  const getOptionText = (option) => {
    return option.optionText || "";
  };

  // Get domain icon based on domain ID or name
  const getDomainIcon = (domain) => {
    const domainId = domain.domainId;
    const domainName = getDomainName(domain).toLowerCase();

    if (
      domainId === 1 ||
      domainName.includes("leadership") ||
      domainName.includes("governance")
    ) {
      return <WorkspacePremium />;
    } else if (
      domainId === 2 ||
      domainName.includes("curriculum") ||
      domainName.includes("instruction")
    ) {
      return <MenuBook />;
    } else if (
      domainId === 3 ||
      domainName.includes("human") ||
      domainName.includes("resource")
    ) {
      return <Groups />;
    } else if (
      domainId === 4 ||
      domainName.includes("facility") ||
      domainName.includes("infrastructure")
    ) {
      return <Business />;
    } else if (
      domainId === 5 ||
      domainName.includes("student") ||
      domainName.includes("outcome")
    ) {
      return <SchoolIcon />;
    }
    return <Assessment />;
  };

  const toggleQuestionExpansion = (questionId) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const parseOptions = (options) => {
    try {
      if (Array.isArray(options)) {
        return options;
      }
      if (typeof options === "string") {
        return JSON.parse(options);
      }
      return options || [];
    } catch (e) {
      console.error("Error parsing options:", e);
      return [];
    }
  };

  const handleDomainSelect = (domain) => {
    // Toggle domain selection - if already selected, deselect it
    if (selectedDomain?.domainId === domain.domainId) {
      setSelectedDomain(null);
      setSelectedSubdomain(null);
      setAnswers({});
    } else {
      setSelectedDomain(domain);
      // Keep subdomain selected if it belongs to the new domain
      if (
        selectedSubdomain &&
        domain.subDomain?.some(
          (sd) =>
            (sd.subDomainId || sd.id) ===
            (selectedSubdomain.subDomainId || selectedSubdomain.id)
        )
      ) {
        // Subdomain belongs to this domain, keep it selected
      } else {
        setSelectedSubdomain(null);
        setAnswers({});
      }
    }
  };

  const handleSubdomainSelect = (subdomain) => {
    const subdomainId = subdomain.subDomainId || subdomain.id;

    if (selectedSubdomain) {
      const currentSubdomainId =
        selectedSubdomain.subDomainId || selectedSubdomain.id;
      setSubdomainAnswers((prev) => ({
        ...prev,
        [currentSubdomainId]: { ...answers },
      }));
    }

    const savedAnswers = subdomainAnswers[subdomainId] || {};
    setSelectedSubdomain(subdomain);
    setAnswers(savedAnswers);
    setQuestionBatch(0);
    // Reset class and section when switching subdomains
    setSelectedClass(null);
    setSelectedSection(null);
  };

  useEffect(() => {
    if (allQuestions && allQuestions.length > 0 && selectedSubdomain) {
      const apiAnswers = {};
      allQuestions.forEach((question) => {
        if (question.selectedOptionId) {
          apiAnswers[question.questionId] = String(question.selectedOptionId);
        }
      });

      if (Object.keys(apiAnswers).length > 0) {
        setAnswers((prev) => ({
          ...apiAnswers,
          ...prev,
        }));
      }
    }
  }, [allQuestions, selectedSubdomain]);

  // Handle answer selection
  const handleAnswerChange = (questionId, optionId) => {
    const newAnswers = {
      ...answers,
      [questionId]: optionId,
    };
    setAnswers(newAnswers);

    // Also update subdomainAnswers for the current subdomain
    if (selectedSubdomain) {
      const subdomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;
      setSubdomainAnswers((prev) => ({
        ...prev,
        [subdomainId]: newAnswers,
      }));
    }
  };

  const submitAnswerMutation = useSubmitAnswerMutation({
    onSuccess: (data) => {
      // Optionally update local state or refetch questions
      console.log("Answer submitted successfully:", data);
    },
  });

  const submitSubdomainWiseAnswersMutation =
    useSubmitSubdomainWiseAnswersMutation({
      onSuccess: (data) => {
        // Save current answers to subdomainAnswers before clearing
        if (selectedSubdomain) {
          const subdomainId =
            selectedSubdomain.subDomainId || selectedSubdomain.id;
          setSubdomainAnswers((prev) => ({
            ...prev,
            [subdomainId]: { ...answers },
          }));
        }
        // Optionally clear answers or navigate
        console.log("Subdomain answers submitted successfully:", data);
      },
    });

  // Handle individual question submission
  const handleSubmitQuestion = (question) => {
    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }

    // Get selected option - prioritize user selection, fallback to API's selectedOptionId
    const userSelectedOption = answers[question.questionId];
    const apiSelectedOption = question.selectedOptionId
      ? String(question.selectedOptionId)
      : null;
    const selectedOptionId = userSelectedOption || apiSelectedOption;

    if (!selectedOptionId) {
      enqueueSnackbar("Please select an option before submitting.", {
        variant: "warning",
      });
      return;
    }

    // Determine section based on question type
    // If isClassroomObservation is 1, it's "class", otherwise (including null) it's "general"
    const section = question.isClassroomObservation === 1 ? "class" : "general";

    // For class-based questions, use selected class and section from dropdowns
    // For general questions, use defaults
    let classValue = question.class || 2; // Default fallback
    let sectionValue = question.section || section; // Default fallback

    if (question.isClassroomObservation === 1) {
      // Class-based question - use selected class and section
      if (!selectedClass) {
        enqueueSnackbar("Please select a class before submitting.", {
          variant: "warning",
        });
        return;
      }
      if (!selectedSection) {
        enqueueSnackbar("Please select a section before submitting.", {
          variant: "warning",
        });
        return;
      }
      classValue = Number(selectedClass);
      sectionValue = selectedSection;
    }

    const payload = {
      isAns: 1,
      answerId: question.answerId || null, // Use existing answerId if question was already answered
      userId: Number(userId),
      questionId: question.questionId,
      optionId: Number(selectedOptionId), // Use the selected option (from user or API)
      class: classValue,
      section: sectionValue,
    };

    submitAnswerMutation.mutate(payload);
  };

  // Handle submit - Submit all answers for the current subdomain
  const handleSubmit = () => {
    if (!selectedSubdomain) {
      enqueueSnackbar("Please select a subdomain first.", {
        variant: "warning",
      });
      return;
    }

    const subDomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;

    // Check if there are any answers
    if (!answers || Object.keys(answers).length === 0) {
      enqueueSnackbar(
        "Please answer at least one question before submitting.",
        {
          variant: "warning",
        }
      );
      return;
    }

    // For class-based questions, validate class and section selection
    const hasClassBasedQuestions = classBasedQuestions.length > 0;
    if (hasClassBasedQuestions && questionBatch === 0) {
      if (!selectedClass) {
        enqueueSnackbar("Please select a class before submitting.", {
          variant: "warning",
        });
        return;
      }
      if (!selectedSection) {
        enqueueSnackbar("Please select a section before submitting.", {
          variant: "warning",
        });
        return;
      }
    }

    // Determine class and section values
    // For class-based questions, use selected class and section
    // For general questions, use empty string for section and default class
    let clsValue = 2; // Default class value
    let sectionValue = "";
    const isClassSelected =
      hasClassBasedQuestions && questionBatch === 0 && selectedClass;

    if (isClassSelected) {
      // Class-based questions - use selected class and section
      clsValue = Number(selectedClass);
      sectionValue = selectedSection || "";
    } else {
      // General questions - use empty section and default class
      // Try to get class from first question if available, otherwise use default
      const firstQuestion = allQuestions[0];
      clsValue = firstQuestion?.class || 2;
      sectionValue = "";
    }

    // Format answers array from current answers state
    const answersArray = allQuestions
      .filter((question) => {
        // Only include questions that have been answered
        const userSelectedAnswer = answers[question.questionId];
        const apiSelectedAnswer = question.selectedOptionId
          ? String(question.selectedOptionId)
          : null;
        return userSelectedAnswer || apiSelectedAnswer;
      })
      .map((question) => {
        const userSelectedAnswer = answers[question.questionId];
        const apiSelectedAnswer = question.selectedOptionId
          ? String(question.selectedOptionId)
          : null;
        const selectedOptionId = userSelectedAnswer || apiSelectedAnswer;

        const answerObj = {
          answerId: question.answerId || null,
          questionId: question.questionId,
          optionId: Number(selectedOptionId),
        };

        // Add cls and section inside answer object if class is selected
        if (isClassSelected) {
          answerObj.cls = clsValue;
          answerObj.section = sectionValue;
        }

        return answerObj;
      });

    if (answersArray.length === 0) {
      enqueueSnackbar(
        "Please answer at least one question before submitting.",
        {
          variant: "warning",
        }
      );
      return;
    }

    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }

    const payload = {
      isAns: 1,
      subDomainId: subDomainId,
      userId: Number(userId),
      answers: answersArray,
    };

    submitSubdomainWiseAnswersMutation.mutate(payload);
  };

  // Show loading only if we don't have static data and API is loading
  if (isLoadingDomains && !isErrorDomains && !domainsData?.data) {
    return (
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
    );
  }

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
            marginLeft: drawerOpen && !matchDownMD ? `${30}px` : 0,
          },
          transition: theme.transitions.create(["margin-left"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <AppBar
          position="fixed"
          className="bg-white shadow-lg border-b border-gray-200 backdrop-blur-sm"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            zIndex: theme.zIndex.drawer + 1,
            boxShadow:
              "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            height: "64px",
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
          <Toolbar className="h-16 px-6">
            <IconButton
              onClick={handleDrawerToggle}
              className="mr-4 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all duration-200"
              edge="start"
              sx={{
                color: "#4b5563",
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  transform: "scale(1.05)",
                },
              }}
            >
              <Menu />
            </IconButton>
            <Box className="flex items-center gap-3 mr-6">
              <Box
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105"
                sx={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #4f46e5 100%)",
                }}
              >
                <Assessment className="text-white text-lg" />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  component="div"
                  className="font-bold text-gray-900"
                  sx={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Self-Assessment
                </Typography>
                <Typography
                  variant="caption"
                  className="text-gray-500 text-xs"
                  sx={{
                    fontSize: "0.7rem",
                    color: "#6b7280",
                    fontWeight: 500,
                  }}
                >
                  School Assessment
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            {user && (
              <Box className="flex items-center gap-4 mr-4">
                <Box className="text-right hidden sm:block">
                  <Typography
                    variant="body2"
                    className="font-semibold text-gray-900 text-sm"
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {user.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    className="text-gray-500 text-xs"
                    sx={{
                      fontSize: "0.75rem",
                      color: "#6b7280",
                      fontWeight: 500,
                    }}
                  >
                    School
                  </Typography>
                </Box>
                <Box
                  className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-200 hover:scale-105 cursor-pointer"
                  sx={{
                    background:
                      "linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #4f46e5 100%)",
                  }}
                >
                  {user.name?.charAt(0)?.toUpperCase() || "S"}
                </Box>
              </Box>
            )}
            <Button
              onClick={handleLogout}
              className="text-gray-700 hover:bg-red-50 hover:text-red-600 font-semibold px-5 py-2 rounded-xl transition-all duration-200 hover:scale-105"
              sx={{
                color: "#374151",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.875rem",
                borderRadius: "12px",
                "&:hover": {
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  transform: "scale(1.05)",
                },
              }}
            >
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ mt: 8 }}>
          <Box
            sx={{
              pl: drawerOpen && !matchDownMD ? 0 : { xs: 2, sm: 2, md: 3 },
              pr: { xs: 2, sm: 2, md: 3 },
              py: 3,
              height: "calc(100vh - 64px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Self-Assessment
                </Typography>
                {isErrorDomains && (
                  <Alert
                    severity="error"
                    sx={{
                      mt: 1,
                      fontSize: "0.75rem",
                      py: 0.5,
                      "& .MuiAlert-message": {
                        fontSize: "0.75rem",
                      },
                    }}
                  >
                    Failed to load domains. Please check your connection.
                  </Alert>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                {["en", "hi", "gu"].map((lang) => (
                  <Chip
                    key={lang}
                    label={lang.toUpperCase()}
                    onClick={() => {
                      setCurrentLanguage(lang);
                      i18n.changeLanguage(lang);
                    }}
                    color={currentLanguage === lang ? "primary" : "default"}
                    sx={{
                      cursor: "pointer",
                      fontWeight: currentLanguage === lang ? 700 : 400,
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* Main Content - Split Layout */}
            <Box
              sx={{
                display: "flex",
                gap: { xs: 2, md: 3 },
                flex: 1,
                overflow: "hidden",
              }}
            >
              {/* Left Panel - Domains and Subdomains */}
              <Paper
                elevation={2}
                sx={{
                  width: { xs: "100%", md: "380px" },
                  minWidth: { md: "380px" },
                  borderRadius: 3,
                  bgcolor: "white",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                {/* Left Panel Header */}
                <Box
                  sx={{
                    p: 3,
                    borderBottom: `2px solid ${colors.neutral.gray200}`,
                    bgcolor: colors.background.secondary,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: colors.text.primary,
                      mb: 0.5,
                    }}
                  >
                    Assessment Domains
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8125rem" }}
                  >
                    Navigate through domains and sub-domains
                  </Typography>
                </Box>

                {/* Domains/Subdomains List */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    p: { xs: 2, md: 2.5 },
                  }}
                >
                  {domains.length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {domains.map((domain) => {
                        const progress = getDomainProgress(domain);
                        const isDomainSelected =
                          selectedDomain?.domainId === domain.domainId;
                        const DomainIcon = getDomainIcon(domain);

                        return (
                          <Box key={domain.domainId}>
                            <Card
                              onClick={() => handleDomainSelect(domain)}
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
                                  bgcolor: isDomainSelected
                                    ? colors.primary.blue + "12"
                                    : colors.primary.lightest + "40",
                                },
                              }}
                            >
                              <CardContent
                                sx={{ p: 2, "&:last-child": { pb: 2 } }}
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
                                    {DomainIcon}
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
                                      D{domain.domainId} {getDomainName(domain)}
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

                            {/* Show Subdomains when domain is selected */}
                            {isDomainSelected &&
                              domain.subDomain &&
                              domain.subDomain.length > 0 && (
                                <Box
                                  sx={{
                                    mt: 1.5,
                                    ml: 2,
                                    pl: 2,
                                    borderLeft: `2px solid ${colors.neutral.gray200}`,
                                  }}
                                >
                                  {domain.subDomain.map((subdomain, index) => {
                                    const subdomainId =
                                      subdomain.subDomainId || subdomain.id;
                                    const subdomainProgress =
                                      getSubdomainProgress(subdomain);
                                    const isSubdomainSelected =
                                      selectedSubdomain?.subDomainId ===
                                      subdomainId;

                                    return (
                                      <Card
                                        key={subdomainId}
                                        onClick={() =>
                                          handleSubdomainSelect(subdomain)
                                        }
                                        sx={{
                                          cursor: "pointer",
                                          transition: "all 0.3s ease",
                                          border: "1.5px solid",
                                          borderColor: isSubdomainSelected
                                            ? colors.accent.green
                                            : "transparent",
                                          borderRadius: 2,
                                          bgcolor: isSubdomainSelected
                                            ? colors.accent.green + "10"
                                            : colors.background.primary,
                                          boxShadow: isSubdomainSelected
                                            ? `0 4px 12px ${colors.accent.green}20`
                                            : "0 2px 8px rgba(0,0,0,0.04)",
                                          mb: 1.5,
                                          "&:hover": {
                                            transform: "translateX(4px)",
                                            boxShadow: `0 6px 16px ${colors.accent.green}25`,
                                            borderColor: colors.accent.green,
                                            bgcolor: colors.accent.green + "15",
                                          },
                                        }}
                                      >
                                        <CardContent
                                          sx={{
                                            p: 1.5,
                                            "&:last-child": { pb: 1.5 },
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
                                                width: 28,
                                                height: 28,
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
                                                  65 + (index % 26)
                                                )}
                                              </Typography>
                                            </Box>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  fontWeight: 600,
                                                  color: isSubdomainSelected
                                                    ? colors.accent.green
                                                    : colors.text.primary,
                                                  fontSize: "0.875rem",
                                                }}
                                              >
                                                SD{domain.domainId}.{index + 1}{" "}
                                                {getSubdomainName(subdomain)}
                                              </Typography>
                                            </Box>
                                            {isSubdomainSelected &&
                                              subdomainProgress === 100 && (
                                                <CheckCircle
                                                  sx={{
                                                    color: colors.accent.green,
                                                    fontSize: 16,
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
                                                  fontSize: "0.65rem",
                                                  color: colors.text.secondary,
                                                  fontWeight: 500,
                                                }}
                                              >
                                                Progress
                                              </Typography>
                                              <Typography
                                                variant="caption"
                                                sx={{
                                                  fontSize: "0.65rem",
                                                  color:
                                                    getProgressColor(
                                                      subdomainProgress
                                                    ),
                                                  fontWeight: 600,
                                                }}
                                              >
                                                {Math.round(subdomainProgress)}%
                                              </Typography>
                                            </Box>
                                            <LinearProgress
                                              variant="determinate"
                                              value={subdomainProgress}
                                              sx={{
                                                height: 5,
                                                borderRadius: 2.5,
                                                bgcolor: colors.neutral.gray200,
                                                "& .MuiLinearProgress-bar": {
                                                  borderRadius: 2.5,
                                                  bgcolor:
                                                    getProgressColor(
                                                      subdomainProgress
                                                    ),
                                                },
                                              }}
                                            />
                                          </Box>
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </Box>
                              )}
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No domains available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Right Panel - Questions */}
              {selectedSubdomain && (
                <Paper
                  elevation={2}
                  sx={{
                    flex: 1,
                    borderRadius: 3,
                    bgcolor: "white",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    minWidth: 0,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Right Panel Header */}
                  <Box
                    sx={{
                      p: 3,
                      borderBottom: `2px solid ${colors.neutral.gray200}`,
                      bgcolor: colors.background.secondary,
                    }}
                  >
                    {/* Breadcrumb */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.75rem",
                        mb: 1.5,
                        display: "block",
                      }}
                    >
                      {selectedDomain && selectedSubdomain
                        ? `D${selectedDomain.domainId} / SD${
                            selectedDomain.domainId
                          }.${
                            selectedDomain.subDomain?.findIndex(
                              (sd) =>
                                (sd.subDomainId || sd.id) ===
                                (selectedSubdomain?.subDomainId ||
                                  selectedSubdomain?.id)
                            ) !== -1
                              ? selectedDomain.subDomain.findIndex(
                                  (sd) =>
                                    (sd.subDomainId || sd.id) ===
                                    (selectedSubdomain?.subDomainId ||
                                      selectedSubdomain?.id)
                                ) + 1
                              : 1
                          }`
                        : ""}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        mb: 2,
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
                          {getSubdomainName(selectedSubdomain)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          Assessment of{" "}
                          {getSubdomainName(selectedSubdomain).toLowerCase()}
                        </Typography>
                      </Box>

                      {/* Progress Card */}
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
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: colors.text.primary,
                            fontSize: "1rem",
                          }}
                        >
                          {
                            allQuestions.filter((q) => answers[q.questionId])
                              .length
                          }
                          /{allQuestions.length}
                        </Typography>
                      </Card>
                    </Box>

                    {/* Question Batch Tabs */}
                    <Tabs
                      value={questionBatch}
                      onChange={(e, newValue) => {
                        setQuestionBatch(newValue);
                        // Reset class and section when switching tabs
                        if (newValue === 1) {
                          setSelectedClass(null);
                          setSelectedSection(null);
                        }
                      }}
                      sx={{
                        borderBottom: 1,
                        borderColor: "divider",
                        "& .MuiTab-root": {
                          textTransform: "none",
                          fontWeight: 600,
                          minHeight: 48,
                        },
                      }}
                    >
                      <Tab
                        icon={<Class sx={{ fontSize: 20, mb: 0.5 }} />}
                        iconPosition="start"
                        label={`Class-based (${classBasedQuestions.length})`}
                        sx={{
                          color:
                            questionBatch === 0
                              ? colors.primary.blue
                              : colors.text.secondary,
                        }}
                      />
                      <Tab
                        icon={<Assignment sx={{ fontSize: 20, mb: 0.5 }} />}
                        iconPosition="start"
                        label={`General (${generalQuestions.length})`}
                        sx={{
                          color:
                            questionBatch === 1
                              ? colors.primary.blue
                              : colors.text.secondary,
                        }}
                      />
                    </Tabs>
                  </Box>

                  {/* Questions Content */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      p: { xs: 2.5, md: 3.5 },
                    }}
                  >
                    {/* Class and Section Dropdowns - Only for Class-based Questions */}
                    {questionBatch === 0 && (
                      <Box
                        sx={{
                          mb: 3,
                          p: 2.5,
                          borderRadius: 2,
                          bgcolor: colors.background.secondary,
                          border: `1.5px solid ${colors.neutral.gray200}`,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            color: colors.text.primary,
                            mb: 2,
                          }}
                        >
                          Select Class and Section
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          {/* Class Dropdown */}
                          <FormControl
                            size="small"
                            sx={{
                              minWidth: { xs: "100%", sm: "200px" },
                            }}
                          >
                            <InputLabel
                              sx={{
                                fontWeight: 600,
                                color: colors.text.secondary,
                              }}
                            >
                              Select Class
                            </InputLabel>
                            <Select
                              value={selectedClass || ""}
                              onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setSelectedSection(null); // Reset section when class changes
                              }}
                              label="Select Class"
                              disabled={
                                isLoadingSchoolData || classOptions.length === 0
                              }
                              sx={{
                                borderRadius: 2,
                                bgcolor: "white",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.neutral.gray300,
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.primary.blue,
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: colors.primary.blue,
                                    borderWidth: 2,
                                  },
                              }}
                            >
                              {isLoadingSchoolData ? (
                                <MenuItem disabled>Loading classes...</MenuItem>
                              ) : classOptions.length === 0 ? (
                                <MenuItem disabled>
                                  No classes available
                                </MenuItem>
                              ) : (
                                classOptions.map((classNum) => (
                                  <MenuItem key={classNum} value={classNum}>
                                    Class {classNum}
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>

                          {/* Section Dropdown */}
                          <FormControl
                            size="small"
                            sx={{
                              minWidth: { xs: "100%", sm: "200px" },
                            }}
                          >
                            <InputLabel
                              sx={{
                                fontWeight: 600,
                                color: colors.text.secondary,
                              }}
                            >
                              Select Section
                            </InputLabel>
                            <Select
                              value={selectedSection || ""}
                              onChange={(e) =>
                                setSelectedSection(e.target.value)
                              }
                              label="Select Section"
                              disabled={
                                !selectedClass ||
                                isLoadingSections ||
                                sections.length === 0
                              }
                              sx={{
                                borderRadius: 2,
                                bgcolor: "white",
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.neutral.gray300,
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: colors.primary.blue,
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: colors.primary.blue,
                                    borderWidth: 2,
                                  },
                              }}
                            >
                              {!selectedClass ? (
                                <MenuItem disabled>
                                  Please select a class first
                                </MenuItem>
                              ) : isLoadingSections ? (
                                <MenuItem disabled>
                                  Loading sections...
                                </MenuItem>
                              ) : sections.length === 0 ? (
                                <MenuItem disabled>
                                  No sections available
                                </MenuItem>
                              ) : (
                                sections.map((section, index) => (
                                  <MenuItem
                                    key={
                                      section.sectionId || section.id || index
                                    }
                                    value={
                                      section.sectionName ||
                                      section.section ||
                                      section
                                    }
                                  >
                                    {section.sectionName ||
                                      section.section ||
                                      `Section ${index + 1}`}
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    )}

                    {isLoadingQuestions ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          minHeight: "200px",
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : isErrorQuestions ? (
                      <Alert severity="error">
                        {isErrorQuestions?.message ||
                          "Failed to load questions"}
                      </Alert>
                    ) : currentQuestions && currentQuestions.length > 0 ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3.5,
                        }}
                      >
                        {currentQuestions.map((question, index) => {
                          const options = parseOptions(question.options);
                          const userSelectedAnswer =
                            answers[question.questionId];
                          const apiSelectedAnswer = question.selectedOptionId
                            ? String(question.selectedOptionId)
                            : null;
                          const selectedAnswer =
                            userSelectedAnswer || apiSelectedAnswer;
                          const isExpanded =
                            expandedQuestions[question.questionId] ?? true;
                          const questionProgress = selectedAnswer ? 100 : 0;

                          return (
                            <Card
                              key={question.questionId}
                              elevation={1}
                              sx={{
                                borderRadius: 2,
                                border: "1px solid rgba(0,0,0,0.08)",
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                overflow: "hidden",
                                "&:hover": {
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                },
                              }}
                            >
                              {/* Question Header - Always Visible */}
                              <Box
                                onClick={() =>
                                  toggleQuestionExpansion(question.questionId)
                                }
                                sx={{
                                  p: 2.5,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  bgcolor: colors.background.primary,
                                  borderBottom: isExpanded
                                    ? `1px solid ${colors.neutral.gray200}`
                                    : "none",
                                  "&:hover": {
                                    bgcolor: colors.background.secondary,
                                  },
                                }}
                              >
                                <Chip
                                  label={`S${index + 1} Standard ${index + 1}`}
                                  size="small"
                                  sx={{
                                    bgcolor: colors.primary.blue,
                                    color: "white",
                                    fontWeight: 700,
                                    minWidth: "100px",
                                    height: "28px",
                                    fontSize: "0.75rem",
                                  }}
                                />
                                <Box sx={{ flex: 1 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 500,
                                      fontSize: "0.875rem",
                                      color: colors.text.primary,
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {getQuestionText(question)}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  {/* Circular Progress */}
                                  <Box
                                    sx={{
                                      position: "relative",
                                      display: "inline-flex",
                                    }}
                                  >
                                    <CircularProgress
                                      variant="determinate"
                                      value={questionProgress}
                                      size={40}
                                      thickness={4}
                                      sx={{
                                        color:
                                          getProgressColor(questionProgress),
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
                                          fontSize: "0.65rem",
                                          fontWeight: 600,
                                          color: colors.text.secondary,
                                        }}
                                      >
                                        {questionProgress}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    sx={{
                                      color: colors.text.secondary,
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ExpandLess />
                                    ) : (
                                      <ExpandMore />
                                    )}
                                  </IconButton>
                                </Box>
                              </Box>

                              {/* Question Content - Expandable */}
                              {isExpanded && (
                                <CardContent sx={{ p: 3, pt: 2.5 }}>
                                  {question.isClassroomObservation === 1 &&
                                    question.observationCount && (
                                      <Chip
                                        label={`Observation Count: ${question.observationCount}`}
                                        size="small"
                                        sx={{
                                          bgcolor:
                                            colors.semantic.warning + "20",
                                          color: colors.semantic.warning,
                                          fontWeight: 600,
                                          fontSize: "0.75rem",
                                          mb: 2.5,
                                        }}
                                      />
                                    )}

                                  {options && options.length > 0 && (
                                    <FormControl
                                      component="fieldset"
                                      fullWidth
                                      sx={{ mb: 3 }}
                                    >
                                      <RadioGroup
                                        value={selectedAnswer || ""}
                                        onChange={(e) =>
                                          handleAnswerChange(
                                            question.questionId,
                                            e.target.value
                                          )
                                        }
                                      >
                                        {options.map((option, optIndex) => (
                                          <FormControlLabel
                                            key={option.optionId || optIndex}
                                            value={String(option.optionId)}
                                            control={
                                              <Radio
                                                sx={{
                                                  color: colors.primary.blue,
                                                  "&.Mui-checked": {
                                                    color: colors.primary.blue,
                                                  },
                                                }}
                                              />
                                            }
                                            label={
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1,
                                                }}
                                              >
                                                <Chip
                                                  label={String.fromCharCode(
                                                    65 + optIndex
                                                  )}
                                                  size="small"
                                                  sx={{
                                                    bgcolor:
                                                      colors.primary.lightest,
                                                    color: colors.primary.blue,
                                                    fontWeight: 600,
                                                    minWidth: "28px",
                                                    height: "28px",
                                                  }}
                                                />
                                                <Typography variant="body2">
                                                  {getOptionText(option)}
                                                </Typography>
                                              </Box>
                                            }
                                            sx={{
                                              mb: 1.5,
                                              p: 2,
                                              borderRadius: 2,
                                              bgcolor:
                                                selectedAnswer ===
                                                String(option.optionId)
                                                  ? colors.primary.lightest
                                                  : "transparent",
                                              border: "1.5px solid",
                                              borderColor:
                                                selectedAnswer ===
                                                String(option.optionId)
                                                  ? colors.primary.blue
                                                  : colors.neutral.gray200,
                                              transition: "all 0.2s ease",
                                              "&:hover": {
                                                bgcolor:
                                                  colors.primary.lightest +
                                                  "80",
                                                borderColor:
                                                  colors.primary.blue,
                                              },
                                            }}
                                          />
                                        ))}
                                      </RadioGroup>
                                    </FormControl>
                                  )}

                                  {/* Submit Button for Individual Question */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      pt: 2.5,
                                      borderTop: `1px solid ${colors.neutral.gray200}`,
                                    }}
                                  >
                                    <Button
                                      variant="contained"
                                      onClick={() =>
                                        handleSubmitQuestion(question)
                                      }
                                      disabled={
                                        !selectedAnswer ||
                                        submitAnswerMutation.isPending
                                      }
                                      sx={{
                                        bgcolor: colors.accent.green,
                                        "&:hover": {
                                          bgcolor: colors.accent.greenDark,
                                        },
                                        "&:disabled": {
                                          bgcolor: colors.neutral.gray300,
                                          color: colors.neutral.gray600,
                                        },
                                        textTransform: "none",
                                        fontWeight: 600,
                                        px: 3,
                                        py: 1,
                                        borderRadius: 2,
                                      }}
                                    >
                                      {submitAnswerMutation.isPending
                                        ? "Submitting..."
                                        : "Save Answer"}
                                    </Button>
                                  </Box>
                                </CardContent>
                              )}
                            </Card>
                          );
                        })}

                        {/* Submit Button */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 2,
                            mt: 4,
                            pt: 3.5,
                            borderTop: `1.5px solid ${colors.neutral.gray200}`,
                          }}
                        >
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSelectedDomain(null);
                              setSelectedSubdomain(null);
                              setAnswers({});
                            }}
                            sx={{
                              borderColor: colors.primary.blue,
                              color: colors.primary.blue,
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            endIcon={<ArrowForward />}
                            onClick={handleSubmit}
                            disabled={
                              submitSubdomainWiseAnswersMutation.isPending ||
                              Object.keys(answers).length === 0 ||
                              (classBasedQuestions.length > 0 &&
                                questionBatch === 0 &&
                                (!selectedClass || !selectedSection))
                            }
                            sx={{
                              bgcolor: colors.accent.green,
                              "&:hover": { bgcolor: colors.accent.greenDark },
                              "&:disabled": {
                                bgcolor: colors.neutral.gray300,
                                color: colors.neutral.gray600,
                              },
                            }}
                          >
                            {submitSubdomainWiseAnswersMutation.isPending
                              ? "Saving..."
                              : "Save Assessment"}
                          </Button>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          No {questionBatch === 0 ? "class-based" : "general"}{" "}
                          questions available for this subdomain
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}

              {/* Domain View - When Domain Selected but No Subdomain */}
              {selectedDomain && !selectedSubdomain && (
                <Paper
                  elevation={2}
                  sx={{
                    flex: 1,
                    borderRadius: 3,
                    bgcolor: "white",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
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
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.75rem",
                        mb: 1.5,
                        display: "block",
                      }}
                    >
                      D{selectedDomain.domainId}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        mb: 2,
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
                          {getDomainName(selectedDomain)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          Assessment of{" "}
                          {getDomainName(selectedDomain).toLowerCase()}
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
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <CircularProgress
                            variant="determinate"
                            value={getDomainProgress(selectedDomain)}
                            size={40}
                            thickness={4}
                            sx={{
                              color: getProgressColor(
                                getDomainProgress(selectedDomain)
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
                            {Math.round(getDomainProgress(selectedDomain))}%
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
                        {selectedDomain.subDomain.map((subdomain, index) => {
                          const subdomainId =
                            subdomain.subDomainId || subdomain.id;
                          const subdomainProgress =
                            getSubdomainProgress(subdomain);

                          return (
                            <Card
                              key={subdomainId}
                              onClick={() => handleSubdomainSelect(subdomain)}
                              elevation={1}
                              sx={{
                                cursor: "pointer",
                                transition: "all 0.3s ease",
                                border: "1.5px solid",
                                borderColor: colors.neutral.gray200,
                                borderRadius: 2,
                                bgcolor: colors.background.primary,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                  borderColor: colors.primary.blue,
                                  bgcolor: colors.primary.lightest + "40",
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
                                    <Chip
                                      label={`SD${selectedDomain.domainId}.${
                                        index + 1
                                      }`}
                                      size="small"
                                      sx={{
                                        bgcolor: colors.accent.green,
                                        color: "white",
                                        fontWeight: 700,
                                        minWidth: "80px",
                                        height: "28px",
                                        fontSize: "0.75rem",
                                      }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontWeight: 600,
                                          color: colors.text.primary,
                                          fontSize: "0.9375rem",
                                        }}
                                      >
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
                                            getProgressColor(subdomainProgress),
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
                                          {Math.round(subdomainProgress)}%
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: "center", py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          No subdomains available for this domain
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}

              {/* Empty State - No Domain Selected */}
              {!selectedDomain && (
                <Paper
                  elevation={2}
                  sx={{
                    flex: 1,
                    borderRadius: 3,
                    bgcolor: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "400px",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Assessment
                      sx={{
                        fontSize: 64,
                        color: colors.neutral.gray300,
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{ color: colors.text.secondary, mb: 1 }}
                    >
                      Select a Domain
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Choose a domain from the left panel to view subdomains
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SelfAssessment;
