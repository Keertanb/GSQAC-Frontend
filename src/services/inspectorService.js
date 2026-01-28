import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";

/**
 * Get allocated schools for inspector
 * @param {Object} params - { districtId: number }
 * @returns {Promise} API response
 */
export const getAllocatedSchools = async (params = {}) => {
  const { districtId, ...otherParams } = params;
  const config = {
    params: { ...otherParams },
  };

  if (districtId) {
    config.params.districtId = districtId;
  }

  const response = await axiosInstance.get(
    "/inspector/allocated-schools",
    config
  );
  return response.data;
};

/**
 * React Query hook for getting allocated schools
 * @param {Object} options - Query options including districtId
 * @returns {Object} Query object from React Query
 */
export const useGetAllocatedSchoolsQuery = ({ districtId, enabled = true }) => {
  return useQuery({
    queryKey: queryKeys.inspector.allocatedSchools(districtId),
    queryFn: () => getAllocatedSchools({ districtId }),
    // enabled: enabled && !!districtId && districtId !== undefined && districtId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};
