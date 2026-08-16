import React from "react";
import { Box, Chip } from "@mui/material";
import { colors } from "../constants/colors";
import { AssessmentOptionText } from "./assessmentOptionText";
import { formatKakshaLabel, getOptionKakshaLevel } from "./assessmentMeta";

export function renderAssessmentOptionLabel(
  t,
  getOptionText,
  option,
  optIndex,
  options = {},
) {
  const { assessmentTheme, isMobile = false, isSelected = false } = options;
  const at = assessmentTheme || { primary: colors.primary.blue };
  const kakshaLevel = getOptionKakshaLevel(option, optIndex);

  return (
    <Box
      className={`sa-mcq-option-label${
        isMobile ? " sa-mcq-option-label--stacked" : ""
      }`}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        width: "100%",
      }}
    >
      <Chip
        label={formatKakshaLabel(kakshaLevel, t)}
        size="small"
        sx={{
          height: 26,
          fontWeight: 800,
          fontSize: "0.6875rem",
          bgcolor: isSelected ? at.primary : `${at.primary}14`,
          color: isSelected ? "#fff" : at.primary,
          border: `1px solid ${at.primary}30`,
          flexShrink: 0,
          mt: 0.125,
        }}
      />
      <AssessmentOptionText text={getOptionText(option)} />
    </Box>
  );
}
