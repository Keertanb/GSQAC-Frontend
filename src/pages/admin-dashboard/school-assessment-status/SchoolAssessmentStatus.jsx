import React from "react";
import "./SchoolAssessmentStatus.css";
import { useSchoolAssessmentStatus } from "./hooks/useSchoolAssessmentStatus";
import { SchoolAssessmentStatusPageView } from "./components/SchoolAssessmentStatusPageView";

const SchoolAssessmentStatus = () => {
  const c = useSchoolAssessmentStatus();
  return <SchoolAssessmentStatusPageView c={c} />;
};

export default SchoolAssessmentStatus;
