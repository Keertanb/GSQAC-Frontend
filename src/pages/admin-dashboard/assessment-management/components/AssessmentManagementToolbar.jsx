import React from "react";
import {
  Box,
  Button,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Add, Settings } from "@mui/icons-material";

/**
 * Language toggle + primary actions (add assessment, settings).
 * Presentational only.
 */
export function AssessmentManagementToolbar({
  currentLanguage,
  onLanguageChange,
  onAddAssessmentClick,
  onOpenSettings,
  t,
  colors,
}) {
  return (
    <Box
      sx={{
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ToggleButtonGroup
          value={currentLanguage}
          exclusive
          onChange={(_e, newLanguage) => {
            if (newLanguage !== null) {
              onLanguageChange(newLanguage);
            }
          }}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              px: 2,
              py: 0.5,
              fontSize: "0.8125rem",
              fontWeight: 600,
              textTransform: "uppercase",
              borderColor: colors.primary.blue + "40",
              color: colors.text.secondary,
              "&.Mui-selected": {
                bgcolor: colors.primary.blue,
                color: "white",
                "&:hover": {
                  bgcolor: colors.primary.dark,
                },
              },
              "&:hover": {
                bgcolor: colors.primary.lightest,
              },
            },
          }}
        >
          <ToggleButton value="gu">ગુ</ToggleButton>
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="hi">हिं</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddAssessmentClick}
          sx={{
            bgcolor: colors.primary.blue,
            "&:hover": { bgcolor: colors.primary.dark },
          }}
        >
          {t("assessment.management.addAssessment")}
        </Button>
        <IconButton
          onClick={onOpenSettings}
          sx={{
            bgcolor: colors.neutral.gray200,
            "&:hover": { bgcolor: colors.neutral.gray300 },
          }}
        >
          <Settings />
        </IconButton>
      </Box>
    </Box>
  );
}
