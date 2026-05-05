import React from "react";
import { useSchoolAllocated } from "./hooks/useSchoolAllocated";
import { SchoolAllocatedPageView } from "./components/SchoolAllocatedPageView";

const SchoolAllocated = () => {
  const c = useSchoolAllocated();
  return <SchoolAllocatedPageView c={c} />;
};

export default SchoolAllocated;
