import React from "react";
import "./Verifier.css";
import { useVerifierManagement } from "./hooks/useVerifierManagement";
import { VerifierPageView } from "./components/VerifierPageView";

const Verifier = () => {
  const c = useVerifierManagement();
  return <VerifierPageView c={c} />;
};

export default Verifier;
