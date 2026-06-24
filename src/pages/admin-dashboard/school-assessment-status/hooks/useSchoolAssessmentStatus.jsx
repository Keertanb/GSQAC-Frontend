import { useState, useMemo, useRef, useEffect } from "react";
import { enqueueSnackbar } from "notistack";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
  useGetSchoolAssessmentStatusListQuery,
  useGetSchoolAssessmentStatusDetailQuery,
  useGetAdminSchoolAssessmentReportQuery,
} from "../../../../services/adminService";
import {
  ensureReportFontsLoaded,
  generateReportPdf,
} from "../../../school-dashboard/report-generation/utils/generateReportPdf";
import studentsBanner from "../../../../assets/students_image.jpeg";
import {
  getRoleAssessmentProgress,
  getSubmittedSchoolSelfAssessment,
} from "../utils/schoolAssessmentProgressUtils";

export function useSchoolAssessmentStatus() {
  const [filters, setFilters] = useState({
    districtId: "",
    blockId: "",
    search: "",
  });
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const previewRefs = useRef([]);

  const { data: districtsData } = useGetAllDistrictsQuery();
  const districts = districtsData?.data || [];

  const { data: blocksData } = useGetDistrictWiseBlocksQuery(filters.districtId);
  const blocks = blocksData?.data || [];

  const { data: listData, isLoading: isLoadingList } =
    useGetSchoolAssessmentStatusListQuery(
      {
        blockId: filters.blockId ? Number(filters.blockId) : undefined,
        page: currentPage,
        limit: itemsPerPage,
        search: filters.search || undefined,
      },
      !!filters.blockId,
    );

  const schools = listData?.data?.rows || [];
  const totalSchools = listData?.data?.total || 0;
  const summary = listData?.data?.summary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    notAllocated: 0,
  };

  const { data: detailData, isLoading: isLoadingDetail } =
    useGetSchoolAssessmentStatusDetailQuery(selectedSchoolId, !!selectedSchoolId);

  const schoolDetail = detailData?.data || null;

  const selectedSchool = useMemo(
    () => schools.find((s) => s.schoolId === selectedSchoolId) || null,
    [schools, selectedSchoolId],
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
        schoolName: school.schoolName || school.schoolNameEn || baseReport.school?.schoolName || "",
        district: school.districtName || school.district || baseReport.school?.district || "",
        taluka: school.talukaName || school.taluka || school.blockName || baseReport.school?.taluka || "",
        cluster: school.clusterName || school.cluster || baseReport.school?.cluster || "",
      },
    };
  }, [reportResponse, schoolDetail, selectedSchool, selectedSchoolId]);

  const progressOverview = useMemo(() => {
    const assessments = schoolDetail?.assessments || [];
    const fallback = selectedSchool || {};

    return {
      schoolSelf: getRoleAssessmentProgress(assessments, 2, fallback),
      verifier: getRoleAssessmentProgress(assessments, 3, fallback),
      crc: getRoleAssessmentProgress(assessments, 4, fallback),
    };
  }, [schoolDetail?.assessments, selectedSchool]);

  useEffect(() => {
    if (submittedSelfAssessment?.assessmentId) {
      ensureReportFontsLoaded().catch(() => undefined);
      const image = new Image();
      image.src = studentsBanner;
    }
  }, [submittedSelfAssessment?.assessmentId]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "districtId") {
        next.blockId = "";
        setSelectedSchoolId("");
      }
      if (field === "blockId") {
        setSelectedSchoolId("");
      }
      return next;
    });
    setCurrentPage(0);
  };

  const handleSchoolSelect = (schoolId) => {
    setSelectedSchoolId(schoolId);
  };

  const handleBackToList = () => {
    setSelectedSchoolId("");
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(0);
  };

  const handleDownloadPdf = async (fileName = "school-assessment-report.pdf") => {
    if (!report?.isSubmitted) {
      enqueueSnackbar("School has not submitted the self-assessment yet.", {
        variant: "warning",
      });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      await ensureReportFontsLoaded();
      const pages = previewRefs.current.filter(Boolean);
      await generateReportPdf(pages, fileName);
      enqueueSnackbar("Report downloaded successfully.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error?.message || "Failed to generate PDF.", { variant: "error" });
    } finally {
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
    isLoadingList,
    selectedSchoolId,
    selectedSchool,
    schoolDetail,
    isLoadingDetail,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    handleFilterChange,
    handleSchoolSelect,
    handleBackToList,
    handleItemsPerPageChange,
    progressOverview,
    submittedSelfAssessment,
    report,
    isReportLoading,
    isReportError,
    reportError,
    refetchReport,
    previewRefs,
    isGeneratingPdf,
    handleDownloadPdf,
  };
}
