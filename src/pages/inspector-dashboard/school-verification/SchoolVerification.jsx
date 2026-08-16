import React from "react";
import { useSchoolVerification } from "./hooks/useSchoolVerification";
import { SchoolVerificationPageView } from "./components/SchoolVerificationPageView";
import { ErrorBoundary } from "../../../components/ErrorBoundary/ErrorBoundary";

const SchoolVerification = () => {
  const c = useSchoolVerification();
  return (
    <ErrorBoundary
      logLabel="SchoolVerification"
      title="School verification could not be loaded"
      message="Reload the page to continue this verification."
    >
      <SchoolVerificationPageView c={c} />
    </ErrorBoundary>
  );
};

export default SchoolVerification;
