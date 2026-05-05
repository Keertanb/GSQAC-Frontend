import React from "react";
import { useSchoolVerification } from "./hooks/useSchoolVerification";
import { SchoolVerificationPageView } from "./components/SchoolVerificationPageView";

const SchoolVerification = () => {
  const c = useSchoolVerification();
  return <SchoolVerificationPageView c={c} />;
};

export default SchoolVerification;
