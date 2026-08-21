import { useMemo } from "react";
import { useGetAllDistrictsQuery } from "../../../../services/adminService";
import { useGetVerifierRegistrationsQuery } from "../../../../services/verifierRegistrationService";
import useAuthStore from "../../../../store/useAuthStore";
import { isNodalRole } from "../../../../constants/roles";
import {
  buildVerifierRegistrationAnalytics,
  emptyVerifierRegistrationAnalytics,
} from "../utils/buildVerifierRegistrationAnalytics";

export function useVerifierRegistrationAnalytics(enabled = true) {
  const role = useAuthStore((s) => s.role);
  const authDistrictId = useAuthStore((s) => s.districtId);
  const districtId =
    isNodalRole(role) && Number(authDistrictId) > 0
      ? Number(authDistrictId)
      : undefined;

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  const { data, isLoading, isError, isFetching, refetch } =
    useGetVerifierRegistrationsQuery(
      {
        page: 0,
        limit: 10000,
        districtId,
      },
      {
        enabled,
        staleTime: 60 * 1000,
      },
    );

  const payload = data?.data || data || {};
  const rows = payload.rows || [];

  const analytics = useMemo(() => {
    if (!rows.length) return emptyVerifierRegistrationAnalytics();
    return buildVerifierRegistrationAnalytics(rows, districts);
  }, [rows, districts]);

  return {
    analytics,
    isLoading: enabled && isLoading,
    isFetching: enabled && isFetching,
    isError: enabled && isError,
    refetch,
    rowCount: rows.length,
    districtScoped: !!districtId,
  };
}
