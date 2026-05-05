import React from "react";
import { useSchoolAssessment } from "./hooks/useSchoolAssessment";
import { SchoolAssessmentPageView } from "./components/SchoolAssessmentPageView";

const SchoolAssessment = () => {
  const c = useSchoolAssessment();
  return <SchoolAssessmentPageView c={c} />;
};

export default SchoolAssessment;
