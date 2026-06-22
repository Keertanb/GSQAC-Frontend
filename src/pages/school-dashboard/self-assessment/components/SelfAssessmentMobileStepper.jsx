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
}) {
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
        border: `1px solid ${colors.neutral.gray200}`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
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
              color: colors.primary.blue,
              bgcolor: colors.primary.blue + "10",
              "&:hover": { bgcolor: colors.primary.blue + "18" },
            }}
          >
            <ArrowBack fontSize="small" />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              color: colors.text.primary,
              fontSize: "0.9375rem",
              lineHeight: 1.3,
            }}
          >
            {steps[activeStep]?.label}
          </Typography>
          {stepSubtitle && (
            <Typography
              variant="caption"
              sx={{
                color: colors.text.secondary,
                display: "block",
                mt: 0.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {stepSubtitle}
            </Typography>
          )}
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
          "& .MuiStepLabel-label.Mui-active": {
            color: colors.primary.blue,
            fontWeight: 700,
          },
          "& .MuiStepLabel-label.Mui-completed": {
            color: colors.accent.green,
          },
          "& .MuiStepIcon-root": {
            fontSize: "1.25rem",
          },
          "& .MuiStepIcon-root.Mui-active": {
            color: colors.primary.blue,
          },
          "& .MuiStepIcon-root.Mui-completed": {
            color: colors.accent.green,
          },
        }}
      >
        {steps.map((step, index) => (
          <Step key={step.key} completed={activeStep > index}>
            <StepButton
              disabled={!step.enabled && index > activeStep}
              onClick={() => step.enabled && onStepChange(index)}
              sx={{
                py: 0.5,
                "& .MuiStepLabel-label": {
                  lineHeight: 1.2,
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
