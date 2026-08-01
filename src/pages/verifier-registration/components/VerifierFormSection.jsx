import React from "react";
import { Typography } from "@mui/material";

export default function VerifierFormSection({
  titleEn,
  titleGu,
  step,
  children,
}) {
  return (
    <section className="vr-reg-section">
      <div className="vr-reg-section__header">
        {step != null && (
          <span className="vr-reg-section__step" aria-hidden>
            {String(step).padStart(2, "0")}
          </span>
        )}
        <div className="vr-reg-section__titles">
          <Typography variant="subtitle1" className="vr-reg-section__title-gu">
            {titleGu}
          </Typography>
          <Typography variant="body2" className="vr-reg-section__title-en">
            {titleEn}
          </Typography>
        </div>
      </div>
      <div className="vr-reg-section__body">{children}</div>
    </section>
  );
}
