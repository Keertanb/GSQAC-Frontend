import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetAdminDashboardQuery,
  useGetAllDistrictsQuery,
} from "../../../../services/adminService";
import {
  ADMIN_SCHOOL_ALLOCATION_URL,
  ADMIN_SCHOOL_ASSESSMENT_STATUS_URL,
  ADMIN_VERIFIER_URL,
} from "../../../../routes/routeUrls";

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);

export function useAdminDashboard() {
  const navigate = useNavigate();
  const [districtId, setDistrictId] = useState("");

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useGetAdminDashboardQuery(
      { districtId: districtId ? Number(districtId) : undefined },
      true,
    );

  const dashboard = data?.data || {};
  const overview = dashboard.overview || {};
  const verificationStatus = dashboard.verificationStatus || [];
  const assessmentStatus = dashboard.assessmentStatus || [];
  const districtBreakdown = dashboard.districtBreakdown || [];
  const blockBreakdown = dashboard.blockBreakdown || [];
  const verifierWorkload = dashboard.verifierWorkload || [];

  const selectedDistrict = useMemo(() => {
    if (!districtId) return null;
    return districts.find((d) => String(d.value) === String(districtId));
  }, [districtId, districts]);

  const insights = useMemo(() => {
    const allocated = overview.allocatedSchools ?? 0;
    const completed = overview.completedVerification ?? 0;
    const pending = overview.pendingVerification ?? 0;
    const verificationTotal = completed + pending;
    const verificationRate = pct(completed, verificationTotal);

    const assessmentTotals = assessmentStatus.reduce(
      (acc, s) => ({ ...acc, [s.name]: s.value }),
      {},
    );
    const assessmentCompleted = assessmentTotals.Completed ?? 0;
    const assessmentTotal = assessmentStatus.reduce((s, i) => s + i.value, 0);
    const assessmentRate = pct(assessmentCompleted, assessmentTotal);

    const activeVerifiers = overview.activeVerifiers ?? 0;
    const avgSchoolsPerVerifier =
      activeVerifiers > 0 ? Math.round(allocated / activeVerifiers) : 0;

    const attentionItems = [];

    if (pending > 0) {
      attentionItems.push({
        id: "pending-verification",
        type: "warning",
        title: `${pending} schools awaiting verification`,
        detail: "Verifier physical verification (PC) is still pending.",
      });
    }

    const unallocatedBlocks = blockBreakdown.filter((b) => b.notAllocated > 0);
    if (unallocatedBlocks.length > 0) {
      attentionItems.push({
        id: "unallocated-blocks",
        type: "danger",
        title: `${unallocatedBlocks.length} block(s) have unallocated schools`,
        detail: `${unallocatedBlocks.reduce((s, b) => s + b.notAllocated, 0)} schools need verifier assignment.`,
      });
    }

    const overloadedVerifiers = verifierWorkload.filter(
      (v) => (v.pendingSchools ?? 0) > (v.completedSchools ?? 0),
    );
    if (overloadedVerifiers.length > 0) {
      attentionItems.push({
        id: "verifier-backlog",
        type: "info",
        title: `${overloadedVerifiers.length} verifier(s) have more pending than completed`,
        detail: "Consider rebalancing workload across verifiers.",
      });
    }

    if ((overview.inactiveVerifiers ?? 0) > 0) {
      attentionItems.push({
        id: "inactive-verifiers",
        type: "muted",
        title: `${overview.inactiveVerifiers} inactive verifier account(s)`,
        detail: "Review and activate or remove unused accounts.",
      });
    }

    const topDistricts = [...districtBreakdown]
      .map((d) => ({
        ...d,
        completionRate: pct(d.completedVerification, d.allocatedSchools),
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    const blocksNeedingAttention = [...blockBreakdown]
      .filter((b) => b.total > 0 && b.completed < b.total)
      .map((b) => ({
        ...b,
        completionRate: pct(b.completed, b.total),
      }))
      .sort((a, b) => a.completionRate - b.completionRate)
      .slice(0, 5);

    const topVerifiers = [...verifierWorkload]
      .map((v) => ({
        ...v,
        completionRate: pct(v.completedSchools, v.totalSchools),
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    return {
      verificationRate,
      assessmentRate,
      verificationTotal,
      assessmentTotal,
      avgSchoolsPerVerifier,
      attentionItems,
      topDistricts,
      blocksNeedingAttention,
      topVerifiers,
      districtsWithData: districtBreakdown.length,
      blocksWithData: blockBreakdown.length,
    };
  }, [overview, assessmentStatus, blockBreakdown, verifierWorkload, districtBreakdown]);

  const districtChartData = useMemo(
    () =>
      districtBreakdown.map((d) => ({
        name:
          (d.districtName || `District ${d.districtId}`).length > 14
            ? `${(d.districtName || "").slice(0, 12)}…`
            : d.districtName || `D${d.districtId}`,
        fullName: d.districtName || `District ${d.districtId}`,
        completed: d.completedVerification ?? 0,
        pending: d.pendingVerification ?? 0,
        allocated: d.allocatedSchools ?? 0,
        verifiers: d.activeVerifiers ?? 0,
      })),
    [districtBreakdown],
  );

  const blockChartData = useMemo(
    () =>
      blockBreakdown.map((b) => ({
        name:
          b.blockName?.length > 18
            ? `${b.blockName.slice(0, 16)}…`
            : b.blockName,
        fullName: b.blockName,
        completed: b.completed ?? 0,
        inProgress: b.inProgress ?? 0,
        pending: b.pending ?? 0,
        notAllocated: b.notAllocated ?? 0,
        total: b.total ?? 0,
      })),
    [blockBreakdown],
  );

  const verifierChartData = useMemo(
    () =>
      verifierWorkload.map((v) => ({
        name:
          (v.verifierUserName || `Verifier ${v.verifierUserId}`).length > 14
            ? `${(v.verifierUserName || "").slice(0, 12)}…`
            : v.verifierUserName || `V${v.verifierUserId}`,
        fullName: v.verifierUserName || `Verifier ${v.verifierUserId}`,
        completed: v.completedSchools ?? 0,
        pending: v.pendingSchools ?? 0,
        total: v.totalSchools ?? 0,
      })),
    [verifierWorkload],
  );

  const handleDistrictChange = (value) => {
    setDistrictId(value);
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const quickLinks = [
    {
      label: "Manage Verifiers",
      description: "Add, edit & assign districts",
      url: ADMIN_VERIFIER_URL,
      tone: "indigo",
      stat: `${overview.activeVerifiers ?? 0} active`,
    },
    {
      label: "School Allocation",
      description: "Assign schools to verifiers",
      url: ADMIN_SCHOOL_ALLOCATION_URL,
      tone: "blue",
      stat: `${overview.allocatedSchools ?? 0} allocated`,
    },
    {
      label: "Assessment Status",
      description: "Drill into school progress",
      url: ADMIN_SCHOOL_ASSESSMENT_STATUS_URL,
      tone: "emerald",
      stat: districtId ? `${overview.totalSchools ?? 0} schools` : "By block",
    },
  ];

  return {
    navigate,
    districtId,
    districts,
    selectedDistrict,
    dashboard,
    overview,
    verificationStatus,
    assessmentStatus,
    districtChartData,
    blockChartData,
    blockBreakdown,
    verifierChartData,
    verifierWorkload,
    insights,
    isLoading,
    isError,
    isFetching,
    lastUpdated,
    refetch,
    handleDistrictChange,
    quickLinks,
  };
}
