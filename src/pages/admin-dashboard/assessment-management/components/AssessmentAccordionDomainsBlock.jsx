import React from "react";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Delete, Edit, ExpandMore } from "@mui/icons-material";
import DomainSubdomainView from "../DomainSubdomainView";
import { formatClassRange } from "../../../../utils/classRange";

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
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: colors.primary.blue + "10" }}>
              <TableCell sx={{ fontWeight: 700, width: 48 }} />
              <TableCell sx={{ fontWeight: 700 }}>
                {t("assessment.domain.title")}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                {t("assessment.management.lowerClass")}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                {t("assessment.management.upperClass")}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">
                {t("common.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessmentDomains.map((domain) => {
              const isExpanded = expandedDomain === domain.domainId;

              return (
                <React.Fragment key={domain.domainId}>
                  <TableRow
                    hover
                    sx={{ "& > *": { borderBottom: isExpanded ? 0 : undefined } }}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setExpandedDomain((prev) =>
                            prev === domain.domainId ? null : domain.domainId,
                          )
                        }
                      >
                        <ExpandMore
                          sx={{
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                          }}
                        />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{getDomainName(domain)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {Number(domain.lowerClass) || 1}
                    </TableCell>
                    <TableCell align="center">
                      {Number(domain.upperClass) || 12}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => onEditDomain(domain, assessment, e)}
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
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 0, px: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: "#f9fafb" }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1.5 }}
                          >
                            Class range:{" "}
                            {formatClassRange(domain.lowerClass, domain.upperClass)}
                          </Typography>
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
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
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
