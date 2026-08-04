import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { HowToReg as HowToRegIcon } from "@mui/icons-material";
import { VERIFIER_REGISTRATION_URL } from "../../../routes/routeUrls";
import { useGetVerifierRegistrationStatusQuery } from "../../../services/verifierRegistrationService";
import { VERIFIER_REGISTRATION_CLOSED_MESSAGE } from "../../../constants/verifierRegistration";
import "./VerifierRegistrationBoard.css";

/**
 * Catchy hanging-board CTA for verifier registration on the public dashboard.
 */
export function VerifierRegistrationBoard({ className = "" }) {
  const navigate = useNavigate();
  const [closedDialogOpen, setClosedDialogOpen] = useState(false);
  const { data: statusData, isLoading } =
    useGetVerifierRegistrationStatusQuery();

  const registrationIsActive =
    statusData?.data?.isActive === 1 || statusData?.data?.isActive === true;
  const closedMessage =
    statusData?.data?.message || VERIFIER_REGISTRATION_CLOSED_MESSAGE;

  const handleClick = () => {
    if (isLoading) return;
    if (!registrationIsActive) {
      setClosedDialogOpen(true);
      return;
    }
    navigate(VERIFIER_REGISTRATION_URL);
  };

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
        onClick={handleClick}
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
          <span className="vr-hang__eyebrow">
            {registrationIsActive ? "Open now" : "Coming soon"}
          </span>
          <span className="vr-hang__title">Verifier Registration</span>
          <span className="vr-hang__sub">Register as a school verifier</span>
        </span>
        <span className="vr-hang__cta">Tap to register →</span>
      </button>

      <Dialog
        open={closedDialogOpen}
        onClose={() => setClosedDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>વેરિફાયર રજીસ્ટ્રેશન</DialogTitle>
        <DialogContent>
          <Typography sx={{ pt: 1, lineHeight: 1.7, fontSize: "1.05rem" }}>
            {closedMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setClosedDialogOpen(false)}
            sx={{ textTransform: "none" }}
          >
            ઠીક છે
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
