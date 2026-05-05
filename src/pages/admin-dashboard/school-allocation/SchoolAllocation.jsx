import React from "react";
import "./SchoolAllocation.css";
import { useSchoolAllocation } from "./hooks/useSchoolAllocation";
import { SchoolAllocationPageView } from "./components/SchoolAllocationPageView";

const SchoolAllocation = () => {
  const c = useSchoolAllocation();
  return <SchoolAllocationPageView c={c} />;
};

export default SchoolAllocation;
