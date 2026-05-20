import React from "react";
import {
  Box,
  Chip,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
import { ContentCopy, Delete, Edit } from "@mui/icons-material";
import { getAssessmentManagementId } from "../utils/assessmentManagementUtils";

const MANAGEMENT_CHIP_STYLES = {
  1: { color: "#ea580c" },
  2: { color: "#059669" },
};

/** Accordion summary: title, chips, active switch, duplicate / edit / delete. */
export function AssessmentAccordionSummaryBar({
  assessment,
  assessmentDomains,
  t,
  colors,
  getAssessmentName,
  getAssessmentRoleIds,
  getRoleName,
  onToggleActive,
  onDuplicate,
  onStartEdit,
  onDelete,
}) {
  const managementId = getAssessmentManagementId(assessment);
  const managementChipStyle = managementId
    ? MANAGEMENT_CHIP_STYLES[managementId]
    : null;
  const managementChipLabel =
    managementId === 1
      ? t("assessment.management.schoolManagementTypes.privateSchool")
      : managementId === 2
        ? t("assessment.management.schoolManagementTypes.governmentSchool")
        : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          {getAssessmentName(assessment)}
        </Typography>
        {assessment.schoolType && (
          <Chip
            size="small"
            label={
              assessment.schoolType === 1 || assessment.schoolType === "1"
                ? t("assessment.management.schoolTypes.primaryShort")
                : t("assessment.management.schoolTypes.secondaryShort")
            }
            sx={{
              bgcolor: colors.accent.purple + "15",
              color: colors.accent.purple,
              fontWeight: 600,
            }}
          />
        )}
        {managementChipLabel && managementChipStyle && (
          <Chip
            size="small"
            label={managementChipLabel}
            sx={{
              bgcolor: managementChipStyle.color + "15",
              color: managementChipStyle.color,
              fontWeight: 600,
            }}
          />
        )}
        {getAssessmentRoleIds(assessment).map((roleId) => (
          <Chip
            key={`${assessment.assessmentId}-${roleId}`}
            size="small"
            label={getRoleName(roleId)}
            sx={{
              bgcolor: colors.primary.blue + "15",
              color: colors.primary.blue,
              fontWeight: 600,
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          {t("assessment.management.domainCount", {
            count: assessmentDomains.length,
          })}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={assessment.isActive === 1}
              onChange={(e) => onToggleActive(assessment, e)}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: colors.accent.green,
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: colors.accent.green,
                },
              }}
            />
          }
          label={
            assessment.isActive
              ? t("assessment.management.active")
              : t("assessment.management.inactive")
          }
          labelPlacement="end"
          sx={{ m: 0 }}
          onClick={(e) => e.stopPropagation()}
        />
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate(assessment);
          }}
          title={t("assessment.management.duplicateAssessment")}
          sx={{
            color: "text.secondary",
            "&:hover": {
              bgcolor: colors.primary.blue + "15",
              color: colors.primary.blue,
            },
          }}
        >
          <ContentCopy fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit(assessment, e);
          }}
          sx={{
            color: "text.secondary",
            "&:hover": {
              bgcolor: colors.primary.blue + "15",
              color: colors.primary.blue,
            },
          }}
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={(e) => onDelete(assessment, e)}
          sx={{
            bgcolor: colors.semantic.error + "15",
            "&:hover": {
              bgcolor: colors.semantic.error + "25",
            },
          }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
