import React from "react";
import { Box, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import {
  formatAcademicYearLabel,
  formatRoundLabel,
  resolveAssessmentPeriod,
} from "../../utils/assessmentMeta";

export function AssessmentPeriodChips({
  academicYear,
  round,
  size = "small",
  className = "",
}) {
  const { t } = useTranslation();
  const period = resolveAssessmentPeriod({ academicYear, round });
  const yearLabel = formatAcademicYearLabel(period.academicYear, t);
  const roundLabel = formatRoundLabel(period.round, t);

  if (!yearLabel && !roundLabel) return null;

  const chipSx = {
    height: size === "small" ? 24 : 28,
    fontWeight: 700,
    fontSize: size === "small" ? "0.6875rem" : "0.75rem",
    bgcolor: `${colors.primary.blue}12`,
    color: colors.primary.dark,
    border: `1px solid ${colors.primary.blue}28`,
  };

  return (
    <Box
      className={className}
      sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}
    >
      {yearLabel ? <Chip size="small" label={yearLabel} sx={chipSx} /> : null}
      {roundLabel ? <Chip size="small" label={roundLabel} sx={chipSx} /> : null}
    </Box>
  );
}
