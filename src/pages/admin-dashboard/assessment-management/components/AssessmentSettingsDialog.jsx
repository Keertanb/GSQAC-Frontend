import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, ExpandMore } from "@mui/icons-material";
import { toDateInputValue } from "../utils/assessmentManagementUtils";

/** Role ↔ assessment assignments (settings modal). Presentational; mutations live in hook. */
export function AssessmentSettingsDialog({ c }) {
  const {
    t,
    colors,
    settingsModalOpen,
    handleCloseSettingsModal,
    isLoadingAssessmentRoleAssignments,
    isLoadingAssessments,
    expandedSettingsRole,
    setExpandedSettingsRole,
    roleAssignments,
    handleAddRoleAssignmentRow,
    assessmentsData,
    getAssessmentName,
    todayDate,
    handleRoleAssignmentChange,
    handleRoleAssignmentTrashClick,
    handleUpdateRoleAssignment,
    handlePublishRoleAssignment,
    updateAssessmentRoleAssignmentMutation,
    deleteAssessmentRoleAssignmentMutation,
    publishAssessmentMutation,
  } = c;

  return (
<Dialog
  open={settingsModalOpen}
  onClose={handleCloseSettingsModal}
  maxWidth="lg"
  fullWidth
>
  <DialogTitle
    sx={{
      fontWeight: 700,
      bgcolor: colors.primary.blue + "10",
      color: colors.primary.blue,
    }}
  >
    {t("assessment.management.assessmentSettings")}
  </DialogTitle>
  <DialogContent sx={{ mt: 2 }}>
    {isLoadingAssessmentRoleAssignments || isLoadingAssessments ? (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={30} />
      </Box>
    ) : (
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
      >
        {[
          { roleId: 2, name: t("assessment.management.roles.school") },
          {
            roleId: 3,
            name: t("assessment.management.roles.schoolVerifier"),
          },
          { roleId: 4, name: t("assessment.management.roles.crc") },
        ].map((role) => {
          const assignmentsForRole = roleAssignments[role.roleId] || [];

          return (
            <Accordion
              key={role.roleId}
              expanded={expandedSettingsRole === role.roleId}
              onChange={() =>
                setExpandedSettingsRole((prev) =>
                  prev === role.roleId ? null : role.roleId,
                )
              }
              disableGutters
              sx={{
                border: `1px solid ${colors.neutral.gray200}`,
                borderRadius: "12px !important",
                overflow: "hidden",
                boxShadow: "none",
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{
                  bgcolor: colors.neutral.gray100,
                  minHeight: 64,
                  "& .MuiAccordionSummary-content": {
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  },
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  {role.name}
                </Typography>
                <Chip
                  size="small"
                  label={t("assessment.management.assignmentCount", {
                    count: assignmentsForRole.length,
                  })}
                  sx={{
                    bgcolor: colors.primary.blue + "15",
                    color: colors.primary.blue,
                    fontWeight: 600,
                  }}
                />
              </AccordionSummary>

              <AccordionDetails sx={{ bgcolor: "#fff" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mb: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={() =>
                      handleAddRoleAssignmentRow(role.roleId)
                    }
                  >
                    {t("assessment.management.addAssessment")}
                  </Button>
                </Box>

                {assignmentsForRole.length === 0 ? (
                  <Card
                    elevation={0}
                    sx={{
                      p: 2,
                      border: `1px dashed ${colors.neutral.gray300}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t(
                        "assessment.management.noAssessmentsAssignedYet",
                      )}
                    </Typography>
                  </Card>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    {assignmentsForRole.map((assignment, index) => (
                      <Card
                        key={
                          assignment.localKey || `${role.roleId}-${index}`
                        }
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `2px solid ${colors.neutral.gray200}`,
                          // bgcolor: assignment.isPublished === 1 ? "#f8fffb" : "#fff",
                        }}
                      >
                        {(() => {
                          const startDateValue = toDateInputValue(
                            assignment.startDate,
                          );
                          const endDateMin =
                            startDateValue && startDateValue > todayDate
                              ? startDateValue
                              : todayDate;

                          return (
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr",
                                  md: "2fr 1fr 1fr auto",
                                },
                                gap: 1.5,
                                alignItems: "center",
                              }}
                            >
                              <FormControl size="small" fullWidth>
                                <InputLabel>
                                  {t("assessment.management.assessment")}
                                </InputLabel>
                                <Select
                                  value={assignment.assessmentId || ""}
                                  label={t(
                                    "assessment.management.assessment",
                                  )}
                                  onChange={(e) =>
                                    handleRoleAssignmentChange(
                                      role.roleId,
                                      index,
                                      "assessmentId",
                                      e.target.value,
                                    )
                                  }
                                  disabled={
                                    assignment.isPublished === 1 &&
                                    !assignment.isNew
                                  }
                                >
                                  <MenuItem value="">
                                    <em>
                                      {t("assessment.management.none")}
                                    </em>
                                  </MenuItem>
                                  {(assessmentsData?.data || [])
                                    .filter((assessmentOption) => {
                                      const optionId = Number(
                                        assessmentOption.assessmentId,
                                      );
                                      const currentSelectedId = Number(
                                        assignment.assessmentId,
                                      );

                                      // Keep currently selected option visible in this row.
                                      if (
                                        optionId === currentSelectedId
                                      ) {
                                        return true;
                                      }

                                      // Hide assessments already assigned in other rows of same role.
                                      return !assignmentsForRole.some(
                                        (assignedRow, rowIndex) =>
                                          rowIndex !== index &&
                                          Number(
                                            assignedRow.assessmentId,
                                          ) === optionId,
                                      );
                                    })
                                    .map((assessment) => (
                                      <MenuItem
                                        key={assessment.assessmentId}
                                        value={assessment.assessmentId}
                                      >
                                        {getAssessmentName(assessment)}
                                      </MenuItem>
                                    ))}
                                </Select>
                              </FormControl>

                              <TextField
                                size="small"
                                type="date"
                                label={t(
                                  "assessment.management.startDate",
                                )}
                                value={toDateInputValue(
                                  assignment.startDate,
                                )}
                                onChange={(e) =>
                                  handleRoleAssignmentChange(
                                    role.roleId,
                                    index,
                                    "startDate",
                                    e.target.value || "",
                                  )
                                }
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                  min: todayDate,
                                  max: "9999-12-31",
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    bgcolor: "#f8fafc",
                                    "& fieldset": {
                                      borderColor: colors.neutral.gray300,
                                    },
                                    "&:hover fieldset": {
                                      borderColor: colors.primary.blue,
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderWidth: "1.5px",
                                      borderColor: colors.primary.blue,
                                    },
                                  },
                                }}
                                fullWidth
                              />

                              <TextField
                                size="small"
                                type="date"
                                label={t("assessment.management.endDate")}
                                value={toDateInputValue(
                                  assignment.endDate,
                                )}
                                onChange={(e) =>
                                  handleRoleAssignmentChange(
                                    role.roleId,
                                    index,
                                    "endDate",
                                    e.target.value || "",
                                  )
                                }
                                InputLabelProps={{ shrink: true }}
                                inputProps={{
                                  min: endDateMin,
                                  max: "9999-12-31",
                                }}
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: 2,
                                    bgcolor: "#f8fafc",
                                    "& fieldset": {
                                      borderColor: colors.neutral.gray300,
                                    },
                                    "&:hover fieldset": {
                                      borderColor: colors.primary.blue,
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderWidth: "1.5px",
                                      borderColor: colors.primary.blue,
                                    },
                                  },
                                }}
                                fullWidth
                              />

                              <Chip
                                size="small"
                                label={
                                  assignment.isPublished === 1
                                    ? t("assessment.management.published")
                                    : t("assessment.management.draft")
                                }
                                sx={{
                                  justifySelf: {
                                    xs: "flex-start",
                                    md: "center",
                                  },
                                  bgcolor:
                                    assignment.isPublished === 1
                                      ? colors.accent.green + "15"
                                      : colors.semantic.warning + "15",
                                  color:
                                    assignment.isPublished === 1
                                      ? colors.accent.green
                                      : colors.semantic.warning,
                                  fontWeight: 600,
                                }}
                              />
                            </Box>
                          );
                        })()}

                        <Box
                          sx={{
                            mt: 1.5,
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              size="small"
                              color="error"
                              title={
                                assignment.isNew
                                  ? t("assessment.management.remove")
                                  : assignment.isPublished === 1
                                    ? t(
                                        "assessment.management.unpublishBeforeDeleting",
                                      )
                                    : t(
                                        "assessment.management.deleteAssignment",
                                      )
                              }
                              onClick={() =>
                                handleRoleAssignmentTrashClick(
                                  role.roleId,
                                  index,
                                )
                              }
                              disabled={
                                deleteAssessmentRoleAssignmentMutation.isPending ||
                                (!assignment.isNew &&
                                  assignment.isPublished === 1)
                              }
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() =>
                                handleUpdateRoleAssignment(
                                  role.roleId,
                                  index,
                                )
                              }
                              disabled={
                                updateAssessmentRoleAssignmentMutation.isPending
                              }
                              sx={{
                                bgcolor: colors.primary.blue,
                                "&:hover": {
                                  bgcolor: colors.primary.dark,
                                },
                              }}
                            >
                              {assignment.isNew
                                ? t("common.add")
                                : t("assessment.management.update")}
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                handlePublishRoleAssignment(
                                  role.roleId,
                                  index,
                                )
                              }
                              disabled={
                                !assignment.assessmentId ||
                                publishAssessmentMutation.isPending
                              }
                            >
                              {assignment.isPublished === 1
                                ? t("assessment.management.unpublish")
                                : t("assessment.management.publish")}
                            </Button>
                          </Box>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Box>
    )}
  </DialogContent>
  <DialogActions sx={{ px: 3, pb: 2 }}>
    <Button onClick={handleCloseSettingsModal}>
      {t("assessment.management.close")}
    </Button>
  </DialogActions>
</Dialog>
  );
}
