import React from "react";
import { useLatestNewsAdmin } from "./hooks/useLatestNewsAdmin";
import { LatestNewsAdminView } from "./components/LatestNewsAdminView";
import "./LatestNewsAdmin.css";

const LatestNewsAdmin = () => {
  const c = useLatestNewsAdmin();
  return <LatestNewsAdminView c={c} />;
};

export default LatestNewsAdmin;
