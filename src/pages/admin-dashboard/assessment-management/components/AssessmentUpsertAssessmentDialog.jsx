import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";

/** Add / edit / duplicate assessment modal. */
export function AssessmentUpsertAssessmentDialog({ c }) {
  const {
    t,
    colors,
    addAssessmentModalOpen,
    setAddAssessmentModalOpen,
    setNewAssessment,
    setEditingAssessment,
    setDuplicateSourceAssessment,
    duplicateSourceAssessment,
    editingAssessment,
    newAssessment,
    schoolManagementOptions,
    getAssessmentName,
    cloneAssessmentMutation,
    updateAssessmentMutation,
    refetchAssessments,
    refetchDomains,
    refetchAssessmentRoleAssignments,
  } = c;

  return (
<Dialog
  open={addAssessmentModalOpen}
  onClose={() => {
    setAddAssessmentModalOpen(false);
    setNewAssessment({
      schoolType: "1",
      management: "",
      assessmentEn: "",
      assessmentHi: "",
      assessmentGu: "",
    });
    setEditingAssessment(null);
    setDuplicateSourceAssessment(null);
  }}
  maxWidth="sm"
  fullWidth
>
  <DialogTitle sx={{ fontWeight: 700 }}>
    {duplicateSourceAssessment
      ? t("assessment.management.duplicateAssessment")
      : editingAssessment
        ? t("assessment.management.editAssessment")
        : t("assessment.management.addAssessment")}
  </DialogTitle>
  <DialogContent sx={{ mt: 1.5 }}>
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        marginTop: 2,
      }}
    >
      {duplicateSourceAssessment && (
        <TextField
          size="small"
          label={t("assessment.management.duplicateFrom")}
          value={getAssessmentName(duplicateSourceAssessment)}
          InputProps={{ readOnly: true }}
          fullWidth
        />
      )}
      <FormControl fullWidth size="small">
        <InputLabel>{t("assessment.management.schoolType")}</InputLabel>
        <Select
          value={newAssessment.schoolType}
          label={t("assessment.management.schoolType")}
          onChange={(e) =>
            setNewAssessment((prev) => ({
              ...prev,
              schoolType: e.target.value,
            }))
          }
        >
          <MenuItem value="1">
            {t("assessment.management.schoolTypes.primary")}
          </MenuItem>
          <MenuItem value="2">
            {t("assessment.management.schoolTypes.secondary")}
          </MenuItem>
        </Select>
      </FormControl>
      <FormControl fullWidth size="small">
        <InputLabel>
          {t("assessment.management.schoolManagement")}
        </InputLabel>
        <Select
          value={newAssessment.management}
          label={t("assessment.management.schoolManagement")}
          onChange={(e) =>
            setNewAssessment((prev) => ({
              ...prev,
              management: e.target.value,
            }))
          }
        >
          <MenuItem value="">
            <em>{t("assessment.management.selectSchoolManagement")}</em>
          </MenuItem>
          {schoolManagementOptions.map((management) => (
            <MenuItem
              key={management.smId}
              value={String(management.smId)}
            >
              {management.managementName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        size="small"
        label={t("assessment.management.assessmentNameGujarati")}
        value={newAssessment.assessmentGu}
        onChange={(e) =>
          setNewAssessment((prev) => ({
            ...prev,
            assessmentGu: e.target.value,
          }))
        }
        required
        InputLabelProps={{
          required: true,
        }}
      />
      <TextField
        size="small"
        label={t("assessment.management.assessmentNameEnglish")}
        value={newAssessment.assessmentEn}
        onChange={(e) =>
          setNewAssessment((prev) => ({
            ...prev,
            assessmentEn: e.target.value,
          }))
        }
        required
        InputLabelProps={{
          required: true,
        }}
      />
      <TextField
        size="small"
        label={t("assessment.management.assessmentNameHindi")}
        value={newAssessment.assessmentHi}
        onChange={(e) =>
          setNewAssessment((prev) => ({
            ...prev,
            assessmentHi: e.target.value,
          }))
        }
      />
    </Box>
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button
      onClick={() => {
        setAddAssessmentModalOpen(false);
        setNewAssessment({
          schoolType: "1",
          management: "",
          assessmentEn: "",
          assessmentHi: "",
          assessmentGu: "",
        });
        setEditingAssessment(null);
        setDuplicateSourceAssessment(null);
      }}
    >
      {t("common.cancel")}
    </Button>
    <Button
      variant="contained"
      disabled={
        (duplicateSourceAssessment
          ? cloneAssessmentMutation.isPending
          : updateAssessmentMutation.isPending) ||
        newAssessment.management === "" ||
        newAssessment.management == null ||
        !newAssessment.assessmentEn?.trim() ||
        !newAssessment.assessmentGu?.trim()
      }
      onClick={() => {
        const nameEn = newAssessment.assessmentEn?.trim();
        const nameGu = newAssessment.assessmentGu?.trim();
        const nameHi = newAssessment.assessmentHi?.trim() || "";
        const managementId = Number(newAssessment.management);
        if (
          !nameEn ||
          !nameGu ||
          newAssessment.management === "" ||
          newAssessment.management == null ||
          Number.isNaN(managementId)
        ) {
          enqueueSnackbar(
            t("assessment.management.addProperAssessmentName"),
            {
              variant: "warning",
            },
          );
          return;
        }
        if (duplicateSourceAssessment) {
          cloneAssessmentMutation.mutate(
            {
              assessmentId: duplicateSourceAssessment.assessmentId,
              newAssessmentGu: nameGu,
              newAssessmentEn: nameEn,
              newAssessmentHi: nameHi,
              schoolType: parseInt(newAssessment.schoolType, 10),
            },
            {
              onSuccess: () => {
                setAddAssessmentModalOpen(false);
                setNewAssessment({
                  schoolType: "1",
                  management: "",
                  assessmentEn: "",
                  assessmentHi: "",
                  assessmentGu: "",
                });
                setDuplicateSourceAssessment(null);
                refetchAssessments();
                refetchDomains();
                refetchAssessmentRoleAssignments();
              },
            },
          );
          return;
        }
        const payload = {
          ...(editingAssessment && {
            assessmentId: editingAssessment.assessmentId,
          }),
          schoolType: parseInt(newAssessment.schoolType, 10),
          management: managementId,
          assessmentEn: nameEn,
          assessmentHi: nameHi,
          assessmentGu: nameGu,
        };
        updateAssessmentMutation.mutate(payload, {
          onSuccess: (data) => {
            const isEdit = !!editingAssessment;
            enqueueSnackbar(
              isEdit
                ? data?.message || "Assessment updated successfully"
                : data?.message || "Assessment added successfully",
              { variant: "success" },
            );
            setAddAssessmentModalOpen(false);
            setNewAssessment({
              schoolType: "1",
              management: "",
              assessmentEn: "",
              assessmentHi: "",
              assessmentGu: "",
            });
            setEditingAssessment(null);
            refetchAssessments();
            refetchAssessmentRoleAssignments();
          },
        });
      }}
      sx={{
        bgcolor: colors.primary.blue,
        "&:hover": { bgcolor: colors.primary.dark },
      }}
    >
      {duplicateSourceAssessment
        ? cloneAssessmentMutation.isPending
          ? t("assessment.management.cloning")
          : t("assessment.management.duplicate")
        : updateAssessmentMutation.isPending
          ? editingAssessment
            ? t("assessment.management.updating")
            : t("assessment.management.creating")
          : editingAssessment
            ? t("assessment.management.update")
            : t("assessment.management.create")}
    </Button>
  </DialogActions>
</Dialog>
  );
}
