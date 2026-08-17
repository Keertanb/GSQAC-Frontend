import React from "react";
import { useSchoolPasswordReset } from "./hooks/useSchoolPasswordReset";
import { SchoolPasswordResetPageView } from "./components/SchoolPasswordResetPageView";

const SchoolPasswordReset = () => {
  const c = useSchoolPasswordReset();
  return <SchoolPasswordResetPageView c={c} />;
};

export default SchoolPasswordReset;
