import React from "react";
import {
  Box,
  Button,
  Card,
  Fade,
  TextField,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";

/** “Add domain” CTA + inline add/edit domain form for one assessment accordion. */
export function AssessmentAccordionDetailsTop({
  assessment,
  t,
  colors,
  showAddDomain,
  activeAssessmentForDomainForm,
  editingDomain,
  newDomainName,
  setNewDomainName,
  setEditingDomain,
  setTranslationId,
  setShowAddDomain,
  setActiveAssessmentForDomainForm,
  onSaveDomain,
  upsertDomainMutation,
}) {
  const isThisAssessment =
    showAddDomain &&
    activeAssessmentForDomainForm?.assessmentId === assessment.assessmentId;

  return (
    <>
      <Box sx={{ mb: 2.5 }}>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => {
            setEditingDomain(null);
            setNewDomainName({ en: "", hi: "", gu: "" });
            setTranslationId(null);
            setShowAddDomain(true);
            setActiveAssessmentForDomainForm({
              assessmentId: assessment.assessmentId,
            });
          }}
        >
          {t("assessment.domain.addDomain")}
        </Button>
      </Box>

      {isThisAssessment && (
        <Fade in={showAddDomain}>
          <Card elevation={1} sx={{ p: 2.5, borderRadius: 2, mb: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: 700 }}>
                {editingDomain
                  ? t("assessment.domain.editDomain")
                  : t("assessment.domain.addDomain")}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                mb: 2,
                flexWrap: "wrap",
              }}
            >
              <TextField
                label={t("assessment.management.domainNameGujarati")}
                value={newDomainName.gu}
                onChange={(e) =>
                  setNewDomainName({
                    ...newDomainName,
                    gu: e.target.value,
                  })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                label={t("assessment.management.domainNameEnglish")}
                value={newDomainName.en}
                onChange={(e) =>
                  setNewDomainName({
                    ...newDomainName,
                    en: e.target.value,
                  })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                label={t("assessment.management.domainNameHindi")}
                value={newDomainName.hi}
                onChange={(e) =>
                  setNewDomainName({
                    ...newDomainName,
                    hi: e.target.value,
                  })
                }
                variant="outlined"
                size="small"
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => onSaveDomain(assessment)}
                disabled={upsertDomainMutation.isPending}
                sx={{
                  bgcolor: colors.primary.blue,
                  "&:hover": { bgcolor: colors.primary.dark },
                }}
              >
                {t("assessment.management.saveDomain")}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddDomain(false);
                  setNewDomainName({ en: "", hi: "", gu: "" });
                  setEditingDomain(null);
                  setTranslationId(null);
                  setActiveAssessmentForDomainForm(null);
                }}
              >
                {t("common.cancel")}
              </Button>
            </Box>
          </Card>
        </Fade>
      )}
    </>
  );
}
