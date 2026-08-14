import React from "react";
import { useSchoolFormReset } from "./hooks/useSchoolFormReset";
import { SchoolFormResetPageView } from "./components/SchoolFormResetPageView";

const SchoolFormReset = () => {
  const c = useSchoolFormReset();
  return <SchoolFormResetPageView c={c} />;
};

export default SchoolFormReset;
