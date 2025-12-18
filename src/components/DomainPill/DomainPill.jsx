import React from "react";
import "./DomainPill.css";

const DomainPill = ({ color, label }) => {
  return (
    <div className="domain-pill">
      <div className={`domain-pill-dot domain-pill-dot-${color}`}></div>
      <span className="domain-pill-label">{label}</span>
    </div>
  );
};

export default DomainPill;
