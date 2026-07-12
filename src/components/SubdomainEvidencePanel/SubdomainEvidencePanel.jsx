import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { colors } from "../../constants/colors";
import { getAssessmentTheme } from "../../utils/assessmentTheme";
import {
  computeMandatoryEvidenceProgress,
  EVIDENCE_ACCEPT,
  getEvidenceSlotName,
  MAX_EVIDENCE_SIZE_BYTES,
  subdomainRequiresEvidence,
  uploadFileToPresignedUrl,
  usePrepareSubdomainEvidenceMutation,
  useSubdomainEvidenceQuery,
} from "../../services/evidenceService";
import { enqueueSnackbar } from "notistack";
import "./SubdomainEvidencePanel.css";

const DEFAULT_EVIDENCE_THEME = getAssessmentTheme(null);

function getEvidenceThemeVars(assessmentTheme) {
  const at = assessmentTheme || DEFAULT_EVIDENCE_THEME;
  return {
    "--evidence-primary": at.primary,
    "--evidence-dark": at.dark,
    "--evidence-lightest": at.lightest,
    "--evidence-soft": `${at.primary}14`,
    "--evidence-border": `${at.primary}40`,
    "--evidence-icon-bg": `${at.primary}1a`,
    "--evidence-shadow": `${at.primary}14`,
    "--evidence-gradient": at.panelGradient,
  };
}

function resolveEvidenceTheme({ assessmentTheme, selectedAssessment }) {
  if (assessmentTheme) return assessmentTheme;
  if (selectedAssessment) return getAssessmentTheme(selectedAssessment);
  return DEFAULT_EVIDENCE_THEME;
}

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function EvidenceViewDialog({
  open,
  onClose,
  evidence,
  viewUrl,
  isPdf,
  isLoading,
  isMobile,
  isTabletView = false,
  title,
  assessmentTheme,
}) {
  const at = assessmentTheme || DEFAULT_EVIDENCE_THEME;
  const handleOpenExternal = () => {
    if (viewUrl) {
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isMobile && !isTabletView}
      maxWidth="md"
      className={`subdomain-evidence-dialog subdomain-evidence-dialog--${at.kind}`}
      PaperProps={{
        className: "subdomain-evidence-dialog__paper",
        style: getEvidenceThemeVars(at),
      }}
    >
      <DialogTitle className="subdomain-evidence-dialog__title">
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>
            {title || "Evidence preview"}
          </Typography>
          {evidence?.fileName ? (
            <Typography variant="caption" color="text.secondary" display="block">
              {evidence.fileName}
              {evidence.fileSizeBytes
                ? ` · ${formatFileSize(evidence.fileSizeBytes)}`
                : ""}
            </Typography>
          ) : null}
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="subdomain-evidence-dialog__content">
        {isLoading ? (
          <Box className="subdomain-evidence-dialog__loading">
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Loading evidence…
            </Typography>
          </Box>
        ) : viewUrl && isPdf ? (
          <Box className="subdomain-evidence-dialog__pdf-wrap">
            <iframe
              title="Evidence PDF preview"
              src={viewUrl}
              className="subdomain-evidence-dialog__pdf"
            />
          </Box>
        ) : viewUrl ? (
          <Box className="subdomain-evidence-dialog__image-wrap">
            <img src={viewUrl} alt="Uploaded evidence" />
          </Box>
        ) : (
          <Box className="subdomain-evidence-dialog__empty">
            <DescriptionIcon className="subdomain-evidence-compact__file-icon" />
            <Typography variant="body2" color="text.secondary">
              Preview is not available. Try opening the file in a new tab.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions className="subdomain-evidence-dialog__actions">
        <Button onClick={onClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
        {viewUrl ? (
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={handleOpenExternal}
            sx={{
              bgcolor: at.primary,
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { bgcolor: at.dark },
            }}
          >
            Open in new tab
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

function EvidenceUploadModal({
  open,
  onClose,
  slots,
  readOnly,
  isUploading,
  uploadingSlotId,
  onUploadClick,
  onViewClick,
  evidenceLabel,
  assessmentTheme,
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const at = assessmentTheme || DEFAULT_EVIDENCE_THEME;
  const progress = computeMandatoryEvidenceProgress(slots);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      fullScreen={isPhone}
      maxWidth="sm"
      className={`subdomain-evidence-upload-modal subdomain-evidence-upload-modal--${at.kind}${
        isPhone ? " subdomain-evidence-upload-modal--mobile" : ""
      }`}
      PaperProps={{
        className: "subdomain-evidence-upload-modal__paper",
        style: getEvidenceThemeVars(at),
      }}
    >
      <DialogTitle
        className="subdomain-evidence-upload-modal__title"
        sx={{
          background: at.panelGradient,
          borderBottom: `1px solid ${at.primary}22`,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{
              lineHeight: 1.3,
              wordBreak: "break-word",
              overflowWrap: "anywhere",
            }}
          >
            {evidenceLabel} upload
          </Typography>
          <Typography variant="caption" color="text.secondary">
            JPG, PNG, PDF · Max 5 MB per file
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={onClose}
          aria-label="Close"
          sx={{ flexShrink: 0, mt: 0.25 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers className="subdomain-evidence-upload-modal__content">
        {progress.total > 0 ? (
          <Box
            className="subdomain-evidence-upload-modal__summary"
            sx={{
              background: `${at.primary}08`,
              border: `1px solid ${at.primary}22`,
            }}
          >
            <Box
              className="subdomain-evidence-upload-modal__summary-row"
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 0.35, sm: 0.75 },
                mb: 0.75,
              }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4 }}>
                Mandatory {evidenceLabel}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={800}
                sx={{
                  color: at.primary,
                  lineHeight: 1.4,
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {progress.uploaded}/{progress.total} uploaded
                {progress.remaining > 0 ? ` · ${progress.remaining} left` : ""}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress.percentage}
              sx={{
                height: 8,
                borderRadius: 99,
                bgcolor: `${at.primary}18`,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 99,
                  bgcolor:
                    progress.percentage === 100
                      ? colors.accent.green
                      : at.primary,
                },
              }}
            />
          </Box>
        ) : null}

        <Box className="subdomain-evidence-upload-modal__slots">
          {slots.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No evidence items are configured for this subdomain yet. Please contact the administrator.
            </Typography>
          ) : (
            slots.map((slot) => {
            const isMandatory =
              slot.isMandatory === 1 ||
              slot.isMandatory === true ||
              slot.isMandatory === "1";
            const hasFile = Boolean(slot.evidence?.evidenceId);
            const slotUploading =
              isUploading && uploadingSlotId === slot.evidenceSlotId;

            return (
              <Box
                key={slot.evidenceSlotId}
                className={`subdomain-evidence-slot-card${
                  hasFile ? " subdomain-evidence-slot-card--done" : ""
                }`}
                sx={
                  !hasFile
                    ? {
                        "&:hover": {
                          borderColor: `${at.primary}55`,
                          boxShadow: `0 4px 14px ${at.primary}12`,
                        },
                      }
                    : undefined
                }
              >
                <Box className="subdomain-evidence-slot-card__header">
                  <Box className="subdomain-evidence-slot-card__info">
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      className="subdomain-evidence-slot-card__name"
                    >
                      {slot.slotName || getEvidenceSlotName(slot)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      className="subdomain-evidence-slot-card__filename"
                    >
                      {hasFile
                        ? slot.evidence?.fileName || "Uploaded"
                        : "Not uploaded yet"}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={isMandatory ? "Mandatory" : "Optional"}
                    color={isMandatory ? "error" : "default"}
                    variant="outlined"
                    className="subdomain-evidence-slot-card__chip"
                    sx={{ fontWeight: 700, flexShrink: 0 }}
                  />
                </Box>

                <Box className="subdomain-evidence-slot-card__actions">
                  {hasFile ? (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<VisibilityIcon />}
                      onClick={() => onViewClick(slot)}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      View
                    </Button>
                  ) : null}
                  {!readOnly ? (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        slotUploading ? (
                          <CircularProgress size={14} color="inherit" />
                        ) : (
                          <CloudUploadIcon />
                        )
                      }
                      onClick={() => onUploadClick(slot)}
                      disabled={slotUploading}
                      sx={{
                        textTransform: "none",
                        fontWeight: 700,
                        bgcolor: at.primary,
                        boxShadow: "none",
                        "&:hover": { bgcolor: at.dark, boxShadow: "none" },
                      }}
                    >
                      {hasFile ? "Replace" : "Upload"}
                    </Button>
                  ) : null}
                </Box>
              </Box>
            );
          })
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function SubdomainEvidencePanel({
  subDomainId,
  schoolId,
  assessmentId,
  subdomain,
  domainName,
  readOnly = false,
  className = "",
  variant = "compact",
  languageCode = "en",
  onProgressChange,
  assessmentTheme: assessmentThemeProp,
  selectedAssessment,
}) {
  const resolvedTheme = resolveEvidenceTheme({
    assessmentTheme: assessmentThemeProp,
    selectedAssessment,
  });
  const themeVars = getEvidenceThemeVars(resolvedTheme);
  const at = resolvedTheme;
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isTouchLayout = useMediaQuery(theme.breakpoints.down("md"));
  const inputRef = useRef(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingSlot, setViewingSlot] = useState(null);
  const [uploadingSlotId, setUploadingSlotId] = useState(null);
  const [activeSlotId, setActiveSlotId] = useState(null);
  const requiresEvidence = subdomainRequiresEvidence(subdomain);
  const lang = languageCode || i18n.language || "en";
  const evidenceLabel = t("selfAssessment.evidence.label", { defaultValue: "Evidence" });

  const { data, isLoading, isFetching, refetch } = useSubdomainEvidenceQuery(
    { subDomainId, schoolId, languageCode: lang.toUpperCase() },
    requiresEvidence,
  );

  const payload = data?.data || data || {};
  const slots = payload.slots || [];
  const progress = useMemo(
    () => computeMandatoryEvidenceProgress(slots),
    [slots],
  );

  const onProgressChangeRef = React.useRef(onProgressChange);
  onProgressChangeRef.current = onProgressChange;
  const lastReportedProgressRef = React.useRef(null);

  React.useEffect(() => {
    if (isLoading) return;

    const prev = lastReportedProgressRef.current;
    if (
      prev &&
      prev.uploaded === progress.uploaded &&
      prev.total === progress.total &&
      prev.percentage === progress.percentage
    ) {
      return;
    }
    lastReportedProgressRef.current = progress;
    onProgressChangeRef.current?.(progress);
  }, [isLoading, progress]);

  const uploadMutation = usePrepareSubdomainEvidenceMutation({
    onSuccess: () => {
      setUploadingSlotId(null);
      refetch();
    },
    onError: () => setUploadingSlotId(null),
  });

  if (!requiresEvidence) return null;

  const hasAnyEvidence = slots.some((slot) => slot.evidence?.evidenceId);
  const isUploading = uploadMutation.isPending;

  const handleOpenUploadModal = (event) => {
    event?.stopPropagation?.();
    setUploadModalOpen(true);
    refetch();
  };

  const handleUploadClick = (slot) => {
    if (readOnly || isUploading) return;
    setActiveSlotId(slot.evidenceSlotId);
    inputRef.current?.click();
  };

  const handleViewClick = async (slot) => {
    setViewingSlot(slot);
    setViewOpen(true);
    if (!slot.evidence?.viewUrl) {
      await refetch();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const evidenceSlotId = activeSlotId;

    if (!file || !evidenceSlotId) return;

    if (file.size > MAX_EVIDENCE_SIZE_BYTES) {
      enqueueSnackbar("File exceeds the maximum allowed size of 5 MB.", {
        variant: "warning",
      });
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const allowed = ["jpg", "jpeg", "png", "pdf"];
    if (!allowed.includes(extension)) {
      enqueueSnackbar("Invalid file type. Allowed formats: JPG, PNG, PDF.", {
        variant: "warning",
      });
      return;
    }

    try {
      setUploadingSlotId(evidenceSlotId);
      const response = await uploadMutation.mutateAsync({
        subDomainId,
        evidenceSlotId,
        schoolId,
        assessmentId: assessmentId ?? null,
        extension,
        contentType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
      });

      const uploadPayload = response?.data || response;
      if (uploadPayload?.uploadURL) {
        await uploadFileToPresignedUrl(uploadPayload.uploadURL, file);
      }
    } catch {
      setUploadingSlotId(null);
    } finally {
      setActiveSlotId(null);
    }
  };

  const viewingEvidence = viewingSlot?.evidence || null;
  const viewUrl = viewingEvidence?.viewUrl || viewingEvidence?.previewUrl || null;
  const isPdf =
    viewingEvidence?.contentType === "application/pdf" ||
    viewingEvidence?.fileName?.toLowerCase().endsWith(".pdf");

  const statusText =
    progress.total > 0
      ? `${progress.uploaded}/${progress.total} mandatory`
      : slots.length > 0
        ? `${slots.filter((s) => s.evidence?.evidenceId).length}/${slots.length}`
        : "Not configured";

  if (variant === "compact") {
    const compactContent = (
      <Box
        className={`subdomain-evidence-compact subdomain-evidence-compact--${at.kind} ${
          progress.percentage === 100 ? "subdomain-evidence-compact--done" : ""
        } ${isPhone ? "subdomain-evidence-compact--mobile" : ""} ${
          isTablet ? "subdomain-evidence-compact--tablet" : ""
        } ${className}`.trim()}
        style={themeVars}
        onClick={handleOpenUploadModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") handleOpenUploadModal(e);
        }}
      >
        {isLoading ? (
          <Box className="subdomain-evidence-compact__loading">
            <CircularProgress size={isPhone ? 20 : 16} />
          </Box>
        ) : (
          <>
            <Box className="subdomain-evidence-compact__lead">
              <Box className="subdomain-evidence-compact__icon-wrap">
                {progress.percentage === 100 && hasAnyEvidence ? (
                  <CheckCircleIcon className="subdomain-evidence-compact__icon subdomain-evidence-compact__icon--done" />
                ) : (
                  <AttachFileIcon className="subdomain-evidence-compact__icon" />
                )}
              </Box>
              <Box className="subdomain-evidence-compact__text">
                <Typography className="subdomain-evidence-compact__label">
                  {evidenceLabel}
                </Typography>
                <Typography className="subdomain-evidence-compact__status">
                  {statusText}
                </Typography>
              </Box>
            </Box>

            <Box className="subdomain-evidence-compact__actions">
              {isTouchLayout ? (
                <IconButton
                  size="small"
                  className="subdomain-evidence-compact__icon-btn subdomain-evidence-compact__icon-btn--upload"
                  onClick={handleOpenUploadModal}
                  aria-label={`Manage ${evidenceLabel}`}
                >
                  <CloudUploadIcon fontSize="small" />
                </IconButton>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  className="subdomain-evidence-compact__btn subdomain-evidence-compact__btn--upload"
                  startIcon={<CloudUploadIcon sx={{ fontSize: "0.95rem !important" }} />}
                  onClick={handleOpenUploadModal}
                  sx={{
                    bgcolor: at.primary,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    minWidth: 0,
                    px: 1,
                    py: 0.35,
                    boxShadow: "none",
                    "&:hover": { bgcolor: at.dark, boxShadow: "none" },
                  }}
                >
                  Upload
                </Button>
              )}
            </Box>
          </>
        )}
      </Box>
    );

    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={EVIDENCE_ACCEPT}
          hidden
          onChange={handleFileChange}
        />

        {isTouchLayout ? (
          compactContent
        ) : (
          <Tooltip
            title={`${evidenceLabel}: ${statusText} · Click to manage uploads`}
            arrow
            placement="top"
          >
            {compactContent}
          </Tooltip>
        )}

        <EvidenceUploadModal
          open={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          slots={slots}
          readOnly={readOnly}
          isUploading={isUploading}
          uploadingSlotId={uploadingSlotId}
          onUploadClick={handleUploadClick}
          onViewClick={handleViewClick}
          evidenceLabel={evidenceLabel}
          assessmentTheme={at}
        />

        <EvidenceViewDialog
          open={viewOpen}
          onClose={() => {
            setViewOpen(false);
            setViewingSlot(null);
          }}
          evidence={viewingEvidence}
          viewUrl={viewUrl}
          isPdf={isPdf}
          isLoading={isFetching && !viewUrl}
          isMobile={isPhone}
          isTabletView={isTablet}
          title={viewingSlot ? getEvidenceSlotName(viewingSlot, lang) : evidenceLabel}
          assessmentTheme={at}
        />
      </>
    );
  }

  return (
    <Box
      className={`subdomain-evidence-panel subdomain-evidence-panel--${at.kind} ${className}`.trim()}
      style={themeVars}
    >
      <Box className="subdomain-evidence-panel__body">
        {isLoading ? (
          <Box className="subdomain-evidence-panel__loading">
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleOpenUploadModal}
            sx={{
              bgcolor: at.primary,
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              "&:hover": { bgcolor: at.dark },
            }}
          >
            Manage {evidenceLabel} ({statusText})
          </Button>
        )}
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept={EVIDENCE_ACCEPT}
        hidden
        onChange={handleFileChange}
      />

      <EvidenceUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        slots={slots}
        readOnly={readOnly}
        isUploading={isUploading}
        uploadingSlotId={uploadingSlotId}
        onUploadClick={handleUploadClick}
        onViewClick={handleViewClick}
        evidenceLabel={evidenceLabel}
        assessmentTheme={at}
      />

      <EvidenceViewDialog
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewingSlot(null);
        }}
        evidence={viewingEvidence}
        viewUrl={viewUrl}
        isPdf={isPdf}
        isLoading={isFetching && !viewUrl}
        isMobile={isPhone}
        isTabletView={isTablet}
        title={viewingSlot ? getEvidenceSlotName(viewingSlot, lang) : evidenceLabel}
        assessmentTheme={at}
      />
    </Box>
  );
}

export { computeMandatoryEvidenceProgress };
