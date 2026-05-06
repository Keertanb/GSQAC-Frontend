import React from "react";
import { useCRCAssessment } from "./hooks/useCRCAssessment";
import { CRCAssessmentPageView } from "./components/CRCAssessmentPageView";

const CRCAssessment = () => {
  const c = useCRCAssessment();
  return <CRCAssessmentPageView c={c} />;
};

export default CRCAssessment;
