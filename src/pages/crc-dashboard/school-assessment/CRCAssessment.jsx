import React from "react";
import { useCRCAssessment } from "./hooks/useCRCAssessment";
import { CRCAssessmentPageView } from "./components/CRCAssessmentPageView";
import { ErrorBoundary } from "../../../components/ErrorBoundary/ErrorBoundary";

const CRCAssessment = () => {
  const c = useCRCAssessment();
  return (
    <ErrorBoundary
      logLabel="CRCAssessment"
      title="CRC assessment could not be loaded"
      message="Reload the page to continue this school assessment."
    >
      <CRCAssessmentPageView c={c} />
    </ErrorBoundary>
  );
};

export default CRCAssessment;
