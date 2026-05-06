import React from "react";
import { useSchoolDetails } from "./hooks/useSchoolDetails";
import { SchoolDetailsPageView } from "./components/SchoolDetailsPageView";

const SchoolDetails = () => {
  const c = useSchoolDetails();
  return <SchoolDetailsPageView c={c} />;
};

export default SchoolDetails;
