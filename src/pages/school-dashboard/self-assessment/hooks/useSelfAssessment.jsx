import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Box, CircularProgress, useTheme, useMediaQuery } from "@mui/material";
import {
  Assessment,
  Assignment,
  Business,
  Class,
  Create,
  Groups,
  MenuBook,
  School as SchoolIcon,
  WorkspacePremium,
} from "@mui/icons-material";
import { enqueueSnackbar } from "notistack";
import { colors } from "../../../../constants/colors";
import { queryKeys } from "../../../../config/queryClient";
import { getRoleId } from "../../../../constants/roles";
import useAuthStore from "../../../../store/useAuthStore";
import { useLogoutMutation } from "../../../../services/authService";
import {
  useGetDomainsQuery,
  useGetSubdomainQuestionsQuery,
  useGetSchoolDataQuery,
  useGetSchoolSectionsQuery,
  useSubmitSubdomainWiseAnswersMutation,
  useSubmitAssessmentMutation,
  useGetSchoolGradesQuery,
} from "../../../../services/schoolService";
import {
  useGetClassWiseSubjectsQuery,
  useSubmitAnswerMutation,
} from "../../../../services/adminService";

const getSessionIdFromDomainsResponse = (domainsResponse, assessmentId) => {
  if (!domainsResponse) return null;

  if (Array.isArray(domainsResponse.data)) {
    if (
      domainsResponse.data.length > 0 &&
      domainsResponse.data[0]?.domains
    ) {
      const assessment =
        domainsResponse.data.find(
          (item) => Number(item.assessmentId) === Number(assessmentId),
        ) || domainsResponse.data[0];
      return assessment?.sessionId ?? domainsResponse.sessionId ?? null;
    }
    return domainsResponse.sessionId ?? null;
  }

  return domainsResponse.sessionId ?? null;
};

export function useSelfAssessment() {
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
  const [submitFeedback, setSubmitFeedback] = useState("");
  const [selectedQuestionTab, setSelectedQuestionTab] = useState(0);
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
    isFetching: isFetchingDomains,
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
      (a) => Number(a.assessmentId) === Number(selectedAssessmentId),
    );
    if (!selectedAssessmentId || !stillExists) {
      setSelectedAssessmentId(assessments[0].assessmentId);
    }
  }, [assessments, selectedAssessmentId]);

  const selectedAssessment = useMemo(() => {
    if (!assessments.length) return null;
    return (
      assessments.find(
        (a) => Number(a.assessmentId) === Number(selectedAssessmentId),
      ) || assessments[0]
    );
  }, [assessments, selectedAssessmentId]);

  const domains = selectedAssessment?.domains || [];
  const isPublished =
    selectedAssessment?.isPublished ?? domainsData?.isPublished ?? false;
  const endDate = selectedAssessment?.endDate ?? domainsData?.endDate ?? null;
  const isSubmitted =
    selectedAssessment?.isSubmitted ?? domainsData?.isSubmitted ?? false;
  const sessionId =
    selectedAssessment?.sessionId ?? domainsData?.sessionId ?? null;

  const assessmentProgress = useMemo(() => {
    const totalQuestions = Number(selectedAssessment?.totalQuestions) || 0;
    const totalAnswer = Number(selectedAssessment?.totalAnswer) || 0;
    const answerPercentage = Number(selectedAssessment?.answerPercentage) || 0;
    const clampedPercentage = Math.min(100, Math.max(0, answerPercentage));

    return {
      totalQuestions,
      totalAnswer,
      answerPercentage: clampedPercentage,
      displayPercentage:
        answerPercentage < 1 && answerPercentage > 0
          ? Number(answerPercentage.toFixed(2))
          : Math.round(clampedPercentage),
    };
  }, [selectedAssessment]);

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
      refetchQuestions();
      refetchDomains();
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
        const domainsResult = await refetchDomains();
        const freshSessionId = getSessionIdFromDomainsResponse(
          domainsResult.data,
          selectedAssessment?.assessmentId ?? selectedAssessmentId,
        );

        if (freshSessionId === null || freshSessionId === undefined) {
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
          refetchQuestions();
        }
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
      if (variables.isSubmitted === 0) {
        // Session creation - refetch domains to get the sessionId
        refetchDomains();
        // enqueueSnackbar("Session created successfully!", {
        //   variant: "success",
        // });
      } else {
        // Final submission - close the feedback modal
        setShowSubmitConfirmation(false);
        setSubmitFeedback("");

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
      setShowSubmitConfirmation(false);
      setSubmitFeedback("");
      enqueueSnackbar(
        error?.response?.data?.message ||
          "Failed to submit assessment. Please try again.",
        {
          variant: "error",
        },
      );
    },
  });

  // Handler to open feedback modal for final submit
  const handleOpenSubmitConfirmation = () => {
    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }
    setSubmitFeedback("");
    setShowSubmitConfirmation(true);
  };

  const handleCloseSubmitFeedback = () => {
    if (submitAssessmentMutation.isPending || isFetchingDomains) return;
    setShowSubmitConfirmation(false);
    setSubmitFeedback("");
  };

  // Handler to confirm final submit with optional feedback (empty → "NA")
  const handleConfirmSubmit = async () => {
    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }

    if (submitAssessmentMutation.isPending || isFetchingDomains) {
      return;
    }

    try {
      const domainsResult = await refetchDomains();
      const freshSessionId = getSessionIdFromDomainsResponse(
        domainsResult.data,
        selectedAssessment?.assessmentId ?? selectedAssessmentId,
      );

      const payload = {
        sessionId: freshSessionId ?? null,
        assessmentId: selectedAssessment?.assessmentId ?? null,
        userId: Number(userId),
        roleId: Number(roleId),
        schoolId: userName || undefined,
        isSubmitted: 1,
        feedback: submitFeedback.trim() || "NA",
      };
      submitAssessmentMutation.mutate(payload);
    } catch (error) {
      console.error("Error refreshing domains before submit:", error);
      enqueueSnackbar(
        "Failed to refresh assessment session. Please try again.",
        { variant: "error" },
      );
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
              0,
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
        (a) => a.assessmentId === chartDrilldownAssessmentId,
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
    if (
      submitSubdomainWiseAnswersMutation.isPending ||
      submitAssessmentMutation.isPending ||
      isFetchingDomains
    ) {
      return;
    }

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

  return {
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
  };
}
