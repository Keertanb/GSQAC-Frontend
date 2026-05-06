import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { AssessmentAccordionSummaryBar } from "./AssessmentAccordionSummaryBar";
import { AssessmentAccordionDetailsTop } from "./AssessmentAccordionDetailsTop";
import { AssessmentAccordionDomainsBlock } from "./AssessmentAccordionDomainsBlock";

/** One assessment row: summary + domain CRUD + DomainSubdomainView expansion. */
export function AssessmentAssessmentAccordionItem({ c, assessment, assessmentDomains }) {
  const {
    t,
    colors,
    expandedAssessmentId,
    setExpandedAssessmentId,
    expandedDomain,
    setExpandedDomain,
    showAddDomain,
    activeAssessmentForDomainForm,
    editingDomain,
    newDomainName,
    setNewDomainName,
    setEditingDomain,
    setTranslationId,
    setShowAddDomain,
    setActiveAssessmentForDomainForm,
    handleAddDomain,
    upsertDomainMutation,
    isLoadingDomains,
    isErrorDomains,
    domainsError,
    languageCode,
    getDomainName,
    getAssessmentName,
    getAssessmentRoleIds,
    getRoleName,
    handleToggleActive,
    handleDuplicateAssessment,
    startEditingAssessment,
    handleDeleteAssessment,
    handleEditDomain,
    handleDeleteDomain,
    setSelectedSubdomain,
    setIsViewOnlyMode,
    setCurrentView,
    refetchDomains,
  } = c;

  return (
    <Accordion
      expanded={expandedAssessmentId === assessment.assessmentId}
      onChange={() => {
        setExpandedAssessmentId((prev) =>
          prev === assessment.assessmentId ? null : assessment.assessmentId,
        );
        setExpandedDomain(null);
      }}
      sx={{ borderRadius: 2, overflow: "hidden" }}
    >
      <AccordionSummary expandIcon={<ExpandMore />}>
        <AssessmentAccordionSummaryBar
          assessment={assessment}
          assessmentDomains={assessmentDomains}
          t={t}
          colors={colors}
          getAssessmentName={getAssessmentName}
          getAssessmentRoleIds={getAssessmentRoleIds}
          getRoleName={getRoleName}
          onToggleActive={handleToggleActive}
          onDuplicate={handleDuplicateAssessment}
          onStartEdit={startEditingAssessment}
          onDelete={handleDeleteAssessment}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: "#f9fafb" }}>
        <AssessmentAccordionDetailsTop
          assessment={assessment}
          t={t}
          colors={colors}
          showAddDomain={showAddDomain}
          activeAssessmentForDomainForm={activeAssessmentForDomainForm}
          editingDomain={editingDomain}
          newDomainName={newDomainName}
          setNewDomainName={setNewDomainName}
          setEditingDomain={setEditingDomain}
          setTranslationId={setTranslationId}
          setShowAddDomain={setShowAddDomain}
          setActiveAssessmentForDomainForm={setActiveAssessmentForDomainForm}
          onSaveDomain={handleAddDomain}
          upsertDomainMutation={upsertDomainMutation}
        />
        <AssessmentAccordionDomainsBlock
          assessment={assessment}
          assessmentDomains={assessmentDomains}
          t={t}
          colors={colors}
          isLoadingDomains={isLoadingDomains}
          isErrorDomains={isErrorDomains}
          domainsError={domainsError}
          expandedDomain={expandedDomain}
          setExpandedDomain={setExpandedDomain}
          languageCode={languageCode}
          getDomainName={getDomainName}
          onEditDomain={handleEditDomain}
          onDeleteDomain={handleDeleteDomain}
          onOpenQuestions={(domain, subdomain, viewOnly) => {
            setSelectedSubdomain({
              ...subdomain,
              subDomainId: subdomain.subDomainId || subdomain.id,
              roleId: domain.roleId,
            });
            setIsViewOnlyMode(viewOnly);
            setCurrentView("questions");
            setExpandedDomain(null);
          }}
          onSubdomainAdded={() => {
            refetchDomains();
          }}
        />
      </AccordionDetails>
    </Accordion>
  );
}
