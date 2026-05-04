import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Tabs,
  Tab,
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
  PhotoCamera,
  Close,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import {
  useGetDomainsQuery,
  useGetSubdomainQuestionsQuery,
} from "../../../services/schoolService";
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
} from "../../../services/schoolService";
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
import "./SelfAssessment.css";

const SelfAssessment = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const { logout, user, userId, userName } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState("gu");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [answers, setAnswers] = useState({});
  const [subdomainAnswers, setSubdomainAnswers] = useState({});
  const [subdomainTextAnswers, setSubdomainTextAnswers] = useState({});
  const [classWiseAnswers, setClassWiseAnswers] = useState({});
  const [classWiseTextAnswers, setClassWiseTextAnswers] = useState({}); // Store text answers per class
  const [selectedClassGroup, setSelectedClassGroup] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textAnswers, setTextAnswers] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [selectedQuestionTab, setSelectedQuestionTab] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [chartDrilldownAssessmentId, setChartDrilldownAssessmentId] =
    useState(null);
  // MCQ image upload: { [questionId]: [base64OrNull, base64OrNull] }, max 2 per question
  const [mcqQuestionImages, setMcqQuestionImages] = useState({});
  const mcqImageInputRef = useRef(null);
  const [pendingMcqImageSlot, setPendingMcqImageSlot] = useState(null);

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

  const queryClient = useQueryClient();

  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isError: isErrorDomains,
    refetch: refetchDomains,
  } = useGetDomainsQuery({
    roleId,
    languageCode,
    userId: userId ? Number(userId) : undefined,
    enabled: true,
  });

  // Fetch all questions (without class filter) for counting purposes
  const { data: allQuestionsData } = useGetSubdomainQuestionsQuery({
    subDomainId: selectedSubdomain?.subDomainId || selectedSubdomain?.id,
    roleId,
    languageCode,
    userId: userId ? Number(userId) : undefined,
    enabled: !!selectedSubdomain,
  });

  // Check if there are subject-wise questions (type 3) in the current subdomain
  const hasSubjectWiseQuestions = useMemo(() => {
    if (!allQuestionsData) return false;
    const questions =
      allQuestionsData?.data?.data ||
      (Array.isArray(allQuestionsData?.data) ? allQuestionsData.data : []);
    return questions.some(
      (q) => q.questionType === 3 || q.questionType === "3",
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
    enabled: !!selectedSubdomain,
  });

  const { data: schoolDataResponse, isLoading: isLoadingSchoolData } =
    useGetSchoolDataQuery({
      schoolId: userName || undefined,
    });

  const schoolData = schoolDataResponse?.data || {};

  // Fetch school grades for FLN questions
  const { data: gradesData, isLoading: isLoadingGrades } =
    useGetSchoolGradesQuery({
      schoolId: userName || undefined,
      enabled: !!userName,
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
        (_, i) => lowerClass + i,
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

  // Reset class and answers when class group changes
  useEffect(() => {
    if (selectedClassGroup) {
      setSelectedClass(null);
      setSelectedSection(null);
      setSelectedSubject(null);
      // Clear answers when class group changes
      setAnswers({});
      setTextAnswers({});
    }
  }, [selectedClassGroup]);

  // Note: Removed auto-selection of class group and class to prevent
  // sending default cls/section parameters for General Questions

  // Fetch all school sections once
  const { data: sectionsData, isLoading: isLoadingSections } =
    useGetSchoolSectionsQuery({
      schoolId: userName || undefined,
      enabled: !!userName,
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

  const assessments = useMemo(() => {
    if (Array.isArray(domainsData?.data)) {
      if (domainsData.data.length > 0 && domainsData.data[0]?.domains) {
        return domainsData.data;
      }
      return [
        {
          assessmentId: null,
          assessmentName: "Assessment",
          domains: domainsData.data,
          isPublished: domainsData?.isPublished,
          startDate: domainsData?.startDate,
          endDate: domainsData?.endDate,
          isSubmitted: domainsData?.isSubmitted,
          sessionId: domainsData?.sessionId,
        },
      ];
    }
    return [];
  }, [domainsData]);

  useEffect(() => {
    if (!assessments.length) {
      setSelectedAssessmentId(null);
      return;
    }
    const stillExists = assessments.some(
      (a) => Number(a.assessmentId) === Number(selectedAssessmentId)
    );
    if (!selectedAssessmentId || !stillExists) {
      setSelectedAssessmentId(assessments[0].assessmentId);
    }
  }, [assessments, selectedAssessmentId]);

  const selectedAssessment = useMemo(() => {
    if (!assessments.length) return null;
    return (
      assessments.find(
        (a) => Number(a.assessmentId) === Number(selectedAssessmentId)
      ) || assessments[0]
    );
  }, [assessments, selectedAssessmentId]);

  const domains = selectedAssessment?.domains || [];
  const isPublished =
    selectedAssessment?.isPublished ?? domainsData?.isPublished ?? false;
  const endDate = selectedAssessment?.endDate ?? domainsData?.endDate ?? null;
  const isSubmitted =
    selectedAssessment?.isSubmitted ?? domainsData?.isSubmitted ?? false;

  // Check if endDate has passed (end date is inclusive - closed only after end of endDate day)
  const isEndDatePassed = useMemo(() => {
    if (!endDate) return false;
    const currentDate = new Date();
    const endDateObj = new Date(endDate);
    // Compare date-only so that the full endDate day is still open
    const toDateOnly = (d) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    return toDateOnly(currentDate) > toDateOnly(endDateObj);
  }, [endDate]);

  // Assessment is read-only if submitted or endDate has passed
  const isReadOnly = isSubmitted || isEndDatePassed;

  // Extract and store sessionId from domains API response
  useEffect(() => {
    setSessionId(selectedAssessment?.sessionId ?? null);
  }, [selectedAssessment?.sessionId]);

  // Helper function to map dropdown group range to API group range format
  const mapGroupRangeToApiFormat = (groupRange) => {
    const mapping = {
      "1-2": "1-2",
      "3-5": "3-4-5",
      "6-8": "6-7-8",
    };
    return mapping[groupRange] || groupRange;
  };

  // Helper function to get flag color for a specific subdomain, question type, and group range
  const getGroupFlagColor = (questionType, groupRange) => {
    if (!selectedSubdomain || !domains) return null;

    const subdomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;

    // Find the domain that contains this subdomain
    const domain = domains.find((d) =>
      d.subDomain?.some((sd) => (sd.subDomainId || sd.id) === subdomainId),
    );

    if (!domain) return null;

    // Find the subdomain
    const subdomain = domain.subDomain?.find(
      (sd) => (sd.subDomainId || sd.id) === subdomainId,
    );

    if (!subdomain || !subdomain.groupWise) return null;

    // Map the dropdown group range to API format
    const apiGroupRange = mapGroupRangeToApiFormat(groupRange);

    // Find the matching groupWise entry
    const groupWise = subdomain.groupWise.find(
      (gw) =>
        (gw.questionType === questionType ||
          String(gw.questionType) === String(questionType)) &&
        gw.groupRange === apiGroupRange,
    );

    return groupWise?.flag || null;
  };

  // Helper function to get color value from flag
  const getFlagColorValue = (flag) => {
    switch (flag) {
      case "green":
        return colors.accent.green;
      case "yellow":
        return colors.semantic.warning;
      case "red":
        return colors.semantic.error;
      default:
        return colors.neutral.gray400;
    }
  };

  // Helper function to get total questions count from groupWise array for a specific question type
  const getTotalQuestionsFromGroupWise = (subdomain, questionType) => {
    if (
      !subdomain ||
      !subdomain.groupWise ||
      !Array.isArray(subdomain.groupWise)
    ) {
      return 0;
    }

    return subdomain.groupWise
      .filter(
        (gw) =>
          gw.questionType === questionType ||
          String(gw.questionType) === String(questionType),
      )
      .reduce((total, gw) => total + (gw.totalQuestions || 0), 0);
  };

  // Get total questions count from API groupWise data for current subdomain
  const getTotalQuestionsCount = (questionType) => {
    if (!selectedSubdomain) return 0;

    const subdomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;

    // Find the subdomain in domains data
    const domain = domains.find((d) =>
      d.subDomain?.some((sd) => (sd.subDomainId || sd.id) === subdomainId),
    );

    if (!domain) return 0;

    const subdomain = domain.subDomain?.find(
      (sd) => (sd.subDomainId || sd.id) === subdomainId,
    );

    if (!subdomain) return 0;

    // For question types 2 and 3, use groupWise data
    if (
      questionType === 2 ||
      questionType === "2" ||
      questionType === 3 ||
      questionType === "3"
    ) {
      return getTotalQuestionsFromGroupWise(subdomain, questionType);
    }

    // For question types 1 and 4, check if subdomain has totalQuestions
    // If groupWise exists, subtract those counts to get type 1/4 count
    if (
      subdomain.totalQuestions !== undefined &&
      subdomain.totalQuestions !== null
    ) {
      const groupWiseTotal =
        subdomain.groupWise?.reduce(
          (total, gw) => total + (gw.totalQuestions || 0),
          0,
        ) || 0;
      return Math.max(0, subdomain.totalQuestions - groupWiseTotal);
    }

    return 0;
  };

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
    (q) => q.questionType === 1 || q.questionType === "1",
  );
  const classroomObservationQuestionsForCount = allQuestionsForCount.filter(
    (q) => q.questionType === 2 || q.questionType === "2",
  );
  const subjectObservationQuestionsForCount = allQuestionsForCount.filter(
    (q) => q.questionType === 3 || q.questionType === "3",
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
    (q) => q.questionType === 1 || q.questionType === "1",
  );
  const classroomObservationQuestions = allQuestions.filter(
    (q) => q.questionType === 2 || q.questionType === "2",
  );
  const subjectObservationQuestions = allQuestions.filter(
    (q) => q.questionType === 3 || q.questionType === "3",
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

  // Calculate total questions count for each type
  const generalQuestionsTotalCount = useMemo(() => {
    return getTotalQuestionsCount(1);
  }, [selectedSubdomain, domains]);

  const classroomObservationQuestionsTotalCount = useMemo(() => {
    return getTotalQuestionsCount(2);
  }, [selectedSubdomain, domains]);

  const subjectObservationQuestionsTotalCount = useMemo(() => {
    return getTotalQuestionsCount(3);
  }, [selectedSubdomain, domains]);

  const flnQuestionsTotalCount = useMemo(() => {
    return getTotalQuestionsCount(4);
  }, [selectedSubdomain, domains]);

  // Define question type tabs - only show tabs that have actual questions to display
  const questionTabs = useMemo(() => {
    const tabs = [];

    // Only add tab if there are actual questions to display
    if (generalQuestions.length > 0) {
      tabs.push({
        id: "general",
        label: t("selfAssessment.tabs.generalQuestions"),
        icon: <Assignment sx={{ fontSize: 20 }} />,
        color: colors.accent.green,
        questions: generalQuestions,
        questionsForCount: generalQuestionsForCount,
        totalCount: generalQuestionsTotalCount,
      });
    }

    // Only add tab if there are actual questions to display
    if (classroomObservationQuestions.length > 0) {
      tabs.push({
        id: "classroom",
        label: t("selfAssessment.tabs.classroomObservation"),
        icon: <Class sx={{ fontSize: 20 }} />,
        color: colors.primary.blue,
        questions: classroomObservationQuestions,
        questionsForCount: classroomObservationQuestionsForCount,
        totalCount: classroomObservationQuestionsTotalCount,
      });
    }

    // Only add tab if there are actual questions to display
    if (subjectObservationQuestions.length > 0) {
      tabs.push({
        id: "subject",
        label: t("selfAssessment.tabs.subjectWiseObservation"),
        icon: <MenuBook sx={{ fontSize: 20 }} />,
        color: colors.accent.purple,
        questions: subjectObservationQuestions,
        questionsForCount: subjectObservationQuestionsForCount,
        totalCount: subjectObservationQuestionsTotalCount,
      });
    }

    // Only add tab if there are actual questions to display
    if (flnQuestions.length > 0) {
      tabs.push({
        id: "fln",
        label: t("selfAssessment.tabs.inputTypeQuestions"),
        icon: <Create sx={{ fontSize: 20 }} />,
        color: colors.semantic.warning,
        questions: flnQuestions,
        questionsForCount: flnQuestionsForCount,
        totalCount: flnQuestionsTotalCount,
      });
    }

    return tabs;
  }, [
    generalQuestions,
    classroomObservationQuestions,
    subjectObservationQuestions,
    flnQuestions,
    generalQuestionsForCount,
    classroomObservationQuestionsForCount,
    subjectObservationQuestionsForCount,
    flnQuestionsForCount,
    generalQuestionsTotalCount,
    classroomObservationQuestionsTotalCount,
    subjectObservationQuestionsTotalCount,
    flnQuestionsTotalCount,
    currentLanguage,
  ]);

  // Reset tab to first when questions change
  useEffect(() => {
    if (questionTabs.length > 0 && selectedQuestionTab >= questionTabs.length) {
      setSelectedQuestionTab(0);
    }
  }, [questionTabs.length, selectedQuestionTab]);

  // Get current tab
  const currentTab = questionTabs[selectedQuestionTab] || null;

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
        (q) => answers[q.questionId],
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
      question.questionType || (question.isClassroomObservation === 1 ? 2 : 1);

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
    // Default icon
    const defaultIcon = <Assessment sx={{ fontSize: 24 }} />;

    try {
      // Check if domain is null/undefined
      if (!domain) {
        console.warn("getDomainIcon: Domain is null or undefined");
        return defaultIcon;
      }

      // Get domain ID and name
      const domainId = domain.domainId;
      const domainName = getDomainName(domain);

      // Check if domainName is valid
      if (!domainName || typeof domainName !== "string") {
        console.warn("getDomainIcon: Invalid domain name for domain:", domain);
        return defaultIcon;
      }

      // Safely convert to lowercase
      const domainNameLower = String(domainName).toLowerCase();

      // Determine icon based on domain ID or name
      if (
        domainId === 1 ||
        domainNameLower.includes("leadership") ||
        domainNameLower.includes("governance")
      ) {
        return <WorkspacePremium sx={{ fontSize: 24 }} />;
      } else if (
        domainId === 2 ||
        domainNameLower.includes("curricul") || // Changed from "curriculum" to catch variations
        domainNameLower.includes("instruction")
      ) {
        return <MenuBook sx={{ fontSize: 24 }} />;
      } else if (
        domainId === 3 ||
        domainNameLower.includes("human") ||
        domainNameLower.includes("resource") ||
        domainNameLower.includes("staff") ||
        domainNameLower.includes("teacher")
      ) {
        return <Groups sx={{ fontSize: 24 }} />;
      } else if (
        domainId === 4 ||
        domainNameLower.includes("facilit") || // Changed from "facility" to catch variations
        domainNameLower.includes("infrastructure")
      ) {
        return <Business sx={{ fontSize: 24 }} />;
      } else if (
        domainId === 5 ||
        domainNameLower.includes("student") ||
        domainNameLower.includes("outcome")
      ) {
        return <SchoolIcon sx={{ fontSize: 24 }} />;
      }
    } catch (error) {
      console.error("Error in getDomainIcon:", error, "Domain:", domain);
    }

    return defaultIcon;
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
            (selectedSubdomain.subDomainId || selectedSubdomain.id),
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
    const activeClassKey = selectedClass ? String(selectedClass) : "general";

    if (selectedSubdomain) {
      const currentSubdomainId =
        selectedSubdomain.subDomainId || selectedSubdomain.id;

      // Save current answers to subdomainAnswers
      setSubdomainAnswers((prev) => ({
        ...prev,
        [currentSubdomainId]: { ...answers },
      }));
      setSubdomainTextAnswers((prev) => ({
        ...prev,
        [currentSubdomainId]: { ...textAnswers },
      }));

      // Save current answers to class-wise storage (also supports "general")
      const storageKey = `${currentSubdomainId}_${activeClassKey}`;
      setClassWiseAnswers((prev) => ({
        ...prev,
        [storageKey]: { ...answers },
      }));
      setClassWiseTextAnswers((prev) => ({
        ...prev,
        [storageKey]: { ...textAnswers },
      }));
    }

    const savedAnswers = subdomainAnswers[subdomainId] || {};
    const nextStorageKey = `${subdomainId}_${activeClassKey}`;
    const savedTextAnswers =
      subdomainTextAnswers[subdomainId] ||
      classWiseTextAnswers[nextStorageKey] ||
      {};
    setSelectedSubdomain(subdomain);
    setAnswers(savedAnswers);
    setTextAnswers(savedTextAnswers);
    // Reset class group, class, section, and subject when switching subdomains
    setSelectedClassGroup(null);
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSubject(null);
    // Reset question tab to first
    setSelectedQuestionTab(0);
  };

  const handleAssessmentSelect = (assessment) => {
    setSelectedAssessmentId(assessment.assessmentId);
    setSelectedDomain(null);
    setSelectedSubdomain(null);
    setAnswers({});
    setTextAnswers({});
    setSubdomainTextAnswers({});
    setSelectedClassGroup(null);
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSubject(null);
    setSelectedQuestionTab(0);
    setChartDrilldownAssessmentId(null);
  };

  // Reset section and subject when class changes
  useEffect(() => {
    if (selectedClass) {
      setSelectedSection(null);
      setSelectedSubject(null);
      // Clear MCQ/option answers only; keep textAnswers so FLN prefill persists
      setAnswers({});
    }
  }, [selectedClass]);

  // Reset subject and answers when section changes
  useEffect(() => {
    if (selectedSection) {
      setSelectedSubject(null);
      // Clear MCQ/option answers only; keep textAnswers so FLN prefill persists
      setAnswers({});
    }
  }, [selectedSection]);

  // Effect to load API answers when questions are fetched (same as SchoolVerification)
  useEffect(() => {
    const questionsForOptions =
      allQuestions && allQuestions.length > 0 ? allQuestions : [];
    const questionsForFLN =
      allQuestionsForCount && allQuestionsForCount.length > 0
        ? allQuestionsForCount
        : questionsForOptions;

    if (
      (questionsForOptions.length > 0 || questionsForFLN.length > 0) &&
      selectedSubdomain
    ) {
      const apiAnswers = {};
      const apiTextAnswers = {};
      const flnAnswersMap = {};

      // Build FLN prefill from unfiltered list so FLN rows (questionId, std, answerText) are always present
      questionsForFLN.forEach((question) => {
        const questionType =
          question.questionType ||
          (question.isClassroomObservation === 1 ? 2 : 1);

        if (questionType !== 4 && questionType !== "4") return;

        const marksValue = question.obtainedMarks ?? question.answerText;
        const hasStd = question.std != null;
        const hasMarks = marksValue != null && marksValue !== "";

        if (hasStd && hasMarks) {
          const qId = question.questionId;
          if (!flnAnswersMap[qId]) flnAnswersMap[qId] = {};
          const stdKey = Number(question.std);
          flnAnswersMap[qId][stdKey] = {
            obtainedMarks: String(marksValue),
            answerId: question.answerId ?? null,
          };
        }
      });

      // Process non-FLN answers from the (possibly filtered) questions list
      questionsForOptions.forEach((question) => {
        const questionType =
          question.questionType ||
          (question.isClassroomObservation === 1 ? 2 : 1);

        let shouldLoadAnswer = false;
        if (questionType === 1 || questionType === "1") {
          shouldLoadAnswer = true;
        } else if (questionType === 2 || questionType === "2") {
          shouldLoadAnswer = !!selectedClass && !!selectedSection;
        } else if (questionType === 3 || questionType === "3") {
          shouldLoadAnswer =
            !!selectedClass &&
            !!selectedSection &&
            !!selectedSubject &&
            question.subjectId === Number(selectedSubject);
        } else if (questionType === 4 || questionType === "4") {
          return;
        }

        if (!shouldLoadAnswer || !question.selectedOptionId) return;

        apiAnswers[question.questionId] = String(question.selectedOptionId);
      });

      // Convert flnAnswersMap to JSON strings for textAnswers state
      Object.keys(flnAnswersMap).forEach((questionId) => {
        if (Object.keys(flnAnswersMap[questionId]).length > 0) {
          apiTextAnswers[questionId] = JSON.stringify(
            flnAnswersMap[questionId],
          );
        }
      });

      if (Object.keys(apiAnswers).length > 0) {
        setAnswers(apiAnswers);
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
      } else {
        setAnswers({});
      }

      // Merge FLN textAnswers per questionId so API data for one class doesn't wipe the other
      if (Object.keys(apiTextAnswers).length > 0) {
        setTextAnswers((prevTextAnswers) => {
          const merged = { ...prevTextAnswers };
          Object.keys(apiTextAnswers).forEach((qId) => {
            try {
              const apiData = JSON.parse(apiTextAnswers[qId]);
              let prevData = {};
              if (merged[qId]) {
                try {
                  prevData = JSON.parse(merged[qId]);
                } catch (_) {}
              }
              merged[qId] = JSON.stringify({ ...prevData, ...apiData });
            } catch (_) {
              merged[qId] = apiTextAnswers[qId];
            }
          });
          return merged;
        });
        const currentSubdomainId =
          selectedSubdomain.subDomainId || selectedSubdomain.id;
        setSubdomainTextAnswers((prev) => {
          const existing = prev[currentSubdomainId] || {};
          const merged = { ...existing };
          Object.keys(apiTextAnswers).forEach((qId) => {
            try {
              const apiData = JSON.parse(apiTextAnswers[qId]);
              let existingData = {};
              if (merged[qId]) {
                try {
                  existingData = JSON.parse(merged[qId]);
                } catch (_) {}
              }
              merged[qId] = JSON.stringify({ ...existingData, ...apiData });
            } catch (_) {
              merged[qId] = apiTextAnswers[qId];
            }
          });
          return {
            ...prev,
            [currentSubdomainId]: merged,
          };
        });
        if (selectedClass) {
          const subdomainId =
            selectedSubdomain.subDomainId || selectedSubdomain.id;
          const classKey = String(selectedClass);
          const storageKey = `${subdomainId}_${classKey}`;
          setClassWiseTextAnswers((prev) => ({
            ...prev,
            [storageKey]: {
              ...(prev[storageKey] || {}),
              ...apiTextAnswers,
            },
          }));
        }
      }
    }
  }, [
    allQuestions,
    allQuestionsForCount,
    selectedSubdomain,
    selectedClass,
    selectedSection,
    selectedSubject,
  ]);

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

  // MCQ image upload: show for all General/MCQ questions (type 1); optionally restrict by question.allowImageUpload when API sends it
  const questionAllowsImageUpload = (question) => {
    const qt =
      question?.questionType ??
      (question?.isClassroomObservation === 1 ? 2 : 1);
    if (qt !== 1 && qt !== "1") return false;
    const allow = question?.allowImageUpload;
    return allow === 1 || allow === "1" || allow === true || allow === "yes";
  };

  const getMcqImagesForQuestion = (questionId) => {
    const arr = mcqQuestionImages[questionId];
    if (!arr) return [null, null];
    return [arr[0] ?? null, arr[1] ?? null];
  };

  /** Returns dataUrl for preview (img src). Handles both { dataUrl, file } and legacy base64. */
  const getMcqImagePreviewSrc = (item) => {
    if (!item) return null;
    return typeof item === "string" ? item : (item?.dataUrl ?? null);
  };

  /** Returns location for display: { latitude, longitude, address } or null. */
  const getMcqImageLocation = (item) => {
    if (!item || typeof item !== "object") return null;
    if (item.latitude != null && item.longitude != null) {
      return {
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address || "",
      };
    }
    return null;
  };

  /** Returns File[] for the given question for upload. */
  const getMcqImageFilesForQuestion = (questionId) => {
    const arr = mcqQuestionImages[questionId];
    if (!arr) return [];
    return arr
      .filter((item) => item && (typeof item === "object" ? item?.file : false))
      .map((item) => item.file);
  };

  /**
   * Build attachedImages for submit payload: each image as { extension, contentType, fileName } only.
   * Sent inside the answer object to sub-domain-wise-submit-answers.
   */
  const buildAttachedImagesForQuestion = (questionId) => {
    const arr = mcqQuestionImages[questionId];
    if (!arr) return [];
    const out = [];
    arr.forEach((item, index) => {
      if (!item || typeof item !== "object" || !item.file || !item.dataUrl)
        return;
      const file = item.file;
      const extension =
        file.name?.split(".").pop()?.toLowerCase() ||
        file.type?.split("/")[1] ||
        "png";
      const contentType = file.type || "image/png";
      const fileName =
        file.name || `answer_${questionId}_${index}.${extension}`;
      out.push({ extension, contentType, fileName });
    });
    return out;
  };

  /**
   * After submit-answers returns uploadUrls, PUT each image file (blob) to its corresponding uploadURL.
   * Response shape: data.uploadUrls = [ { questionId, images: [ { fileName, uploadURL } ] } ]
   * Uses XMLHttpRequest so the PUT method is explicitly set and sent.
   */
  const uploadImagesToPresignedUrls = async (
    uploadUrls,
    imagesByQuestionId,
  ) => {
    if (!uploadUrls?.length || !imagesByQuestionId) return;

    for (const entry of uploadUrls) {
      const arr = imagesByQuestionId[entry.questionId];
      if (!Array.isArray(arr)) continue;

      for (let i = 0; i < (entry.images?.length ?? 0); i++) {
        const { uploadURL } = entry.images[i];
        const item = arr[i];
        const file = item?.file;

        if (!file || !uploadURL) continue;

        try {
          const res = await fetch(uploadURL, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });

          if (!res.ok) {
            throw new Error(`Upload failed ${res.status}`);
          }
        } catch (err) {
          console.error("Failed to upload image:", err);
        }
      }
    }
  };
  const handleMcqImageCaptureClick = (questionId, index) => {
    setPendingMcqImageSlot({ questionId, index });
    setTimeout(() => mcqImageInputRef.current?.click(), 0);
  };

  const getAddressFromCoords = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "GSQAC-SelfAssessment-Web" } },
      );
      const data = await res.json();
      return data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch {
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  };

  const handleMcqImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !pendingMcqImageSlot) {
      setPendingMcqImageSlot(null);
      return;
    }
    let latitude = null;
    let longitude = null;
    let address = "";
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        address = await getAddressFromCoords(latitude, longitude);
      } catch {
        address = "Location unavailable";
      }
    } else {
      address = "Location unavailable";
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setMcqQuestionImages((prev) => {
        const arr = [...(prev[pendingMcqImageSlot.questionId] || [null, null])];
        arr[pendingMcqImageSlot.index] = {
          dataUrl,
          file,
          latitude,
          longitude,
          address,
        };
        return { ...prev, [pendingMcqImageSlot.questionId]: arr };
      });
      setPendingMcqImageSlot(null);
    };
    reader.readAsDataURL(file);
  };

  const handleMcqImageRemove = (questionId, index) => {
    setMcqQuestionImages((prev) => {
      const arr = [...(prev[questionId] || [null, null])];
      arr[index] = null;
      const next = { ...prev, [questionId]: arr };
      if (arr.every((x) => x == null)) delete next[questionId];
      return next;
    });
  };

  // Handle text answer change for FLN questions
  const handleTextAnswerChange = (questionId, text) => {
    const newTextAnswers = {
      ...textAnswers,
      [questionId]: text,
    };
    setTextAnswers(newTextAnswers);

    // Save to subdomain-level cache so switching subdomains never wipes FLN entries
    if (selectedSubdomain) {
      const subdomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;
      setSubdomainTextAnswers((prev) => ({
        ...prev,
        [subdomainId]: newTextAnswers,
      }));

      // Save to classWiseTextAnswers
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
        },
      );
    },
  });

  const submitSubdomainWiseAnswersMutation =
    useSubmitSubdomainWiseAnswersMutation({
      onSuccess: async (data) => {
        // If API returned presigned upload URLs, PUT each image file to its URL
        const uploadUrls = data?.data?.uploadUrls;
        if (uploadUrls?.length) {
          await uploadImagesToPresignedUrls(uploadUrls, mcqQuestionImages);
        }
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
            assessmentId: selectedAssessment?.assessmentId ?? null,
            userId: Number(userId),
            roleId: Number(roleId),
            schoolId: userName || undefined,
            isSubmitted: 0,
          };
          submitAssessmentMutation.mutate(sessionPayload);
        } else {
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
          },
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
        // enqueueSnackbar("Session created successfully!", {
        //   variant: "success",
        // });
      } else {
        // Final submission - close the confirmation modal
        setShowSubmitConfirmation(false);

        // Refetch domains to update progress and isSubmitted status
        refetchDomains();

        // Refetch questions if subdomain is selected
        if (selectedSubdomain) {
          refetchQuestions();
        }

        // Invalidate all school-related queries to refresh dashboard data
        queryClient.invalidateQueries({
          queryKey: ["school"],
        });

        // Invalidate specific queries
        queryClient.invalidateQueries({
          queryKey: queryKeys.school.domains(roleId, languageCode),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.school.schoolData(userName),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.school.schoolSections(userName),
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
        },
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
    const payload = {
      sessionId: sessionId || null,
      assessmentId: selectedAssessment?.assessmentId ?? null,
      userId: Number(userId),
      roleId: Number(roleId),
      schoolId: userName || undefined,
      isSubmitted: 1,
    };
    submitAssessmentMutation.mutate(payload);
  };

  const allDomainsComplete = useMemo(() => {
    if (!domains || domains.length === 0) return false;
    return domains.every((domain) => {
      const progress = getDomainProgress(domain);
      return Math.round(progress) === 100;
    });
  }, [domains, getDomainProgress]);

  // Prepare chart data for bar graph
  const domainChartData = useMemo(() => {
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

  const assessmentChartData = useMemo(() => {
    if (!assessments || assessments.length === 0) return [];
    return assessments.map((assessment, index) => {
      const assessmentDomains = assessment.domains || [];
      const progress =
        assessmentDomains.length > 0
          ? assessmentDomains.reduce(
              (sum, domain) => sum + getDomainProgress(domain),
              0
            ) / assessmentDomains.length
          : 0;
      return {
        name: `${index + 1}. ${
          assessment.assessmentName ||
          t("selfAssessment.assessmentNameFallback", {
            id: assessment.assessmentId,
          })
        }`,
        progress: Math.round(progress),
        assessmentId: assessment.assessmentId,
        color: getProgressColor(progress),
      };
    });
  }, [assessments]);

  const currentChartData = useMemo(() => {
    if (assessments.length > 1 && !chartDrilldownAssessmentId) {
      return assessmentChartData;
    }
    if (chartDrilldownAssessmentId) {
      const drillAssessment = assessments.find(
        (a) => a.assessmentId === chartDrilldownAssessmentId
      );
      const drillDomains = drillAssessment?.domains || [];
      return drillDomains.map((domain, index) => {
        const progress = getDomainProgress(domain);
        return {
          name: `${index + 1}. ${getDomainName(domain)}`,
          progress: Math.round(progress),
          domainId: domain.domainId,
          color: getProgressColor(progress),
        };
      });
    }
    return domainChartData;
  }, [
    assessments,
    chartDrilldownAssessmentId,
    assessmentChartData,
    domainChartData,
  ]);

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
            (key) => flnData[key] && flnData[key].obtainedMarks,
          );
        } catch (e) {
          return false;
        }
      }
      // For other questions, check if option is selected
      // Only count API answer if required dropdowns are selected
      const apiAnswer =
        shouldShowApiAnswer(q) && q.selectedOptionId
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
      (d) => d.domainId === selectedDomain.domainId,
    );
    const subdomainIdx = selectedDomain.subDomain?.findIndex(
      (sd) =>
        (sd.subDomainId || sd.id) ===
        (selectedSubdomain.subDomainId || selectedSubdomain.id),
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
          (key) => flnData[key] && flnData[key].obtainedMarks,
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
                  : null),
            ),
      obtainedMarks:
        questionType === 4 || questionType === "4"
          ? textAnswers[question.questionId]
          : null,
      cls: classValue,
      section: sectionValue,
      schoolId: userName || undefined,
    };
    if (questionType === 1 || questionType === "1") {
      const attachedImages = buildAttachedImagesForQuestion(
        question.questionId,
      );
      if (attachedImages.length > 0) payload.attachedImages = attachedImages;
    }

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
        },
      );
      return;
    }

    // Check if user has answered any class-based questions (type 2 or 3)
    const hasAnsweredClassBasedQuestions = classBasedQuestions.some(
      (q) => answers[q.questionId] || textAnswers[q.questionId],
    );

    // Check if user has answered any subject observation questions (type 3)
    const hasAnsweredSubjectQuestions = subjectObservationQuestions.some(
      (q) => answers[q.questionId] || textAnswers[q.questionId],
    );

    // Only require class/section if user has answered class-based questions
    if (hasAnsweredClassBasedQuestions) {
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

      // For subject observation questions, only validate subject if user has answered type 3 questions
      if (hasAnsweredSubjectQuestions && !selectedSubject) {
        enqueueSnackbar("Please select a subject before submitting.", {
          variant: "warning",
        });
        return;
      }
    }

    let clsValue = null;
    let sectionValue = null;
    const isClassSelected = hasAnsweredClassBasedQuestions && selectedClass;

    if (isClassSelected) {
      // Class-based questions - use selected class and section
      clsValue = Number(selectedClass);
      sectionValue = selectedSection || null;
    }
    // For General questions or FLN questions, clsValue and sectionValue remain null

    // Determine questionType for current submission (tab-based)
    const questionTypeByTabId = {
      general: 1,
      classroom: 2,
      subject: 3,
      fln: 4,
    };
    const payloadQuestionType = currentTab?.id
      ? questionTypeByTabId[currentTab.id] || null
      : null;

    // Format answers array from current answers state (with image data in attachedImages for MCQ)
    const answersArray = [];

    for (const question of allQuestions) {
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
          const answerEntry = {
            answerId: question.answerId || null,
            questionId: question.questionId,
            optionId: Number(selectedOptionId),
            obtainedMarks: null,
          };
          if (questionType === 1 || questionType === "1") {
            const attachedImages = buildAttachedImagesForQuestion(
              question.questionId,
            );
            if (attachedImages.length > 0)
              answerEntry.attachedImages = attachedImages;
          }
          answersArray.push(answerEntry);
        }
      }
    }

    if (answersArray.length === 0) {
      enqueueSnackbar(
        "Please answer at least one question before submitting.",
        {
          variant: "warning",
        },
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
      questionType: payloadQuestionType,
      userId: Number(userId),
      cls: clsValue,
      section: sectionValue,
      subjectId: selectedSubject ? Number(selectedSubject) : null,
      schoolId: userName || undefined,
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
  console.log(
    (classBasedQuestions.length > 0, !selectedClass || !selectedSection),
    "answersanswersanswers",
  );
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
                <Assessment
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
                  Self-Assessment
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
                  School Assessment
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

        <Box sx={{ mt: 8 }} className="self-assessment-page-content">
          <Box
            sx={{
              pl: drawerOpen && !matchDownMD ? 0 : { xs: 1.5, sm: 2, md: 3 },
              pr: { xs: 1.5, sm: 2, md: 3 },
              py: { xs: 2, md: 3 },
              height: { xs: "auto", md: "calc(100vh - 64px)" },
              minHeight: { xs: "calc(100vh - 64px)", md: "calc(100vh - 64px)" },
              display: "flex",
              flexDirection: "column",
              overflow: { xs: "visible", md: "hidden" },
            }}
          >
            {/* Header */}
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

            {/* Main Content - Split Layout */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: { xs: 2, md: 3 },
                flex: 1,
                minHeight: 0,
                overflow: { xs: "visible", md: "hidden" },
              }}
            >
              {/* Left Panel - Domains and Subdomains */}
              <Paper
                sx={{
                  width: { xs: "100%", md: "380px" },
                  minWidth: { xs: 0, md: "380px" },
                  flexShrink: { md: 0 },
                  borderRadius: 3,
                  bgcolor: "white",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  maxHeight: { xs: "none", md: "calc(100vh - 200px)" },
                  minHeight: { xs: "240px", md: "auto" },
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                {/* Left Panel Header */}
                <Box
                  sx={{
                    p: { xs: 2, md: 3 },
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
                              (a) => Number(a.assessmentId) === selectedId
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
                                                    65 + (subdomainIndex % 26),
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
                                                  "& .MuiLinearProgress-bar": {
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

                {/* Final Submit Button */}
                {isPublished && !isReadOnly && (
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

              {/* Right Panel - Questions */}
              {selectedSubdomain && (
                <Paper
                  sx={{
                    flex: 1,
                    minHeight: { xs: "400px", md: 0 },
                    borderRadius: 3,
                    bgcolor: "white",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    maxHeight: { xs: "none", md: "calc(100vh - 200px)" },
                    minWidth: 0,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  {/* Right Panel Header */}
                  <Box
                    sx={{
                      p: { xs: 2, md: 3 },
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
                            selectedDomain,
                          )} / ${domainNumber}.${subdomainNumber}. ${getSubdomainName(
                            selectedSubdomain,
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
                      overflowX: "hidden",
                      p: { xs: 1.5, sm: 2, md: 3.5 },
                      WebkitOverflowScrolling: "touch",
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

                    {/* Question Type Tabs */}
                    {!isLoadingQuestions &&
                      allQuestions.length > 0 &&
                      questionTabs.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                          <Tabs
                            value={selectedQuestionTab}
                            onChange={(e, newValue) => {
                              // Reset class group, class, section, and subject when changing question type tab
                              setSelectedClassGroup(null);
                              setSelectedClass(null);
                              setSelectedSection(null);
                              setSelectedSubject(null);
                              // Clear MCQ/option answers only; keep textAnswers so FLN prefill persists when switching to FLN tab
                              setAnswers({});
                              setSelectedQuestionTab(newValue);
                            }}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                              borderBottom: 2,
                              borderColor: colors.neutral.gray200,
                              "& .MuiTabs-indicator": {
                                height: 3,
                                borderRadius: "3px 3px 0 0",
                              },
                              "& .MuiTab-root": {
                                textTransform: "none",
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                minHeight: 48,
                                px: 2,
                                "&.Mui-selected": {
                                  color:
                                    currentTab?.color || colors.primary.blue,
                                },
                              },
                            }}
                          >
                            {questionTabs.map((tab, index) => {
                              return (
                                <Tab
                                  key={tab.id}
                                  label={
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      {tab.icon}
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: "0.875rem",
                                        }}
                                      >
                                        {tab.label}
                                      </Typography>
                                    </Box>
                                  }
                                  sx={{
                                    color: colors.text.secondary,
                                    "&.Mui-selected": {
                                      color: tab.color,
                                    },
                                  }}
                                />
                              );
                            })}
                          </Tabs>
                        </Box>
                      )}

                    {/* Questions Content Based on Selected Tab */}
                    {!isLoadingQuestions &&
                      allQuestions.length > 0 &&
                      currentTab && (
                        <Box>
                          {/* Classroom Observation Questions Section (Type 2) */}
                          {currentTab.id === "classroom" && (
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
                                    sx={{
                                      fontSize: 24,
                                      color: colors.primary.blue,
                                    }}
                                  />
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 700,
                                      color: colors.text.primary,
                                    }}
                                  >
                                    {t(
                                      "selfAssessment.sections.classroomTitle",
                                    )}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: colors.text.secondary,
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {t(
                                    "selfAssessment.sections.classroomDescription",
                                  )}
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
                                      // disabled={isReadOnly}
                                      sx={{
                                        borderRadius: 2,
                                        bgcolor: "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: colors.neutral.gray300,
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                          {
                                            borderColor: colors.primary.blue,
                                          },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                          {
                                            borderColor: colors.primary.blue,
                                            borderWidth: 2,
                                          },
                                      }}
                                    >
                                      {["1-2", "3-5", "6-8"]
                                        .filter((groupRange) => {
                                          // Filter out groups with gray/null/undefined flags
                                          const flag = getGroupFlagColor(
                                            2,
                                            groupRange,
                                          );
                                          return (
                                            flag !== null &&
                                            flag !== undefined &&
                                            flag !== "gray"
                                          );
                                        })
                                        .map((groupRange) => {
                                          const flag = getGroupFlagColor(
                                            2,
                                            groupRange,
                                          );
                                          const flagColor = flag
                                            ? getFlagColorValue(flag)
                                            : null;
                                          const displayRange =
                                            groupRange === "3-5"
                                              ? "3-5"
                                              : groupRange;

                                          return (
                                            <MenuItem
                                              key={groupRange}
                                              value={groupRange}
                                            >
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1,
                                                }}
                                              >
                                                {flagColor && (
                                                  <Box
                                                    sx={{
                                                      width: 10,
                                                      height: 10,
                                                      borderRadius: "50%",
                                                      bgcolor: flagColor,
                                                      flexShrink: 0,
                                                    }}
                                                  />
                                                )}
                                                <Typography>
                                                  Class {displayRange}
                                                </Typography>
                                              </Box>
                                            </MenuItem>
                                          );
                                        })}
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
                                        if (
                                          selectedSubdomain &&
                                          selectedClass
                                        ) {
                                          const subdomainId =
                                            selectedSubdomain.subDomainId ||
                                            selectedSubdomain.id;
                                          const classKey =
                                            String(selectedClass);
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
                                        filteredClassOptions.length === 0 ||
                                        isReadOnly
                                      }
                                      sx={{
                                        borderRadius: 2,
                                        bgcolor: "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: colors.neutral.gray300,
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                          {
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
                                          {t("selfAssessment.loadingClasses")}
                                        </MenuItem>
                                      ) : filteredClassOptions.length === 0 ? (
                                        <MenuItem disabled>
                                          {selectedClassGroup
                                            ? `No classes available in ${selectedClassGroup} range`
                                            : "Please select a class group first"}
                                        </MenuItem>
                                      ) : (
                                        filteredClassOptions.map((classNum) => (
                                          <MenuItem
                                            key={classNum}
                                            value={classNum}
                                          >
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
                                        sections.length === 0 ||
                                        isReadOnly
                                      }
                                      sx={{
                                        borderRadius: 2,
                                        bgcolor: "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: colors.neutral.gray300,
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                          {
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
                                    t("selfAssessment.failedToLoadQuestions")}
                                </Alert>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2.5,
                                  }}
                                >
                                  {currentTab.questions.map(
                                    (question, index) => {
                                      const options = parseOptions(
                                        question.options,
                                      );
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
                                        expandedQuestions[
                                          question.questionId
                                        ] ?? true;
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
                                            boxShadow:
                                              "0 2px 8px rgba(0,0,0,0.08)",
                                            overflow: "hidden",
                                            "&:hover": {
                                              boxShadow:
                                                "0 4px 12px rgba(0,0,0,0.1)",
                                            },
                                          }}
                                        >
                                          {/* Question Header - Always Visible */}
                                          <Box
                                            onClick={() =>
                                              toggleQuestionExpansion(
                                                question.questionId,
                                              )
                                            }
                                            sx={{
                                              p: 2.5,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 2,
                                              bgcolor:
                                                colors.background.primary,
                                              borderBottom: isExpanded
                                                ? `1px solid ${colors.neutral.gray200}`
                                                : "none",
                                              "&:hover": {
                                                bgcolor:
                                                  colors.background.secondary,
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
                                                        colors.semantic
                                                          .warning + "20",
                                                      color:
                                                        colors.semantic.warning,
                                                      fontWeight: 600,
                                                      fontSize: "0.75rem",
                                                      mb: 2.5,
                                                    }}
                                                  />
                                                )}

                                              {options &&
                                                options.length > 0 && (
                                                  <FormControl
                                                    component="fieldset"
                                                    fullWidth
                                                    sx={{ mb: 3 }}
                                                  >
                                                    <RadioGroup
                                                      value={
                                                        selectedAnswer || ""
                                                      }
                                                      onChange={(e) =>
                                                        handleAnswerChange(
                                                          question.questionId,
                                                          e.target.value,
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
                                                              option.optionId,
                                                            )}
                                                            control={
                                                              <Radio
                                                                disabled={
                                                                  !isPublished ||
                                                                  isReadOnly
                                                                }
                                                                sx={{
                                                                  color:
                                                                    colors
                                                                      .primary
                                                                      .blue,
                                                                  "&.Mui-checked":
                                                                    {
                                                                      color:
                                                                        colors
                                                                          .primary
                                                                          .blue,
                                                                    },
                                                                }}
                                                              />
                                                            }
                                                            label={
                                                              <Typography variant="body2">
                                                                {getOptionText(
                                                                  option,
                                                                )}
                                                              </Typography>
                                                            }
                                                            sx={{
                                                              mb: 1.5,
                                                              p: 2,
                                                              borderRadius: 2,
                                                              bgcolor:
                                                                selectedAnswer ===
                                                                String(
                                                                  option.optionId,
                                                                )
                                                                  ? colors
                                                                      .primary
                                                                      .lightest
                                                                  : "transparent",
                                                              border:
                                                                "1.5px solid",
                                                              borderColor:
                                                                selectedAnswer ===
                                                                String(
                                                                  option.optionId,
                                                                )
                                                                  ? colors
                                                                      .primary
                                                                      .blue
                                                                  : colors
                                                                      .neutral
                                                                      .gray200,
                                                              transition:
                                                                "all 0.2s ease",
                                                              "&:hover": {
                                                                bgcolor:
                                                                  colors.primary
                                                                    .lightest +
                                                                  "80",
                                                                borderColor:
                                                                  colors.primary
                                                                    .blue,
                                                              },
                                                            }}
                                                          />
                                                        ),
                                                      )}
                                                    </RadioGroup>
                                                  </FormControl>
                                                )}
                                              {questionAllowsImageUpload(
                                                question,
                                              ) && (
                                                <Box
                                                  sx={{
                                                    mt: 2.5,
                                                    pt: 2.5,
                                                    borderTop: `1px solid ${colors.neutral.gray200}`,
                                                  }}
                                                >
                                                  <Box
                                                    sx={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 1,
                                                      mb: 1.5,
                                                    }}
                                                  >
                                                    <PhotoCamera
                                                      sx={{
                                                        fontSize: 18,
                                                        color:
                                                          colors.primary.blue,
                                                      }}
                                                    />
                                                    <Typography
                                                      variant="subtitle2"
                                                      sx={{
                                                        fontWeight: 600,
                                                        color:
                                                          colors.text.primary,
                                                      }}
                                                    >
                                                      Add photos (up to 2)
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      display: "flex",
                                                      gap: 2,
                                                      flexWrap: "wrap",
                                                    }}
                                                  >
                                                    {[0, 1].map((idx) => {
                                                      const imgs =
                                                        getMcqImagesForQuestion(
                                                          question.questionId,
                                                        );
                                                      const item = imgs[idx];
                                                      const src =
                                                        getMcqImagePreviewSrc(
                                                          item,
                                                        );
                                                      const location =
                                                        getMcqImageLocation(
                                                          item,
                                                        );
                                                      return (
                                                        <Box
                                                          key={idx}
                                                          sx={{
                                                            position:
                                                              "relative",
                                                            width: 160,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            border:
                                                              "2px dashed",
                                                            borderColor: src
                                                              ? "transparent"
                                                              : colors.neutral
                                                                  .gray300,
                                                            bgcolor: src
                                                              ? "transparent"
                                                              : colors
                                                                  .background
                                                                  .secondary,
                                                            display: "flex",
                                                            flexDirection:
                                                              "column",
                                                            alignItems:
                                                              "stretch",
                                                            justifyContent:
                                                              "center",
                                                            transition:
                                                              "border-color 0.2s, box-shadow 0.2s",
                                                            "&:hover": src
                                                              ? {}
                                                              : {
                                                                  borderColor:
                                                                    colors
                                                                      .primary
                                                                      .light,
                                                                  bgcolor:
                                                                    colors
                                                                      .primary
                                                                      .lightest +
                                                                    "40",
                                                                },
                                                          }}
                                                        >
                                                          {src ? (
                                                            <>
                                                              <Box
                                                                sx={{
                                                                  position:
                                                                    "relative",
                                                                  width: "100%",
                                                                  height: 110,
                                                                }}
                                                              >
                                                                <Box
                                                                  component="img"
                                                                  src={src}
                                                                  alt={`Capture ${idx + 1}`}
                                                                  sx={{
                                                                    width:
                                                                      "100%",
                                                                    height:
                                                                      "100%",
                                                                    objectFit:
                                                                      "cover",
                                                                    display:
                                                                      "block",
                                                                  }}
                                                                />
                                                                <IconButton
                                                                  size="small"
                                                                  sx={{
                                                                    position:
                                                                      "absolute",
                                                                    top: 6,
                                                                    right: 6,
                                                                    bgcolor:
                                                                      "rgba(0,0,0,0.55)",
                                                                    color:
                                                                      "white",
                                                                    "&:hover": {
                                                                      bgcolor:
                                                                        "rgba(0,0,0,0.75)",
                                                                    },
                                                                    width: 28,
                                                                    height: 28,
                                                                  }}
                                                                  onClick={() =>
                                                                    handleMcqImageRemove(
                                                                      question.questionId,
                                                                      idx,
                                                                    )
                                                                  }
                                                                >
                                                                  <Close
                                                                    sx={{
                                                                      fontSize: 16,
                                                                    }}
                                                                  />
                                                                </IconButton>
                                                              </Box>
                                                              {location && (
                                                                <Box
                                                                  sx={{
                                                                    px: 1,
                                                                    py: 0.75,
                                                                    bgcolor:
                                                                      "rgba(0,0,0,0.65)",
                                                                    color:
                                                                      "white",
                                                                    fontSize:
                                                                      "0.7rem",
                                                                    lineHeight: 1.3,
                                                                    borderTop:
                                                                      "1px solid rgba(255,255,255,0.15)",
                                                                  }}
                                                                >
                                                                  {location.latitude !=
                                                                    null &&
                                                                    location.longitude !=
                                                                      null && (
                                                                      <Box
                                                                        component="span"
                                                                        sx={{
                                                                          opacity: 0.95,
                                                                        }}
                                                                      >
                                                                        {location.latitude.toFixed(
                                                                          5,
                                                                        )}
                                                                        ,{" "}
                                                                        {location.longitude.toFixed(
                                                                          5,
                                                                        )}
                                                                      </Box>
                                                                    )}
                                                                  {location.address && (
                                                                    <Box
                                                                      sx={{
                                                                        mt: 0.25,
                                                                      }}
                                                                      component="div"
                                                                    >
                                                                      {location
                                                                        .address
                                                                        .length >
                                                                      48
                                                                        ? location.address.slice(
                                                                            0,
                                                                            48,
                                                                          ) +
                                                                          "…"
                                                                        : location.address}
                                                                    </Box>
                                                                  )}
                                                                </Box>
                                                              )}
                                                            </>
                                                          ) : (
                                                            <Button
                                                              fullWidth
                                                              disableRipple
                                                              startIcon={
                                                                <PhotoCamera
                                                                  sx={{
                                                                    fontSize: 22,
                                                                    color:
                                                                      colors
                                                                        .neutral
                                                                        .gray500,
                                                                  }}
                                                                />
                                                              }
                                                              onClick={() =>
                                                                handleMcqImageCaptureClick(
                                                                  question.questionId,
                                                                  idx,
                                                                )
                                                              }
                                                              disabled={
                                                                !isPublished ||
                                                                isReadOnly
                                                              }
                                                              sx={{
                                                                height: 120,
                                                                flexDirection:
                                                                  "column",
                                                                textTransform:
                                                                  "none",
                                                                color:
                                                                  colors.neutral
                                                                    .gray600,
                                                                fontSize:
                                                                  "0.8rem",
                                                                "& .MuiButton-startIcon":
                                                                  {
                                                                    margin: 0,
                                                                    mb: 0.5,
                                                                  },
                                                              }}
                                                            >
                                                              Capture image
                                                            </Button>
                                                          )}
                                                        </Box>
                                                      );
                                                    })}
                                                  </Box>
                                                </Box>
                                              )}
                                            </CardContent>
                                          )}
                                        </Card>
                                      );
                                    },
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Subject-Wise Observation Questions Section (Type 3) */}
                          {currentTab.id === "subject" && (
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
                                    sx={{
                                      fontSize: 24,
                                      color: colors.accent.purple,
                                    }}
                                  />
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 700,
                                      color: colors.text.primary,
                                    }}
                                  >
                                    {t("selfAssessment.sections.subjectTitle")}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: colors.text.secondary,
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {t(
                                    "selfAssessment.sections.subjectDescription",
                                  )}
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
                                  Select Class Group, Class, Section, and
                                  Subject
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
                                      disabled={isReadOnly}
                                      sx={{
                                        borderRadius: 2,
                                        bgcolor: "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: colors.neutral.gray300,
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                          {
                                            borderColor: colors.accent.purple,
                                          },
                                        "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                          {
                                            borderColor: colors.accent.purple,
                                            borderWidth: 2,
                                          },
                                      }}
                                    >
                                      {["1-2", "3-5", "6-8"]
                                        .filter((groupRange) => {
                                          // Filter out groups with gray/null/undefined flags
                                          const flag = getGroupFlagColor(
                                            3,
                                            groupRange,
                                          );
                                          return (
                                            flag !== null &&
                                            flag !== undefined &&
                                            flag !== "gray"
                                          );
                                        })
                                        .map((groupRange) => {
                                          const flag = getGroupFlagColor(
                                            3,
                                            groupRange,
                                          );
                                          const flagColor = flag
                                            ? getFlagColorValue(flag)
                                            : null;
                                          const displayRange =
                                            groupRange === "3-5"
                                              ? "3-5"
                                              : groupRange;

                                          return (
                                            <MenuItem
                                              key={groupRange}
                                              value={groupRange}
                                            >
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: 1,
                                                }}
                                              >
                                                {flagColor && (
                                                  <Box
                                                    sx={{
                                                      width: 10,
                                                      height: 10,
                                                      borderRadius: "50%",
                                                      bgcolor: flagColor,
                                                      flexShrink: 0,
                                                    }}
                                                  />
                                                )}
                                                <Typography>
                                                  Class {displayRange}
                                                </Typography>
                                              </Box>
                                            </MenuItem>
                                          );
                                        })}
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
                                        if (
                                          selectedSubdomain &&
                                          selectedClass
                                        ) {
                                          const subdomainId =
                                            selectedSubdomain.subDomainId ||
                                            selectedSubdomain.id;
                                          const classKey =
                                            String(selectedClass);
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
                                        filteredClassOptions.length === 0 ||
                                        isReadOnly
                                      }
                                      sx={{
                                        borderRadius: 2,
                                        bgcolor: "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: colors.neutral.gray300,
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                          {
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
                                          {t("selfAssessment.loadingClasses")}
                                        </MenuItem>
                                      ) : filteredClassOptions.length === 0 ? (
                                        <MenuItem disabled>
                                          {selectedClassGroup
                                            ? `No classes available in ${selectedClassGroup} range`
                                            : "Please select a class group first"}
                                        </MenuItem>
                                      ) : (
                                        filteredClassOptions.map((classNum) => (
                                          <MenuItem
                                            key={classNum}
                                            value={classNum}
                                          >
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
                                        !selectedClass ||
                                        sections.length === 0 ||
                                        isReadOnly
                                      }
                                      sx={{
                                        borderRadius: 2,
                                        bgcolor: "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: colors.neutral.gray300,
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                          {
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
                                        // Clear MCQ/option answers only; keep textAnswers so FLN prefill persists
                                        setAnswers({});
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
                                        subjects.length === 0 ||
                                        isReadOnly
                                      }
                                      sx={{
                                        borderRadius: 2,
                                        bgcolor: "white",
                                        "& .MuiOutlinedInput-notchedOutline": {
                                          borderColor: colors.neutral.gray300,
                                        },
                                        "&:hover .MuiOutlinedInput-notchedOutline":
                                          {
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
                                    t("selfAssessment.failedToLoadQuestions")}
                                </Alert>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2.5,
                                  }}
                                >
                                  {currentTab.questions.map(
                                    (question, index) => {
                                      const options = parseOptions(
                                        question.options,
                                      );
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
                                        expandedQuestions[
                                          question.questionId
                                        ] ?? true;
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
                                            boxShadow:
                                              "0 2px 8px rgba(0,0,0,0.08)",
                                            overflow: "hidden",
                                            "&:hover": {
                                              boxShadow:
                                                "0 4px 12px rgba(0,0,0,0.1)",
                                            },
                                          }}
                                        >
                                          {/* Question Header - Always Visible */}
                                          <Box
                                            onClick={() =>
                                              toggleQuestionExpansion(
                                                question.questionId,
                                              )
                                            }
                                            sx={{
                                              p: 2.5,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 2,
                                              bgcolor:
                                                colors.background.primary,
                                              borderBottom: isExpanded
                                                ? `1px solid ${colors.neutral.gray200}`
                                                : "none",
                                              "&:hover": {
                                                bgcolor:
                                                  colors.background.secondary,
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
                                              {options &&
                                                options.length > 0 && (
                                                  <FormControl
                                                    component="fieldset"
                                                    fullWidth
                                                    sx={{ mb: 3 }}
                                                  >
                                                    <RadioGroup
                                                      value={
                                                        selectedAnswer || ""
                                                      }
                                                      onChange={(e) =>
                                                        handleAnswerChange(
                                                          question.questionId,
                                                          e.target.value,
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
                                                              option.optionId,
                                                            )}
                                                            control={
                                                              <Radio
                                                                disabled={
                                                                  !isPublished ||
                                                                  isReadOnly
                                                                }
                                                                sx={{
                                                                  color:
                                                                    colors
                                                                      .accent
                                                                      .purple,
                                                                  "&.Mui-checked":
                                                                    {
                                                                      color:
                                                                        colors
                                                                          .accent
                                                                          .purple,
                                                                    },
                                                                }}
                                                              />
                                                            }
                                                            label={
                                                              <Typography variant="body2">
                                                                {getOptionText(
                                                                  option,
                                                                )}
                                                              </Typography>
                                                            }
                                                            sx={{
                                                              mb: 1.5,
                                                              p: 2,
                                                              borderRadius: 2,
                                                              bgcolor:
                                                                selectedAnswer ===
                                                                String(
                                                                  option.optionId,
                                                                )
                                                                  ? colors
                                                                      .accent
                                                                      .purple +
                                                                    "15"
                                                                  : "transparent",
                                                              border:
                                                                "1.5px solid",
                                                              borderColor:
                                                                selectedAnswer ===
                                                                String(
                                                                  option.optionId,
                                                                )
                                                                  ? colors
                                                                      .accent
                                                                      .purple
                                                                  : colors
                                                                      .neutral
                                                                      .gray200,
                                                              transition:
                                                                "all 0.2s ease",
                                                              "&:hover": {
                                                                bgcolor:
                                                                  colors.accent
                                                                    .purple +
                                                                  "15",
                                                                borderColor:
                                                                  colors.accent
                                                                    .purple,
                                                              },
                                                            }}
                                                          />
                                                        ),
                                                      )}
                                                    </RadioGroup>
                                                  </FormControl>
                                                )}
                                              {questionAllowsImageUpload(
                                                question,
                                              ) && (
                                                <Box
                                                  sx={{
                                                    mt: 2.5,
                                                    pt: 2.5,
                                                    borderTop: `1px solid ${colors.neutral.gray200}`,
                                                  }}
                                                >
                                                  <Box
                                                    sx={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 1,
                                                      mb: 1.5,
                                                    }}
                                                  >
                                                    <PhotoCamera
                                                      sx={{
                                                        fontSize: 18,
                                                        color:
                                                          colors.primary.blue,
                                                      }}
                                                    />
                                                    <Typography
                                                      variant="subtitle2"
                                                      sx={{
                                                        fontWeight: 600,
                                                        color:
                                                          colors.text.primary,
                                                      }}
                                                    >
                                                      Add photos (up to 2)
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      display: "flex",
                                                      gap: 2,
                                                      flexWrap: "wrap",
                                                    }}
                                                  >
                                                    {[0, 1].map((idx) => {
                                                      const imgs =
                                                        getMcqImagesForQuestion(
                                                          question.questionId,
                                                        );
                                                      const item = imgs[idx];
                                                      const src =
                                                        getMcqImagePreviewSrc(
                                                          item,
                                                        );
                                                      const location =
                                                        getMcqImageLocation(
                                                          item,
                                                        );
                                                      return (
                                                        <Box
                                                          key={idx}
                                                          sx={{
                                                            position:
                                                              "relative",
                                                            width: 160,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            border:
                                                              "2px dashed",
                                                            borderColor: src
                                                              ? "transparent"
                                                              : colors.neutral
                                                                  .gray300,
                                                            bgcolor: src
                                                              ? "transparent"
                                                              : colors
                                                                  .background
                                                                  .secondary,
                                                            display: "flex",
                                                            flexDirection:
                                                              "column",
                                                            alignItems:
                                                              "stretch",
                                                            justifyContent:
                                                              "center",
                                                            transition:
                                                              "border-color 0.2s, box-shadow 0.2s",
                                                            "&:hover": src
                                                              ? {}
                                                              : {
                                                                  borderColor:
                                                                    colors
                                                                      .primary
                                                                      .light,
                                                                  bgcolor:
                                                                    colors
                                                                      .primary
                                                                      .lightest +
                                                                    "40",
                                                                },
                                                          }}
                                                        >
                                                          {src ? (
                                                            <>
                                                              <Box
                                                                sx={{
                                                                  position:
                                                                    "relative",
                                                                  width: "100%",
                                                                  height: 110,
                                                                }}
                                                              >
                                                                <Box
                                                                  component="img"
                                                                  src={src}
                                                                  alt={`Capture ${idx + 1}`}
                                                                  sx={{
                                                                    width:
                                                                      "100%",
                                                                    height:
                                                                      "100%",
                                                                    objectFit:
                                                                      "cover",
                                                                    display:
                                                                      "block",
                                                                  }}
                                                                />
                                                                <IconButton
                                                                  size="small"
                                                                  sx={{
                                                                    position:
                                                                      "absolute",
                                                                    top: 6,
                                                                    right: 6,
                                                                    bgcolor:
                                                                      "rgba(0,0,0,0.55)",
                                                                    color:
                                                                      "white",
                                                                    "&:hover": {
                                                                      bgcolor:
                                                                        "rgba(0,0,0,0.75)",
                                                                    },
                                                                    width: 28,
                                                                    height: 28,
                                                                  }}
                                                                  onClick={() =>
                                                                    handleMcqImageRemove(
                                                                      question.questionId,
                                                                      idx,
                                                                    )
                                                                  }
                                                                >
                                                                  <Close
                                                                    sx={{
                                                                      fontSize: 16,
                                                                    }}
                                                                  />
                                                                </IconButton>
                                                              </Box>
                                                              {location && (
                                                                <Box
                                                                  sx={{
                                                                    px: 1,
                                                                    py: 0.75,
                                                                    bgcolor:
                                                                      "rgba(0,0,0,0.65)",
                                                                    color:
                                                                      "white",
                                                                    fontSize:
                                                                      "0.7rem",
                                                                    lineHeight: 1.3,
                                                                    borderTop:
                                                                      "1px solid rgba(255,255,255,0.15)",
                                                                  }}
                                                                >
                                                                  {location.latitude !=
                                                                    null &&
                                                                    location.longitude !=
                                                                      null && (
                                                                      <Box
                                                                        component="span"
                                                                        sx={{
                                                                          opacity: 0.95,
                                                                        }}
                                                                      >
                                                                        {location.latitude.toFixed(
                                                                          5,
                                                                        )}
                                                                        ,{" "}
                                                                        {location.longitude.toFixed(
                                                                          5,
                                                                        )}
                                                                      </Box>
                                                                    )}
                                                                  {location.address && (
                                                                    <Box
                                                                      sx={{
                                                                        mt: 0.25,
                                                                      }}
                                                                      component="div"
                                                                    >
                                                                      {location
                                                                        .address
                                                                        .length >
                                                                      48
                                                                        ? location.address.slice(
                                                                            0,
                                                                            48,
                                                                          ) +
                                                                          "…"
                                                                        : location.address}
                                                                    </Box>
                                                                  )}
                                                                </Box>
                                                              )}
                                                            </>
                                                          ) : (
                                                            <Button
                                                              fullWidth
                                                              disableRipple
                                                              startIcon={
                                                                <PhotoCamera
                                                                  sx={{
                                                                    fontSize: 22,
                                                                    color:
                                                                      colors
                                                                        .neutral
                                                                        .gray500,
                                                                  }}
                                                                />
                                                              }
                                                              onClick={() =>
                                                                handleMcqImageCaptureClick(
                                                                  question.questionId,
                                                                  idx,
                                                                )
                                                              }
                                                              disabled={
                                                                !isPublished ||
                                                                isReadOnly
                                                              }
                                                              sx={{
                                                                height: 120,
                                                                flexDirection:
                                                                  "column",
                                                                textTransform:
                                                                  "none",
                                                                color:
                                                                  colors.neutral
                                                                    .gray600,
                                                                fontSize:
                                                                  "0.8rem",
                                                                "& .MuiButton-startIcon":
                                                                  {
                                                                    margin: 0,
                                                                    mb: 0.5,
                                                                  },
                                                              }}
                                                            >
                                                              Capture image
                                                            </Button>
                                                          )}
                                                        </Box>
                                                      );
                                                    })}
                                                  </Box>
                                                </Box>
                                              )}
                                            </CardContent>
                                          )}
                                        </Card>
                                      );
                                    },
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* FLN Questions Section (Type 4) */}
                          {currentTab.id === "fln" && (
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
                                    {t("selfAssessment.sections.flnTitle")}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: colors.text.secondary,
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {t("selfAssessment.sections.flnDescription")}
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
                                    t("selfAssessment.failedToLoadQuestions")}
                                </Alert>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2.5,
                                  }}
                                >
                                  {currentTab.questions.map(
                                    (question, index) => {
                                      const textAnswer =
                                        textAnswers[question.questionId] || "";
                                      const isExpanded =
                                        expandedQuestions[
                                          question.questionId
                                        ] ?? true;

                                      // Check if FLN question has any answers
                                      let questionProgress = 0;
                                      if (textAnswer) {
                                        try {
                                          const flnData =
                                            JSON.parse(textAnswer);
                                          const hasAnswer = Object.keys(
                                            flnData,
                                          ).some(
                                            (key) =>
                                              flnData[key] &&
                                              flnData[key].obtainedMarks,
                                          );
                                          questionProgress = hasAnswer
                                            ? 100
                                            : 0;
                                        } catch (e) {
                                          questionProgress = 0;
                                        }
                                      }
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
                                            boxShadow:
                                              "0 2px 8px rgba(0,0,0,0.08)",
                                            overflow: "hidden",
                                            "&:hover": {
                                              boxShadow:
                                                "0 4px 12px rgba(0,0,0,0.1)",
                                            },
                                          }}
                                        >
                                          {/* Question Header - Always Visible */}
                                          <Box
                                            onClick={() =>
                                              toggleQuestionExpansion(
                                                question.questionId,
                                              )
                                            }
                                            sx={{
                                              p: 2.5,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 2,
                                              bgcolor:
                                                colors.background.primary,
                                              borderBottom: isExpanded
                                                ? `1px solid ${colors.neutral.gray200}`
                                                : "none",
                                              "&:hover": {
                                                bgcolor:
                                                  colors.background.secondary,
                                              },
                                            }}
                                          >
                                            <Chip
                                              label={`Q ${questionNumber}`}
                                              size="small"
                                              sx={{
                                                bgcolor:
                                                  colors.accent.orangeDark,
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
                                                  const maxMarks =
                                                    totalStudents * 10;

                                                  return (
                                                    <Box
                                                      key={classNum}
                                                      sx={{
                                                        p: 2.5,
                                                        borderRadius: 2,
                                                        bgcolor:
                                                          colors.background
                                                            .secondary,
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
                                                            color:
                                                              colors.text
                                                                .primary,
                                                            whiteSpace:
                                                              "nowrap",
                                                          }}
                                                        >
                                                          Total number of
                                                          students for Class{" "}
                                                          {classNum}:
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
                                                                colors.primary
                                                                  .blue,
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
                                                            color:
                                                              colors.text
                                                                .primary,
                                                            whiteSpace:
                                                              "nowrap",
                                                          }}
                                                        >
                                                          Obtained marks:
                                                        </Typography>
                                                        <TextField
                                                          size="small"
                                                          type="number"
                                                          disabled={
                                                            !isPublished ||
                                                            isReadOnly
                                                          }
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
                                                              (Number(value) >=
                                                                0 &&
                                                                Number(value) <=
                                                                  maxMarks)
                                                            ) {
                                                              const newData = {
                                                                ...flnData,
                                                                [classNum]: {
                                                                  obtainedMarks:
                                                                    value,
                                                                  answerId:
                                                                    classData.answerId ||
                                                                    null, // Preserve answerId
                                                                },
                                                              };
                                                              handleTextAnswerChange(
                                                                question.questionId,
                                                                JSON.stringify(
                                                                  newData,
                                                                ),
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
                                                              classData.obtainedMarks,
                                                            ) > maxMarks
                                                          }
                                                          sx={{
                                                            width: "150px",
                                                            "& .MuiOutlinedInput-root":
                                                              {
                                                                borderRadius: 0.5,
                                                                bgcolor:
                                                                  "white",
                                                              },
                                                          }}
                                                        />
                                                        <Typography
                                                          variant="body2"
                                                          sx={{
                                                            fontWeight: 600,
                                                            color:
                                                              colors.semantic
                                                                .warning,
                                                            whiteSpace:
                                                              "nowrap",
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
                                    },
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* General Questions Section */}
                          {currentTab.id === "general" && (
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
                                    sx={{
                                      fontSize: 24,
                                      color: colors.accent.green,
                                    }}
                                  />
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: 700,
                                      color: colors.text.primary,
                                    }}
                                  >
                                    {t("selfAssessment.sections.generalTitle")}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: colors.text.secondary,
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {t("selfAssessment.sections.generalDescription")}
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
                                    t("selfAssessment.failedToLoadQuestions")}
                                </Alert>
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2.5,
                                  }}
                                >
                                  {currentTab.questions.map(
                                    (question, index) => {
                                      const options = parseOptions(
                                        question.options,
                                      );
                                      const userSelectedAnswer =
                                        answers[question.questionId];
                                      const apiSelectedAnswer =
                                        question.selectedOptionId
                                          ? String(question.selectedOptionId)
                                          : null;
                                      const selectedAnswer =
                                        userSelectedAnswer || apiSelectedAnswer;
                                      const isExpanded =
                                        expandedQuestions[
                                          question.questionId
                                        ] ?? true;
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
                                            boxShadow:
                                              "0 2px 8px rgba(0,0,0,0.08)",
                                            overflow: "hidden",
                                            "&:hover": {
                                              boxShadow:
                                                "0 4px 12px rgba(0,0,0,0.1)",
                                            },
                                          }}
                                        >
                                          {/* Question Header - Always Visible */}
                                          <Box
                                            onClick={() =>
                                              toggleQuestionExpansion(
                                                question.questionId,
                                              )
                                            }
                                            sx={{
                                              p: 2.5,
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              gap: 2,
                                              bgcolor:
                                                colors.background.primary,
                                              borderBottom: isExpanded
                                                ? `1px solid ${colors.neutral.gray200}`
                                                : "none",
                                              "&:hover": {
                                                bgcolor:
                                                  colors.background.secondary,
                                              },
                                            }}
                                          >
                                            <Chip
                                              label={`Q ${questionNumber}`}
                                              size="small"
                                              sx={{
                                                bgcolor:
                                                  colors.accent.greenDark,
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
                                              {options &&
                                                options.length > 0 && (
                                                  <FormControl
                                                    component="fieldset"
                                                    fullWidth
                                                    sx={{ mb: 3 }}
                                                  >
                                                    <RadioGroup
                                                      value={
                                                        selectedAnswer || ""
                                                      }
                                                      onChange={(e) =>
                                                        handleAnswerChange(
                                                          question.questionId,
                                                          e.target.value,
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
                                                              option.optionId,
                                                            )}
                                                            control={
                                                              <Radio
                                                                disabled={
                                                                  !isPublished ||
                                                                  isSubmitted
                                                                }
                                                                sx={{
                                                                  color:
                                                                    colors
                                                                      .primary
                                                                      .blue,
                                                                  "&.Mui-checked":
                                                                    {
                                                                      color:
                                                                        colors
                                                                          .primary
                                                                          .blue,
                                                                    },
                                                                }}
                                                              />
                                                            }
                                                            label={
                                                              <Typography variant="body2">
                                                                {getOptionText(
                                                                  option,
                                                                )}
                                                              </Typography>
                                                            }
                                                            sx={{
                                                              mb: 1.5,
                                                              p: 2,
                                                              borderRadius: 2,
                                                              bgcolor:
                                                                selectedAnswer ===
                                                                String(
                                                                  option.optionId,
                                                                )
                                                                  ? colors
                                                                      .primary
                                                                      .lightest
                                                                  : "transparent",
                                                              border:
                                                                "1.5px solid",
                                                              borderColor:
                                                                selectedAnswer ===
                                                                String(
                                                                  option.optionId,
                                                                )
                                                                  ? colors
                                                                      .primary
                                                                      .blue
                                                                  : colors
                                                                      .neutral
                                                                      .gray200,
                                                              transition:
                                                                "all 0.2s ease",
                                                              "&:hover": {
                                                                bgcolor:
                                                                  colors.primary
                                                                    .lightest +
                                                                  "80",
                                                                borderColor:
                                                                  colors.primary
                                                                    .blue,
                                                              },
                                                            }}
                                                          />
                                                        ),
                                                      )}
                                                    </RadioGroup>
                                                  </FormControl>
                                                )}
                                              {questionAllowsImageUpload(
                                                question,
                                              ) && (
                                                <Box
                                                  sx={{
                                                    mt: 2.5,
                                                    pt: 2.5,
                                                    borderTop: `1px solid ${colors.neutral.gray200}`,
                                                  }}
                                                >
                                                  <Box
                                                    sx={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: 1,
                                                      mb: 1.5,
                                                    }}
                                                  >
                                                    <PhotoCamera
                                                      sx={{
                                                        fontSize: 18,
                                                        color:
                                                          colors.primary.blue,
                                                      }}
                                                    />
                                                    <Typography
                                                      variant="subtitle2"
                                                      sx={{
                                                        fontWeight: 600,
                                                        color:
                                                          colors.text.primary,
                                                      }}
                                                    >
                                                      Add photos (up to 2)
                                                    </Typography>
                                                  </Box>
                                                  <Box
                                                    sx={{
                                                      display: "flex",
                                                      gap: 2,
                                                      flexWrap: "wrap",
                                                    }}
                                                  >
                                                    {[0, 1].map((idx) => {
                                                      const imgs =
                                                        getMcqImagesForQuestion(
                                                          question.questionId,
                                                        );
                                                      const item = imgs[idx];
                                                      const src =
                                                        getMcqImagePreviewSrc(
                                                          item,
                                                        );
                                                      const location =
                                                        getMcqImageLocation(
                                                          item,
                                                        );
                                                      return (
                                                        <Box
                                                          key={idx}
                                                          sx={{
                                                            position:
                                                              "relative",
                                                            width: 160,
                                                            borderRadius: 2,
                                                            overflow: "hidden",
                                                            border:
                                                              "2px dashed",
                                                            borderColor: src
                                                              ? "transparent"
                                                              : colors.neutral
                                                                  .gray300,
                                                            bgcolor: src
                                                              ? "transparent"
                                                              : colors
                                                                  .background
                                                                  .secondary,
                                                            display: "flex",
                                                            flexDirection:
                                                              "column",
                                                            alignItems:
                                                              "stretch",
                                                            justifyContent:
                                                              "center",
                                                            transition:
                                                              "border-color 0.2s, box-shadow 0.2s",
                                                            "&:hover": src
                                                              ? {}
                                                              : {
                                                                  borderColor:
                                                                    colors
                                                                      .primary
                                                                      .light,
                                                                  bgcolor:
                                                                    colors
                                                                      .primary
                                                                      .lightest +
                                                                    "40",
                                                                },
                                                          }}
                                                        >
                                                          {src ? (
                                                            <>
                                                              <Box
                                                                sx={{
                                                                  position:
                                                                    "relative",
                                                                  width: "100%",
                                                                  height: 110,
                                                                }}
                                                              >
                                                                <Box
                                                                  component="img"
                                                                  src={src}
                                                                  alt={`Capture ${idx + 1}`}
                                                                  sx={{
                                                                    width:
                                                                      "100%",
                                                                    height:
                                                                      "100%",
                                                                    objectFit:
                                                                      "cover",
                                                                    display:
                                                                      "block",
                                                                  }}
                                                                />
                                                                <IconButton
                                                                  size="small"
                                                                  sx={{
                                                                    position:
                                                                      "absolute",
                                                                    top: 6,
                                                                    right: 6,
                                                                    bgcolor:
                                                                      "rgba(0,0,0,0.55)",
                                                                    color:
                                                                      "white",
                                                                    "&:hover": {
                                                                      bgcolor:
                                                                        "rgba(0,0,0,0.75)",
                                                                    },
                                                                    width: 28,
                                                                    height: 28,
                                                                  }}
                                                                  onClick={() =>
                                                                    handleMcqImageRemove(
                                                                      question.questionId,
                                                                      idx,
                                                                    )
                                                                  }
                                                                >
                                                                  <Close
                                                                    sx={{
                                                                      fontSize: 16,
                                                                    }}
                                                                  />
                                                                </IconButton>
                                                              </Box>
                                                              {location && (
                                                                <Box
                                                                  sx={{
                                                                    px: 1,
                                                                    py: 0.75,
                                                                    bgcolor:
                                                                      "rgba(0,0,0,0.65)",
                                                                    color:
                                                                      "white",
                                                                    fontSize:
                                                                      "0.7rem",
                                                                    lineHeight: 1.3,
                                                                    borderTop:
                                                                      "1px solid rgba(255,255,255,0.15)",
                                                                  }}
                                                                >
                                                                  {location.latitude !=
                                                                    null &&
                                                                    location.longitude !=
                                                                      null && (
                                                                      <Box
                                                                        component="span"
                                                                        sx={{
                                                                          opacity: 0.95,
                                                                        }}
                                                                      >
                                                                        {location.latitude.toFixed(
                                                                          5,
                                                                        )}
                                                                        ,{" "}
                                                                        {location.longitude.toFixed(
                                                                          5,
                                                                        )}
                                                                      </Box>
                                                                    )}
                                                                  {location.address && (
                                                                    <Box
                                                                      sx={{
                                                                        mt: 0.25,
                                                                      }}
                                                                      component="div"
                                                                    >
                                                                      {location
                                                                        .address
                                                                        .length >
                                                                      48
                                                                        ? location.address.slice(
                                                                            0,
                                                                            48,
                                                                          ) +
                                                                          "…"
                                                                        : location.address}
                                                                    </Box>
                                                                  )}
                                                                </Box>
                                                              )}
                                                            </>
                                                          ) : (
                                                            <Button
                                                              fullWidth
                                                              disableRipple
                                                              startIcon={
                                                                <PhotoCamera
                                                                  sx={{
                                                                    fontSize: 22,
                                                                    color:
                                                                      colors
                                                                        .neutral
                                                                        .gray500,
                                                                  }}
                                                                />
                                                              }
                                                              onClick={() =>
                                                                handleMcqImageCaptureClick(
                                                                  question.questionId,
                                                                  idx,
                                                                )
                                                              }
                                                              disabled={
                                                                !isPublished ||
                                                                isSubmitted
                                                              }
                                                              sx={{
                                                                height: 120,
                                                                flexDirection:
                                                                  "column",
                                                                textTransform:
                                                                  "none",
                                                                color:
                                                                  colors.neutral
                                                                    .gray600,
                                                                fontSize:
                                                                  "0.8rem",
                                                                "& .MuiButton-startIcon":
                                                                  {
                                                                    margin: 0,
                                                                    mb: 0.5,
                                                                  },
                                                              }}
                                                            >
                                                              Capture image
                                                            </Button>
                                                          )}
                                                        </Box>
                                                      );
                                                    })}
                                                  </Box>
                                                </Box>
                                              )}
                                            </CardContent>
                                          )}
                                        </Card>
                                      );
                                    },
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      )}

                    {/* Submit Button */}
                    {isPublished && !isReadOnly && (
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
                          disabled={(() => {
                            if (
                              submitSubdomainWiseAnswersMutation.isPending
                            ) {
                              return true;
                            }

                            const hasAnswers =
                              (answers && Object.keys(answers).length > 0) ||
                              (textAnswers &&
                                Object.keys(textAnswers).length > 0);

                            if (!hasAnswers) {
                              return true;
                            }

                            const hasAnsweredClassBasedQuestions =
                              classBasedQuestions.some(
                                (q) =>
                                  answers[q.questionId] ||
                                  textAnswers[q.questionId],
                              );

                            const hasAnsweredSubjectQuestions =
                              subjectObservationQuestions.some(
                                (q) =>
                                  answers[q.questionId] ||
                                  textAnswers[q.questionId],
                              );

                            if (hasAnsweredClassBasedQuestions) {
                              if (!selectedClass || !selectedSection) {
                                return true;
                              }
                              if (
                                hasAnsweredSubjectQuestions &&
                                !selectedSubject
                              ) {
                                return true;
                              }
                            }

                            return false;
                          })()}
                          startIcon={
                            submitSubdomainWiseAnswersMutation.isPending ? (
                              <CircularProgress
                                size={18}
                                thickness={5}
                                color="inherit"
                                aria-hidden
                              />
                            ) : null
                          }
                          sx={{
                            bgcolor: colors.accent.green,
                            minWidth: 168,
                            textTransform: "none",
                            fontWeight: 600,
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
                                  (d) => d.domainId === selectedDomain.domainId,
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
                                                {Math.round(subdomainProgress)}%
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
                          {assessments.length > 1 && !chartDrilldownAssessmentId
                            ? "Assessment Progress Overview"
                            : "Domain Progress Overview"}
                        </Typography>
                        {assessments.length > 1 && chartDrilldownAssessmentId && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setChartDrilldownAssessmentId(null)}
                            sx={{ alignSelf: "flex-start", textTransform: "none" }}
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
                                  if (
                                    assessments.length > 1 &&
                                    !chartDrilldownAssessmentId
                                  ) {
                                    const assessment = assessments.find(
                                      (a) => a.assessmentId === data.assessmentId
                                    );
                                    if (assessment) {
                                      handleAssessmentSelect(assessment);
                                      setChartDrilldownAssessmentId(
                                        assessment.assessmentId
                                      );
                                    }
                                    return;
                                  }

                                  const sourceDomains = chartDrilldownAssessmentId
                                    ? assessments.find(
                                        (a) =>
                                          a.assessmentId ===
                                          chartDrilldownAssessmentId
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
          </Box>
        </Box>
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

export default SelfAssessment;
