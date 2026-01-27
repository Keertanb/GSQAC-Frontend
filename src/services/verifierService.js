import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";
import { enqueueSnackbar } from "notistack";
import useAuthStore from "../store/useAuthStore";

/**
 * Get domains and subdomains for verifier/inspector
 * @param {Object} params - { roleId?: number, languageCode?: string }
 * @returns {Promise} API response
 */
export const getDomains = async (params = {}) => {
  const { roleId, languageCode, ...otherParams } = params;
  const config = {
    params: { languageCode, ...otherParams },
    headers: {},
  };

  if (roleId) {
    config.headers.roleId = roleId;
  }

  const response = await axiosInstance.get("/questionnaire/domain", config);
  return response.data;
};

/**
 * Get subdomain questions for verifier/inspector
 * @param {Object} params - Query parameters
 * @returns {Promise} API response
 */
export const getSubdomainQuestions = async (params) => {
  const {
    roleId,
    subDomainId,
    languageCode,
    userId,
    cls,
    section,
    subjectId,
    ...otherParams
  } = params;
  const config = {
    params: { subDomainId, languageCode, ...otherParams },
    headers: {},
  };

  // Add cls to params if provided
  if (cls) {
    config.params.cls = cls;
  }

  // Add section to params if provided
  if (section) {
    config.params.section = section;
  }

  // Add subjectId to params if provided
  if (subjectId) {
    config.params.subjectId = subjectId;
  }

  // Set roleId in header if provided
  if (roleId) {
    config.headers.roleId = roleId;
  }

  // Get userId from auth store if not provided in params, and set in header if present
  const authState = useAuthStore.getState();
  const userIdToSend = userId || authState.userId;
  if (userIdToSend) {
    config.headers.userId = userIdToSend;
  }

  const response = await axiosInstance.get("/questionnaire/question", config);
  return response.data;
};

/**
 * Submit answer for a single question
 * @param {Object} payload - Answer payload
 * @returns {Promise} API response
 */
export const submitAnswer = async (payload) => {
  const response = await axiosInstance.post("/questionnaire/answer", payload);
  return response.data;
};

/**
 * Submit all answers for a subdomain
 * @param {Object} payload - Answers payload
 * @returns {Promise} API response
 */
export const submitSubdomainWiseAnswers = async (payload) => {
  const response = await axiosInstance.post(
    "/questionnaire/subdomain-wise-answers",
    payload
  );
  return response.data;
};

/**
 * React Query hook for getting domains (verifier/inspector)
 * @param {Object} options - Query options
 * @param {number} options.roleId - Role ID (will be sent in header)
 * @param {string} options.languageCode - Language code (EN, HI, GU)
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetDomainsQuery = ({
  roleId,
  languageCode,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.verifier.domains(roleId, languageCode),
    queryFn: () => getDomains({ roleId, languageCode }),
    enabled: enabled && !!roleId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * React Query hook for getting subdomain questions
 * @param {Object} options - Query options
 * @returns {Object} Query object from React Query
 */
export const useGetSubdomainQuestionsQuery = ({
  subDomainId,
  roleId,
  languageCode,
  classNumber,
  section,
  subjectId,
  userId,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.verifier.subdomainQuestions(
      subDomainId,
      roleId,
      languageCode,
      classNumber,
      section,
      subjectId
    ),
    queryFn: () =>
      getSubdomainQuestions({
        subDomainId,
        roleId,
        languageCode,
        cls: classNumber,
        section,
        subjectId,
        userId,
      }),
    enabled: enabled && !!subDomainId && !!roleId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * React Query hook for submitting answer
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSubmitAnswerMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => submitAnswer(data),
    mutationKey: queryKeys.verifier.submitAnswer(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Answer submitted successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to submit answer",
        {
          variant: "error",
        }
      );
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
};

/**
 * React Query hook for submitting subdomain-wise answers
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSubmitSubdomainWiseAnswersMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => submitSubdomainWiseAnswers(data),
    mutationKey: queryKeys.verifier.submitSubdomainWiseAnswers(),
    onSuccess: (data) => {
      enqueueSnackbar(
        data?.message || "Answers submitted successfully",
        {
          variant: "success",
        }
      );
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to submit answers",
        {
          variant: "error",
        }
      );
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
};

/**
 * Get school data
 * @param {Object} params - { schoolId?: number, userName?: string, academicYear?: string }
 * @returns {Promise} API response
 */
export const getSchoolData = async (params) => {
  const response = await axiosInstance.get("/school/school-data", { params });
  return response.data;
};

/**
 * Get all sections by schoolId
 * @param {Object} params - { schoolId: string }
 * @returns {Promise} API response
 */
export const getSchoolSections = async (params) => {
  const response = await axiosInstance.get("/school/section", {
    params,
  });
  return response.data;
};

/**
 * Get school grades with student counts
 * @param {Object} params - { schoolId: string }
 * @returns {Promise} API response
 */
export const getSchoolGrades = async (params) => {
  const response = await axiosInstance.get("/school/grades", { params });
  return response.data;
};

/**
 * Submit final assessment
 * @param {Object} payload - { userId: number, roleId: number, isSubmitted: number }
 * @returns {Promise} API response
 */
export const submitAssessment = async (payload) => {
  const response = await axiosInstance.post(
    "/school/submit-assessment",
    payload
  );
  return response.data;
};

/**
 * React Query hook for getting school data
 * @param {Object} options - Query options
 * @param {number} options.schoolId - School ID (optional)
 * @param {string} options.userName - User Name (optional, preferred over schoolId)
 * @param {string} options.academicYear - Academic Year (optional)
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetSchoolDataQuery = ({
  schoolId,
  userName,
  academicYear,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.verifier.schoolData(schoolId || userName, academicYear),
    queryFn: () => {
      const params = {};
      if (userName) {
        params.userName = userName;
      } else if (schoolId) {
        params.schoolId = schoolId;
      }
      if (academicYear) {
        params.academicYear = academicYear;
      }
      return getSchoolData(params);
    },
    enabled: enabled && (!!userName || !!schoolId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * React Query hook for getting all school sections
 * @param {Object} options - Query options
 * @param {string} options.schoolId - School ID
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetSchoolSectionsQuery = ({ schoolId, enabled = true }) => {
  return useQuery({
    queryKey: queryKeys.verifier.schoolSections(schoolId),
    queryFn: () => getSchoolSections({ schoolId }),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * React Query hook for getting school grades with student counts
 * @param {Object} options - Query options
 * @param {string} options.schoolId - School ID
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Query result
 */
export const useGetSchoolGradesQuery = ({ schoolId, enabled = true }) => {
  return useQuery({
    queryKey: ["verifier", "grades", schoolId],
    queryFn: () => getSchoolGrades({ schoolId }),
    enabled: enabled && !!schoolId,
    staleTime: 10 * 60 * 1000, // 10 minutes (grades don't change often)
  });
};

/**
 * React Query hook for submitting assessment
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSubmitAssessmentMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => submitAssessment(data),
    mutationKey: ["verifier", "submit-assessment"],
    onSuccess: (data) => {
      enqueueSnackbar(
        data?.message || "Assessment submitted successfully",
        {
          variant: "success",
        }
      );
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to submit assessment",
        {
          variant: "error",
        }
      );
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
};

