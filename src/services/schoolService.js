import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";
import { enqueueSnackbar } from "notistack";

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
 * Get class-wise sections
 * @param {Object} params - { userId: number, class: number }
 * @returns {Promise} API response
 */
export const getClassWiseSections = async (params) => {
  const response = await axiosInstance.get("/school/class-wise-sections", {
    params,
  });
  return response.data;
};

/**
 * Submit subdomain-wise answers
 * @param {Object} payload - { isAns: number, subDomainId: number, cls: number, section: string, answers: Array }
 * @returns {Promise} API response
 */
export const submitSubdomainWiseAnswers = async (payload) => {
  const response = await axiosInstance.post(
    "/school/sub-domain-wise-submit-answers",
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
    queryKey: queryKeys.school.schoolData(schoolId || userName, academicYear),
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
 * React Query hook for getting class-wise sections
 * @param {Object} options - Query options
 * @param {number} options.userId - User ID
 * @param {number} options.class - Class number
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetClassWiseSectionsQuery = ({
  userId,
  class: classNumber,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.school.classWiseSections(userId, classNumber),
    queryFn: () => getClassWiseSections({ userId, class: classNumber }),
    enabled: enabled && !!userId && !!classNumber,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    mutationKey: queryKeys.school.submitSubdomainWiseAnswers(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Answers submitted successfully", {
        variant: "success",
      });
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
