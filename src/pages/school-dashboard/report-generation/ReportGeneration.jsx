import React from "react";
import { useReportGeneration } from "./hooks/useReportGeneration";
import { ReportGenerationPageView } from "./components/ReportGenerationPageView";

const ReportGeneration = () => {
  const c = useReportGeneration();
  return <ReportGenerationPageView c={c} />;
};

export default ReportGeneration;
