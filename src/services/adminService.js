import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";
import { enqueueSnackbar } from "notistack";

/**
 * Get domains and subdomains
 * @param {Object} params - { roleId: number, languageCode?: string }
 * @returns {Promise} API response
 */
export const getDomains = async (params) => {
  const response = await axiosInstance.get("/questionnaire/domain", { params });
  return response.data;
};

/**
 * Get questions for a subdomain
 * @param {Object} params - { subDomainId: number, roleId: number, languageCode?: string, userId?: number }
 * @returns {Promise} API response
 */
export const getSubdomainQuestions = async (params) => {
  const response = await axiosInstance.get("/questionnaire/question", {
    params,
  });
  return response.data;
};

/**
 * Upsert (add or edit) domain
 * @param {Object} payload - { domainId?: number, roleId: number, domainNameEn: string, domainNameHi: string, domainNameGu: string }
 * @returns {Promise} API response
 */
export const upsertDomain = async (payload) => {
  const response = await axiosInstance.post("/questionnaire/domain", payload);
  return response.data;
};

/**
 * Upsert (add or edit) subdomain
 * @param {Object} payload - { subDomainId?: number, domainId: number, roleId: number, subDomainNameEn: string, subDomainNameHi: string, subDomainNameGu: string }
 * @returns {Promise} API response
 */
export const upsertSubdomain = async (payload) => {
  const response = await axiosInstance.post(
    "/questionnaire/sub-domain",
    payload
  );
  return response.data;
};

/**
 * Upsert (add or edit) question
 * @param {Object} payload - { questionId?: number, subDomainId: number, roleId: number, questionTextEn: string, questionTextHi: string, questionTextGu: string }
 * @returns {Promise} API response
 */
export const upsertQuestion = async (payload) => {
  const response = await axiosInstance.post("/questionnaire/question", payload);
  return response.data;
};

/**
 * Upsert (add or edit) question option
 * @param {Object} payload - { optionId?: number, questionId: number, optionTextEn: string, optionTextHi: string, optionTextGu: string }
 * @returns {Promise} API response
 */
export const upsertQuestionOption = async (payload) => {
  const response = await axiosInstance.post(
    "/questionnaire/question-option",
    payload
  );
  return response.data;
};

/**
 * Delete domain
 * @param {number} domainId - Domain ID to delete
 * @returns {Promise} API response
 */
export const deleteDomain = async (domainId) => {
  const response = await axiosInstance.delete("/questionnaire/domain", {
    params: { domainId },
  });
  return response.data;
};

/**
 * Delete question
 * @param {number} questionId - Question ID to delete
 * @returns {Promise} API response
 */
export const deleteQuestion = async (questionId) => {
  const response = await axiosInstance.delete("/questionnaire/question", {
    params: { questionId },
  });
  return response.data;
};

/**
 * Delete question option
 * @param {number} questionId - Question ID (or optionId) to delete
 * @returns {Promise} API response
 */
export const deleteQuestionOption = async (questionId) => {
  const response = await axiosInstance.delete(
    "/questionnaire/question-option",
    {
      params: { questionId },
    }
  );
  return response.data;
};

/**
 * Submit answer for a question
 * @param {Object} payload - { isAns: number, answerId: number | null, userId: number, questionId: number, optionId: number, class: number, section: string }
 * @returns {Promise} API response
 */
export const submitAnswer = async (payload) => {
  const response = await axiosInstance.post("/school/submit-answers", payload);
  console.log(payload, "payloadpayload");
  return response.data;
};

/**
 * React Query hook for getting domains
 * @param {Object} options - Query options
 * @param {number} options.roleId - Role ID
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
    queryKey: queryKeys.admin.domains(roleId, languageCode),
    queryFn: () => getDomains({ roleId, languageCode }),
    enabled: enabled && !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * React Query hook for getting questions for a subdomain
 * @param {Object} options - Query options
 * @param {number} options.subDomainId - Subdomain ID
 * @param {number} options.roleId - Role ID
 * @param {string} options.languageCode - Language code (EN, HI, GU)
 * @param {number} options.userId - User ID (optional)
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetSubdomainQuestionsQuery = ({
  subDomainId,
  roleId,
  languageCode,
  userId,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.admin.subdomainQuestions(
      subDomainId,
      roleId,
      languageCode
    ),
    queryFn: () =>
      getSubdomainQuestions({ subDomainId, roleId, languageCode, userId }),
    enabled: enabled && !!subDomainId && !!roleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * React Query hook for upserting domain
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useUpsertDomainMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => upsertDomain(data),
    mutationKey: queryKeys.admin.upsertDomain(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Domain saved successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save domain",
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
 * React Query hook for upserting subdomain
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useUpsertSubdomainMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => upsertSubdomain(data),
    mutationKey: queryKeys.admin.upsertSubdomain(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Subdomain saved successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save subdomain",
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
 * React Query hook for upserting question
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useUpsertQuestionMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => upsertQuestion(data),
    mutationKey: queryKeys.admin.upsertQuestion(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Question saved successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save question",
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
 * React Query hook for upserting question option
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useUpsertQuestionOptionMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => upsertQuestionOption(data),
    mutationKey: queryKeys.admin.upsertQuestionOption(),
    onSuccess: (data) => {
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save option",
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
 * React Query hook for deleting domain
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useDeleteDomainMutation = (options = {}) => {
  return useMutation({
    mutationFn: (domainId) => deleteDomain(domainId),
    mutationKey: queryKeys.admin.deleteDomain(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Domain deleted successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to delete domain",
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
 * React Query hook for deleting question
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useDeleteQuestionMutation = (options = {}) => {
  return useMutation({
    mutationFn: (questionId) => deleteQuestion(questionId),
    mutationKey: queryKeys.admin.deleteQuestion(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Question deleted successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to delete question",
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
 * React Query hook for deleting question option
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useDeleteQuestionOptionMutation = (options = {}) => {
  return useMutation({
    mutationFn: (questionId) => deleteQuestionOption(questionId),
    mutationKey: queryKeys.admin.deleteQuestionOption(),
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Question option deleted successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to delete question option",
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
 * React Query hook for submitting answer
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSubmitAnswerMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => submitAnswer(data),
    mutationKey: ["school", "submit-answer"],
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
