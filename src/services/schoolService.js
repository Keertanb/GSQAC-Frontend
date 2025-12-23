import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../config/axios";
import { queryKeys } from "../config/queryClient";

/**
 * Get school data
 * @param {Object} params - { schoolId: number, academicYear: string }
 * @returns {Promise} API response
 */
export const getSchoolData = async (params) => {
  const response = await axiosInstance.get("/school/school-data", { params });
  return response.data;
};

/**
 * React Query hook for getting school data
 * @param {Object} options - Query options
 * @param {number} options.schoolId - School ID
 * @param {string} options.academicYear - Academic Year
 * @param {boolean} options.enabled - Whether the query should run
 * @returns {Object} Query object from React Query
 */
export const useGetSchoolDataQuery = ({
  schoolId,
  academicYear,
  enabled = true,
}) => {
  return useQuery({
    queryKey: queryKeys.school.schoolData(schoolId, academicYear),
    queryFn: () => getSchoolData({ schoolId, academicYear }),
    // enabled: enabled && !!schoolId && !!academicYear,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
