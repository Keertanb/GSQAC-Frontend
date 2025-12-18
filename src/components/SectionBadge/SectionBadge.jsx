import React from 'react';
import './SectionBadge.css';

const SectionBadge = ({ text }) => {
  return (
    <div className="section-badge">
      <span>{text}</span>
    </div>
  );
};

export default SectionBadge;

