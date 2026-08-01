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
      {labelGu && (
        <Typography component="span" variant="body2" className="vr-reg-field-label__gu">
          {labelGu}
          {required && <span className="vr-reg-required"> *</span>}
          {optional && <span className="vr-reg-optional"> (વૈકલ્પિક)</span>}
        </Typography>
      )}
      {labelEn && (
        <Typography component="span" variant="caption" className="vr-reg-field-label__en">
          {labelEn}
          {!labelGu && required && <span className="vr-reg-required"> *</span>}
          {!labelGu && optional && (
            <span className="vr-reg-optional"> (Optional)</span>
          )}
        </Typography>
      )}
    </Box>
  );
}
