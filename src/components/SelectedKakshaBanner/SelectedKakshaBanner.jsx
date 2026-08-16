import React from "react";
import { Box, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/colors";
import { formatKakshaLabel } from "../../utils/assessmentMeta";

export function SelectedKakshaBanner({
  level,
  accent = colors.primary.blue,
  compact = false,
}) {
  const { t } = useTranslation();
  const label = formatKakshaLabel(level, t);
  if (!label) return null;

  return (
    <Box
      sx={{
        mt: compact ? 1 : 1.5,
        px: compact ? 1.25 : 1.75,
        py: compact ? 1 : 1.25,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        bgcolor: `${accent}12`,
        border: `1.5px solid ${accent}40`,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          color: colors.text.secondary,
          letterSpacing: 0.2,
        }}
      >
        {t("selfAssessment.selectedKakshaLabel", {
          defaultValue: "Selected કક્ષા",
        })}
      </Typography>
      <Chip
        label={label}
        size="small"
        sx={{
          height: compact ? 24 : 28,
          fontWeight: 800,
          fontSize: compact ? "0.75rem" : "0.8125rem",
          bgcolor: accent,
          color: "#fff",
        }}
      />
    </Box>
  );
}
