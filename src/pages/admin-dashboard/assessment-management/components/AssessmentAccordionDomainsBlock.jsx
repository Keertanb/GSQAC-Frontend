import React from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import { Delete, Edit, ExpandMore } from "@mui/icons-material";
import DomainSubdomainView from "../DomainSubdomainView";

/** Domain list / loading / error / empty for one assessment. */
export function AssessmentAccordionDomainsBlock({
  assessment,
  assessmentDomains,
  t,
  colors,
  isLoadingDomains,
  isErrorDomains,
  domainsError,
  expandedDomain,
  setExpandedDomain,
  languageCode,
  getDomainName,
  onEditDomain,
  onDeleteDomain,
  onOpenQuestions,
  onSubdomainAdded,
}) {
  if (isLoadingDomains) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (isErrorDomains) {
    return (
      <Alert severity="error">
        {domainsError?.message ||
          t("assessment.management.failedToLoadDomains")}
      </Alert>
    );
  }

  if (assessmentDomains.length > 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {assessmentDomains.map((domain) => (
          <Card key={domain.domainId} sx={{ borderRadius: 2 }}>
            <Box
              onClick={() =>
                setExpandedDomain((prev) =>
                  prev === domain.domainId ? null : domain.domainId,
                )
              }
              sx={{
                p: 2,
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                {getDomainName(domain)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={(e) => onEditDomain(domain, assessment, e)}
                  sx={{ mr: 0.5 }}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => onDeleteDomain(domain, e)}
                  sx={{
                    bgcolor: colors.semantic.error + "15",
                    "&:hover": {
                      bgcolor: colors.semantic.error + "25",
                    },
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
                <IconButton size="small">
                  <ExpandMore
                    sx={{
                      transform:
                        expandedDomain === domain.domainId
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                    }}
                  />
                </IconButton>
              </Box>
            </Box>
            {expandedDomain === domain.domainId && (
              <Box sx={{ px: 2, pb: 2 }}>
                <DomainSubdomainView
                  domain={domain}
                  languageCode={languageCode}
                  roleId={domain.roleId}
                  onNavigateToCriteria={(subdomain, viewOnly = false) => {
                    onOpenQuestions(domain, subdomain, viewOnly);
                  }}
                  onSubdomainAdded={onSubdomainAdded}
                />
              </Box>
            )}
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {t("assessment.management.noDomainsForAssessment")}
      </Typography>
    </Card>
  );
}
