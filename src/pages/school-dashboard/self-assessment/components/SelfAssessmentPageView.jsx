import React from "react";
import { SelfAssessmentLayout } from "./SelfAssessmentLayout";
import { SchoolHostelFacilityModalGate } from "../../components/SchoolHostelFacilityModalGate";

export function SelfAssessmentPageView({ c }) {
  return (
    <>
      <SelfAssessmentLayout c={c} />
      <SchoolHostelFacilityModalGate />
    </>
  );
}
