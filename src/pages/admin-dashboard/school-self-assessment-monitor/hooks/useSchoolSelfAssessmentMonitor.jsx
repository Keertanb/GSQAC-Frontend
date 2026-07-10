import { useState, useMemo, useRef, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
  useGetSchoolSelfAssessmentMonitorQuery,
  useGetSchoolAssessmentStatusDetailQuery,
  useGetAdminSchoolAssessmentReportQuery,
} from "../../../../services/adminService";
import {
  ensureReportFontsLoaded,
  generateReportPdf,
  waitForPdfCapturePages,
} from "../../../school-dashboard/report-generation/utils/generateReportPdf";
import { buildReportPageList } from "../../../school-dashboard/report-generation/utils/reportPageUtils";
import studentsBanner from "../../../../assets/students_image.jpeg";
import { getSubmittedSchoolSelfAssessment } from "../../school-assessment-status/utils/schoolAssessmentProgressUtils";

export function useSchoolSelfAssessmentMonitor() {
  const [filters, setFilters] = useState({
    districtId: "",
    blockId: "",
    search: "",
    status: "all",
  });
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfCaptureActive, setPdfCaptureActive] = useState(false);
  const pdfCaptureRefs = useRef([]);

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  const { data: blocksData } = useGetDistrictWiseBlocksQuery(filters.districtId);
  const blocks = blocksData?.data || [];

  const queryEnabled = !!(filters.districtId || filters.blockId);

  const { data: monitorData, isLoading: isLoadingList, isFetching } =
    useGetSchoolSelfAssessmentMonitorQuery(
      {
        districtId: filters.districtId ? Number(filters.districtId) : undefined,
        blockId: filters.blockId ? Number(filters.blockId) : undefined,
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
        status: filters.status !== "all" ? filters.status : undefined,
      },
      queryEnabled,
    );

  const schools = monitorData?.data?.rows || [];
  const totalSchools = monitorData?.data?.total || 0;
  const summary = monitorData?.data?.summary || {
    total: 0,
    submitted: 0,
    pending: 0,
    notStarted: 0,
    recentlyActive: 0,
    submissionRate: 0,
    chartData: [],
  };
  const blockBreakdown = monitorData?.data?.blockBreakdown || [];

  const { data: detailData, isLoading: isLoadingDetail } =
    useGetSchoolAssessmentStatusDetailQuery(selectedSchoolId, !!selectedSchoolId);

  const schoolDetail = detailData?.data || null;
  const selectedSchool = useMemo(
    () => schools.find((school) => school.schoolId === selectedSchoolId) || null,
    [schools, selectedSchoolId],
  );

  const schoolSelfAssessments = useMemo(
    () =>
      (schoolDetail?.assessments || []).filter((item) => Number(item.roleId) === 2),
    [schoolDetail?.assessments],
  );

  const submittedSelfAssessment = useMemo(
    () => getSubmittedSchoolSelfAssessment(schoolDetail?.assessments || []),
    [schoolDetail?.assessments],
  );

  const {
    data: reportResponse,
    isLoading: isReportLoading,
    isError: isReportError,
    error: reportError,
    refetch: refetchReport,
  } = useGetAdminSchoolAssessmentReportQuery({
    schoolId: selectedSchoolId,
    assessmentId: submittedSelfAssessment?.assessmentId,
    languageCode: "GU",
    enabled: !!selectedSchoolId && !!submittedSelfAssessment?.assessmentId,
  });

  const report = useMemo(() => {
    const baseReport = reportResponse?.data;
    if (!baseReport?.isSubmitted) return baseReport;

    const school = schoolDetail?.school || selectedSchool || {};

    return {
      ...baseReport,
      school: {
        schoolId: selectedSchoolId,
        schoolName:
          school.schoolName ||
          school.schoolNameEn ||
          baseReport.school?.schoolName ||
          "",
        district:
          school.districtName ||
          school.district ||
          baseReport.school?.district ||
          "",
        taluka:
          school.talukaName ||
          school.taluka ||
          school.blockName ||
          baseReport.school?.taluka ||
          "",
        cluster:
          school.clusterName ||
          school.cluster ||
          baseReport.school?.cluster ||
          "",
      },
    };
  }, [reportResponse, schoolDetail, selectedSchool, selectedSchoolId]);

  const pdfPageCount = useMemo(
    () => (report?.isSubmitted ? buildReportPageList(report).length : 0),
    [report],
  );

  useEffect(() => {
    pdfCaptureRefs.current = pdfCaptureRefs.current.slice(0, pdfPageCount);
  }, [pdfPageCount]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "districtId") {
        next.blockId = "";
      }
      return next;
    });
    setCurrentPage(0);
    if (key === "districtId" || key === "blockId") {
      setSelectedSchoolId("");
    }
  };

  const handleSelectSchool = (schoolId) => {
    setSelectedSchoolId(schoolId);
  };

  const handleBackToList = () => {
    setSelectedSchoolId("");
  };

  const handleDownloadPdf = async (filename) => {
    if (!report?.isSubmitted || isGeneratingPdf) return;

    try {
      setIsGeneratingPdf(true);
      setPdfCaptureActive(true);
      await ensureReportFontsLoaded();
      await waitForPdfCapturePages(pdfCaptureRefs, pdfPageCount);
      await generateReportPdf(pdfCaptureRefs, filename, studentsBanner);
      enqueueSnackbar("Report downloaded successfully.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error?.message || "Failed to download report.", {
        variant: "error",
      });
    } finally {
      setPdfCaptureActive(false);
      setIsGeneratingPdf(false);
    }
  };

  return {
    filters,
    districts,
    blocks,
    schools,
    totalSchools,
    summary,
    blockBreakdown,
    isLoadingList,
    isFetching,
    queryEnabled,
    selectedSchoolId,
    selectedSchool,
    schoolDetail,
    schoolSelfAssessments,
    isLoadingDetail,
    report,
    isReportLoading,
    isReportError,
    reportError,
    refetchReport,
    pdfCaptureRefs,
    pdfCaptureActive,
    isGeneratingPdf,
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    handleFilterChange,
    handleSelectSchool,
    handleBackToList,
    handleDownloadPdf,
  };
}
