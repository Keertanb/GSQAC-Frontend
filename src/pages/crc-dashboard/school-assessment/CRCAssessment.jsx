import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
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
  Language,
  Create,
  LocationOn,
  AccountTree,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import {
  useGetDomainsQuery,
  useGetSubdomainQuestionsQuery,
} from "../../../services/crcService";
import {
  useSubmitAnswerMutation,
  useGetClassWiseSubjectsQuery,
} from "../../../services/adminService";
import { getRoleId } from "../../../constants/roles";
import { queryKeys } from "../../../config/queryClient";
import AppDrawer from "../../../components/AppDrawer/AppDrawer";
import { DRAWER_WIDTH } from "../../../constants/menuItems";
import useAuthStore from "../../../store/useAuthStore";
import { useLogoutMutation } from "../../../services/authService";
import { enqueueSnackbar } from "notistack";
import {
  useGetSchoolDataQuery,
  useGetSchoolSectionsQuery,
  useSubmitSubdomainWiseAnswersMutation,
  useSubmitAssessmentMutation,
  useGetSchoolGradesQuery,
} from "../../../services/crcService";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CRCAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolId: paramSchoolId } = useParams();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const { logout, user, userId } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState("gu");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [answers, setAnswers] = useState({});
  const [subdomainAnswers, setSubdomainAnswers] = useState({});
  const [classWiseAnswers, setClassWiseAnswers] = useState({});
  const [classWiseTextAnswers, setClassWiseTextAnswers] = useState({}); // Store text answers per class
  const [selectedClassGroup, setSelectedClassGroup] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textAnswers, setTextAnswers] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pendingFinalSubmit, setPendingFinalSubmit] = useState(false);

  // Get school info from location state or use paramSchoolId
  const schoolFromState = location.state?.school;
  const schoolCode = schoolFromState?.schoolCode || paramSchoolId;

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

  const roleId = getRoleId("crc");

  const queryClient = useQueryClient();

  // Get schoolId from URL params
  const schoolId = paramSchoolId;

  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isError: isErrorDomains,
    refetch: refetchDomains,
  } = useGetDomainsQuery({
    roleId,
    userId: userId ? Number(userId) : undefined,
    languageCode,
    schoolId,
    enabled: true,
  });

  // Fetch all questions (without class filter) for counting purposes
  const { data: allQuestionsData } = useGetSubdomainQuestionsQuery({
    subDomainId: selectedSubdomain?.subDomainId || selectedSubdomain?.id,
    roleId,
    languageCode,
    userId: userId ? Number(userId) : undefined,
    schoolId: schoolId,
    enabled: !!selectedSubdomain,
  });

  // Check if there are subject-wise questions (type 3) in the current subdomain
  const hasSubjectWiseQuestions = useMemo(() => {
    if (!allQuestionsData) return false;
    const questions =
      allQuestionsData?.data?.data ||
      (Array.isArray(allQuestionsData?.data) ? allQuestionsData.data : []);
    return questions.some(
      (q) => q.questionType === 3 || q.questionType === "3"
    );
  }, [allQuestionsData]);

  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
    isError: isErrorQuestions,
    refetch: refetchQuestions,
  } = useGetSubdomainQuestionsQuery({
    subDomainId: selectedSubdomain?.subDomainId || selectedSubdomain?.id,
    roleId,
    languageCode,
    // Only send cls and section when they are explicitly selected
    ...(selectedClass && { classNumber: Number(selectedClass) }),
    ...(selectedSection && { section: selectedSection }),
    // Only send subjectId for subject-wise questions when subject is selected
    ...(hasSubjectWiseQuestions &&
      selectedSubject && { subjectId: Number(selectedSubject) }),
    userId: userId ? Number(userId) : undefined,
    schoolId: schoolId,
    enabled: !!selectedSubdomain,
  });

  const { data: schoolDataResponse, isLoading: isLoadingSchoolData } =
    useGetSchoolDataQuery({
      userName: schoolCode || undefined,
      enabled: !!schoolCode,
    });

  const schoolData = schoolDataResponse?.data || {};

  // Fetch school grades for FLN questions
  const { data: gradesData, isLoading: isLoadingGrades } =
    useGetSchoolGradesQuery({
      schoolId: schoolCode || undefined,
      enabled: !!schoolCode,
    });

  // Parse grades data to get student counts by class
  const gradesCounts = useMemo(() => {
    if (!gradesData?.data) return {};
    const counts = {};
    gradesData.data.forEach((grade) => {
      counts[grade.stdClass] = grade.count;
    });
    return counts;
  }, [gradesData]);

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

  // Filter class options based on selected class group
  const filteredClassOptions = useMemo(() => {
    if (!selectedClassGroup) {
      return classOptions;
    }

    let minClass, maxClass;
    if (selectedClassGroup === "1-2") {
      minClass = 1;
      maxClass = 2;
    } else if (selectedClassGroup === "3-5") {
      minClass = 3;
      maxClass = 5;
    } else if (selectedClassGroup === "6-8") {
      minClass = 6;
      maxClass = 8;
    }

    return classOptions.filter((cls) => cls >= minClass && cls <= maxClass);
  }, [classOptions, selectedClassGroup]);

  // Reset class when class group changes
  useEffect(() => {
    if (selectedClassGroup) {
      setSelectedClass(null);
    }
  }, [selectedClassGroup]);

  // Note: Removed auto-selection of class group and class to prevent
  // sending default cls/section parameters for General Questions

  // Fetch all school sections once
  const { data: sectionsData, isLoading: isLoadingSections } =
    useGetSchoolSectionsQuery({
      schoolId: schoolCode || undefined,
      enabled: !!schoolCode,
    });

  // Fetch class-wise subjects when class is selected
  const { data: subjectsData, isLoading: isLoadingSubjects } =
    useGetClassWiseSubjectsQuery({
      classId: selectedClass ? Number(selectedClass) : undefined,
      enabled: !!selectedClass,
    });

  // Extract sections from API response - sections are grouped by classId
  const sections = useMemo(() => {
    if (!sectionsData || !selectedClass) return [];

    const classKey = String(selectedClass);

    if (sectionsData.data && sectionsData.data[classKey]) {
      return sectionsData.data[classKey];
    }

    return [];
  }, [sectionsData, selectedClass]);

  // Note: Removed auto-selection of section to prevent
  // sending default section parameter for General Questions

  // Extract subjects from API response - handle both array and object formats
  const subjects = useMemo(() => {
    if (!subjectsData) return [];
    // If data is an array, return it directly
    if (Array.isArray(subjectsData.data)) {
      return subjectsData.data;
    }
    // If data itself is an array
    if (Array.isArray(subjectsData)) {
      return subjectsData;
    }
    return [];
  }, [subjectsData]);

  // Note: Removed auto-selection of subject to allow manual selection only

  const domains = domainsData?.data || [];
  const isPublished = domainsData?.isPublished || false;

  // Extract and store sessionId from domains API response
  useEffect(() => {
    if (domainsData?.sessionId !== undefined) {
      const newSessionId = domainsData.sessionId;
      setSessionId(newSessionId);
      // If we have a pending final submit and now have sessionId, submit final
      if (pendingFinalSubmit && newSessionId) {
        const finalPayload = {
          sessionId: newSessionId,
          userId: Number(userId),
          roleId: Number(roleId),
          schoolId: schoolId,
          isSubmitted: 1,
        };
        submitAssessmentMutation.mutate(finalPayload);
        setPendingFinalSubmit(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainsData?.sessionId, pendingFinalSubmit]);
  const endDate = domainsData?.endDate || null;
  const isSubmitted = domainsData?.isSubmitted || false;

  // All questions for counting (unfiltered by class)
  const allQuestionsForCount = useMemo(() => {
    if (
      allQuestionsData?.data?.data &&
      Array.isArray(allQuestionsData.data.data)
    ) {
      return allQuestionsData.data.data;
    }
    if (allQuestionsData?.data && Array.isArray(allQuestionsData.data)) {
      return allQuestionsData.data;
    }
    return [];
  }, [allQuestionsData?.data]);

  const allQuestions = useMemo(() => {
    if (questionsData?.data?.data && Array.isArray(questionsData.data.data)) {
      return questionsData.data.data;
    }
    if (questionsData?.data && Array.isArray(questionsData.data)) {
      return questionsData.data;
    }
    return [];
  }, [questionsData?.data]);

  // Questions for counting (unfiltered)
  const singleChoiceQuestionsForCount = allQuestionsForCount.filter(
    (q) => q.questionType === 1 || q.questionType === "1"
  );
  const classroomObservationQuestionsForCount = allQuestionsForCount.filter(
    (q) => q.questionType === 2 || q.questionType === "2"
  );
  const subjectObservationQuestionsForCount = allQuestionsForCount.filter(
    (q) => q.questionType === 3 || q.questionType === "3"
  );
  // FLN questions for counting - deduplicate by questionId
  const flnQuestionsForCount = allQuestionsForCount
    .filter((q) => q.questionType === 4 || q.questionType === "4")
    .reduce((unique, question) => {
      if (!unique.find((q) => q.questionId === question.questionId)) {
        unique.push(question);
      }
      return unique;
    }, []);
  const generalQuestionsForCount = allQuestionsForCount.filter((q) => {
    if (q.questionType) {
      return q.questionType === 1 || q.questionType === "1";
    }
    return q.isClassroomObservation !== 1 || q.isClassroomObservation == null;
  });

  // Questions for display (filtered by class/section)
  const singleChoiceQuestions = allQuestions.filter(
    (q) => q.questionType === 1 || q.questionType === "1"
  );
  const classroomObservationQuestions = allQuestions.filter(
    (q) => q.questionType === 2 || q.questionType === "2"
  );
  const subjectObservationQuestions = allQuestions.filter(
    (q) => q.questionType === 3 || q.questionType === "3"
  );
  // FLN questions - deduplicate by questionId since API returns one per class
  const flnQuestions = allQuestions
    .filter((q) => q.questionType === 4 || q.questionType === "4")
    .reduce((unique, question) => {
      if (!unique.find((q) => q.questionId === question.questionId)) {
        unique.push(question);
      }
      return unique;
    }, []);

  // Legacy support - if questionType is not set, use isClassroomObservation
  const classBasedQuestions = allQuestions.filter((q) => {
    if (q.questionType) {
      return (
        q.questionType === 2 ||
        q.questionType === "2" ||
        q.questionType === 3 ||
        q.questionType === "3"
      );
    }
    return q.isClassroomObservation === 1;
  });
  const generalQuestions = allQuestions.filter((q) => {
    if (q.questionType) {
      return q.questionType === 1 || q.questionType === "1";
    }
    return q.isClassroomObservation !== 1 || q.isClassroomObservation == null;
  });

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

  // Helper function to check if API answer should be shown based on question type and selected dropdowns
  const shouldShowApiAnswer = (question) => {
    const questionType =
      question.questionType ||
      (question.isClassroomObservation === 1 ? 2 : 1);

    if (questionType === 1 || questionType === "1") {
      // General questions - no dropdowns needed
      return true;
    } else if (questionType === 2 || questionType === "2") {
      // Classroom observation - needs class and section
      return !!selectedClass && !!selectedSection;
    } else if (questionType === 3 || questionType === "3") {
      // Subject observation - needs class, section, and subject
      return !!selectedClass && !!selectedSection && !!selectedSubject;
    } else if (questionType === 4 || questionType === "4") {
      // FLN questions - no dropdowns needed
      return true;
    }
    return false;
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

      // Save current answers to subdomainAnswers
      setSubdomainAnswers((prev) => ({
        ...prev,
        [currentSubdomainId]: { ...answers },
      }));

      // Save current answers to classWiseAnswers before switching
      if (selectedClass) {
        const classKey = String(selectedClass);
        const storageKey = `${currentSubdomainId}_${classKey}`;
        setClassWiseAnswers((prev) => ({
          ...prev,
          [storageKey]: { ...answers },
        }));
        setClassWiseTextAnswers((prev) => ({
          ...prev,
          [storageKey]: { ...textAnswers },
        }));
      }
    }

    const savedAnswers = subdomainAnswers[subdomainId] || {};
    setSelectedSubdomain(subdomain);
    setAnswers(savedAnswers);
    // Reset class group, class, section, and subject when switching subdomains
    setSelectedClassGroup(null);
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSubject(null);
    setTextAnswers({});
  };

  // Effect to handle class changes - reset section and subject
  useEffect(() => {
    if (!selectedSubdomain || !selectedClass) return;

    // Reset subject when class changes (since it's class-specific)
    setSelectedSubject(null);

    // Reset answers - they will be loaded from API if they exist
    setAnswers({});
    setTextAnswers({});
  }, [selectedClass, selectedSubdomain]);

  // Effect to load API answers when questions are fetched (API answers take priority)
  useEffect(() => {
    if (allQuestions && allQuestions.length > 0 && selectedSubdomain) {
      const apiAnswers = {};
      const apiTextAnswers = {};
      const flnAnswersMap = {}; // To group FLN answers by questionId

      allQuestions.forEach((question) => {
        const questionType =
          question.questionType ||
          (question.isClassroomObservation === 1 ? 2 : 1);

        // Check if required dropdowns are selected based on question type
        let shouldLoadAnswer = false;

        if (questionType === 1 || questionType === "1") {
          // General questions - no dropdowns needed
          shouldLoadAnswer = true;
        } else if (questionType === 2 || questionType === "2") {
          // Classroom observation - needs class and section
          shouldLoadAnswer = !!selectedClass && !!selectedSection;
        } else if (questionType === 3 || questionType === "3") {
          // Subject observation - needs class, section, and subject
          shouldLoadAnswer =
            !!selectedClass && !!selectedSection && !!selectedSubject;
        } else if (questionType === 4 || questionType === "4") {
          // FLN questions - no dropdowns needed
          shouldLoadAnswer = true;
        }

        // Only load answers if required dropdowns are selected
        if (!shouldLoadAnswer) {
          return;
        }

        // For FLN questions (type 4), group by questionId and std
        if (questionType === 4 || questionType === "4") {
          const qId = question.questionId;

          // Initialize map for this question if not exists
          if (!flnAnswersMap[qId]) {
            flnAnswersMap[qId] = {};
          }

          // Check if we have std (API format)
          if (question.std) {
            flnAnswersMap[qId][question.std] = {
              obtainedMarks:
                question.answerText !== null &&
                question.answerText !== undefined
                  ? String(question.answerText)
                  : "",
              answerId: question.answerId || null,
            };
          }
        } else if (question.selectedOptionId) {
          // For other questions, load selected option
          apiAnswers[question.questionId] = String(question.selectedOptionId);
        }
      });

      // Convert flnAnswersMap to JSON strings for textAnswers state
      Object.keys(flnAnswersMap).forEach((questionId) => {
        // Only add if there's actual data
        if (Object.keys(flnAnswersMap[questionId]).length > 0) {
          apiTextAnswers[questionId] = JSON.stringify(
            flnAnswersMap[questionId]
          );
        }
      });

      // API answers take priority - they override any locally saved answers
      if (Object.keys(apiAnswers).length > 0) {
        setAnswers(apiAnswers);

        // Also save to classWiseAnswers so it persists (if class is selected)
        if (selectedClass) {
          const subdomainId =
            selectedSubdomain.subDomainId || selectedSubdomain.id;
          const classKey = String(selectedClass);
          const storageKey = `${subdomainId}_${classKey}`;
          setClassWiseAnswers((prev) => ({
            ...prev,
            [storageKey]: apiAnswers,
          }));
        }
      }

      if (Object.keys(apiTextAnswers).length > 0) {
        setTextAnswers(apiTextAnswers);

        // Also save to classWiseTextAnswers (if class is selected)
        if (selectedClass) {
          const subdomainId =
            selectedSubdomain.subDomainId || selectedSubdomain.id;
          const classKey = String(selectedClass);
          const storageKey = `${subdomainId}_${classKey}`;
          setClassWiseTextAnswers((prev) => ({
            ...prev,
            [storageKey]: apiTextAnswers,
          }));
        }
      }
    }
  }, [allQuestions, selectedSubdomain, selectedClass, selectedSection, selectedSubject]);

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

      // Save to classWiseAnswers
      const classKey = selectedClass ? String(selectedClass) : "general";
      const storageKey = `${subdomainId}_${classKey}`;
      setClassWiseAnswers((prev) => ({
        ...prev,
        [storageKey]: newAnswers,
      }));
    }
  };

  // Handle text answer change for FLN questions
  const handleTextAnswerChange = (questionId, text) => {
    const newTextAnswers = {
      ...textAnswers,
      [questionId]: text,
    };
    setTextAnswers(newTextAnswers);

    // Save to classWiseTextAnswers
    if (selectedSubdomain) {
      const subdomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;
      const classKey = selectedClass ? String(selectedClass) : "general";
      const storageKey = `${subdomainId}_${classKey}`;
      setClassWiseTextAnswers((prev) => ({
        ...prev,
        [storageKey]: newTextAnswers,
      }));
    }
  };

  const submitAnswerMutation = useSubmitAnswerMutation({
    onSuccess: (data) => {
      // Refetch questions and domains to update progress bars
      refetchQuestions();
      refetchDomains();
      console.log("Answer submitted successfully:", data);
      enqueueSnackbar("Answer submitted successfully!", {
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error submitting answer:", error);
      enqueueSnackbar(
        error?.response?.data?.message ||
          "Failed to submit answer. Please try again.",
        {
          variant: "error",
        }
      );
    },
  });

  const submitSubdomainWiseAnswersMutation =
    useSubmitSubdomainWiseAnswersMutation({
      schoolId: schoolId,
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
        // If sessionId is null, create session by calling submit-assessment API
        if (sessionId === null) {
          const sessionPayload = {
            sessionId: null,
            userId: Number(userId),
            roleId: Number(roleId),
            schoolId: schoolId,
            isSubmitted: 0,
          };
          submitAssessmentMutation.mutate(sessionPayload);
        } else {
          // Refetch questions and domains to update progress bars
          refetchQuestions();
          refetchDomains();
        }
        // Optionally clear answers or navigate
        console.log("Subdomain answers submitted successfully:", data);
        enqueueSnackbar("All answers submitted successfully!", {
          variant: "success",
        });
      },
      onError: (error) => {
        console.error("Error submitting subdomain answers:", error);
        enqueueSnackbar(
          error?.response?.data?.message ||
            "Failed to submit answers. Please try again.",
          {
            variant: "error",
          }
        );
      },
    });

  const submitAssessmentMutation = useSubmitAssessmentMutation({
    onSuccess: (data, variables) => {
      console.log("Assessment submitted successfully:", data);
      
      // Check if this was a session creation (isSubmitted: 0)
      if (variables.isSubmitted === 0) {
        // Session creation - refetch domains to get the sessionId
        refetchDomains();
        enqueueSnackbar("Session created successfully!", {
          variant: "success",
        });
      } else {
        // Final submit (isSubmitted: 1) - close modal and invalidate queries
        setShowSubmitConfirmation(false);
        
        // Refetch domains to update progress and isSubmitted status
        refetchDomains();
        
        // Refetch questions if subdomain is selected
        if (selectedSubdomain) {
          refetchQuestions();
        }
        
        // Invalidate all CRC-related queries to refresh dashboard data
        queryClient.invalidateQueries({
          queryKey: ["crc"],
        });
        
        // Invalidate specific queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.crc.domains(roleId, languageCode, schoolId),
        });
        
        queryClient.invalidateQueries({
          queryKey: queryKeys.crc.schoolData(schoolCode),
        });
        
        queryClient.invalidateQueries({
          queryKey: queryKeys.crc.schoolSections(schoolCode),
        });
        
        enqueueSnackbar("Assessment submitted successfully!", {
          variant: "success",
        });
      }
    },
    onError: (error) => {
      console.error("Error submitting assessment:", error);
      // Close the confirmation modal
      setShowSubmitConfirmation(false);
      enqueueSnackbar(
        error?.response?.data?.message ||
          "Failed to submit assessment. Please try again.",
        {
          variant: "error",
        }
      );
    },
  });

  // Handler to open confirmation modal for final submit
  const handleOpenSubmitConfirmation = () => {
    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }
    setShowSubmitConfirmation(true);
  };

  // Handler to confirm final submit
  const handleConfirmSubmit = () => {
    // If sessionId is null, create session first
    if (sessionId === null) {
      // Set flag to submit final after session is created
      setPendingFinalSubmit(true);
      
      // First create session with isSubmitted: 0
      const sessionPayload = {
        sessionId: null,
        userId: Number(userId),
        roleId: Number(roleId),
        schoolId: schoolId,
        isSubmitted: 0,
      };
      
      // Submit session creation
      submitAssessmentMutation.mutate(sessionPayload);
    } else {
      // Session already exists, submit final
      const payload = {
        sessionId: sessionId,
        userId: Number(userId),
        roleId: Number(roleId),
        schoolId: schoolId,
        isSubmitted: 1,
      };
      submitAssessmentMutation.mutate(payload);
    }
  };

  const allDomainsComplete = useMemo(() => {
    if (!domains || domains.length === 0) return false;
    return domains.every((domain) => {
      const progress = getDomainProgress(domain);
      return Math.round(progress) === 100;
    });
  }, [domains, getDomainProgress]);

  // Prepare chart data for bar graph
  const chartData = useMemo(() => {
    if (!domains || domains.length === 0) return [];
    return domains.map((domain, index) => {
      const progress = getDomainProgress(domain);
      const roundedProgress = Math.round(progress);
      return {
        name: `${index + 1}. ${getDomainName(domain)}`,
        progress: roundedProgress,
        domainId: domain.domainId,
        color: getProgressColor(progress),
      };
    });
  }, [domains]);

  // Calculate total answered and total questions
  const { totalAnswered, totalQuestions } = useMemo(() => {
    const total = allQuestionsForCount.length;
    const answered = allQuestionsForCount.filter((q) => {
      const questionType =
        q.questionType || (q.isClassroomObservation === 1 ? 2 : 1);
      // For FLN questions (type 4), check if JSON has valid data
      if (questionType === 4 || questionType === "4") {
        const textAnswer = textAnswers[q.questionId];
        if (!textAnswer) return false;
        try {
          const flnData = JSON.parse(textAnswer);
          // Check if at least one class has an answer
          return Object.keys(flnData).some(
            (key) => flnData[key] && flnData[key].obtainedMarks
          );
        } catch (e) {
          return false;
        }
      }
      // For other questions, check if option is selected
      // Only count API answer if required dropdowns are selected
      const apiAnswer = shouldShowApiAnswer(q) && q.selectedOptionId
        ? q.selectedOptionId
        : null;
      return answers[q.questionId] || apiAnswer;
    }).length;
    return { totalAnswered: answered, totalQuestions: total };
  }, [allQuestionsForCount, answers, textAnswers]);

  // Get domain and subdomain indices for numbering
  const { domainNumber, subdomainNumber } = useMemo(() => {
    if (!selectedDomain || !selectedSubdomain) {
      return { domainNumber: 0, subdomainNumber: 0 };
    }

    const domainIdx = domains.findIndex(
      (d) => d.domainId === selectedDomain.domainId
    );
    const subdomainIdx = selectedDomain.subDomain?.findIndex(
      (sd) =>
        (sd.subDomainId || sd.id) ===
        (selectedSubdomain.subDomainId || selectedSubdomain.id)
    );

    return {
      domainNumber: domainIdx + 1,
      subdomainNumber: subdomainIdx + 1,
    };
  }, [selectedDomain, selectedSubdomain, domains]);

  // Handle individual question submission
  const handleSubmitQuestion = (question) => {
    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }

    const questionType =
      question.questionType || (question.isClassroomObservation === 1 ? 2 : 1);

    // For FLN questions (type 4), validate text answer
    if (questionType === 4 || questionType === "4") {
      const textAnswer = textAnswers[question.questionId];
      if (!textAnswer) {
        enqueueSnackbar("Please enter an answer before submitting.", {
          variant: "warning",
        });
        return;
      }
      // Validate that at least one class has an answer
      try {
        const flnData = JSON.parse(textAnswer);
        const hasAnswer = Object.keys(flnData).some(
          (key) => flnData[key] && flnData[key].obtainedMarks
        );
        if (!hasAnswer) {
          enqueueSnackbar("Please enter marks for at least one class.", {
            variant: "warning",
          });
          return;
        }
      } catch (e) {
        enqueueSnackbar("Invalid answer format. Please try again.", {
          variant: "error",
        });
        return;
      }
    } else {
      // For other question types, validate option selection
      const userSelectedOption = answers[question.questionId];
      const apiSelectedOption =
        shouldShowApiAnswer(question) && question.selectedOptionId
          ? String(question.selectedOptionId)
          : null;
      const selectedOptionId = userSelectedOption || apiSelectedOption;

      if (!selectedOptionId) {
        enqueueSnackbar("Please select an option before submitting.", {
          variant: "warning",
        });
        return;
      }
    }

    let classValue = 2; // Default
    let sectionValue = "general"; // Default
    let subjectId = null;

    // For classroom observation (type 2) and subject observation (type 3)
    if (
      questionType === 2 ||
      questionType === "2" ||
      questionType === 3 ||
      questionType === "3"
    ) {
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

      // For subject observation (type 3), subject is required
      if (questionType === 3 || questionType === "3") {
        if (!selectedSubject) {
          enqueueSnackbar("Please select a subject before submitting.", {
            variant: "warning",
          });
          return;
        }
        subjectId = Number(selectedSubject);
      }
    }

    const payload = {
      isAns: 1,
      answerId: question.answerId || null,
      questionId: question.questionId,
      userId: Number(userId),
      subjectId: subjectId,
      optionId:
        questionType === 4 || questionType === "4"
          ? null
          : Number(
              answers[question.questionId] ||
                (shouldShowApiAnswer(question) && question.selectedOptionId
                  ? question.selectedOptionId
                  : null)
            ),
      obtainedMarks:
        questionType === 4 || questionType === "4"
          ? textAnswers[question.questionId]
          : null,
      cls: classValue,
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

    // Check if there are any answers (either option-based or text-based)
    const hasAnswers =
      (answers && Object.keys(answers).length > 0) ||
      (textAnswers && Object.keys(textAnswers).length > 0);

    if (!hasAnswers) {
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
    const hasSubjectQuestions = subjectObservationQuestions.length > 0;

    // Check if user has answered any subject observation questions (type 3)
    const hasAnsweredSubjectQuestions = subjectObservationQuestions.some(
      (q) => answers[q.questionId] || textAnswers[q.questionId]
    );

    if (hasClassBasedQuestions) {
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

    // For subject observation questions, only validate subject if user has answered type 3 questions
    if (hasAnsweredSubjectQuestions && !selectedSubject) {
      enqueueSnackbar("Please select a subject before submitting.", {
        variant: "warning",
      });
      return;
    }

    let clsValue = null;
    let sectionValue = null;
    const isClassSelected = hasClassBasedQuestions && selectedClass;

    if (isClassSelected) {
      // Class-based questions - use selected class and section
      clsValue = Number(selectedClass);
      sectionValue = selectedSection || null;
    }
    // For General questions or FLN questions, clsValue and sectionValue remain null

    // Format answers array from current answers state
    const answersArray = [];

    allQuestions.forEach((question) => {
      const questionType =
        question.questionType ||
        (question.isClassroomObservation === 1 ? 2 : 1);

      // For FLN questions (type 4), create separate answer objects for each class
      if (questionType === 4 || questionType === "4") {
        const textAnswer = textAnswers[question.questionId];
        if (textAnswer) {
          try {
            const flnData = JSON.parse(textAnswer);
            // Create separate answer objects for class 2 and 3
            [2, 3].forEach((classNum) => {
              if (flnData[classNum] && flnData[classNum].obtainedMarks) {
                answersArray.push({
                  answerId: flnData[classNum].answerId || null, // Use class-specific answerId
                  questionId: question.questionId,
                  optionId: null,
                  obtainedMarks: {
                    answerText: Number(flnData[classNum].obtainedMarks),
                    std: classNum,
                  },
                });
              }
            });
          } catch (e) {
            console.error("Error parsing FLN answer:", e);
          }
        }
      } else {
        // For other question types, check if option is selected
        const userSelectedAnswer = answers[question.questionId];
        const apiSelectedAnswer =
          shouldShowApiAnswer(question) && question.selectedOptionId
            ? String(question.selectedOptionId)
            : null;
        const selectedOptionId = userSelectedAnswer || apiSelectedAnswer;

        if (selectedOptionId) {
          answersArray.push({
            answerId: question.answerId || null,
            questionId: question.questionId,
            optionId: Number(selectedOptionId),
            obtainedMarks: null,
          });
        }
      }
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
      userId: Number(userId),
      cls: clsValue,
      section: sectionValue,
      subjectId: selectedSubject ? Number(selectedSubject) : null,
      answers: answersArray,
    };

    submitSubdomainWiseAnswersMutation.mutate(payload);
  };

  // Show loading while fetching domains
  if (isLoadingDomains) {
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
  console.log(isPublished, endDate, "answersanswersanswers");
  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", mt: 0, ml: 0 }}>
            {/* School Details Card */}
            {schoolFromState && (
              <Box
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: colors.background.secondary,
                  border: `1px solid ${colors.neutral.gray200}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flex: 1,
                    minWidth: 180,
                  }}
                >
                  <SchoolIcon
                    sx={{
                      fontSize: 18,
                      color: colors.primary.blue,
                    }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: colors.text.primary,
                        fontSize: "0.875rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {schoolFromState.schoolName || "N/A"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.6875rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {schoolFromState.schoolId || "N/A"}
                    </Typography>
                  </Box>
                </Box>
                {schoolFromState.districtName && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <LocationOn
                      sx={{
                        fontSize: 14,
                        color: colors.text.secondary,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.75rem",
                      }}
                    >
                      {schoolFromState.districtName}
                    </Typography>
                  </Box>
                )}
                {schoolFromState.blockName && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <LocationOn
                      sx={{
                        fontSize: 14,
                        color: colors.text.secondary,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.75rem",
                      }}
                    >
                      {schoolFromState.blockName}
                    </Typography>
                  </Box>
                )}
                {schoolFromState.clusterName && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <AccountTree
                      sx={{
                        fontSize: 14,
                        color: colors.text.secondary,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.75rem",
                      }}
                    >
                      {schoolFromState.clusterName}
                    </Typography>
                  </Box>
                )}
                {schoolFromState.villageName && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <LocationOn
                      sx={{
                        fontSize: 14,
                        color: colors.text.secondary,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.text.secondary,
                        fontSize: "0.75rem",
                      }}
                    >
                      {schoolFromState.villageName}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 3,
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
                        color:
                          isSubmitted === 1 || isSubmitted === true
                            ? colors.semantic.error
                            : colors.semantic.warning,
                        fontWeight: 600,
                        fontSize: "0.875rem",
                      }}
                    >
                      {isSubmitted === 1 || isSubmitted === true
                        ? `The assessment submission time is ended and closed on ${endDate}`
                        : `Submit all questions before ${endDate}`}
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
                    Failed to load assessment. Please check your connection or
                    contact administrator.
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
                sx={{
                  width: { xs: "100%", md: "380px" },
                  minWidth: { md: "380px" },
                  borderRadius: 3,
                  bgcolor: "white",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  maxHeight: "calc(100vh - 200px)",
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
                    {t("selfAssessment.assessmentDomains")}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.8125rem" }}
                  >
                    {t("selfAssessment.navigateSubtitle")}
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
                      {domains.map((domain, domainIndex) => {
                        const progress = getDomainProgress(domain);
                        const isDomainSelected =
                          selectedDomain?.domainId === domain.domainId;
                        const DomainIcon = getDomainIcon(domain);
                        const domainNumber = domainIndex + 1;

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

                            {/* Show Subdomains when domain is selected */}
                            {isDomainSelected &&
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
                                          key={subdomainId}
                                          onClick={() =>
                                            handleSubdomainSelect(subdomain)
                                          }
                                          sx={{
                                            cursor: "pointer",
                                            mb: 1.2,
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
                                              borderColor: colors.primary.blue,
                                              bgcolor:
                                                colors.primary.blue + "08",
                                            },
                                          }}
                                        >
                                          <CardContent
                                            sx={{
                                              p: 1.2,
                                              "&:last-child": { pb: 1.2 },
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
                                                    65 + (subdomainIndex % 26)
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
                                                  {getSubdomainName(subdomain)}
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
                                                        subdomainProgress
                                                      ),
                                                    fontWeight: 600,
                                                  }}
                                                >
                                                  {Math.round(
                                                    subdomainProgress
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
                                                  "& .MuiLinearProgress-bar": {
                                                    borderRadius: 2,
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
                                    }
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

                {/* Final Submit Button */}
                {isPublished && !isSubmitted && (
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
                        !allDomainsComplete
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

              {/* Right Panel - Questions */}
              {selectedSubdomain && (
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
                        ? `${domainNumber}. ${getDomainName(
                            selectedDomain
                          )} / ${domainNumber}.${subdomainNumber}. ${getSubdomainName(
                            selectedSubdomain
                          )}`
                        : ""}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: colors.text.primary,
                          mb: 0.5,
                        }}
                      >
                        {domainNumber}.{subdomainNumber}.{" "}
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
                  </Box>

                  {/* Questions Content */}
                  <Box
                    sx={{
                      flex: 1,
                      overflowY: "auto",
                      p: { xs: 2.5, md: 3.5 },
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

                    {/* Classroom Observation Questions Section (Type 2) */}
                    {classroomObservationQuestions.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        {/* Section Header */}
                        <Box
                          sx={{
                            mb: 3,
                            pb: 2,
                            borderBottom: `2px solid ${colors.neutral.gray200}`,
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
                            <Class
                              sx={{ fontSize: 24, color: colors.primary.blue }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: colors.text.primary,
                              }}
                            >
                              Classroom Observation Questions
                            </Typography>
                            <Chip
                              label={`${
                                classroomObservationQuestionsForCount.filter(
                                  (q) =>
                                    answers[q.questionId] ||
                                    textAnswers[q.questionId]
                                ).length
                              }/${
                                classroomObservationQuestionsForCount.length
                              } answered`}
                              size="small"
                              sx={{
                                bgcolor: colors.primary.blue + "15",
                                color: colors.primary.blue,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.text.secondary,
                              fontSize: "0.875rem",
                            }}
                          >
                            These questions require classroom observation and
                            class selection
                          </Typography>
                        </Box>

                        {/* Class and Section Dropdowns */}
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
                            Select Class Group, Class and Section
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Class Group Dropdown */}
                            <FormControl
                              size="small"
                              sx={{
                                minWidth: { xs: "100%", sm: "150px" },
                              }}
                            >
                              <InputLabel
                                sx={{
                                  fontWeight: 600,
                                  color: colors.text.secondary,
                                }}
                              >
                                Class Group
                              </InputLabel>
                              <Select
                                value={selectedClassGroup || ""}
                                onChange={(e) =>
                                  setSelectedClassGroup(e.target.value)
                                }
                                label="Class Group"
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
                                <MenuItem value="1-2">Class 1-2</MenuItem>
                                <MenuItem value="3-5">Class 3-5</MenuItem>
                                <MenuItem value="6-8">Class 6-8</MenuItem>
                              </Select>
                            </FormControl>

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
                                  // Save current answers before changing class
                                  if (selectedSubdomain && selectedClass) {
                                    const subdomainId =
                                      selectedSubdomain.subDomainId ||
                                      selectedSubdomain.id;
                                    const classKey = String(selectedClass);
                                    const storageKey = `${subdomainId}_${classKey}`;
                                    setClassWiseAnswers((prev) => ({
                                      ...prev,
                                      [storageKey]: { ...answers },
                                    }));
                                    setClassWiseTextAnswers((prev) => ({
                                      ...prev,
                                      [storageKey]: { ...textAnswers },
                                    }));
                                  }
                                  setSelectedClass(e.target.value);
                                  // Reset section so it can be auto-selected for the new class
                                  setSelectedSection(null);
                                }}
                                label="Select Class"
                                disabled={
                                  isLoadingSchoolData ||
                                  filteredClassOptions.length === 0
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
                                  <MenuItem disabled>
                                    Loading classes...
                                  </MenuItem>
                                ) : filteredClassOptions.length === 0 ? (
                                  <MenuItem disabled>
                                    {selectedClassGroup
                                      ? `No classes available in ${selectedClassGroup} range`
                                      : "Please select a class group first"}
                                  </MenuItem>
                                ) : (
                                  filteredClassOptions.map((classNum) => (
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
                                  !selectedClass || sections.length === 0
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
                                ) : sections.length === 0 ? (
                                  <MenuItem disabled>
                                    No sections available for this class
                                  </MenuItem>
                                ) : (
                                  sections.map((section, index) => (
                                    <MenuItem
                                      key={section.id || index}
                                      value={
                                        section.sectionName ||
                                        section.name ||
                                        section.value
                                      }
                                    >
                                      Section{" "}
                                      {section.sectionName ||
                                        section.name ||
                                        section.value}
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>

                        {/* Classroom Observation Questions List */}
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
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2.5,
                            }}
                          >
                            {classroomObservationQuestions.map(
                              (question, index) => {
                                const options = parseOptions(question.options);
                                const userSelectedAnswer =
                                  answers[question.questionId];
                                const apiSelectedAnswer =
                                  shouldShowApiAnswer(question) &&
                                  question.selectedOptionId
                                    ? String(question.selectedOptionId)
                                    : null;
                                const selectedAnswer =
                                  userSelectedAnswer || apiSelectedAnswer;
                                const isExpanded =
                                  expandedQuestions[question.questionId] ??
                                  true;
                                const questionProgress = selectedAnswer
                                  ? 100
                                  : 0;
                                const questionNumber = `${domainNumber}.${subdomainNumber}.${
                                  index + 1
                                }`;

                                return (
                                  <Card
                                    key={question.questionId}
                                    sx={{
                                      borderRadius: 2,
                                      border: "1px solid",
                                      borderColor: colors.neutral.gray200,
                                      transition: "all 0.2s ease",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                      overflow: "hidden",
                                      "&:hover": {
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                      },
                                    }}
                                  >
                                    {/* Question Header - Always Visible */}
                                    <Box
                                      onClick={() =>
                                        toggleQuestionExpansion(
                                          question.questionId
                                        )
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
                                        label={`Q ${questionNumber}`}
                                        size="small"
                                        sx={{
                                          bgcolor: colors.primary.dark,
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
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                            color: colors.text.primary,
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          {getQuestionText(question)}
                                        </Typography>
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

                                    {/* Question Content - Expandable */}
                                    {isExpanded && (
                                      <CardContent sx={{ p: 3, pt: 2.5 }}>
                                        {question.isClassroomObservation ===
                                          1 &&
                                          question.observationCount && (
                                            <Chip
                                              label={`Observation Count: ${question.observationCount}`}
                                              size="small"
                                              sx={{
                                                bgcolor:
                                                  colors.semantic.warning +
                                                  "20",
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
                                              {options.map(
                                                (option, optIndex) => (
                                                  <FormControlLabel
                                                    key={
                                                      option.optionId ||
                                                      optIndex
                                                    }
                                                    value={String(
                                                      option.optionId
                                                    )}
                                                    control={
                                                      <Radio
                                                        disabled={!isPublished || isSubmitted}
                                                        sx={{
                                                          color:
                                                            colors.primary.blue,
                                                          "&.Mui-checked": {
                                                            color:
                                                              colors.primary
                                                                .blue,
                                                          },
                                                        }}
                                                      />
                                                    }
                                                    label={
                                                      <Typography variant="body2">
                                                        {getOptionText(option)}
                                                      </Typography>
                                                    }
                                                    sx={{
                                                      mb: 1.5,
                                                      p: 2,
                                                      borderRadius: 2,
                                                      bgcolor:
                                                        selectedAnswer ===
                                                        String(option.optionId)
                                                          ? colors.primary
                                                              .lightest
                                                          : "transparent",
                                                      border: "1.5px solid",
                                                      borderColor:
                                                        selectedAnswer ===
                                                        String(option.optionId)
                                                          ? colors.primary.blue
                                                          : colors.neutral
                                                              .gray200,
                                                      transition:
                                                        "all 0.2s ease",
                                                      "&:hover": {
                                                        bgcolor:
                                                          colors.primary
                                                            .lightest + "80",
                                                        borderColor:
                                                          colors.primary.blue,
                                                      },
                                                    }}
                                                  />
                                                )
                                              )}
                                            </RadioGroup>
                                          </FormControl>
                                        )}
                                      </CardContent>
                                    )}
                                  </Card>
                                );
                              }
                            )}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Subject-Wise Observation Questions Section (Type 3) */}
                    {subjectObservationQuestions.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        {/* Section Header */}
                        <Box
                          sx={{
                            mb: 3,
                            pb: 2,
                            borderBottom: `2px solid ${colors.neutral.gray200}`,
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
                            <MenuBook
                              sx={{ fontSize: 24, color: colors.accent.purple }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: colors.text.primary,
                              }}
                            >
                              Subject-Wise Observation Questions
                            </Typography>
                            <Chip
                              label={`${
                                subjectObservationQuestionsForCount.filter(
                                  (q) =>
                                    answers[q.questionId] ||
                                    textAnswers[q.questionId]
                                ).length
                              }/${
                                subjectObservationQuestionsForCount.length
                              } answered`}
                              size="small"
                              sx={{
                                bgcolor: colors.accent.purple + "15",
                                color: colors.accent.purple,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.text.secondary,
                              fontSize: "0.875rem",
                            }}
                          >
                            These questions require subject-specific observation
                            and class, section, and subject selection
                          </Typography>
                        </Box>

                        {/* Class, Section, and Subject Dropdowns */}
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
                            Select Class Group, Class, Section, and Subject
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            {/* Class Group Dropdown */}
                            <FormControl
                              size="small"
                              sx={{
                                minWidth: { xs: "100%", sm: "150px" },
                              }}
                            >
                              <InputLabel
                                sx={{
                                  fontWeight: 600,
                                  color: colors.text.secondary,
                                }}
                              >
                                Class Group
                              </InputLabel>
                              <Select
                                value={selectedClassGroup || ""}
                                onChange={(e) =>
                                  setSelectedClassGroup(e.target.value)
                                }
                                label="Class Group"
                                sx={{
                                  borderRadius: 2,
                                  bgcolor: "white",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.neutral.gray300,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.accent.purple,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: colors.accent.purple,
                                      borderWidth: 2,
                                    },
                                }}
                              >
                                <MenuItem value="1-2">Class 1-2</MenuItem>
                                <MenuItem value="3-5">Class 3-5</MenuItem>
                                <MenuItem value="6-8">Class 6-8</MenuItem>
                              </Select>
                            </FormControl>

                            {/* Class Dropdown */}
                            <FormControl
                              size="small"
                              sx={{
                                minWidth: { xs: "100%", sm: "180px" },
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
                                  // Save current answers before changing class
                                  if (selectedSubdomain && selectedClass) {
                                    const subdomainId =
                                      selectedSubdomain.subDomainId ||
                                      selectedSubdomain.id;
                                    const classKey = String(selectedClass);
                                    const storageKey = `${subdomainId}_${classKey}`;
                                    setClassWiseAnswers((prev) => ({
                                      ...prev,
                                      [storageKey]: { ...answers },
                                    }));
                                    setClassWiseTextAnswers((prev) => ({
                                      ...prev,
                                      [storageKey]: { ...textAnswers },
                                    }));
                                  }
                                  setSelectedClass(e.target.value);
                                  // Reset section so it can be auto-selected for the new class
                                  setSelectedSection(null);
                                }}
                                label="Select Class"
                                disabled={
                                  isLoadingSchoolData ||
                                  filteredClassOptions.length === 0
                                }
                                sx={{
                                  borderRadius: 2,
                                  bgcolor: "white",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.neutral.gray300,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.accent.purple,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: colors.accent.purple,
                                      borderWidth: 2,
                                    },
                                }}
                              >
                                {isLoadingSchoolData ? (
                                  <MenuItem disabled>
                                    Loading classes...
                                  </MenuItem>
                                ) : filteredClassOptions.length === 0 ? (
                                  <MenuItem disabled>
                                    {selectedClassGroup
                                      ? `No classes available in ${selectedClassGroup} range`
                                      : "Please select a class group first"}
                                  </MenuItem>
                                ) : (
                                  filteredClassOptions.map((classNum) => (
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
                                minWidth: { xs: "100%", sm: "180px" },
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
                                  !selectedClass || sections.length === 0
                                }
                                sx={{
                                  borderRadius: 2,
                                  bgcolor: "white",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.neutral.gray300,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.accent.purple,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: colors.accent.purple,
                                      borderWidth: 2,
                                    },
                                }}
                              >
                                {!selectedClass ? (
                                  <MenuItem disabled>
                                    Please select a class first
                                  </MenuItem>
                                ) : sections.length === 0 ? (
                                  <MenuItem disabled>
                                    No sections available for this class
                                  </MenuItem>
                                ) : (
                                  sections.map((section, index) => (
                                    <MenuItem
                                      key={section.id || index}
                                      value={
                                        section.sectionName ||
                                        section.name ||
                                        section.value
                                      }
                                    >
                                      Section{" "}
                                      {section.sectionName ||
                                        section.name ||
                                        section.value}
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>

                            {/* Subject Dropdown */}
                            <FormControl
                              size="small"
                              sx={{
                                minWidth: { xs: "100%", sm: "180px" },
                              }}
                            >
                              <InputLabel
                                sx={{
                                  fontWeight: 600,
                                  color: colors.text.secondary,
                                }}
                              >
                                Select Subject
                              </InputLabel>
                              <Select
                                value={selectedSubject || ""}
                                onChange={(e) => {
                                  setSelectedSubject(e.target.value);
                                  // Refetch questions when subject changes
                                  if (refetchQuestions) {
                                    refetchQuestions();
                                  }
                                }}
                                label="Select Subject"
                                disabled={
                                  !selectedClass ||
                                  isLoadingSubjects ||
                                  subjects.length === 0
                                }
                                sx={{
                                  borderRadius: 2,
                                  bgcolor: "white",
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.neutral.gray300,
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: colors.accent.purple,
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: colors.accent.purple,
                                      borderWidth: 2,
                                    },
                                }}
                              >
                                {!selectedClass ? (
                                  <MenuItem disabled>
                                    Please select a class first
                                  </MenuItem>
                                ) : isLoadingSubjects ? (
                                  <MenuItem disabled>
                                    Loading subjects...
                                  </MenuItem>
                                ) : subjects.length === 0 ? (
                                  <MenuItem disabled>
                                    No subjects available for this class
                                  </MenuItem>
                                ) : (
                                  subjects.map((subject) => (
                                    <MenuItem
                                      key={subject.id}
                                      value={subject.id}
                                    >
                                      {subject.subject}
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>

                        {/* Subject-Wise Questions List */}
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
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2.5,
                            }}
                          >
                            {subjectObservationQuestions.map(
                              (question, index) => {
                                const options = parseOptions(question.options);
                                const userSelectedAnswer =
                                  answers[question.questionId];
                                const apiSelectedAnswer =
                                  shouldShowApiAnswer(question) &&
                                  question.selectedOptionId
                                    ? String(question.selectedOptionId)
                                    : null;
                                const selectedAnswer =
                                  userSelectedAnswer || apiSelectedAnswer;
                                const isExpanded =
                                  expandedQuestions[question.questionId] ??
                                  true;
                                const questionProgress = selectedAnswer
                                  ? 100
                                  : 0;
                                const questionNumber = `${domainNumber}.${subdomainNumber}.${
                                  index +
                                  1 +
                                  classroomObservationQuestions.length
                                }`;

                                return (
                                  <Card
                                    key={question.questionId}
                                    sx={{
                                      borderRadius: 2,
                                      border: "1px solid",
                                      borderColor: colors.neutral.gray200,
                                      transition: "all 0.2s ease",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                      overflow: "hidden",
                                      "&:hover": {
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                      },
                                    }}
                                  >
                                    {/* Question Header - Always Visible */}
                                    <Box
                                      onClick={() =>
                                        toggleQuestionExpansion(
                                          question.questionId
                                        )
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
                                        label={`Q ${questionNumber}`}
                                        size="small"
                                        sx={{
                                          bgcolor: colors.neutral.gray800,
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
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                            color: colors.text.primary,
                                            lineHeight: 1.5,
                                          }}
                                        >
                                          {getQuestionText(question)}
                                        </Typography>
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

                                    {/* Question Content - Expandable */}
                                    {isExpanded && (
                                      <CardContent sx={{ p: 3, pt: 2.5 }}>
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
                                              {options.map(
                                                (option, optIndex) => (
                                                  <FormControlLabel
                                                    key={
                                                      option.optionId ||
                                                      optIndex
                                                    }
                                                    value={String(
                                                      option.optionId
                                                    )}
                                                    control={
                                                      <Radio
                                                        disabled={!isPublished || isSubmitted}
                                                        sx={{
                                                          color:
                                                            colors.accent
                                                              .purple,
                                                          "&.Mui-checked": {
                                                            color:
                                                              colors.accent
                                                                .purple,
                                                          },
                                                        }}
                                                      />
                                                    }
                                                    label={
                                                      <Typography variant="body2">
                                                        {getOptionText(option)}
                                                      </Typography>
                                                    }
                                                    sx={{
                                                      mb: 1.5,
                                                      p: 2,
                                                      borderRadius: 2,
                                                      bgcolor:
                                                        selectedAnswer ===
                                                        String(option.optionId)
                                                          ? colors.accent
                                                              .purple + "15"
                                                          : "transparent",
                                                      border: "1.5px solid",
                                                      borderColor:
                                                        selectedAnswer ===
                                                        String(option.optionId)
                                                          ? colors.accent.purple
                                                          : colors.neutral
                                                              .gray200,
                                                      transition:
                                                        "all 0.2s ease",
                                                      "&:hover": {
                                                        bgcolor:
                                                          colors.accent.purple +
                                                          "15",
                                                        borderColor:
                                                          colors.accent.purple,
                                                      },
                                                    }}
                                                  />
                                                )
                                              )}
                                            </RadioGroup>
                                          </FormControl>
                                        )}
                                      </CardContent>
                                    )}
                                  </Card>
                                );
                              }
                            )}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* FLN Questions Section (Type 4) */}
                    {flnQuestions.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        {/* Section Header */}
                        <Box
                          sx={{
                            mb: 3,
                            pb: 2,
                            borderBottom: `2px solid ${colors.neutral.gray200}`,
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
                            <Create
                              sx={{
                                fontSize: 24,
                                color: colors.semantic.warning,
                              }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: colors.text.primary,
                              }}
                            >
                              Input Type Questions
                            </Typography>
                            <Chip
                              label={`${
                                flnQuestionsForCount.filter((q) => {
                                  const textAnswer = textAnswers[q.questionId];
                                  if (!textAnswer) return false;
                                  try {
                                    const flnData = JSON.parse(textAnswer);
                                    return Object.keys(flnData).some(
                                      (key) =>
                                        flnData[key] &&
                                        flnData[key].obtainedMarks
                                    );
                                  } catch (e) {
                                    return false;
                                  }
                                }).length
                              }/${flnQuestionsForCount.length} answered`}
                              size="small"
                              sx={{
                                bgcolor: colors.semantic.warning + "15",
                                color: colors.semantic.warning,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.text.secondary,
                              fontSize: "0.875rem",
                            }}
                          >
                            Foundational Literacy and Numeracy questions that
                            require text responses
                          </Typography>
                        </Box>

                        {/* FLN Questions List */}
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
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2.5,
                            }}
                          >
                            {flnQuestions.map((question, index) => {
                              const textAnswer =
                                textAnswers[question.questionId] || "";
                              const isExpanded =
                                expandedQuestions[question.questionId] ?? true;

                              // Check if FLN question has any answers
                              let questionProgress = 0;
                              if (textAnswer) {
                                try {
                                  const flnData = JSON.parse(textAnswer);
                                  const hasAnswer = Object.keys(flnData).some(
                                    (key) =>
                                      flnData[key] && flnData[key].obtainedMarks
                                  );
                                  questionProgress = hasAnswer ? 100 : 0;
                                } catch (e) {
                                  questionProgress = 0;
                                }
                              }
                              const questionNumber = `${domainNumber}.${subdomainNumber}.${
                                index +
                                1 +
                                classroomObservationQuestions.length +
                                subjectObservationQuestions.length
                              }`;

                              return (
                                <Card
                                  key={question.questionId}
                                  sx={{
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: colors.neutral.gray200,
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                    overflow: "hidden",
                                    "&:hover": {
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    },
                                  }}
                                >
                                  {/* Question Header - Always Visible */}
                                  <Box
                                    onClick={() =>
                                      toggleQuestionExpansion(
                                        question.questionId
                                      )
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
                                      label={`Q ${questionNumber}`}
                                      size="small"
                                      sx={{
                                        bgcolor: colors.accent.orangeDark,
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

                                  {/* Question Content - Expandable */}
                                  {isExpanded && (
                                    <CardContent sx={{ p: 3, pt: 2.5 }}>
                                      {/* FLN Input Fields for classes 2 and 3 */}
                                      <Box
                                        sx={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 2.5,
                                        }}
                                      >
                                        {[2, 3].map((classNum) => {
                                          // Parse existing answer if it exists
                                          let flnData = {};
                                          try {
                                            flnData = textAnswer
                                              ? JSON.parse(textAnswer)
                                              : {};
                                          } catch (e) {
                                            flnData = {};
                                          }

                                          const classData = flnData[
                                            classNum
                                          ] || {
                                            obtainedMarks: "",
                                            answerId: null,
                                          };

                                          // Get total students count from API
                                          const totalStudents =
                                            gradesCounts[classNum] || 0;
                                          const maxMarks = totalStudents * 10;

                                          return (
                                            <Box
                                              key={classNum}
                                              sx={{
                                                p: 2.5,
                                                borderRadius: 2,
                                                bgcolor:
                                                  colors.background.secondary,
                                                border: `1px solid ${colors.neutral.gray200}`,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 3,
                                                flexWrap: "wrap",
                                              }}
                                            >
                                              {/* Total Students - Static Display */}
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1.5,
                                                  flex: "1 1 300px",
                                                }}
                                              >
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 600,
                                                    color: colors.text.primary,
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  Total number of students for
                                                  Class {classNum}:
                                                </Typography>
                                                <Box
                                                  sx={{
                                                    px: 2,
                                                    py: 1,
                                                    // bgcolor:
                                                    //   colors.primary.lightest,
                                                  }}
                                                >
                                                  <Typography
                                                    variant="body2"
                                                    sx={{
                                                      fontWeight: 700,
                                                      color:
                                                        colors.primary.blue,
                                                    }}
                                                  >
                                                    {totalStudents}
                                                  </Typography>
                                                </Box>
                                              </Box>

                                              {/* Obtained Marks Field */}
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1.5,
                                                  flex: "1 1 250px",
                                                }}
                                              >
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 600,
                                                    color: colors.text.primary,
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  Obtained marks:
                                                </Typography>
                                                <TextField
                                                  size="small"
                                                  type="number"
                                                  disabled={!isPublished || isSubmitted}
                                                  value={
                                                    classData.obtainedMarks ||
                                                    ""
                                                  }
                                                  onChange={(e) => {
                                                    const value =
                                                      e.target.value;
                                                    // Validate: only positive numbers and <= max marks
                                                    if (
                                                      value === "" ||
                                                      (Number(value) >= 0 &&
                                                        Number(value) <=
                                                          maxMarks)
                                                    ) {
                                                      const newData = {
                                                        ...flnData,
                                                        [classNum]: {
                                                          obtainedMarks: value,
                                                          answerId:
                                                            classData.answerId ||
                                                            null, // Preserve answerId
                                                        },
                                                      };
                                                      handleTextAnswerChange(
                                                        question.questionId,
                                                        JSON.stringify(newData)
                                                      );
                                                    }
                                                  }}
                                                  onKeyDown={(e) => {
                                                    // Prevent minus sign, plus sign, and 'e'
                                                    if (
                                                      e.key === "-" ||
                                                      e.key === "+" ||
                                                      e.key === "e" ||
                                                      e.key === "E"
                                                    ) {
                                                      e.preventDefault();
                                                    }
                                                  }}
                                                  placeholder="Enter marks"
                                                  inputProps={{
                                                    min: 0,
                                                    max: maxMarks,
                                                  }}
                                                  error={
                                                    classData.obtainedMarks &&
                                                    Number(
                                                      classData.obtainedMarks
                                                    ) > maxMarks
                                                  }
                                                  sx={{
                                                    width: "150px",
                                                    "& .MuiOutlinedInput-root":
                                                      {
                                                        borderRadius: 0.5,
                                                        bgcolor: "white",
                                                      },
                                                  }}
                                                />
                                                <Typography
                                                  variant="body2"
                                                  sx={{
                                                    fontWeight: 600,
                                                    color:
                                                      colors.semantic.warning,
                                                    whiteSpace: "nowrap",
                                                  }}
                                                >
                                                  Max: {maxMarks}
                                                </Typography>
                                              </Box>
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    </CardContent>
                                  )}
                                </Card>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* General Questions Section */}
                    {generalQuestions.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        {/* Section Header */}
                        <Box
                          sx={{
                            mb: 3,
                            pb: 2,
                            borderBottom: `2px solid ${colors.neutral.gray200}`,
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
                            <Assignment
                              sx={{ fontSize: 24, color: colors.accent.green }}
                            />
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: colors.text.primary,
                              }}
                            >
                              General Questions
                            </Typography>
                            <Chip
                              label={`${
                                generalQuestionsForCount.filter(
                                  (q) =>
                                    answers[q.questionId] ||
                                    textAnswers[q.questionId]
                                ).length
                              }/${generalQuestionsForCount.length} answered`}
                              size="small"
                              sx={{
                                bgcolor: colors.accent.green + "15",
                                color: colors.accent.green,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.text.secondary,
                              fontSize: "0.875rem",
                            }}
                          >
                            General assessment questions that don't require
                            classroom observation
                          </Typography>
                        </Box>

                        {/* General Questions List */}
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
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 2.5,
                            }}
                          >
                            {generalQuestions.map((question, index) => {
                              const options = parseOptions(question.options);
                              const userSelectedAnswer =
                                answers[question.questionId];
                              const apiSelectedAnswer =
                                question.selectedOptionId
                                  ? String(question.selectedOptionId)
                                  : null;
                              const selectedAnswer =
                                userSelectedAnswer || apiSelectedAnswer;
                              const isExpanded =
                                expandedQuestions[question.questionId] ?? true;
                              const questionProgress = selectedAnswer ? 100 : 0;
                              const questionNumber = `${domainNumber}.${subdomainNumber}.${
                                classBasedQuestions.length + index + 1
                              }`;

                              return (
                                <Card
                                  key={question.questionId}
                                  sx={{
                                    borderRadius: 2,
                                    border: "1px solid",
                                    borderColor: colors.neutral.gray200,
                                    transition: "all 0.2s ease",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                    overflow: "hidden",
                                    "&:hover": {
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    },
                                  }}
                                >
                                  {/* Question Header - Always Visible */}
                                  <Box
                                    onClick={() =>
                                      toggleQuestionExpansion(
                                        question.questionId
                                      )
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
                                      label={`Q ${questionNumber}`}
                                      size="small"
                                      sx={{
                                        bgcolor: colors.accent.greenDark,
                                        color: "white",
                                        fontWeight: 700,
                                        minWidth: "80px",
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
                                                key={
                                                  option.optionId || optIndex
                                                }
                                                value={String(option.optionId)}
                                                control={
                                                  <Radio
                                                    disabled={!isPublished || isSubmitted}
                                                    sx={{
                                                      color:
                                                        colors.primary.blue,
                                                      "&.Mui-checked": {
                                                        color:
                                                          colors.primary.blue,
                                                      },
                                                    }}
                                                  />
                                                }
                                                label={
                                                  <Typography variant="body2">
                                                    {getOptionText(option)}
                                                  </Typography>
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
                                    </CardContent>
                                  )}
                                </Card>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Submit Button */}
                    {isPublished && !isSubmitted && (
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
                          onClick={handleSubmit}
                          disabled={
                            submitSubdomainWiseAnswersMutation.isPending ||
                            (Object.keys(answers).length === 0 &&
                              Object.keys(textAnswers).length === 0) ||
                            (classBasedQuestions.length > 0 &&
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
                    )}
                  </Box>
                </Paper>
              )}

              {/* Domain View - When Domain Selected but No Subdomain */}
              {selectedDomain &&
                !selectedSubdomain &&
                (() => {
                  const domainIdx = domains.findIndex(
                    (d) => d.domainId === selectedDomain.domainId
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
                            {selectedDomain.subDomain.map(
                              (subdomain, index) => {
                                const subdomainId =
                                  subdomain.subDomainId || subdomain.id;
                                const subdomainProgress =
                                  getSubdomainProgress(subdomain);
                                const domainIdx = domains.findIndex(
                                  (d) => d.domainId === selectedDomain.domainId
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
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
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
                                                65 + (index % 26)
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
                                                    subdomainProgress
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
                                                {Math.round(subdomainProgress)}%
                                              </Typography>
                                            </Box>
                                          </Box>
                                        </Box>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                );
                              }
                            )}
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
                  );
                })()}

              {/* Domains Overview - No Domain Selected */}
              {!selectedDomain && (
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
                    }}
                  >
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
                    {domains.length > 0 ? (
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
                          Domain Progress Overview
                        </Typography>
                        <Box
                          sx={{
                            flex: 1,
                            minHeight: "400px",
                            width: "100%",
                          }}
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartData}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tick={{ fill: colors.text.secondary, fontSize: 12 }}
                                stroke={colors.neutral.gray400}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={200}
                                tick={{ fill: colors.text.primary, fontSize: 12 }}
                                stroke={colors.neutral.gray400}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: colors.background.primary,
                                  border: `1px solid ${colors.neutral.gray300}`,
                                  borderRadius: "8px",
                                  padding: "8px 12px",
                                }}
                                formatter={(value) => [`${value}%`, "Progress"]}
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
                                  const domain = domains.find(
                                    (d) => d.domainId === data.domainId
                                  );
                                  if (domain) {
                                    handleDomainSelect(domain);
                                  }
                                }}
                                cursor="pointer"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
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
                          The assessment has not been published or created yet.
                          Please contact your administrator to publish the
                          assessment.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              )}
            </Box>

      {/* Confirmation Modal for Final Submit */}
      <ConfirmationModal
        open={showSubmitConfirmation}
        onClose={() => setShowSubmitConfirmation(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Assessment"
        message="Are you sure you want to submit your assessment? You will not be able to edit your responses after submission."
        confirmText="Yes, Submit"
        cancelText="Cancel"
        variant="warning"
        isLoading={submitAssessmentMutation.isPending}
      />
    </Box>
  );
};

export default CRCAssessment;

