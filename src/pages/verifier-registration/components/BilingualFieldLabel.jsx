import React from "react";
import { Box, Typography } from "@mui/material";

export default function BilingualFieldLabel({
  labelEn,
  labelGu,
  required = false,
  optional = false,
}) {
  return (
    <Box className="vr-reg-field-label">
      <Typography component="span" variant="body2" className="vr-reg-field-label__en">
        {labelEn}
        {required && <span className="vr-reg-required"> *</span>}
        {optional && <span className="vr-reg-optional"> (Optional)</span>}
      </Typography>
      {labelGu && (
        <Typography component="span" variant="caption" className="vr-reg-field-label__gu">
          {labelGu}
        </Typography>
      )}
    </Box>
  );
}
