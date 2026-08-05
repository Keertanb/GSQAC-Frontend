import React, { useState } from "react";
import { useVerifierRegistrationList } from "./hooks/useVerifierRegistrationList";
import { useVerifierRegistrationAnalytics } from "./hooks/useVerifierRegistrationAnalytics";
import { VerifierRegistrationPageView } from "./components/VerifierRegistrationPageView";
import "./VerifierRegistrationAdmin.css";

const VerifierRegistrationAdmin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const list = useVerifierRegistrationList();
  const analytics = useVerifierRegistrationAnalytics(activeTab === "dashboard");

  return (
    <VerifierRegistrationPageView
      c={list}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      analytics={analytics}
    />
  );
};

export default VerifierRegistrationAdmin;
