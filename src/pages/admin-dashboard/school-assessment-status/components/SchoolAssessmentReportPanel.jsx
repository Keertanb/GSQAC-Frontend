import React from "react";
import { CircularProgress } from "@mui/material";
import { Download, Refresh } from "@mui/icons-material";
import { ReportDocument } from "../../../school-dashboard/report-generation/components/ReportDocument";
import "../../../school-dashboard/report-generation/ReportGeneration.css";

export function SchoolAssessmentReportPanel({
  report,
  isLoading,
  isError,
  reportError,
  onRetry,
  previewRefs,
  isGeneratingPdf,
  onDownloadPdf,
}) {
  if (isLoading) {
    return (
      <div className="sas-report-panel sas-report-panel--loading">
        <div className="sas-spinner" />
        <p>Loading school report...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="sas-report-panel sas-report-panel--error">
        <p>
          {reportError?.response?.data?.message ||
            reportError?.message ||
            "Unable to load school report."}
        </p>
        <button type="button" className="sas-report-retry-btn" onClick={onRetry}>
          <Refresh fontSize="small" />
          Retry
        </button>
      </div>
    );
  }

  if (!report?.isSubmitted) {
    return null;
  }

  const safeName = (report.school?.schoolName || "school-report")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return (
    <div className="sas-report-panel">
      <div className="sas-report-panel-header">
        <div>
          <h3 className="sas-section-title">School Accreditation Report</h3>
          <p className="sas-report-panel-subtitle">
            Submitted self-assessment report card
          </p>
        </div>
        <button
          type="button"
          className="sas-report-download-btn"
          onClick={() => onDownloadPdf(`${safeName || "school-report"}.pdf`)}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <Download fontSize="small" />
          )}
          Download PDF
        </button>
      </div>

      <div className="sas-report-preview">
        <ReportDocument report={report} pageRefs={previewRefs} />
      </div>
    </div>
  );
}
