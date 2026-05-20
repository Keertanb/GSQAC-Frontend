import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme, useMediaQuery } from "@mui/material";
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
import { colors } from "../../../../constants/colors";
import {
  useGetDomainsQuery,
  useGetSubdomainQuestionsQuery,
  useGetSchoolDataQuery,
  useGetSchoolSectionsQuery,
  useSubmitSubdomainWiseAnswersMutation,
  useSubmitAssessmentMutation,
  useGetSchoolGradesQuery,
} from "../../../../services/crcService";
import {
  useSubmitAnswerMutation,
  useGetClassWiseSubjectsQuery,
} from "../../../../services/adminService";
import { getRoleId } from "../../../../constants/roles";
import { queryKeys } from "../../../../config/queryClient";
import { DRAWER_WIDTH } from "../../../../constants/menuItems";
import useAuthStore from "../../../../store/useAuthStore";
import { useLogoutMutation } from "../../../../services/authService";
import { enqueueSnackbar } from "notistack";

export function useCRCAssessment() {
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
  const [sessionId, setSessionId] = useState(null);
  const [pendingFinalSubmit, setPendingFinalSubmit] = useState(false);
  const [selectedQuestionTab, setSelectedQuestionTab] = useState(0);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);
  const [chartDrilldownAssessmentId, setChartDrilldownAssessmentId] =
    useState(null);

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
    schoolId: schoolId,
    enabled: !!selectedSubdomain,
  });

  const { data: schoolDataResponse, isLoading: isLoadingSchoolData } =
    useGetSchoolDataQuery({
      schoolId: schoolCode || undefined,
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

  // Extract and store sessionId from domains API response
  useEffect(() => {
    if (selectedAssessment?.sessionId !== undefined) {
      const newSessionId = selectedAssessment.sessionId;
      setSessionId(newSessionId);
      // If we have a pending final submit and now have sessionId, submit final
      if (pendingFinalSubmit && newSessionId) {
        const finalPayload = {
          sessionId: newSessionId,
          assessmentId: selectedAssessment?.assessmentId ?? null,
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
  }, [selectedAssessment?.sessionId, pendingFinalSubmit]);
  const endDate = selectedAssessment?.endDate ?? domainsData?.endDate ?? null;
  const isSubmitted =
    selectedAssessment?.isSubmitted ?? domainsData?.isSubmitted ?? false;

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
            (key) => flnData[key] && flnData[key].obtainedMarks,
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
        (aq) => aq.questionId === q.questionId,
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
      enqueueSnackbar("Answer submitted successfully!", {
        variant: "success",
      });
    },
    onError: (error) => {
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
            assessmentId: selectedAssessment?.assessmentId ?? null,
            userId: Number(userId),
            roleId: Number(roleId),
            schoolId: schoolId,
            isSubmitted: 0,
          };
          submitAssessmentMutation.mutate(sessionPayload);
        } else {
          refetchDomains();
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
      // Check if this was a session creation (isSubmitted: 0)
      if (variables.isSubmitted === 0) {
        // Session creation - refetch domains to get the sessionId
        refetchDomains();
        // enqueueSnackbar("Session created successfully!", {
        //   variant: "success",
        // });
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
    // If sessionId is null, create session first
    if (sessionId === null) {
      // Set flag to submit final after session is created
      setPendingFinalSubmit(true);

      // First create session with isSubmitted: 0
      const sessionPayload = {
        sessionId: null,
        assessmentId: selectedAssessment?.assessmentId ?? null,
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
        assessmentId: selectedAssessment?.assessmentId ?? null,
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
        },
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
    // Only include questions from the current tab
    const answersArray = [];
    const questionsToProcess = currentTab?.questions || [];

    questionsToProcess.forEach((question) => {
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
      questionType:
        currentTab?.id === "general"
          ? 1
          : currentTab?.id === "classroom"
            ? 2
            : currentTab?.id === "subject"
              ? 3
              : currentTab?.id === "fln"
                ? 4
                : null,
      userId: Number(userId),
      schoolId: schoolId,
      cls: clsValue,
      section: sectionValue,
      subjectId: selectedSubject ? Number(selectedSubject) : null,
      answers: answersArray,
    };

    submitSubdomainWiseAnswersMutation.mutate(payload);
  };

  return {
    navigate,
    location,
    paramSchoolId,
    theme,
    matchDownMD,
    drawerOpen,
    setDrawerOpen,
    logout,
    user,
    userId,
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
    sessionId,
    setSessionId,
    pendingFinalSubmit,
    setPendingFinalSubmit,
    selectedQuestionTab,
    setSelectedQuestionTab,
    selectedAssessmentId,
    setSelectedAssessmentId,
    chartDrilldownAssessmentId,
    setChartDrilldownAssessmentId,
    schoolFromState,
    schoolCode,
    logoutMutation,
    handleDrawerToggle,
    handleLogout,
    languageCodeMap,
    languageCode,
    roleId,
    queryClient,
    schoolId,
    domainsData,
    isLoadingDomains,
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
    mapGroupRangeToApiFormat,
    getGroupFlagColor,
    getFlagColorValue,
    getTotalQuestionsFromGroupWise,
    getTotalQuestionsCount,
    endDate,
    isSubmitted,
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
    shouldShowApiAnswer,
    areAllQuestionsAnsweredForCurrentTab,
    getSubdomainProgress,
    getDomainProgress,
    getDomainName,
    getSubdomainName,
    getProgressColor,
    getQuestionText,
    getOptionText,
    getDomainIcon,
    toggleQuestionExpansion,
    parseOptions,
    handleDomainSelect,
    handleSubdomainSelect,
    handleAssessmentSelect,
    handleAnswerChange,
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
