import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Add, Download, Settings } from "@mui/icons-material";

/**
 * Language toggle + primary actions (add assessment, settings).
 * Presentational only.
 */
export function AssessmentManagementToolbar({
  currentLanguage,
  onLanguageChange,
  onAddAssessmentClick,
  onOpenSettings,
  pdfDownloadManagement,
  onPdfDownloadManagementChange,
  onDownloadAssessmentsPdf,
  isDownloadingAssessmentsPdf,
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
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="assessment-pdf-role-label">
            {t("assessment.management.selectDownloadRole")}
          </InputLabel>
          <Select
            labelId="assessment-pdf-role-label"
            value={pdfDownloadManagement}
            label={t("assessment.management.selectDownloadRole")}
            onChange={(event) => onPdfDownloadManagementChange(event.target.value)}
            disabled={isDownloadingAssessmentsPdf}
            displayEmpty
          >
            <MenuItem value="">
              <em>{t("assessment.management.selectDownloadRole")}</em>
            </MenuItem>
            <MenuItem value="2">
              {t("assessment.management.schoolManagementTypes.governmentSchool")}
            </MenuItem>
            <MenuItem value="1">
              {t("assessment.management.schoolManagementTypes.privateSchool")}
            </MenuItem>
            <MenuItem value="3">
              {t("assessment.management.schoolManagementTypes.grantInAidSchool")}
            </MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={
            isDownloadingAssessmentsPdf ? (
              <CircularProgress size={16} />
            ) : (
              <Download />
            )
          }
          onClick={onDownloadAssessmentsPdf}
          disabled={isDownloadingAssessmentsPdf || !pdfDownloadManagement}
          sx={{
            borderColor: colors.primary.blue,
            color: colors.primary.blue,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              borderColor: colors.primary.dark,
              bgcolor: colors.primary.lightest,
            },
          }}
        >
          {isDownloadingAssessmentsPdf
            ? t("assessment.management.downloadingPdf")
            : t("assessment.management.downloadPdf")}
        </Button>
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
