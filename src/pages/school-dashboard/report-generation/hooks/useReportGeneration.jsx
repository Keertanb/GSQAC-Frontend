import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, useMediaQuery } from "@mui/material";
import { enqueueSnackbar } from "notistack";
import useAuthStore from "../../../../store/useAuthStore";
import { getRoleId } from "../../../../constants/roles";
import {
  useGetDomainsQuery,
  useGetAssessmentReportQuery,
  useGetSchoolDataQuery,
} from "../../../../services/schoolService";
import { useLogoutMutation } from "../../../../services/authService";
import { generateReportPdf, ensureReportFontsLoaded } from "../utils/generateReportPdf";
import studentsBanner from "../../../../assets/students_image.jpeg";

export function useReportGeneration() {
  const navigate = useNavigate();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(!matchDownMD);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const previewRefs = useRef([]);

  const { logout, userName, userId } = useAuthStore();
  const roleId = getRoleId("school");

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const logoutMutation = useLogoutMutation({
    onSuccess: () => {
      logout();
      navigate("/login");
    },
    onError: () => {
      logout();
      navigate("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const { data: domainsResponse, isLoading: isDomainsLoading } = useGetDomainsQuery({
    roleId,
    languageCode: "GU",
    userId,
    enabled: !!roleId && !!userId,
  });

  const assessments = useMemo(() => {
    const domainsData = domainsResponse?.data?.data ?? domainsResponse?.data ?? domainsResponse;
    if (!domainsData) return [];

    if (Array.isArray(domainsData?.data)) {
      if (domainsData.data.length > 0 && domainsData.data[0]?.domains) {
        return domainsData.data;
      }
      return [
        {
          assessmentId: domainsData.assessmentId ?? null,
          assessmentName: "Assessment",
          domains: domainsData.data,
          isSubmitted: domainsData?.isSubmitted,
          sessionId: domainsData?.sessionId,
        },
      ];
    }

    if (Array.isArray(domainsData) && domainsData[0]?.domains) {
      return domainsData;
    }

    return [];
  }, [domainsResponse]);

  const selectedAssessment = assessments[0] || null;
  const assessmentId = selectedAssessment?.assessmentId;
  const isSubmitted =
    Number(selectedAssessment?.isSubmitted) === 1 || selectedAssessment?.isSubmitted === true;

  const { data: schoolDataResponse } = useGetSchoolDataQuery({
    schoolId: userName,
    enabled: !!userName,
  });

  const {
    data: reportResponse,
    isLoading: isReportLoading,
    isError: isReportError,
    error: reportError,
    refetch: refetchReport,
  } = useGetAssessmentReportQuery({
    schoolId: userName,
    assessmentId,
    languageCode: "GU",
    enabled: !!userName && !!assessmentId && isSubmitted,
  });

  const schoolData = schoolDataResponse?.data ?? schoolDataResponse;

  const report = useMemo(() => {
    const baseReport = reportResponse?.data;
    if (!baseReport?.isSubmitted) return baseReport;

    return {
      ...baseReport,
      school: {
        schoolId: userName,
        schoolName:
          schoolData?.schoolName ||
          schoolData?.schoolNameEn ||
          baseReport.school?.schoolName ||
          "",
        district:
          schoolData?.districtName ||
          schoolData?.district ||
          baseReport.school?.district ||
          "",
        taluka:
          schoolData?.talukaName ||
          schoolData?.taluka ||
          baseReport.school?.taluka ||
          "",
        cluster:
          schoolData?.clusterName ||
          schoolData?.cluster ||
          baseReport.school?.cluster ||
          "",
      },
    };
  }, [reportResponse, schoolData, userName]);

  useEffect(() => {
    if (report?.isSubmitted) {
      ensureReportFontsLoaded().catch(() => undefined);
      const image = new Image();
      image.src = studentsBanner;
    }
  }, [report?.isSubmitted]);

  const handleDownloadPdf = async () => {
    if (!report?.isSubmitted) {
      enqueueSnackbar("Submit your assessment before generating the report.", { variant: "warning" });
      return;
    }

    setIsGeneratingPdf(true);
    try {
      await ensureReportFontsLoaded();
      const pages = previewRefs.current.filter(Boolean);
      const safeName = (report.school?.schoolName || "school-report")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      await generateReportPdf(pages, `${safeName || "school-report"}.pdf`);
      enqueueSnackbar("Report downloaded successfully.", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(error?.message || "Failed to generate PDF.", { variant: "error" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return {
    theme,
    drawerOpen,
    setDrawerOpen,
    matchDownMD,
    handleDrawerToggle,
    handleLogout,
    isDomainsLoading,
    isReportLoading,
    isReportError,
    reportError,
    refetchReport,
    isSubmitted,
    assessmentId,
    report,
    previewRefs,
    isGeneratingPdf,
    handleDownloadPdf,
    selectedAssessment,
  };
}
