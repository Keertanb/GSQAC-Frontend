import React from "react";
import "./AdminOverview.css";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { AdminDashboardPageView } from "./components/AdminDashboardPageView";

const AdminOverview = () => {
  const c = useAdminDashboard();
  return <AdminDashboardPageView c={c} />;
};

export default AdminOverview;
