import { useQuery, useMutation } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";
import { enqueueSnackbar } from "notistack";
import useAuthStore from "../store/useAuthStore";

/**
 * Get domains and subdomains (admin)
 * @param {Object} params - { roleId?: number, languageCode?: string, assessmentId?: number|string }
 * @returns {Promise} API response
 */
export const getDomains = async (params = {}) => {
  const { languageCode, ...otherParams } = params;
  const config = {
    params: { languageCode, ...otherParams },
    headers: {},
  };

  const response = await axiosInstance.get("/admin/domain", config);
  return response.data;
};

/**
 * Get class-wise subjects
 * @param {Object} params - { classId: number }
 * @returns {Promise} API response
 */
export const getClassWiseSubjects = async (params) => {
  const response = await axiosInstance.get("/admin/class-wise-subject", {
    params,
  });
  return response.data;
};

/**
 * Get questions for a subdomain
 * @param {Object} params - { subDomainId: number, roleId: number, languageCode?: string, userId?: number, cls?: number, section?: string }
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

  const response = await axiosInstance.get("/admin/question", config);
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
 * Upsert (add or edit) question options in one request
 * @param {Object} payload - { questionId: number, options: Array<{ optionId?: number | null, optionTextEn: string, optionTextHi: string, optionTextGu: string }> }
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
 * @param {number} options.roleId - Role ID (will be sent in header)
 * @param {string} options.languageCode - Language code (EN, HI, GU)
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetDomainsQuery = ({
  languageCode,
  assessmentId,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.admin.domains(languageCode, assessmentId || null),
    queryFn: () => getDomains({ languageCode, assessmentId }),
    enabled: enabled,
    staleTime: 5 * 60 * 1000,
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
  classNumber,
  section,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.admin.subdomainQuestions(
      subDomainId,
      roleId,
      languageCode,
      classNumber,
      section
    ),
    queryFn: () =>
      getSubdomainQuestions({
        subDomainId,
        roleId,
        languageCode,
        cls: classNumber,
        section,
      }),
    enabled: enabled && !!subDomainId && !!roleId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * React Query hook for getting class-wise subjects
 * @param {Object} options - Query options
 * @param {number} options.classId - Class ID
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetClassWiseSubjectsQuery = ({ classId, enabled = true }) => {
  return useQuery({
    queryKey: ["admin", "class-wise-subjects", classId],
    queryFn: () => getClassWiseSubjects({ classId }),
    enabled: enabled && !!classId,
    staleTime: 5 * 60 * 1000,
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

/**
 * Get verifiers
 * @param {Object} params - { page: number, limit: number }
 * @returns {Promise} API response
 */
export const getVerifiers = async (params) => {
  const response = await axiosInstance.get("/admin/verifier", { params });
  return response.data;
};

/**
 * Get verifier count (total, active, inactive)
 * @returns {Promise} API response - { data: { TOTAL_VERIFIER, ACTIVE_VERIFIER, INACTIVE_VERIFIER } }
 */
export const getVerifierCount = async () => {
  const response = await axiosInstance.get("/admin/verifire-count");
  return response.data;
};

/**
 * React Query hook for getting verifier count
 * @returns {Object} Query object from React Query
 */
export const useGetVerifierCountQuery = (options = {}) => {
  return useQuery({
    queryKey: ["admin", "verifier-count"],
    queryFn: getVerifierCount,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Upsert (add or edit) verifier
 * @param {Object} payload - { userId?: number, userName: string, mobileNumber: string, isActive: number }
 * @returns {Promise} API response
 */
export const upsertVerifier = async (payload) => {
  const response = await axiosInstance.post("/admin/verifier", payload);
  return response.data;
};

/**
 * React Query hook for getting verifiers
 * @param {Object} params - { page: number, limit: number }
 * @returns {Object} Query object from React Query
 */
export const useGetVerifiersQuery = (params = { page: 1, limit: 10 }) => {
  return useQuery({
    queryKey: ["admin", "verifiers", params.page, params.limit],
    queryFn: () => getVerifiers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * React Query hook for upserting verifier
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useUpsertVerifierMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => upsertVerifier(data),
    mutationKey: ["admin", "upsert-verifier"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Verifier saved successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save verifier",
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
 * Get all districts
 * @returns {Promise} API response
 */
export const getAllDistricts = async () => {
  const response = await axiosInstance.get("/master/all-districts");
  return response.data;
};

/**
 * React Query hook for getting all districts
 * @returns {Object} Query object from React Query
 */
export const useGetAllDistrictsQuery = () => {
  return useQuery({
    queryKey: ["master", "all-districts"],
    queryFn: () => getAllDistricts(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get blocks by district ID
 * @param {number} districtId - District ID
 * @returns {Promise} API response
 */
export const getDistrictWiseBlocks = async (districtId) => {
  const response = await axiosInstance.get("/master/blocks-by-districtId", {
    params: { districtId },
  });
  return response.data;
};

/**
 * React Query hook for getting blocks by district
 * @param {number} districtId - District ID
 * @returns {Object} Query object from React Query
 */
export const useGetDistrictWiseBlocksQuery = (districtId) => {
  return useQuery({
    queryKey: ["master", "district-wise-blocks", districtId],
    queryFn: () => getDistrictWiseBlocks(districtId),
    enabled: !!districtId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get clusters by block ID
 * @param {number} blockId - Block ID
 * @returns {Promise} API response
 */
export const getClustersByBlockId = async (blockId) => {
  const response = await axiosInstance.get("/master/clusters-by-blockId", {
    params: { blockId },
  });
  return response.data;
};

/**
 * React Query hook for getting clusters by block
 * @param {number} blockId - Block ID
 * @returns {Object} Query object from React Query
 */
export const useGetClustersByBlockIdQuery = (blockId) => {
  return useQuery({
    queryKey: ["master", "clusters-by-blockId", blockId],
    queryFn: () => getClustersByBlockId(blockId),
    enabled: !!blockId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get all district nodal officers
 * @param {Object} params - { page: number, limit: number, search?: string }
 * @returns {Promise} API response
 */
export const getDistrictNodalOfficers = async (params) => {
  const response = await axiosInstance.get("/admin/nodel-officer", { params });
  return response.data;
};

/**
 * Upsert (add or edit) district nodal officer
 * @param {Object} payload - { userId?: number, roleId: number, userName: string, mobileNumber: string, isActive: number, districtIds: number[], email?: string }
 * @returns {Promise} API response
 */
export const upsertDistrictNodalOfficer = async (payload) => {
  const response = await axiosInstance.post("/admin/nodel-officer", payload);
  return response.data;
};

/**
 * React Query hook for getting district nodal officers
 * @param {Object} params - { page: number, limit: number, search?: string }
 * @returns {Object} Query object from React Query
 */
export const useGetDistrictNodalOfficersQuery = (
  params = { page: 1, limit: 10 }
) => {
  return useQuery({
    queryKey: [
      "admin",
      "nodal-officers",
      params.page,
      params.limit,
      params.search,
    ],
    queryFn: () => getDistrictNodalOfficers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * React Query hook for upserting district nodal officer
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useUpsertDistrictNodalOfficerMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => upsertDistrictNodalOfficer(data),
    mutationKey: ["admin", "upsert-nodal-officer"],
    onSuccess: (data) => {
      enqueueSnackbar(
        data?.message || "District Nodal Officer saved successfully",
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
        error?.response?.data?.message ||
          "Failed to save district nodal officer",
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
 * Get school list
 * @param {Object} params - { blockId?: number, clusterId?: string, villageId?: number, page?: number, limit?: number }
 * @returns {Promise} API response
 */
export const getSchoolList = async (params = {}) => {
  const response = await axiosInstance.get("/school/school-list", { params });
  return response.data;
};

/**
 * React Query hook for getting school list
 * @param {Object} params - { blockId?: number, clusterId?: string, villageId?: number, page?: number, limit?: number }
 * @param {boolean} enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetSchoolListQuery = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: [
      "school",
      "school-list",
      params.blockId,
      params.clusterId,
      params.villageId,
      params.status,
      params.page,
      params.limit,
    ],
    queryFn: () => getSchoolList(params),
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get verifiers by district
 * @param {number} districtId - District ID
 * @returns {Promise} API response
 */
export const getVerifiersByDistrict = async (districtId) => {
  const response = await axiosInstance.get("/admin/verifier-by-district", {
    params: { districtId },
  });
  return response.data;
};

/**
 * React Query hook for getting verifiers by district
 * @param {number} districtId - District ID
 * @returns {Object} Query object from React Query
 */
export const useGetVerifiersByDistrictQuery = (districtId) => {
  return useQuery({
    queryKey: ["admin", "verifiers-by-district", districtId],
    queryFn: () => getVerifiersByDistrict(districtId),
    enabled: !!districtId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Save school allocation
 * @param {Object} payload - { id?: number | null, schoolId: string, userId: number, status: string, allocatedDate: string }
 * @returns {Promise} API response
 */
export const saveSchoolAllocation = async (payload) => {
  const response = await axiosInstance.post("/admin/school-allocated", payload);
  return response.data;
};

/**
 * React Query hook for saving school allocation
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useSaveSchoolAllocationMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => saveSchoolAllocation(data),
    mutationKey: ["admin", "save-school-allocation"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "School allocation saved successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save school allocation",
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
 * Get all roles
 * @returns {Promise} API response
 */
export const getRoles = async () => {
  const response = await axiosInstance.get("/admin/roles");
  return response.data;
};

/**
 * Update role status
 * @param {Object} payload - { roleId: number, isActive: number }
 * @returns {Promise} API response
 */
export const updateRoleStatus = async (payload) => {
  const response = await axiosInstance.put("/admin/roles", payload);
  return response.data;
};

/**
 * React Query hook for getting all roles
 * @returns {Object} Query object from React Query
 */
export const useGetRolesQuery = () => {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: getRoles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * React Query hook for updating role status
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useUpdateRoleStatusMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => updateRoleStatus(data),
    mutationKey: ["admin", "update-role-status"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Role status updated successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to update role status",
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
 * Translate Gujarati text to English and Hindi
 * @param {Object} payload - { id: number|null, transGu: string }
 * @returns {Promise} API response
 */
export const translateText = async (payload) => {
  const response = await axiosInstance.post(
    "/translation/upsert-translation",
    payload
  );
  return response.data;
};

/**
 * React Query hook for translating text
 * @param {Object} options - Mutation options
 * @returns {Object} Mutation object from React Query
 */
export const useTranslateTextMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => translateText(data),
    mutationKey: ["admin", "translate-text"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Translation successful", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(error?.response?.data?.message || "Translation failed", {
        variant: "error",
      });
      if (options.onError) {
        options.onError(error);
      }
    },
    ...options,
  });
};

/**
 * Get assessments by academic year
 * @param {string} academicYear - Academic year (optional, e.g., "2024-25")
 * @returns {Promise} API response
 */
export const getAssessments = async (academicYear) => {
  const config = academicYear ? { params: { academicYear } } : {};
  const response = await axiosInstance.get("/admin/assessment", config);
  return response.data;
};

/**
 * Update assessment details
 * @param {Object} payload - { assessmentId, roleId, isPublished, startDate, endDate }
 * @returns {Promise} API response
 */
export const updateAssessment = async (payload) => {
  const response = await axiosInstance.post("/admin/assessment", payload);
  return response.data;
};

/**
 * Publish/Unpublish assessment
 * @param {Object} payload - { roleId: number, isPublished: number }
 * @returns {Promise} API response
 */
export const publishAssessment = async (payload) => {
  const response = await axiosInstance.put("/admin/publish", payload);
  return response.data;
};

/**
 * Get assessment-role assignments
 * @returns {Promise} API response
 */
export const getAssessmentRoleAssignments = async () => {
  const response = await axiosInstance.get("/admin/assessment-role-assignment");
  return response.data;
};

/**
 * Update assessment-role assignment
 * @param {Object} payload - { roleId, assessmentId, startDate, endDate }
 * @returns {Promise} API response
 */
export const updateAssessmentRoleAssignment = async (payload) => {
  const response = await axiosInstance.post("/admin/assessment-role-assignment", payload);
  return response.data;
};

/**
 * Delete a subdomain
 * @param {string} subDomainId - ID of the subdomain to delete
 * @returns {Promise} API response
 */
export const deleteSubdomain = async (subDomainId) => {
  const response = await axiosInstance.delete("/questionnaire/sub-domain", {
    params: { subDomainId },
  });
  return response.data;
};

/**
 * Delete assessment by ID
 * @param {number} assessmentId - Assessment ID to delete
 * @returns {Promise} API response
 */
export const deleteAssessment = async (assessmentId) => {
  const response = await axiosInstance.delete("/questionnaire/assessment", {
    params: { assessmentId },
  });
  return response.data;
};

/**
 * React Query hook to get assessments
 * @param {string} academicYear - Optional academic year filter
 * @param {object} options - React Query options
 */
export const useGetAssessmentsQuery = (academicYear, options = {}) => {
  return useQuery({
    queryKey: academicYear
      ? queryKeys.admin.assessments(academicYear)
      : ["admin", "assessments"],
    queryFn: () => getAssessments(academicYear),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * React Query hook to update assessment
 */
export const useUpdateAssessmentMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => updateAssessment(data),
    mutationKey: ["admin", "update-assessment"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Assessment updated successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to update assessment",
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
 * React Query hook to publish/unpublish assessment
 */
export const usePublishAssessmentMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => publishAssessment(data),
    mutationKey: ["admin", "publish-assessment"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Assessment published successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to publish assessment",
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
 * React Query hook to get assessment-role assignments
 */
export const useGetAssessmentRoleAssignmentsQuery = (options = {}) => {
  return useQuery({
    queryKey: ["admin", "assessment-role-assignments"],
    queryFn: getAssessmentRoleAssignments,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * React Query hook to update assessment-role assignment
 */
export const useUpdateAssessmentRoleAssignmentMutation = (options = {}) => {
  return useMutation({
    mutationFn: (data) => updateAssessmentRoleAssignment(data),
    mutationKey: ["admin", "update-assessment-role-assignment"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Assignment updated successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to update assignment",
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
 * React Query mutation hook for deleting a subdomain
 */
export const useDeleteSubdomainMutation = (options = {}) => {
  return useMutation({
    mutationFn: (subDomainId) => deleteSubdomain(subDomainId),
    mutationKey: ["admin", "delete-subdomain"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Subdomain deleted successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to delete subdomain",
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
 * React Query mutation hook for deleting an assessment
 */
export const useDeleteAssessmentMutation = (options = {}) => {
  return useMutation({
    mutationFn: (assessmentId) => deleteAssessment(assessmentId),
    mutationKey: ["admin", "delete-assessment"],
    onSuccess: (data) => {
      enqueueSnackbar(data?.message || "Assessment deleted successfully", {
        variant: "success",
      });
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },
    onError: (error) => {
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to delete assessment",
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
