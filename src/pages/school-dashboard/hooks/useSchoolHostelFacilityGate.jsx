import { useQueryClient } from "@tanstack/react-query";
import useAuthStore from "../../../store/useAuthStore";
import {
  useGetSchoolDataQuery,
  useSetSchoolHostelFacilityMutation,
} from "../../../services/schoolService";

/**
 * Shows the one-time hostel facility modal for school users when hostel is unset.
 * Use <SchoolHostelFacilityModalGate /> on any school dashboard screen.
 */
export function useSchoolHostelFacilityGate() {
  const queryClient = useQueryClient();
  const { userName } = useAuthStore();

  const {
    data: schoolDataResponse,
    isLoading: isLoadingSchoolData,
    refetch: refetchSchoolData,
  } = useGetSchoolDataQuery({
    schoolId: userName || undefined,
    enabled: !!userName,
  });

  const schoolData = schoolDataResponse?.data || {};

  const showHostelFacilityModal =
    !isLoadingSchoolData &&
    !!userName &&
    (schoolData.hostel === null || schoolData.hostel === undefined);

  const setHostelFacilityMutation = useSetSchoolHostelFacilityMutation({
    onSuccess: () => {
      refetchSchoolData();
      queryClient.invalidateQueries({ queryKey: ["school", "domains"] });
    },
  });

  const handleConfirmHostelFacility = (hostel) => {
    if (!userName) return;
    setHostelFacilityMutation.mutate({
      schoolId: userName,
      hostel,
    });
  };

  return {
    showHostelFacilityModal,
    handleConfirmHostelFacility,
    isSavingHostelFacility: setHostelFacilityMutation.isPending,
    isHostelConfigured:
      schoolData.hostel !== null && schoolData.hostel !== undefined,
    isLoadingSchoolData,
  };
}
