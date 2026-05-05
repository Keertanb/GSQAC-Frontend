import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

/** Edit assessment display names (GU/EN/HI). */
export function AssessmentEditAssessmentNameDialog({ c }) {
  const {
    t,
    colors,
    showEditAssessment,
    cancelEditAssessment,
    tempAssessmentName,
    setTempAssessmentName,
    saveAssessmentName,
    updateAssessmentMutation,
  } = c;

  return (
<Dialog
  open={showEditAssessment}
  onClose={cancelEditAssessment}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ fontWeight: 700 }}>
    {t("assessment.management.editAssessmentName")}
  </DialogTitle>
  <DialogContent>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
      <TextField
        label={t("assessment.management.assessmentNameGujarati")}
        value={tempAssessmentName.gu}
        onChange={(e) =>
          setTempAssessmentName((prev) => ({
            ...prev,
            gu: e.target.value,
          }))
        }
        variant="outlined"
        size="small"
        fullWidth
      />
      <TextField
        label={t("assessment.management.assessmentNameEnglish")}
        value={tempAssessmentName.en}
        onChange={(e) =>
          setTempAssessmentName((prev) => ({
            ...prev,
            en: e.target.value,
          }))
        }
        variant="outlined"
        size="small"
        fullWidth
      />
      <TextField
        label={t("assessment.management.assessmentNameHindi")}
        value={tempAssessmentName.hi}
        onChange={(e) =>
          setTempAssessmentName((prev) => ({
            ...prev,
            hi: e.target.value,
          }))
        }
        variant="outlined"
        size="small"
        fullWidth
      />
    </Box>
  </DialogContent>
  <DialogActions sx={{ p: 2 }}>
    <Button onClick={cancelEditAssessment}>{t("common.cancel")}</Button>
    <Button
      variant="contained"
      onClick={saveAssessmentName}
      disabled={updateAssessmentMutation.isPending}
      sx={{
        bgcolor: colors.primary.blue,
        "&:hover": { bgcolor: colors.primary.dark },
      }}
    >
      {updateAssessmentMutation.isPending
        ? t("assessment.management.saving")
        : t("assessment.management.saveChanges")}
    </Button>
  </DialogActions>
</Dialog>
  );
}
