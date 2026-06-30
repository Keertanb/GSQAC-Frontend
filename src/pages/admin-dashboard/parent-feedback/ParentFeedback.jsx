import React from "react";
import { useParentFeedback } from "./hooks/useParentFeedback";
import { ParentFeedbackPageView } from "./components/ParentFeedbackPageView";
import "./ParentFeedback.css";

const ParentFeedback = () => {
  const c = useParentFeedback();
  return <ParentFeedbackPageView c={c} />;
};

export default ParentFeedback;
