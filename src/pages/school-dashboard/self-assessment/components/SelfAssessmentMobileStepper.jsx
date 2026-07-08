import React from "react";
import {
  Box,
  Stepper,
  Step,
  StepButton,
  Typography,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { colors } from "../../../../constants/colors";

export function SelfAssessmentMobileStepper({
  activeStep,
  onStepChange,
  onBack,
  t,
  selectedDomain,
  selectedSubdomain,
  getDomainName,
  getSubdomainName,
  assessmentTheme,
}) {
  const at = assessmentTheme || {
    primary: colors.primary.blue,
    lightest: colors.primary.lightest,
  };

  const steps = [
    {
      key: "domains",
      label: t("selfAssessment.mobileStep.domains"),
      enabled: true,
    },
    {
      key: "subdomains",
      label: t("selfAssessment.mobileStep.subdomains"),
      enabled: !!selectedDomain,
    },
    {
      key: "questions",
      label: t("selfAssessment.mobileStep.questions"),
      enabled: !!selectedSubdomain,
    },
  ];

  const stepSubtitle =
    activeStep === 0
      ? t("selfAssessment.navigateSubtitle")
      : activeStep === 1 && selectedDomain
        ? getDomainName(selectedDomain)
        : activeStep === 2 && selectedSubdomain
          ? getSubdomainName(selectedSubdomain)
          : "";

  return (
    <Box
      className="sa-mobile-stepper"
      sx={{
        mb: 2,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 2.5,
        bgcolor: "white",
        border: `1px solid ${at.primary}22`,
        boxShadow: `0 2px 12px ${at.primary}12`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 1.5,
        }}
      >
        {activeStep > 0 && (
          <IconButton
            size="small"
            onClick={onBack}
            aria-label={t("selfAssessment.mobileStep.back")}
            sx={{
              color: at.primary,
              bgcolor: `${at.primary}10`,
              "&:hover": { bgcolor: `${at.primary}18` },
            }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 800, color: colors.text.primary, lineHeight: 1.3 }}
          >
            {steps[activeStep]?.label}
          </Typography>
          {stepSubtitle ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.25, lineHeight: 1.35 }}
            >
              {stepSubtitle}
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          "& .MuiStepConnector-line": {
            borderColor: colors.neutral.gray200,
          },
          "& .MuiStepLabel-label": {
            fontSize: "0.6875rem",
            fontWeight: 600,
            mt: 0.5,
          },
          "& .MuiStepIcon-root": {
            color: colors.neutral.gray300,
            "&.Mui-active": {
              color: at.primary,
            },
            "&.Mui-completed": {
              color: at.primary,
            },
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.key} completed={activeStep > index}>
            <StepButton
              onClick={() => step.enabled && onStepChange(index)}
              disabled={!step.enabled}
              sx={{
                "& .MuiStepLabel-label": {
                  color:
                    activeStep === index
                      ? at.primary
                      : colors.text.secondary,
                  fontWeight: activeStep === index ? 800 : 600,
                },
              }}
            >
              {step.label}
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
