import React from "react";
import { useSelfAssessment } from "./hooks/useSelfAssessment";
import { SelfAssessmentPageView } from "./components/SelfAssessmentPageView";

const SelfAssessment = () => {
  const c = useSelfAssessment();
  return <SelfAssessmentPageView c={c} />;
};

export default SelfAssessment;
