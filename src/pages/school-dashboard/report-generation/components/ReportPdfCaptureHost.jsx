import React from "react";
import { createPortal } from "react-dom";
import { ReportDocument } from "./ReportDocument";

/**
 * Renders the report off-screen solely for PDF capture.
 * Never visible to the user and not tied to the preview scroll container.
 */
export function ReportPdfCaptureHost({ report, pageRefs, active }) {
  if (!active || !report?.isSubmitted) {
    return null;
  }

  return createPortal(
    <div className="rpt-pdf-capture-host" aria-hidden="true">
      <ReportDocument report={report} pageRefs={pageRefs} pdfCapture />
    </div>,
    document.body,
  );
}
