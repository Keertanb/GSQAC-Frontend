import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { colors } from "../../constants/colors";
import { getAssessmentTheme } from "../../utils/assessmentTheme";
import "./AssessmentChipSelector.css";

export function AssessmentChipSelector({
  assessments = [],
  selectedAssessmentId,
  onSelect,
  label,
  getAssessmentLabel,
  getAssessmentTheme: getAssessmentThemeProp = getAssessmentTheme,
  className = "",
}) {
  if (!assessments || assessments.length <= 1) return null;

  return (
    <Box className={`assessment-chip-selector ${className}`.trim()}>
      {label ? (
        <Typography
          variant="caption"
          className="assessment-chip-selector__label"
          sx={{ color: colors.text.secondary, fontWeight: 700 }}
        >
          {label}
        </Typography>
      ) : null}

      <Box
        className="assessment-chip-selector__chips"
        role="listbox"
        aria-label={label || "Assessments"}
      >
        {assessments.map((assessment) => {
          const assessmentId = Number(assessment.assessmentId);
          const selected = Number(selectedAssessmentId) === assessmentId;
          const chipTheme = getAssessmentThemeProp(assessment);
          const chipLabel =
            getAssessmentLabel?.(assessment) ||
            assessment.assessmentName ||
            `Assessment ${assessment.assessmentId}`;

          return (
            <Chip
              key={assessment.assessmentId}
              role="option"
              aria-selected={selected}
              label={chipLabel}
              clickable
              onClick={() => onSelect?.(assessment)}
              className={`assessment-chip-selector__chip${
                selected ? " assessment-chip-selector__chip--selected" : ""
              } assessment-chip-selector__chip--${chipTheme.kind}`}
              sx={{
                height: "auto",
                minHeight: 36,
                borderRadius: "999px",
                fontWeight: selected ? 800 : 600,
                fontSize: "0.8125rem",
                px: 0.5,
                py: 0.25,
                border: `1.5px solid ${
                  selected ? chipTheme.primary : colors.neutral.gray200
                }`,
                bgcolor: selected ? `${chipTheme.primary}14` : "#fff",
                color: selected ? chipTheme.primary : colors.text.primary,
                boxShadow: selected
                  ? `0 4px 12px ${chipTheme.primary}22`
                  : "0 1px 3px rgba(15, 23, 42, 0.06)",
                transition: "all 0.2s ease",
                "& .MuiChip-label": {
                  whiteSpace: "normal",
                  textAlign: "center",
                  lineHeight: 1.3,
                  px: 1.25,
                  py: 0.5,
                },
                "&:hover": {
                  borderColor: chipTheme.primary,
                  bgcolor: selected
                    ? `${chipTheme.primary}1c`
                    : `${chipTheme.primary}0a`,
                  boxShadow: `0 4px 12px ${chipTheme.primary}18`,
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
