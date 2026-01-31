import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../config/queryClient";
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
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
  TextField,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CheckCircle,
  ArrowForward,
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
  Create,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import {
  useGetDomainsQuery,
  useGetSubdomainQuestionsQuery,
  useSubmitAnswerMutation,
  useSubmitSubdomainWiseAnswersMutation,
  useGetSchoolDataQuery,
  useGetSchoolSectionsQuery,
  useGetSchoolGradesQuery,
  useSubmitAssessmentMutation,
} from "../../../services/verifierService";
import { getRoleId } from "../../../constants/roles";
import { enqueueSnackbar } from "notistack";
import useAuthStore from "../../../store/useAuthStore";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { useGetClassWiseSubjectsQuery } from "../../../services/adminService";
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

const SchoolVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userName } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentLanguage, setCurrentLanguage] = useState("gu");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [answers, setAnswers] = useState({});
  const [subdomainAnswers, setSubdomainAnswers] = useState({});
  const [classWiseAnswers, setClassWiseAnswers] = useState({});
  const [classWiseTextAnswers, setClassWiseTextAnswers] = useState({});
  const [selectedClassGroup, setSelectedClassGroup] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [textAnswers, setTextAnswers] = useState({});
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [selectedQuestionTab, setSelectedQuestionTab] = useState(0);

  // Get school info from location state
  const schoolFromState = location.state?.school;
  const schoolId =
    schoolFromState?.schoolId || schoolFromState?.schoolCode || userName;

  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  // Use inspector role ID (roleId: 3)
  const roleId = getRoleId("inspector");

  // Debug: Log API call parameters
  useEffect(() => {
    console.log("SchoolVerification API Debug:", {
      roleId,
      languageCode,
      schoolId,
      schoolFromState,
      userName,
      willCallAPI: !!roleId,
    });
  }, [roleId, languageCode, schoolId, schoolFromState, userName]);

  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isError: isErrorDomains,
    refetch: refetchDomains,
  } = useGetDomainsQuery({
    roleId,
    languageCode,
    schoolId: schoolId || undefined,
    enabled: !!roleId,
  });

  // Fetch all questions (without class filter) for counting purposes
  const { data: allQuestionsData } = useGetSubdomainQuestionsQuery({
    subDomainId: selectedSubdomain?.subDomainId || selectedSubdomain?.id,
    roleId,
    languageCode,
    userId: userId ? Number(userId) : undefined,
    schoolId: schoolId || undefined,
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
    schoolId: schoolId || undefined,
    enabled: !!selectedSubdomain,
  });

  const { data: schoolDataResponse, isLoading: isLoadingSchoolData } =
    useGetSchoolDataQuery({
      schoolId: schoolId || undefined,
    });

  const schoolData = schoolDataResponse?.data || {};

  // Fetch school grades for FLN questions
  const { data: gradesData, isLoading: isLoadingGrades } =
    useGetSchoolGradesQuery({
      schoolId: schoolId || undefined,
      enabled: !!schoolId,
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


  // Fetch all school sections once
  const { data: sectionsData, isLoading: isLoadingSections } =
    useGetSchoolSectionsQuery({
      schoolId: schoolId || undefined,
      enabled: !!schoolId,
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

  const domains = domainsData?.data || [];
  const isPublished = domainsData?.isPublished || false;
  const endDate = domainsData?.endDate || null;
  const isSubmitted = domainsData?.isSubmitted || false;
  const sessionId = domainsData?.sessionId || null;

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
      d.subDomain?.some(
        (sd) => (sd.subDomainId || sd.id) === subdomainId
      )
    );
    
    if (!domain) return null;
    
    // Find the subdomain
    const subdomain = domain.subDomain?.find(
      (sd) => (sd.subDomainId || sd.id) === subdomainId
    );
    
    if (!subdomain || !subdomain.groupWise) return null;
    
    // Map the dropdown group range to API format
    const apiGroupRange = mapGroupRangeToApiFormat(groupRange);
    
    // Find the matching groupWise entry
    const groupWise = subdomain.groupWise.find(
      (gw) =>
        (gw.questionType === questionType || String(gw.questionType) === String(questionType)) &&
        gw.groupRange === apiGroupRange
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
    if (!subdomain || !subdomain.groupWise || !Array.isArray(subdomain.groupWise)) {
      return 0;
    }
    
    return subdomain.groupWise
      .filter((gw) => 
        gw.questionType === questionType || 
        String(gw.questionType) === String(questionType)
      )
      .reduce((total, gw) => total + (gw.totalQuestions || 0), 0);
  };

  // Get total questions count from API groupWise data for current subdomain
  const getTotalQuestionsCount = (questionType) => {
    if (!selectedSubdomain) return 0;
    
    const subdomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;
    
    // Find the subdomain in domains data
    const domain = domains.find((d) =>
      d.subDomain?.some(
        (sd) => (sd.subDomainId || sd.id) === subdomainId
      )
    );
    
    if (!domain) return 0;
    
    const subdomain = domain.subDomain?.find(
      (sd) => (sd.subDomainId || sd.id) === subdomainId
    );
    
    if (!subdomain) return 0;
    
    // For question types 2 and 3, use groupWise data
    if (questionType === 2 || questionType === "2" || questionType === 3 || questionType === "3") {
      return getTotalQuestionsFromGroupWise(subdomain, questionType);
    }
    
    // For question types 1 and 4, check if subdomain has totalQuestions
    // If groupWise exists, subtract those counts to get type 1/4 count
    if (subdomain.totalQuestions !== undefined && subdomain.totalQuestions !== null) {
      const groupWiseTotal = subdomain.groupWise?.reduce(
        (total, gw) => total + (gw.totalQuestions || 0),
        0
      ) || 0;
      return Math.max(0, subdomain.totalQuestions - groupWiseTotal);
    }
    
    return 0;
  };

  // All questions for counting (unfiltered by class) - kept for answer checking
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

  // Get total counts from API groupWise data
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

  // Questions for counting (unfiltered) - kept for answer checking logic
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

  // Get domain name based on language
  const getDomainName = (domain) => {
    if (!domain) return "";
    if (languageCode === "EN") {
      return domain.domainNameEn || domain.domainName || "";
    } else if (languageCode === "HI") {
      return domain.domainNameHi || domain.domainName || "";
    } else {
      return domain.domainNameGu || domain.domainName || "";
    }
  };

  // Get subdomain name based on language
  const getSubdomainName = (subdomain) => {
    if (!subdomain) return "";
    if (languageCode === "EN") {
      return subdomain.subDomainNameEn || subdomain.subDomainName || "";
    } else if (languageCode === "HI") {
      return subdomain.subDomainNameHi || subdomain.subDomainName || "";
    } else {
      return subdomain.subDomainNameGu || subdomain.subDomainName || "";
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

  // Calculate subdomain progress
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
      const answeredQuestions = allQuestions.filter((q) => {
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
        const apiAnswer =
          shouldShowApiAnswer(q) && q.selectedOptionId
            ? q.selectedOptionId
            : null;
        return answers[q.questionId] || apiAnswer;
      }).length;
      return (answeredQuestions / totalQuestions) * 100;
    }

    return 0;
  };

  // Calculate domain progress
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

  // Get domain icon
  // Get domain icon based on domain ID or name
  const getDomainIcon = (domain) => {
    if (!domain) return <Assessment sx={{ fontSize: 24 }} />;
    const domainId = domain.domainId;
    const domainName = getDomainName(domain);
    if (!domainName) return <Assessment sx={{ fontSize: 24 }} />;
    const domainNameLower = domainName.toLowerCase();

    if (
      domainId === 1 ||
      domainNameLower.includes("leadership") ||
      domainNameLower.includes("governance")
    ) {
      return <WorkspacePremium sx={{ fontSize: 24 }} />;
    } else if (
      domainId === 2 ||
      domainNameLower.includes("curriculum") ||
      domainNameLower.includes("instruction") ||
      domainNameLower.includes("teaching") ||
      domainNameLower.includes("learning")
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
      domainNameLower.includes("facility") ||
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
    return <Assessment sx={{ fontSize: 24 }} />;
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

  // Handle domain selection
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
    if (!selectedSubdomain) return;

    // If class is cleared, also clear section and subject
    if (!selectedClass) {
      setSelectedSection(null);
      setSelectedSubject(null);
      setAnswers({});
      setTextAnswers({});
      return;
    }

    // Reset subject when class changes (since it's class-specific)
    setSelectedSubject(null);

    // Reset answers - they will be loaded from API if they exist
    setAnswers({});
    setTextAnswers({});
  }, [selectedClass, selectedSubdomain]);

  // Effect to handle section changes - reset subject and answers
  useEffect(() => {
    if (!selectedSubdomain) return;

    // If section is cleared, also clear subject
    if (!selectedSection) {
      setSelectedSubject(null);
      setAnswers({});
      setTextAnswers({});
      return;
    }

    // Reset subject when section changes
    setSelectedSubject(null);

    // Reset answers - they will be loaded from API if they exist
    setAnswers({});
    setTextAnswers({});
  }, [selectedSection, selectedSubdomain]);

  // Effect to handle subject changes - reset answers
  useEffect(() => {
    if (!selectedSubdomain) return;

    // If subject is cleared, clear answers
    if (!selectedSubject) {
      setAnswers({});
      setTextAnswers({});
      return;
    }

    // Reset answers when subject changes - they will be loaded from API if they exist
    setAnswers({});
    setTextAnswers({});
  }, [selectedSubject, selectedSubdomain]);

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
        // AND if the question has a selectedOptionId (meaning it has an answer from API)
        if (!shouldLoadAnswer || !question.selectedOptionId) {
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
          // For other questions, load selected option only if it matches current selections
          // For subject questions, verify the question's subjectId matches selectedSubject
          if (questionType === 3 || questionType === "3") {
            // For subject questions, only load if question's subjectId matches selectedSubject
            if (question.subjectId && Number(question.subjectId) === Number(selectedSubject)) {
              apiAnswers[question.questionId] = String(question.selectedOptionId);
            }
          } else {
            // For other question types, load the answer
            apiAnswers[question.questionId] = String(question.selectedOptionId);
          }
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
      // Only set answers if we have valid answers that match current selections
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
      } else {
        // If no API answers match current selections, ensure answers are cleared
        // This prevents showing cached answers from previous selections
        setAnswers({});
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
      } else {
        // If no API text answers match current selections, ensure textAnswers are cleared
        setTextAnswers({});
      }
    }
  }, [
    allQuestions,
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
        // Refetch questions and domains to update progress bars and get sessionId
        refetchQuestions();
        refetchDomains();
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
    onSuccess: (data) => {
      console.log("Assessment submitted successfully:", data);
      // Close the confirmation modal
      setShowSubmitConfirmation(false);

      // Refetch domains to update progress and isSubmitted status
      refetchDomains();

      // Refetch questions if subdomain is selected
      if (selectedSubdomain) {
        refetchQuestions();
      }

      // Invalidate all verifier-related queries to refresh dashboard data
      queryClient.invalidateQueries({
        queryKey: ["verifier"],
      });

      // Invalidate specific queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.verifier.domains(roleId, languageCode, schoolId),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.verifier.schoolData(schoolId || userName),
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.verifier.schoolSections(schoolId || userName),
      });

      enqueueSnackbar("Assessment submitted successfully!", {
        variant: "success",
      });
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
    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }

    // If sessionId is null, this is the first submit (isSubmitted: 0)
    // If sessionId is present, this is the final submit (isSubmitted: 1)
    const isFirstSubmit = sessionId === null || sessionId === undefined;

    const payload = {
      sessionId: sessionId || null,
      userId: Number(userId),
      roleId: Number(roleId),
      schoolId: schoolId || undefined,
      isSubmitted: isFirstSubmit ? 0 : 1,
    };
    submitAssessmentMutation.mutate(payload);
  };

  // Check if all domains are complete
  const allDomainsComplete = useMemo(() => {
    if (!domains || domains.length === 0) return false;
    return domains.every((domain) => {
      const progress = getDomainProgress(domain);
      return Math.round(progress) === 100;
    });
  }, [domains]);

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

    // Validate class/section/subject based on CURRENT TAB TYPE only
    // For classroom observation questions, validate class and section
    if (currentTab?.id === "classroom") {
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

    // For subject observation questions, validate class, section, and subject
    if (currentTab?.id === "subject") {
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
      if (!selectedSubject) {
        enqueueSnackbar("Please select a subject before submitting.", {
          variant: "warning",
        });
        return;
      }
    }

    // Determine class and section values based on current tab type
    let clsValue = null;
    let sectionValue = null;
    const isClassSelected =
      (currentTab?.id === "classroom" || currentTab?.id === "subject") &&
      selectedClass;

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

    const subDomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;

    const payload = {
      isAns: 1,
      userId: Number(userId),
      schoolId: schoolId || undefined,
      cls: clsValue,
      section: sectionValue,
      subjectId: selectedSubject ? Number(selectedSubject) : null,
      answers: answersArray,
    };

    submitSubdomainWiseAnswersMutation.mutate(payload);

    // If sessionId is null, call submit-assessment API for first submit
    if (sessionId === null || sessionId === undefined) {
      const firstSubmitPayload = {
        sessionId: null,
        userId: Number(userId),
        roleId: Number(roleId),
        schoolId: schoolId || undefined,
        isSubmitted: 0,
      };
      submitAssessmentMutation.mutate(firstSubmitPayload);
    }
  };

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

  // Define question type tabs
  const questionTabs = useMemo(() => {
    const tabs = [];

    if (generalQuestions.length > 0 || generalQuestionsTotalCount > 0) {
      tabs.push({
        id: "general",
        label: "General Questions",
        icon: <Assignment sx={{ fontSize: 20 }} />,
        color: colors.accent.green,
        questions: generalQuestions,
        questionsForCount: generalQuestionsForCount,
        totalCount: generalQuestionsTotalCount,
      });
    }

    if (classroomObservationQuestions.length > 0 || classroomObservationQuestionsTotalCount > 0) {
      tabs.push({
        id: "classroom",
        label: "Classroom Observation",
        icon: <Class sx={{ fontSize: 20 }} />,
        color: colors.primary.blue,
        questions: classroomObservationQuestions,
        questionsForCount: classroomObservationQuestionsForCount,
        totalCount: classroomObservationQuestionsTotalCount,
      });
    }

    if (subjectObservationQuestions.length > 0 || subjectObservationQuestionsTotalCount > 0) {
      tabs.push({
        id: "subject",
        label: "Subject-Wise Observation",
        icon: <MenuBook sx={{ fontSize: 20 }} />,
        color: colors.accent.purple,
        questions: subjectObservationQuestions,
        questionsForCount: subjectObservationQuestionsForCount,
        totalCount: subjectObservationQuestionsTotalCount,
      });
    }

    if (flnQuestions.length > 0 || flnQuestionsTotalCount > 0) {
      tabs.push({
        id: "fln",
        label: "Input Type Questions",
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
  ]);

  // Reset tab to first when questions change
  useEffect(() => {
    if (questionTabs.length > 0 && selectedQuestionTab >= questionTabs.length) {
      setSelectedQuestionTab(0);
    }
  }, [questionTabs.length, selectedQuestionTab]);

  // Get current tab
  const currentTab = questionTabs[selectedQuestionTab] || null;

  // Reset selected class group if it becomes unavailable (no flag)
  useEffect(() => {
    if (selectedClassGroup && selectedSubdomain && currentTab) {
      let questionType = null;
      if (currentTab.id === "classroom") {
        questionType = 2;
      } else if (currentTab.id === "subject") {
        questionType = 3;
      }
      
      if (questionType) {
        const flag = getGroupFlagColor(questionType, selectedClassGroup);
        if (flag === null || flag === undefined) {
          // Reset if the selected group no longer has a flag
          setSelectedClassGroup(null);
          setSelectedClass(null);
          setSelectedSection(null);
          setSelectedSubject(null);
          setAnswers({});
          setTextAnswers({});
        }
      }
    }
  }, [selectedClassGroup, selectedSubdomain, currentTab]);

  // Check if all questions of the current tab type are answered
  const areAllQuestionsAnsweredForCurrentTab = useMemo(() => {
    if (
      !currentTab ||
      !currentTab.questionsForCount ||
      currentTab.questionsForCount.length === 0
    ) {
      return false;
    }

    const questionsForCount = currentTab.questionsForCount;

    // For FLN questions (type 4), check if all have valid JSON answers
    if (currentTab.id === "fln") {
      return questionsForCount.every((q) => {
        const textAnswer = textAnswers[q.questionId];
        if (!textAnswer) return false;
        try {
          const flnData = JSON.parse(textAnswer);
          // Check if at least one class (2 or 3) has an answer
          return Object.keys(flnData).some(
            (key) => flnData[key] && flnData[key].obtainedMarks
          );
        } catch (e) {
          return false;
        }
      });
    }

    // For other question types, check if all questions have answers
    return questionsForCount.every((q) => {
      // Check if question has an answer (either from user or API)
      const userAnswer = answers[q.questionId];
      const userTextAnswer = textAnswers[q.questionId];

      // Find the question in allQuestions to check API answer
      const questionInAll = allQuestions.find(
        (aq) => aq.questionId === q.questionId
      );

      // For questions that need class/section/subject, check if API answer should be shown
      const apiAnswer =
        questionInAll &&
        shouldShowApiAnswer(questionInAll) &&
        questionInAll.selectedOptionId
          ? String(questionInAll.selectedOptionId)
          : null;

      return userAnswer || userTextAnswer || apiAnswer;
    });
  }, [
    currentTab,
    answers,
    textAnswers,
    allQuestions,
    selectedClass,
    selectedSection,
    selectedSubject,
  ]);

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
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              mb: 0.5,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                fontSize: { xs: "1.75rem", md: "2.125rem" },
              }}
            >
              School Verification
            </Typography>
            {isPublished && endDate && (
              <Typography
                variant="body2"
                sx={{
                  color: colors.semantic.warning,
                  fontWeight: 600,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Complete your assessment before {endDate}. After that date,
                submissions will not be accepted.
              </Typography>
            )}
          </Box>
          <Typography variant="body1" color="text.secondary">
            Verify and assess school quality standards
          </Typography>
          {isErrorDomains && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to load domains. Please check your connection.
            </Alert>
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ToggleButtonGroup
            value={currentLanguage}
            exclusive
            onChange={(e, newLanguage) => {
              if (newLanguage !== null) {
                setCurrentLanguage(newLanguage);
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

      {/* School Details Card */}
      {(schoolFromState || schoolData) && (
        <Paper
          elevation={1}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            bgcolor: colors.background.secondary,
            border: `1px solid ${colors.neutral.gray200}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <SchoolIcon
              sx={{
                fontSize: 32,
                color: colors.primary.blue,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.text.primary,
                  mb: 0.5,
                }}
              >
                {schoolFromState?.schoolName ||
                  schoolData?.schoolName ||
                  "School Name"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 1,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.secondary,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <strong>School ID:</strong>{" "}
                  {schoolId || schoolFromState?.schoolId || "N/A"}
                </Typography>
                {schoolFromState?.schoolCode && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text.secondary,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <strong>School Code:</strong> {schoolFromState.schoolCode}
                  </Typography>
                )}
                {schoolData?.districtName && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text.secondary,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <strong>District:</strong> {schoolData.districtName}
                  </Typography>
                )}
                {schoolData?.blockName && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: colors.text.secondary,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <strong>Block:</strong> {schoolData.blockName}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Main Content - Split Layout */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 2, md: 3 },
          minHeight: "calc(100vh - 300px)",
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
            maxHeight: "calc(100vh - 300px)",
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
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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
                                selectedSubdomain?.subDomainId === subdomainId;
                              const subdomainNumber = `${domainNumber}.${
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
                                    mb: 1,
                                    transition: "all 0.3s ease",
                                    border: "1px solid",
                                    borderColor: isSubdomainSelected
                                      ? colors.primary.blue
                                      : colors.neutral.gray200,
                                    borderRadius: 1.5,
                                    bgcolor: isSubdomainSelected
                                      ? colors.primary.blue + "05"
                                      : "white",
                                    boxShadow: isSubdomainSelected
                                      ? `0 2px 8px ${colors.primary.blue}10`
                                      : "none",
                                    "&:hover": {
                                      borderColor: colors.primary.blue,
                                      bgcolor: colors.primary.blue + "05",
                                    },
                                  }}
                                >
                                  <CardContent
                                    sx={{ p: 1.2, "&:last-child": { pb: 1.2 } }}
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
                                            : colors.accent.green + "80",
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
                                              color: colors.accent.green,
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
                                          justifyContent: "space-between",
                                          mb: 0.3,
                                        }}
                                      >
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontSize: "0.625rem",
                                            color: colors.text.secondary,
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
                                          {Math.round(subdomainProgress)}%
                                        </Typography>
                                      </Box>
                                      <LinearProgress
                                        variant="determinate"
                                        value={subdomainProgress}
                                        sx={{
                                          height: 4,
                                          borderRadius: 2,
                                          bgcolor: colors.neutral.gray200,
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
                  submitAssessmentMutation.isPending || !allDomainsComplete
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

        {/* Right Panel - Questions or Domain Overview */}
        {selectedSubdomain && (
          <Paper
            elevation={2}
            sx={{
              flex: 1,
              borderRadius: 3,
              bgcolor: "white",
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 300px)",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <>
              {/* Questions Header */}
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
                      There are no questions available for this subdomain yet.
                      Please contact your administrator to add questions.
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
                          // Clear answers when changing tabs
                          setAnswers({});
                          setTextAnswers({});
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
                              color: currentTab?.color || colors.primary.blue,
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
                                Classroom Observation Questions
                              </Typography>
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
                                  onChange={(e) => {
                                    // Clear all answers and selections when class group changes
                                    setAnswers({});
                                    setTextAnswers({});
                                    setSelectedClass(null);
                                    setSelectedSection(null);
                                    setSelectedSubject(null);
                                    setSelectedClassGroup(e.target.value);
                                  }}
                                  label="Class Group"
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
                                      // Filter out groups with grey/null flags
                                      const flag = getGroupFlagColor(2, groupRange);
                                      return flag !== null && flag !== undefined;
                                    })
                                    .map((groupRange) => {
                                      const flag = getGroupFlagColor(2, groupRange);
                                      const flagColor = flag ? getFlagColorValue(flag) : null;
                                      const displayRange = groupRange === "3-5" ? "3-5" : groupRange;
                                      
                                      return (
                                        <MenuItem key={groupRange} value={groupRange}>
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
                                            <Typography>Class {displayRange}</Typography>
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
                                    // Clear answers, section, and subject immediately
                                    setAnswers({});
                                    setTextAnswers({});
                                    setSelectedSection(null);
                                    setSelectedSubject(null);
                                    setSelectedClass(e.target.value);
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
                                  onChange={(e) => {
                                    // Clear answers and subject before changing section
                                    setAnswers({});
                                    setTextAnswers({});
                                    setSelectedSubject(null);
                                    setSelectedSection(e.target.value);
                                  }}
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
                                  const options = parseOptions(
                                    question.options
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
                                    expandedQuestions[question.questionId] ??
                                    true;
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
                                          boxShadow:
                                            "0 4px 12px rgba(0,0,0,0.1)",
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
                                            bgcolor:
                                              colors.background.secondary,
                                          },
                                        }}
                                      >
                                        <Chip
                                          label={`Q ${questionNumber}`}
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
                                                  color:
                                                    colors.semantic.warning,
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
                                                          disabled={
                                                            !isPublished ||
                                                            isSubmitted
                                                          }
                                                          sx={{
                                                            color:
                                                              colors.primary
                                                                .blue,
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
                                                          {getOptionText(
                                                            option
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
                                                            option.optionId
                                                          )
                                                            ? colors.primary
                                                                .lightest
                                                            : "transparent",
                                                        border: "1.5px solid",
                                                        borderColor:
                                                          selectedAnswer ===
                                                          String(
                                                            option.optionId
                                                          )
                                                            ? colors.primary
                                                                .blue
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
                                Subject-Wise Observation Questions
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: colors.text.secondary,
                                fontSize: "0.875rem",
                              }}
                            >
                              These questions require subject-specific
                              observation and class, section, and subject
                              selection
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
                                  onChange={(e) => {
                                    // Clear all answers and selections when class group changes
                                    setAnswers({});
                                    setTextAnswers({});
                                    setSelectedClass(null);
                                    setSelectedSection(null);
                                    setSelectedSubject(null);
                                    setSelectedClassGroup(e.target.value);
                                  }}
                                  label="Class Group"
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
                                      // Filter out groups with grey/null flags
                                      const flag = getGroupFlagColor(3, groupRange);
                                      return flag !== null && flag !== undefined;
                                    })
                                    .map((groupRange) => {
                                      const flag = getGroupFlagColor(3, groupRange);
                                      const flagColor = flag ? getFlagColorValue(flag) : null;
                                      const displayRange = groupRange === "3-5" ? "3-5" : groupRange;
                                      
                                      return (
                                        <MenuItem key={groupRange} value={groupRange}>
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
                                            <Typography>Class {displayRange}</Typography>
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
                                    // Clear answers, section, and subject immediately
                                    setAnswers({});
                                    setTextAnswers({});
                                    setSelectedSection(null);
                                    setSelectedSubject(null);
                                    setSelectedClass(e.target.value);
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
                                  onChange={(e) => {
                                    // Clear answers and subject before changing section
                                    setAnswers({});
                                    setTextAnswers({});
                                    setSelectedSubject(null);
                                    setSelectedSection(e.target.value);
                                  }}
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
                                    // Clear answers before changing subject
                                    setAnswers({});
                                    setTextAnswers({});
                                    // Set new subject - React Query will automatically refetch with new subjectId
                                    setSelectedSubject(e.target.value);
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
                                  const options = parseOptions(
                                    question.options
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
                                    expandedQuestions[question.questionId] ??
                                    true;
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
                                          boxShadow:
                                            "0 4px 12px rgba(0,0,0,0.1)",
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
                                            bgcolor:
                                              colors.background.secondary,
                                          },
                                        }}
                                      >
                                        <Chip
                                          label={`Q ${questionNumber}`}
                                          size="small"
                                          sx={{
                                            bgcolor: colors.accent.purple,
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
                                                          disabled={
                                                            !isPublished ||
                                                            isSubmitted
                                                          }
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
                                                          {getOptionText(
                                                            option
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
                                                            option.optionId
                                                          )
                                                            ? colors.accent
                                                                .purple + "15"
                                                            : "transparent",
                                                        border: "1.5px solid",
                                                        borderColor:
                                                          selectedAnswer ===
                                                          String(
                                                            option.optionId
                                                          )
                                                            ? colors.accent
                                                                .purple
                                                            : colors.neutral
                                                                .gray200,
                                                        transition:
                                                          "all 0.2s ease",
                                                        "&:hover": {
                                                          bgcolor:
                                                            colors.accent
                                                              .purple + "15",
                                                          borderColor:
                                                            colors.accent
                                                              .purple,
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
                                Input Type Questions
                              </Typography>
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
                                  expandedQuestions[question.questionId] ??
                                  true;

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
                                          bgcolor: colors.semantic.warning,
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
                                                      color:
                                                        colors.text.primary,
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
                                                      color:
                                                        colors.text.primary,
                                                      whiteSpace: "nowrap",
                                                    }}
                                                  >
                                                    Obtained marks:
                                                  </Typography>
                                                  <TextField
                                                    size="small"
                                                    type="number"
                                                    disabled={
                                                      !isPublished ||
                                                      isSubmitted
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
                                                        (Number(value) >= 0 &&
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
                                                            newData
                                                          )
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
                                General Questions
                              </Typography>
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
                                  shouldShowApiAnswer(question) &&
                                  question.selectedOptionId
                                    ? String(question.selectedOptionId)
                                    : null;
                                const selectedAnswer =
                                  userSelectedAnswer || apiSelectedAnswer;
                                const isExpanded =
                                  expandedQuestions[question.questionId] ??
                                  true;
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
                                                        disabled={
                                                          !isPublished ||
                                                          isSubmitted
                                                        }
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
                              })}
                            </Box>
                          )}
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
                        !areAllQuestionsAnsweredForCurrentTab ||
                        // For class-based questions (classroom and subject), validate class and section
                        ((currentTab?.id === "classroom" ||
                          currentTab?.id === "subject") &&
                          (!selectedClass || !selectedSection)) ||
                        // For subject questions, also validate subject selection
                        (currentTab?.id === "subject" && !selectedSubject)
                      }
                      title={
                        !areAllQuestionsAnsweredForCurrentTab
                          ? `Please answer all ${
                              currentTab?.label || "questions"
                            } before saving`
                          : (currentTab?.id === "classroom" ||
                              currentTab?.id === "subject") &&
                            (!selectedClass || !selectedSection)
                          ? "Please select class and section before saving"
                          : currentTab?.id === "subject" && !selectedSubject
                          ? "Please select subject before saving"
                          : "Save assessment for this question type"
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
            </>
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
              maxHeight: "calc(100vh - 300px)",
              overflow: "hidden",
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
                    {domains.findIndex(
                      (d) => d.domainId === selectedDomain.domainId
                    ) + 1}
                    . {getDomainName(selectedDomain)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem" }}
                  >
                    Assessment of {getDomainName(selectedDomain).toLowerCase()}
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
                  {selectedDomain.subDomain.map((subdomain, index) => {
                    const subdomainId = subdomain.subDomainId || subdomain.id;
                    const subdomainProgress = getSubdomainProgress(subdomain);
                    const domainIdx = domains.findIndex(
                      (d) => d.domainId === selectedDomain.domainId
                    );
                    const subdomainNumber = `${domainIdx + 1}.${index + 1}`;

                    return (
                      <Card
                        key={subdomainId}
                        onClick={() => handleSubdomainSelect(subdomain)}
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
                                  {String.fromCharCode(65 + (index % 26))}
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
                                    color: getProgressColor(subdomainProgress),
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
              maxHeight: "calc(100vh - 300px)",
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
                Assessment Overview
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.875rem" }}
              >
                Review progress across all domains
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
                    The assessment has not been published or created yet. Please
                    contact your administrator to publish the assessment.
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
        isLoading={submitAssessmentMutation.isPending}
      />
    </Box>
  );
};

export default SchoolVerification;
