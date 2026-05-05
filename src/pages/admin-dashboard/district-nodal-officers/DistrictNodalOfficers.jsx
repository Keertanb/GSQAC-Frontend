import React from "react";

import { useDistrictNodalOfficers } from "./hooks/useDistrictNodalOfficers";
import { DistrictNodalOfficersPageView } from "./components/DistrictNodalOfficersPageView";
import "./DistrictNodalOfficers.css";

const DistrictNodalOfficers = () => {
  const c = useDistrictNodalOfficers();
  return <DistrictNodalOfficersPageView c={c} />;
};

export default DistrictNodalOfficers;
