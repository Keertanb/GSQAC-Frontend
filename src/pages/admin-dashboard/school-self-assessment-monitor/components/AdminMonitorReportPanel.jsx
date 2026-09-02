import React from "react";
import { CircularProgress } from "@mui/material";
import { Download, Refresh } from "@mui/icons-material";
import { AdminMonitorReportDocument } from "./AdminMonitorReportDocument";
import { AdminMonitorReportPdfCaptureHost } from "./AdminMonitorReportPdfCaptureHost";
import "../AdminMonitorReport.css";

export function AdminMonitorReportPanel({
  report,
  isLoading,
  isError,
  reportError,
  onRetry,
  pdfCaptureRefs,
  pdfCaptureActive,
  isGeneratingPdf,
  onDownloadPdf,
}) {
  if (isLoading) {
    return (
      <div className="ssam-report-panel ssam-report-panel--loading">
        <div className="ssam-spinner" />
        <p>Loading assessment report...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="ssam-report-panel ssam-report-panel--error">
        <p>
          {reportError?.response?.data?.message ||
            reportError?.message ||
            "Unable to load assessment report."}
        </p>
        <button type="button" className="ssam-report-retry-btn" onClick={onRetry}>
          <Refresh fontSize="small" />
          Retry
        </button>
      </div>
    );
  }

  if (!report?.isSubmitted) {
    return (
      <div className="ssam-report-panel ssam-report-panel--empty">
        <h3>Self-Assessment Report</h3>
        <p>Report will appear here once the school submits self-assessment.</p>
      </div>
    );
  }

  const safeName = (report.school?.schoolName || "school-report")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return (
    <div className="ssam-report-panel">
      <div className="ssam-report-panel-header">
        <div>
          <h3>Self-Assessment Report</h3>
          <p className="ssam-report-panel-subtitle">
            3-page domain performance summary
            {report.academicYear ? ` · ${report.academicYear}` : ""}
            {report.round != null && report.round !== "" ? ` · Round ${report.round}` : ""}
          </p>
        </div>
        <button
          type="button"
          className="ssam-report-download-btn"
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

      <div className="ssam-report-preview">
        <AdminMonitorReportDocument report={report} screenPreview />
      </div>

      <AdminMonitorReportPdfCaptureHost
        report={report}
        pageRefs={pdfCaptureRefs}
        active={pdfCaptureActive}
      />
    </div>
  );
}
