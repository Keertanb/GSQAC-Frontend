import React from "react";
import { Box, Button, Typography } from "@mui/material";

/** Preview strip for WebView / web-captured image + geo meta. */
export function AssessmentCapturedImagePreview({
  capturedImage,
  capturedImageMeta,
  onRemove,
  t,
  colors,
}) {
  if (!capturedImage) return null;

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: `1px solid ${colors.neutral.gray200}`,
        bgcolor: colors.background.secondary,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        {t("assessment.management.capturedImage")}
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Box
          component="img"
          src={capturedImage}
          alt="Captured"
          sx={{
            maxWidth: 280,
            maxHeight: 280,
            objectFit: "contain",
            borderRadius: 2,
            border: `1px solid ${colors.neutral.gray300}`,
          }}
        />
        {capturedImageMeta && (
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5 }}
            >
              <strong>{t("assessment.management.latitude")}:</strong>{" "}
              {capturedImageMeta.latitude != null
                ? capturedImageMeta.latitude.toFixed(6)
                : "—"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 0.5 }}
            >
              <strong>{t("assessment.management.longitude")}:</strong>{" "}
              {capturedImageMeta.longitude != null
                ? capturedImageMeta.longitude.toFixed(6)
                : "—"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block" }}
            >
              <strong>{t("assessment.management.address")}:</strong>{" "}
              {capturedImageMeta.address || "—"}
            </Typography>
          </Box>
        )}
        <Button variant="outlined" size="small" color="error" onClick={onRemove}>
          {t("assessment.management.remove")}
        </Button>
      </Box>
    </Box>
  );
}
