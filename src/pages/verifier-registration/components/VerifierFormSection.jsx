import React from "react";
import { Typography } from "@mui/material";

export default function VerifierFormSection({ titleEn, titleGu, children }) {
  return (
    <section className="vr-reg-section">
      <div className="vr-reg-section__header">
        <Typography variant="subtitle1" className="vr-reg-section__title-en">
          {titleEn}
        </Typography>
        <Typography variant="body2" className="vr-reg-section__title-gu">
          {titleGu}
        </Typography>
      </div>
      <div className="vr-reg-section__body">{children}</div>
    </section>
  );
}
