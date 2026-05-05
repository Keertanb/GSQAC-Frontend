import React from "react";
import { Box } from "@mui/material";
import ConfirmationModal from "../../../../components/ConfirmationModal/ConfirmationModal";
import "../AssessmentManagement.css";
import { AssessmentManagementToolbar } from "./AssessmentManagementToolbar";
import { AssessmentCapturedImagePreview } from "./AssessmentCapturedImagePreview";
import { AssessmentCaptureImageDialog } from "./AssessmentCaptureImageDialog";
import { AssessmentAssessmentsSection } from "./AssessmentAssessmentsSection";
import { AssessmentEditAssessmentNameDialog } from "./AssessmentEditAssessmentNameDialog";
import { AssessmentUpsertAssessmentDialog } from "./AssessmentUpsertAssessmentDialog";
import { AssessmentSettingsDialog } from "./AssessmentSettingsDialog";

/**
 * Main assessment management layout (domains list + modals).
 * All data and handlers come from useAssessmentManagement().
 */
export function AssessmentManagementPageView({ c }) {
  const {
    t,
    colors,
    currentLanguage,
    handleLanguageChange,
    setAddAssessmentModalOpen,
    handleOpenSettingsModal,
    capturedImage,
    capturedImageMeta,
    setCapturedImage,
    setCapturedImageMeta,
    captureModalOpen,
    captureMode,
    captureLoading,
    captureVideoRef,
    captureCanvasRef,
    fileInputRef,
    closeCaptureModal,
    startWebCamera,
    captureFromVideo,
    handleFileSelect,
    deleteDomainModalOpen,
    setDeleteDomainModalOpen,
    confirmDeleteDomain,
    domainToDelete,
    deleteAssessmentModalOpen,
    setDeleteAssessmentModalOpen,
    confirmDeleteAssessment,
    assessmentToDelete,
    getDomainName,
    getAssessmentName,
    deleteDomainMutation,
    deleteAssessmentMutation,
  } = c;

  return (
    <Box className="assessment-management-container">
      <AssessmentManagementToolbar
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onAddAssessmentClick={() => setAddAssessmentModalOpen(true)}
        onOpenSettings={handleOpenSettingsModal}
        t={t}
        colors={colors}
      />

      <AssessmentCapturedImagePreview
        capturedImage={capturedImage}
        capturedImageMeta={capturedImageMeta}
        onRemove={() => {
          setCapturedImage(null);
          setCapturedImageMeta(null);
        }}
        t={t}
        colors={colors}
      />

      <AssessmentCaptureImageDialog
        open={captureModalOpen}
        captureMode={captureMode}
        captureLoading={captureLoading}
        captureVideoRef={captureVideoRef}
        captureCanvasRef={captureCanvasRef}
        fileInputRef={fileInputRef}
        onClose={closeCaptureModal}
        onStartWebCamera={startWebCamera}
        onCaptureFromVideo={captureFromVideo}
        onFileChange={handleFileSelect}
        onPickFileClick={() => fileInputRef.current?.click()}
        t={t}
        colors={colors}
      />

      <AssessmentAssessmentsSection c={c} />

      <AssessmentEditAssessmentNameDialog c={c} />
      <AssessmentUpsertAssessmentDialog c={c} />
      <AssessmentSettingsDialog c={c} />

      <ConfirmationModal
        open={deleteDomainModalOpen}
        onClose={() => setDeleteDomainModalOpen(false)}
        onConfirm={confirmDeleteDomain}
        title={t("assessment.management.deleteDomain")}
        message={t("assessment.management.deleteDomainConfirm", {
          domainName: domainToDelete ? getDomainName(domainToDelete) : "",
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteDomainMutation.isPending}
      />

      <ConfirmationModal
        open={deleteAssessmentModalOpen}
        onClose={() => setDeleteAssessmentModalOpen(false)}
        onConfirm={confirmDeleteAssessment}
        title={t("assessment.management.deleteAssessment")}
        message={t("assessment.management.deleteAssessmentConfirm", {
          assessmentName: assessmentToDelete
            ? getAssessmentName(assessmentToDelete)
            : "",
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteAssessmentMutation.isPending}
      />
    </Box>
  );
}
