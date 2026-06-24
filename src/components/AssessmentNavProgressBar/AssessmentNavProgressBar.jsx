import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { colors } from "../../constants/colors";

export function formatProgressPercentage(progress) {
  const value = Number(progress) || 0;
  if (value > 0 && value < 1) return Number(value.toFixed(1));
  return Math.round(value);
}

export function AssessmentNavProgressBar({
  progress,
  getProgressColor,
  label = "Progress",
  mobile = false,
}) {
  const clampedProgress = Math.min(100, Math.max(0, Number(progress) || 0));
  const progressColor = getProgressColor(clampedProgress);
  const displayPercentage = formatProgressPercentage(clampedProgress);

  return (
    <Box
      className="sa-nav-progress"
      sx={{
        mt: mobile ? 1.25 : 1,
        width: "100%",
        ...(mobile && {
          pt: 1.25,
          borderTop: `1px solid ${colors.neutral.gray200}`,
        }),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.75,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: mobile ? "0.75rem" : "0.7rem",
            color: colors.text.secondary,
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{
            fontSize: mobile ? "0.875rem" : "0.75rem",
            fontWeight: 800,
            color: progressColor,
            bgcolor: `${progressColor}18`,
            border: `1px solid ${progressColor}30`,
            px: 1,
            py: 0.35,
            borderRadius: "8px",
            lineHeight: 1.2,
            flexShrink: 0,
          }}
        >
          {displayPercentage}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={clampedProgress}
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={{
          height: mobile ? 8 : 6,
          borderRadius: 4,
          bgcolor: colors.neutral.gray200,
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            bgcolor: progressColor,
          },
        }}
      />
    </Box>
  );
}
