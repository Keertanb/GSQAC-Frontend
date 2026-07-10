import React from "react";
import { useSchoolSelfAssessmentMonitor } from "./hooks/useSchoolSelfAssessmentMonitor";
import { SchoolSelfAssessmentMonitorPageView } from "./components/SchoolSelfAssessmentMonitorPageView";
import "./SchoolSelfAssessmentMonitor.css";

export default function SchoolSelfAssessmentMonitor() {
  const controller = useSchoolSelfAssessmentMonitor();
  return <SchoolSelfAssessmentMonitorPageView c={controller} />;
}
