import React from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { colors } from "../../constants/colors";

export function AssessmentOverallProgress({
  t,
  assessmentProgress,
  getProgressColor,
  compact = false,
}) {
  if (!assessmentProgress || assessmentProgress.totalQuestions <= 0) {
    return null;
  }

  return (
    <Box
      className="sa-overall-progress"
      sx={{
        p: compact ? { xs: 1.5, md: 2 } : { xs: 2, md: 2.5 },
        borderRadius: 2,
        bgcolor: "white",
        border: `1px solid ${colors.neutral.gray200}`,
        boxShadow: compact ? "none" : "0 2px 12px rgba(0,0,0,0.04)",
        minWidth: compact ? { xs: "100%", md: 260 } : undefined,
        maxWidth: compact ? { md: 300 } : undefined,
        flex: compact ? { md: "0 0 280px" } : undefined,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant={compact ? "caption" : "subtitle2"}
          sx={{
            fontWeight: 700,
            color: colors.text.primary,
            fontSize: compact ? "0.75rem" : "0.9375rem",
            lineHeight: 1.3,
          }}
        >
          {t("selfAssessment.overallProgress")}
        </Typography>
        <Typography
          variant={compact ? "caption" : "subtitle2"}
          sx={{
            fontWeight: 700,
            color: getProgressColor(assessmentProgress.answerPercentage),
            fontSize: compact ? "0.8125rem" : "0.9375rem",
          }}
        >
          {assessmentProgress.displayPercentage}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={assessmentProgress.answerPercentage}
        sx={{
          height: compact ? 8 : 10,
          borderRadius: 5,
          bgcolor: colors.neutral.gray200,
          "& .MuiLinearProgress-bar": {
            borderRadius: 5,
            bgcolor: getProgressColor(assessmentProgress.answerPercentage),
          },
        }}
      />
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 0.75,
          color: colors.text.secondary,
          fontWeight: 500,
          fontSize: compact ? "0.6875rem" : "0.75rem",
        }}
      >
        {t("selfAssessment.questionsAnswered", {
          answered: assessmentProgress.totalAnswer,
          total: assessmentProgress.totalQuestions,
        })}
      </Typography>
    </Box>
  );
}
