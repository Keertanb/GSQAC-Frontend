import React from "react";
import { Box, CircularProgress, Alert } from "@mui/material";

import QuestionsView from "./QuestionsView";
import { useAssessmentManagement } from "./hooks/useAssessmentManagement";
import { AssessmentManagementPageView } from "./components/AssessmentManagementPageView";

/**
 * Admin: assessment & domain management entry.
 * — React Query + state: useAssessmentManagement
 * — UI: components/AssessmentManagementPageView + children
 */
const AssessmentManagement = () => {
  const c = useAssessmentManagement();

  if (c.isLoadingDomains || c.isLoadingAssessments) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (c.isErrorDomains || c.isErrorAssessments) {
    return (
      <Box>
        <Alert severity="error">
          {c.domainsError?.message ||
            c.assessmentsError?.message ||
            c.t("common.error") ||
            "Failed to load data"}
        </Alert>
      </Box>
    );
  }

  if (c.currentView === "questions" && c.selectedSubdomain) {
    return (
      <QuestionsView
        subdomainData={c.selectedSubdomain}
        onBack={() => {
          c.setCurrentView("domains");
          c.setSelectedSubdomain(null);
          c.setIsViewOnlyMode(false);
        }}
        currentLanguage={c.currentLanguage}
        isViewOnly={c.isViewOnlyMode}
      />
    );
  }

  return <AssessmentManagementPageView c={c} />;
};

export default AssessmentManagement;
