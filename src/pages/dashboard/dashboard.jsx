import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";
import FeatureCard from "../../components/FeatureCard/FeatureCard";
import DomainPill from "../../components/DomainPill/DomainPill";
import SectionBadge from "../../components/SectionBadge/SectionBadge";
// Import CSS at the top level to ensure it's loaded
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  // Ensure CSS styles are applied after component mounts and on navigation
  useEffect(() => {
    // Force browser to recalculate styles without causing visual glitches
    const forceStyleRecalc = () => {
      const container = document.querySelector(".dashboard-container");
      if (container) {
        // Trigger a reflow to force style recalculation
        // This ensures CSS is applied even if loaded asynchronously
        void container.offsetHeight;
      }
    };

    // Apply immediately on mount
    forceStyleRecalc();

    // Also apply after a microtask to catch any async CSS loading
    Promise.resolve().then(() => {
      forceStyleRecalc();
    });

    // Fallback: apply after a short delay to ensure styles are loaded
    const timeoutId = setTimeout(forceStyleRecalc, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="logo-text">
              <h2 className="logo-title">GSQAC</h2>
              <p className="logo-subtitle">
                Gujarat School Quality Accreditation
              </p>
            </div>
          </div>

          <div className="header-right">
            <nav className="header-nav">
              <a href="#" className="nav-link">
                Home
              </a>
              <a href="#" className="nav-link">
                Schools
              </a>
              <a href="#" className="nav-link">
                About
              </a>
              <a href="#" className="nav-link">
                Grievance
              </a>
            </nav>

            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => navigate("/login")}
              sx={{
                borderColor: "#d1d5db",
                color: "#111827",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  borderColor: "#9ca3af",
                  backgroundColor: "#f9fafb",
                  color: "#1e3a8a",
                },
              }}
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="badge">
            <span>NEP 2020 Quality Mandate</span>
          </div>

          <h1 className="hero-title">
            Gujarat School Quality Accreditation Council
          </h1>

          <p className="hero-subtitle">
            State School Standards Authority ensuring transparent assessment,
            accreditation, and public disclosure for quality education in
            Gujarat.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span>Find Schools</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => navigate("/login?role=school")}
            >
              <span>School Login</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Separator Line */}
      <div className="separator-line">
        <div className="separator-orange"></div>
        <div className="separator-green"></div>
      </div>

      {/* Statistics Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="stat-number">12,450+</div>
            <div className="stat-label">Schools Registered</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stat-number">8.5M+</div>
            <div className="stat-label">Students Covered</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <div className="stat-number">33</div>
            <div className="stat-label">Districts</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="stat-number">9,200+</div>
            <div className="stat-label">Accredited Schools</div>
          </div>
        </div>
      </section>

      {/* <section className="content-section">
        <div className="content-container">
          <div className="section-header">
            <SectionBadge text="SQAAF Parameters" />
            <h2 className="section-title">5 Domains of Assessment</h2>
            <p className="section-subtitle">
              Schools are evaluated across five comprehensive domains aligned
              with National Education Policy 2020 quality benchmarks.
            </p>
          </div>

          <div className="domains-container">
            <DomainPill color="blue" label="Teaching & Learning" />
            <DomainPill color="orange" label="Assessment" />
            <DomainPill color="green" label="School Administration" />
            <DomainPill color="orange" label="Holistic Development" />
            <DomainPill color="blue" label="Resource Utilization" />
          </div>
        </div>
      </section>

      <section className="content-section content-section-alt">
        <div className="content-container">
          <div className="section-header">
            <SectionBadge text="System Features" />
            <h2 className="section-title">
              Complete Quality Assurance Workflow
            </h2>
            <p className="section-subtitle">
              End-to-end digital system for school registration, assessment,
              verification, and public disclosure.
            </p>
          </div>

          <div className="features-container">
            <FeatureCard
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
              }
              title="Self-Assessment"
              description="Schools evaluate themselves across 5 key domains aligned with NEP 2020 quality benchmarks."
            />
            <FeatureCard
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
              title="Verification"
              description="School Inspectors conduct on-site validation with transparent pendency tracking."
            />
            <FeatureCard
              icon={
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              }
              title="Grading & Reports"
              description="Objective SQAAF-based scoring with auto-generated performance report cards."
            />
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default Dashboard;
