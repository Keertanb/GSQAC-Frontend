import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { colors } from "../constants/colors";

export function renderAssessmentOptionLabel(t, getOptionText, option, optIndex) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        width: "100%",
      }}
    >
      <Chip
        label={t("selfAssessment.level", { level: optIndex })}
        size="small"
        sx={{
          height: 26,
          fontWeight: 700,
          fontSize: "0.6875rem",
          bgcolor: `${colors.primary.blue}14`,
          color: colors.primary.blue,
          border: `1px solid ${colors.primary.blue}30`,
          flexShrink: 0,
          mt: 0.125,
        }}
      />
      <Typography variant="body2" sx={{ lineHeight: 1.5, flex: 1 }}>
        {getOptionText(option)}
      </Typography>
    </Box>
  );
}
