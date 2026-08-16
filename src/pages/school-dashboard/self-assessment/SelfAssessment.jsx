import React from "react";
import { useSelfAssessment } from "./hooks/useSelfAssessment";
import { SelfAssessmentPageView } from "./components/SelfAssessmentPageView";
import { ErrorBoundary } from "../../../components/ErrorBoundary/ErrorBoundary";

const SelfAssessment = () => {
  const c = useSelfAssessment();
  return (
    <ErrorBoundary
      logLabel="SelfAssessment"
      title="Self-assessment could not be loaded"
      message="Reload the page to continue your assessment."
    >
      <SelfAssessmentPageView c={c} />
    </ErrorBoundary>
  );
};

export default SelfAssessment;
