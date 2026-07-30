import React from "react";
import { useVerifierRegistrationList } from "./hooks/useVerifierRegistrationList";
import { VerifierRegistrationPageView } from "./components/VerifierRegistrationPageView";
import "./VerifierRegistrationAdmin.css";

const VerifierRegistrationAdmin = () => {
  const c = useVerifierRegistrationList();
  return <VerifierRegistrationPageView c={c} />;
};

export default VerifierRegistrationAdmin;
