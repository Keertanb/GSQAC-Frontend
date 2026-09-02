import React from "react";
import { createPortal } from "react-dom";
import { AdminMonitorReportDocument } from "./AdminMonitorReportDocument";

export function AdminMonitorReportPdfCaptureHost({ report, pageRefs, active }) {
  if (!active || !report?.isSubmitted) {
    return null;
  }

  return createPortal(
    <div className="amr-pdf-capture-host" aria-hidden="true">
      <AdminMonitorReportDocument report={report} pageRefs={pageRefs} pdfCapture />
    </div>,
    document.body,
  );
}
