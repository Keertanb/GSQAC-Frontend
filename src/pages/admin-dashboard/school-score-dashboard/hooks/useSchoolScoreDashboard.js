import { useMemo, useState, useEffect } from "react";
import {
  useGetAdminSchoolScoreDashboardQuery,
  useGetAllDistrictsQuery,
} from "../../../../services/adminService";
import useAuthStore from "../../../../store/useAuthStore";
import { isNodalRole } from "../../../../constants/roles";
import { rejectTestDistricts } from "../../../../utils/excludedDistricts";
import { getAssessmentGradeInfo } from "../../../../utils/assessmentGrading";

const BAND_COLORS = [
  "#94a3b8",
  "#64748b",
  "#0e7490",
  "#0891b2",
  "#06b6d4",
  "#14b8a6",
  "#10b981",
  "#34d399",
  "#059669",
  "#047857",
];

const GRADE_COLORS = {
  A5: "#047857",
  A4: "#059669",
  A3: "#10b981",
  A2: "#34d399",
  A1: "#6ee7b7",
  B: "#ca8a04",
  C: "#dc2626",
  D: "#94a3b8",
};

export function useSchoolScoreDashboard() {
  const role = useAuthStore((state) => state.role);
  const authDistrictId = useAuthStore(
    (state) => state.districtId ?? state.user?.districtId,
  );
  const isNodal = isNodalRole(role);
  const lockedDistrictId =
    isNodal && authDistrictId != null && String(authDistrictId) !== ""
      ? String(authDistrictId)
      : "";

  const [districtId, setDistrictId] = useState(lockedDistrictId);

  useEffect(() => {
    if (lockedDistrictId && districtId !== lockedDistrictId) {
      setDistrictId(lockedDistrictId);
    }
  }, [lockedDistrictId, districtId]);

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = useMemo(() => {
    const all = rejectTestDistricts(districtsData?.data || []);
    if (!isNodal || !lockedDistrictId) return all;
    return all.filter(
      (d) => String(d.value ?? d.districtId) === String(lockedDistrictId),
    );
  }, [districtsData, isNodal, lockedDistrictId]);

  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt, error } =
    useGetAdminSchoolScoreDashboardQuery(
      { districtId: districtId ? Number(districtId) : undefined },
      !isNodal || Boolean(lockedDistrictId),
    );

  const payload = data?.data || {};
  const summary = payload.summary || {};
  const scoreBands = payload.scoreBands || [];
  const gradeDistribution = payload.gradeDistribution || [];
  const districtAverages = rejectTestDistricts(payload.districtAverages || []);

  const averageGradeInfo = useMemo(
    () => getAssessmentGradeInfo(summary.averageScore),
    [summary.averageScore],
  );

  const bandChartData = useMemo(
    () =>
      scoreBands.map((row, index) => ({
        ...row,
        fill: BAND_COLORS[index % BAND_COLORS.length],
      })),
    [scoreBands],
  );

  const gradeChartData = useMemo(
    () =>
      gradeDistribution.map((row) => ({
        ...row,
        name: row.gradeLabel,
        fill: GRADE_COLORS[row.gradeLabel] || "#64748b",
      })),
    [gradeDistribution],
  );

  const totalBandSchools = useMemo(
    () => scoreBands.reduce((sum, row) => sum + (row.schoolCount || 0), 0),
    [scoreBands],
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return null;
    return new Date(dataUpdatedAt).toLocaleString();
  }, [dataUpdatedAt]);

  return {
    isNodal,
    districtId,
    setDistrictId,
    districts,
    isLoading,
    isError,
    isFetching,
    refetch,
    error,
    summary,
    averageGradeInfo,
    bandChartData,
    gradeChartData,
    districtAverages,
    totalBandSchools,
    lastUpdatedLabel,
  };
}
