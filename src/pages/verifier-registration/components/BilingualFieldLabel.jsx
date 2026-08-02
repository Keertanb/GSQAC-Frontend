import React from "react";
import { Box, Typography } from "@mui/material";

export default function BilingualFieldLabel({
  labelEn,
  labelGu,
  required = false,
  optional = false,
}) {
  const label =
    labelGu && labelEn && labelGu !== labelEn
      ? `${labelGu} (${labelEn})`
      : labelGu || labelEn || "";

  return (
    <Box className="vr-reg-field-label">
      <Typography component="span" variant="body2" className="vr-reg-field-label__gu">
        {label}
        {required && <span className="vr-reg-required"> *</span>}
        {optional && (
          <span className="vr-reg-optional"> (વૈકલ્પિક / Optional)</span>
        )}
      </Typography>
    </Box>
  );
}
