import React from "react";
import { Box, Card, CircularProgress, Typography } from "@mui/material";
import { AssessmentAssessmentAccordionItem } from "./AssessmentAssessmentAccordionItem";

/** Loading / empty / list of assessment accordions. */
export function AssessmentAssessmentsSection({ c }) {
  const {
    t,
    isLoadingAssessments,
    assessmentsData,
    domainsByAssessmentId,
  } = c;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {isLoadingAssessments ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : assessmentsData?.data && assessmentsData.data.length > 0 ? (
        assessmentsData.data.map((assessment) => {
          const assessmentDomains =
            domainsByAssessmentId[assessment.assessmentId] || [];
          return (
            <AssessmentAssessmentAccordionItem
              key={assessment.assessmentId}
              c={c}
              assessment={assessment}
              assessmentDomains={assessmentDomains}
            />
          );
        })
      ) : (
        <Card
          elevation={2}
          sx={{ p: 4, textAlign: "center", borderRadius: 3 }}
        >
          <Typography variant="body1" color="text.secondary">
            {t("assessment.management.noAssessmentsAvailable")}
          </Typography>
        </Card>
      )}
    </Box>
  );
}
