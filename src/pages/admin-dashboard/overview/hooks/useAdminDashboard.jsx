import { useState, useMemo } from "react";
import {
  useGetAdminDashboardQuery,
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
  useGetSchoolListQuery,
} from "../../../../services/adminService";

const pct = (num, den) => (den > 0 ? Math.round((num / den) * 100) : 0);
const RADAR_COLORS = ["#4338ca", "#0891b2", "#b45309", "#059669", "#be185d"];

export function useAdminDashboard() {
  const [districtId, setDistrictId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [schoolId, setSchoolId] = useState("");

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  const { data: blocksData } = useGetDistrictWiseBlocksQuery(
    districtId ? Number(districtId) : undefined,
  );
  const blocks = blocksData?.data || [];

  const { data: schoolsData } = useGetSchoolListQuery(
    {
      blockId: blockId ? Number(blockId) : undefined,
      page: 0,
      limit: 500,
    },
    Boolean(blockId),
  );
  const schools = schoolsData?.data?.rows || [];

  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } =
    useGetAdminDashboardQuery(
      { districtId: districtId ? Number(districtId) : undefined },
      true,
    );

  const { data: statewideData } = useGetAdminDashboardQuery({}, Boolean(districtId));

  const dashboard = data?.data || {};
  const statewideDashboard = statewideData?.data || {};
  const overview = dashboard.overview || {};
  const verificationStatus = dashboard.verificationStatus || [];
  const assessmentStatus = dashboard.assessmentStatus || [];
  const selfAssessmentCounts = dashboard.selfAssessmentCounts || {};
  const districtBreakdown = dashboard.districtBreakdown || [];
  const statewideDistrictBreakdown =
    districtId && statewideDashboard.districtBreakdown?.length
      ? statewideDashboard.districtBreakdown
      : districtBreakdown;
  const blockBreakdown = dashboard.blockBreakdown || [];
  const verifierWorkload = dashboard.verifierWorkload || [];

  const selectedDistrict = useMemo(() => {
    if (!districtId) return null;
    return districts.find((d) => String(d.value) === String(districtId));
  }, [districtId, districts]);

  const selectedBlock = useMemo(() => {
    if (!blockId) return null;
    return blocks.find((b) => String(b.value ?? b.blockId) === String(blockId));
  }, [blockId, blocks]);

  const selectedSchool = useMemo(() => {
    if (!schoolId) return null;
    return schools.find((s) => String(s.schoolId) === String(schoolId));
  }, [schoolId, schools]);

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

  const completionRateChartData = useMemo(
    () =>
      [...districtBreakdown]
        .filter((d) => (d.allocatedSchools ?? 0) > 0)
        .map((d) => {
          const rate = pct(d.completedVerification, d.allocatedSchools);
          return {
            name:
              (d.districtName || `District ${d.districtId}`).length > 16
                ? `${(d.districtName || "").slice(0, 14)}…`
                : d.districtName || `D${d.districtId}`,
            fullName: d.districtName || `District ${d.districtId}`,
            rate,
            completed: d.completedVerification ?? 0,
            pending: d.pendingVerification ?? 0,
            allocated: d.allocatedSchools ?? 0,
            verifiers: d.activeVerifiers ?? 0,
          };
        })
        .sort((a, b) => b.rate - a.rate),
    [districtBreakdown],
  );

  const laggingDistricts = useMemo(
    () =>
      [...districtBreakdown]
        .filter((d) => (d.allocatedSchools ?? 0) > 0)
        .map((d) => ({
          ...d,
          completionRate: pct(d.completedVerification, d.allocatedSchools),
        }))
        .sort((a, b) => a.completionRate - b.completionRate)
        .slice(0, 5),
    [districtBreakdown],
  );

  const verifierStatusChart = useMemo(
    () => [
      {
        name: "Active",
        value: overview.activeVerifiers ?? 0,
        color: "#10b981",
      },
      {
        name: "Inactive",
        value: overview.inactiveVerifiers ?? 0,
        color: "#94a3b8",
      },
    ].filter((item) => item.value > 0),
    [overview.activeVerifiers, overview.inactiveVerifiers],
  );

  const allocationFunnel = useMemo(() => {
    const tracked = overview.totalTrackedSchools ?? overview.totalSchools ?? 0;
    const allocated = overview.allocatedSchools ?? 0;
    const verified = overview.completedVerification ?? 0;
    return {
      tracked,
      allocated,
      verified,
      pending: overview.pendingVerification ?? 0,
      allocationRate: pct(allocated, tracked),
      verificationRate: pct(verified, allocated),
    };
  }, [overview]);

  const comparisonChartData = useMemo(() => {
    const verificationCompleted =
      verificationStatus.find((s) => s.name === "Completed")?.value ?? 0;
    const verificationPending =
      verificationStatus.find((s) => s.name === "Pending")?.value ?? 0;
    const assessmentCompleted =
      assessmentStatus.find((s) => s.name === "Completed")?.value ?? 0;
    const assessmentPending =
      assessmentStatus.find((s) => s.name === "Pending")?.value ?? 0;
    const assessmentInProgress =
      assessmentStatus.find((s) => s.name === "In Progress")?.value ?? 0;

    return [
      {
        name: "Verification",
        completed: verificationCompleted,
        pending: verificationPending,
        inProgress: 0,
      },
      {
        name: "Assessment",
        completed: assessmentCompleted,
        pending: assessmentPending,
        inProgress: assessmentInProgress,
      },
    ];
  }, [verificationStatus, assessmentStatus]);

  const workloadBuckets = useMemo(() => {
    const buckets = { light: 0, balanced: 0, heavy: 0 };
    verifierWorkload.forEach((v) => {
      const pending = v.pendingSchools ?? 0;
      const completed = v.completedSchools ?? 0;
      if (pending > completed) buckets.heavy += 1;
      else if (pending > 0) buckets.balanced += 1;
      else buckets.light += 1;
    });
    return [
      { name: "On track", value: buckets.light, color: "#10b981" },
      { name: "In progress", value: buckets.balanced, color: "#3b82f6" },
      { name: "Backlogged", value: buckets.heavy, color: "#f59e0b" },
    ].filter((b) => b.value > 0);
  }, [verifierWorkload]);

  const districtPerformanceData = useMemo(
    () =>
      districtChartData.map((d) => ({
        ...d,
        rate: d.allocated > 0 ? Math.round((d.completed / d.allocated) * 100) : 0,
      })),
    [districtChartData],
  );

  const districtRadarData = useMemo(() => {
    const top = [...districtChartData]
      .sort((a, b) => b.allocated - a.allocated)
      .slice(0, 5);
    if (top.length < 2) return { entities: [], axes: [] };
    const maxVerifiers = Math.max(1, ...top.map((d) => d.verifiers));
    const maxAllocated = Math.max(1, ...top.map((d) => d.allocated));
    const entities = top.map((d, i) => ({ key: d.fullName, color: RADAR_COLORS[i % RADAR_COLORS.length] }));
    const axes = [
      {
        metric: "Verification Rate",
        ...Object.fromEntries(top.map((d) => [d.fullName, pct(d.completed, d.allocated)])),
      },
      {
        metric: "Verifier Strength",
        ...Object.fromEntries(top.map((d) => [d.fullName, Math.round((d.verifiers / maxVerifiers) * 100)])),
      },
      {
        metric: "Allocation Volume",
        ...Object.fromEntries(top.map((d) => [d.fullName, Math.round((d.allocated / maxAllocated) * 100)])),
      },
    ];
    return { entities, axes };
  }, [districtChartData]);

  const blockRadarData = useMemo(() => {
    const top = [...blockChartData]
      .filter((b) => b.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
    if (top.length < 2) return { entities: [], axes: [] };
    const entities = top.map((b, i) => ({ key: b.fullName, color: RADAR_COLORS[i % RADAR_COLORS.length] }));
    const axes = [
      {
        metric: "Completion Rate",
        ...Object.fromEntries(top.map((b) => [b.fullName, pct(b.completed, b.total)])),
      },
      {
        metric: "In-Progress Rate",
        ...Object.fromEntries(top.map((b) => [b.fullName, pct(b.inProgress, b.total)])),
      },
      {
        metric: "Allocation Rate",
        ...Object.fromEntries(top.map((b) => [b.fullName, pct(b.total - b.notAllocated, b.total)])),
      },
    ];
    return { entities, axes };
  }, [blockChartData]);

  const blockHeatmapData = useMemo(
    () =>
      [...blockChartData]
        .map((b) => ({
          name: b.fullName,
          rate: pct(b.completed, b.total),
          total: b.total,
          completed: b.completed,
        }))
        .sort((a, b) => b.rate - a.rate),
    [blockChartData],
  );

  const insightCards = useMemo(() => {
    const districtsBelow50 = districtBreakdown.filter(
      (d) =>
        (d.allocatedSchools ?? 0) > 0 &&
        pct(d.completedVerification, d.allocatedSchools) < 50,
    ).length;

    const totalPending = overview.pendingVerification ?? 0;
    const activeVerifiers = overview.activeVerifiers ?? 0;
    const avgPendingPerVerifier =
      activeVerifiers > 0 ? Math.round(totalPending / activeVerifiers) : 0;

    const tracked = overview.totalTrackedSchools ?? overview.totalSchools ?? 0;
    const allocated = overview.allocatedSchools ?? 0;

    return {
      allocationCoverage: pct(allocated, tracked),
      districtsBelow50,
      totalPending,
      avgPendingPerVerifier,
      unallocatedSchools: Math.max(0, tracked - allocated),
    };
  }, [districtBreakdown, overview]);

  const handleDistrictChange = (value) => {
    setDistrictId(value);
    setBlockId("");
    setSchoolId("");
  };

  const handleDistrictSelect = (value) => {
    setDistrictId(value);
    setBlockId("");
    setSchoolId("");
  };

  const handleClearDistrict = () => {
    setDistrictId("");
    setBlockId("");
    setSchoolId("");
  };

  const handleBlockChange = (value) => {
    setBlockId(value);
    setSchoolId("");
  };

  const handleBlockSelect = (value) => {
    setBlockId(value);
    setSchoolId("");
  };

  const handleClearBlock = () => {
    setBlockId("");
    setSchoolId("");
  };

  const handleSchoolChange = (value) => {
    setSchoolId(value);
  };

  const handleSchoolSelect = (value) => {
    setSchoolId(value);
  };

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;


  return {
    districtId,
    blockId,
    schoolId,
    districts,
    blocks,
    schools,
    selectedDistrict,
    selectedBlock,
    selectedSchool,
    dashboard,
    overview,
    verificationStatus,
    assessmentStatus,
    selfAssessmentCounts,
    districtChartData,
    blockChartData,
    blockBreakdown,
    districtBreakdown,
    statewideDistrictBreakdown,
    verifierChartData,
    verifierWorkload,
    completionRateChartData,
    laggingDistricts,
    verifierStatusChart,
    allocationFunnel,
    comparisonChartData,
    workloadBuckets,
    districtPerformanceData,
    districtRadarData,
    blockRadarData,
    blockHeatmapData,
    insightCards,
    insights,
    isLoading,
    isError,
    isFetching,
    lastUpdated,
    refetch,
    handleDistrictChange,
    handleDistrictSelect,
    handleClearDistrict,
    handleBlockChange,
    handleBlockSelect,
    handleClearBlock,
    handleSchoolChange,
    handleSchoolSelect,
  };
}
