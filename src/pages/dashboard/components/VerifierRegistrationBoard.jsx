import React from "react";
import { useNavigate } from "react-router-dom";
import { HowToReg as HowToRegIcon } from "@mui/icons-material";
import { VERIFIER_REGISTRATION_URL } from "../../../routes/routeUrls";
import "./VerifierRegistrationBoard.css";

/**
 * Catchy hanging-board CTA for verifier registration on the public dashboard.
 */
export function VerifierRegistrationBoard({ className = "" }) {
  const navigate = useNavigate();

  return (
    <div className={`vr-hang ${className}`.trim()}>
      <div className="vr-hang__ropes" aria-hidden>
        <span className="vr-hang__rope vr-hang__rope--left" />
        <span className="vr-hang__rope vr-hang__rope--right" />
        <span className="vr-hang__peg vr-hang__peg--left" />
        <span className="vr-hang__peg vr-hang__peg--right" />
      </div>

      <button
        type="button"
        className="vr-hang__board"
        onClick={() => navigate(VERIFIER_REGISTRATION_URL)}
        aria-label="Open verifier registration form"
      >
        <span className="vr-hang__nail" aria-hidden />
        <span className="vr-hang__blink-badge" aria-hidden>
          New
        </span>
        <span className="vr-hang__icon-wrap" aria-hidden>
          <HowToRegIcon className="vr-hang__icon" />
        </span>
        <span className="vr-hang__text-stack">
          <span className="vr-hang__eyebrow">Open now</span>
          <span className="vr-hang__title">Verifier Registration</span>
          <span className="vr-hang__sub">Register as a school verifier</span>
        </span>
        <span className="vr-hang__cta">Tap to register →</span>
      </button>
    </div>
  );
}
