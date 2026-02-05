import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  Fade,
  TextField,
} from "@mui/material";
import { ExpandMore, Add } from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import DomainSubdomainView from "./DomainSubdomainView";
import QuestionsView from "./QuestionsView";
import { useGetDomainsQuery, useUpsertDomainMutation } from "../../../services/adminService";
import { getRoleId } from "../../../constants/roles";

const roleLabelMap = {
  2: "School",
  3: "School Verifier",
  4: "CRC",
  5: "Verifier",
};

export default function AssessmentAccordion({
  assessment,
  languageCode,
  currentLanguage,
  onAssessmentChanged,
}) {
  const [expandedDomain, setExpandedDomain] = useState(null);
  const [currentView, setCurrentView] = useState("domains"); // domains | questions
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);

  // Add Domain form state (now scoped inside assessment accordion)
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [newDomainName, setNewDomainName] = useState({ en: "", hi: "", gu: "" });

  const roleId = assessment?.roleId;
  const assessmentId = assessment?.assessmentId;

  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isError: isErrorDomains,
    error: domainsError,
    refetch: refetchDomains,
  } = useGetDomainsQuery({
    roleId,
    languageCode,
    assessmentId,
    enabled: !!roleId && !!assessmentId,
  });

  const domains = domainsData?.data || [];

  const upsertDomainMutation = useUpsertDomainMutation({
    onSuccess: () => {
      refetchDomains();
      setNewDomainName({ en: "", hi: "", gu: "" });
      setShowAddDomain(false);
      setEditingDomain(null);
      if (onAssessmentChanged) onAssessmentChanged();
    },
  });

  const roleLabel = roleLabelMap[assessment?.roleId] || `Role ${assessment?.roleId || "-"}`;

  const canEdit = useMemo(() => {
    // Allow editing domains regardless of published state unless you want to block it.
    return true;
  }, []);

  const handleToggleDomain = (domainId) => {
    setExpandedDomain(expandedDomain === domainId ? null : domainId);
  };

  const handleAddDomain = () => {
    // Count how many languages are filled
    const filledLanguages = [
      newDomainName.en.trim(),
      newDomainName.hi.trim(),
      newDomainName.gu.trim(),
    ].filter((name) => name.length > 0);

    // Check if at least 2 languages are provided
    if (filledLanguages.length < 2) {
      // keep behavior consistent with existing screen (snackbar in parent)
      return;
    }

    const payload = {
      roleId: roleId || getRoleId("school"),
      domainNameEn: newDomainName.en.trim(),
      domainNameHi: newDomainName.hi.trim(),
      domainNameGu: newDomainName.gu.trim(),
      assessmentId,
    };

    if (editingDomain) {
      payload.domainId = editingDomain.domainId;
    }

    upsertDomainMutation.mutate(payload);
  };

  if (currentView === "questions" && selectedSubdomain) {
    return (
      <Box sx={{ mt: 2 }}>
        <QuestionsView
          subdomainData={selectedSubdomain}
          onBack={() => {
            setCurrentView("domains");
            setSelectedSubdomain(null);
          }}
          currentLanguage={currentLanguage}
          isViewOnly={false}
        />
      </Box>
    );
  }

  return (
    <Accordion
      disableGutters
      elevation={2}
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 240 }}>
            <Typography sx={{ fontWeight: 800, color: colors.text.primary }}>
              Assessment {assessment?.assessmentId || "-"}{" "}
              {assessment?.academicYear ? `• ${assessment.academicYear}` : ""}
              {assessment?.round ? ` • Round ${assessment.round}` : ""}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              {assessment?.startDate ? `Start: ${assessment.startDate}` : "Start: -"}{" "}
              {assessment?.endDate ? `• End: ${assessment.endDate}` : "• End: -"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={roleLabel}
              sx={{
                bgcolor: colors.primary.blue + "15",
                color: colors.primary.blue,
                fontWeight: 700,
              }}
            />
            <Chip
              size="small"
              label={assessment?.isPublished ? "Published" : "Unpublished"}
              sx={{
                bgcolor: assessment?.isPublished
                  ? colors.accent.green + "15"
                  : colors.semantic.warning + "15",
                color: assessment?.isPublished ? colors.accent.green : colors.semantic.warning,
                fontWeight: 700,
              }}
            />
          </Box>
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ bgcolor: "#fafafa" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Domains
          </Typography>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingDomain(null);
              setNewDomainName({ en: "", hi: "", gu: "" });
              setShowAddDomain((v) => !v);
            }}
            disabled={!canEdit}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            Add Domain
          </Button>
        </Box>

        {showAddDomain && (
          <Fade in={showAddDomain}>
            <Card
              elevation={1}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
              }}
            >
              <Typography sx={{ fontWeight: 800, mb: 1.5 }}>
                {editingDomain ? "Edit Domain" : "Add Domain"}
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <TextField
                  label="Domain Name (Gujarati)"
                  size="small"
                  value={newDomainName.gu}
                  onChange={(e) => setNewDomainName((p) => ({ ...p, gu: e.target.value }))}
                  sx={{ flex: "1 1 240px" }}
                />
                <TextField
                  label="Domain Name (English)"
                  size="small"
                  value={newDomainName.en}
                  onChange={(e) => setNewDomainName((p) => ({ ...p, en: e.target.value }))}
                  sx={{ flex: "1 1 240px" }}
                />
                <TextField
                  label="Domain Name (Hindi)"
                  size="small"
                  value={newDomainName.hi}
                  onChange={(e) => setNewDomainName((p) => ({ ...p, hi: e.target.value }))}
                  sx={{ flex: "1 1 240px" }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleAddDomain}
                  disabled={upsertDomainMutation.isPending}
                  sx={{
                    bgcolor: colors.accent.green,
                    "&:hover": { bgcolor: colors.accent.greenDark },
                  }}
                >
                  {upsertDomainMutation.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowAddDomain(false);
                    setEditingDomain(null);
                    setNewDomainName({ en: "", hi: "", gu: "" });
                  }}
                  disabled={upsertDomainMutation.isPending}
                >
                  Cancel
                </Button>
              </Box>
            </Card>
          </Fade>
        )}

        {isLoadingDomains ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress size={28} />
          </Box>
        ) : isErrorDomains ? (
          <Alert severity="error">
            {domainsError?.message || "Failed to load domains for this assessment"}
          </Alert>
        ) : domains.length === 0 ? (
          <Card elevation={0} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
            <Typography color="text.secondary">No domains available for this assessment.</Typography>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {domains.map((domain) => (
              <Card
                key={domain.domainId}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${colors.neutral.gray200}`,
                  overflow: "hidden",
                }}
              >
                <Box
                  onClick={() => handleToggleDomain(domain.domainId)}
                  sx={{
                    cursor: "pointer",
                    p: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    bgcolor: "white",
                    "&:hover": { bgcolor: colors.primary.blue + "08" },
                  }}
                >
                  <Typography sx={{ fontWeight: 800 }}>
                    {domain.domainNameEn || domain.domainName || `Domain ${domain.domainId}`}
                  </Typography>
                  <ExpandMore
                    sx={{
                      transform: expandedDomain === domain.domainId ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms ease",
                      color: colors.text.secondary,
                    }}
                  />
                </Box>

                {expandedDomain === domain.domainId && (
                  <Box sx={{ p: 2, bgcolor: "#fff" }}>
                    <DomainSubdomainView
                      domain={domain}
                      languageCode={languageCode}
                      roleId={domain.roleId}
                      onNavigateToCriteria={(subdomain, viewOnly = false) => {
                        setSelectedSubdomain({
                          ...subdomain,
                          subDomainId: subdomain.subDomainId || subdomain.id,
                          roleId: domain.roleId,
                        });
                        setCurrentView("questions");
                        setExpandedDomain(null);
                      }}
                      onSubdomainAdded={() => {
                        refetchDomains();
                      }}
                    />
                  </Box>
                )}
              </Card>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}


