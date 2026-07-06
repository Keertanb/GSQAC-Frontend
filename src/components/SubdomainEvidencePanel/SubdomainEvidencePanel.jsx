import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { colors } from "../../constants/colors";
import {
  EVIDENCE_ACCEPT,
  MAX_EVIDENCE_SIZE_BYTES,
  subdomainRequiresEvidence,
  uploadFileToPresignedUrl,
  usePrepareSubdomainEvidenceMutation,
  useSubdomainEvidenceQuery,
} from "../../services/evidenceService";
import { enqueueSnackbar } from "notistack";
import "./SubdomainEvidencePanel.css";

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
}) {
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
      className="subdomain-evidence-dialog"
      PaperProps={{ className: "subdomain-evidence-dialog__paper" }}
    >
      <DialogTitle className="subdomain-evidence-dialog__title">
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>
            Subdomain evidence
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
              bgcolor: colors.primary.blue,
              textTransform: "none",
              fontWeight: 700,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            Open in new tab
          </Button>
        ) : null}
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
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isTouchLayout = useMediaQuery(theme.breakpoints.down("md"));
  const inputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const requiresEvidence = subdomainRequiresEvidence(subdomain);

  const { data, isLoading, isFetching, refetch } = useSubdomainEvidenceQuery(
    { subDomainId, schoolId },
    requiresEvidence,
  );

  const evidence = data?.data || null;
  const uploadMutation = usePrepareSubdomainEvidenceMutation({
    onSuccess: () => setLocalPreview(null),
  });

  if (!requiresEvidence) return null;

  const isPdf =
    evidence?.contentType === "application/pdf" ||
    evidence?.fileName?.toLowerCase().endsWith(".pdf");
  const viewUrl =
    localPreview || evidence?.viewUrl || evidence?.previewUrl || null;
  const isUploading = uploadMutation.isPending;
  const hasEvidence = Boolean(evidence?.fileName || localPreview);

  const handlePickFile = () => {
    if (readOnly || isUploading) return;
    inputRef.current?.click();
  };

  const handleOpenView = async (event) => {
    event?.stopPropagation?.();
    setViewOpen(true);
    if (!viewUrl || !evidence?.viewUrl) {
      await refetch();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

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

    if (file.type.startsWith("image/")) {
      setLocalPreview(URL.createObjectURL(file));
    } else {
      setLocalPreview(null);
    }

    try {
      const response = await uploadMutation.mutateAsync({
        subDomainId,
        schoolId,
        assessmentId: assessmentId ?? null,
        extension,
        contentType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
      });

      const payload = response?.data || response;
      if (payload?.uploadURL) {
        await uploadFileToPresignedUrl(payload.uploadURL, file);
      }
    } catch {
      setLocalPreview(null);
    }
  };

  const tooltipTitle = hasEvidence
    ? "View uploaded evidence"
    : "JPG, PNG, PDF · Max 5 MB";

  if (variant === "compact") {
    const showActions = hasEvidence || !readOnly;

    const renderViewAction = () =>
      hasEvidence ? (
        isTouchLayout ? (
          <Tooltip title="View evidence" arrow>
            <IconButton
              size="small"
              className="subdomain-evidence-compact__icon-btn subdomain-evidence-compact__icon-btn--view"
              onClick={handleOpenView}
              aria-label="View evidence"
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            size="small"
            variant="outlined"
            className="subdomain-evidence-compact__btn subdomain-evidence-compact__btn--view"
            startIcon={<VisibilityIcon sx={{ fontSize: "0.95rem !important" }} />}
            onClick={handleOpenView}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.7rem",
              minWidth: 0,
              px: 1,
              py: 0.35,
              borderColor: colors.primary.blue,
              color: colors.primary.blue,
            }}
          >
            View
          </Button>
        )
      ) : null;

    const renderUploadAction = () =>
      !readOnly ? (
        isTouchLayout ? (
          <Tooltip title={hasEvidence ? "Replace evidence" : "Upload evidence"} arrow>
            <IconButton
              size="small"
              className="subdomain-evidence-compact__icon-btn subdomain-evidence-compact__icon-btn--upload"
              onClick={(e) => {
                e.stopPropagation();
                handlePickFile();
              }}
              disabled={isUploading}
              aria-label={hasEvidence ? "Replace evidence" : "Upload evidence"}
            >
              {isUploading ? (
                <CircularProgress size={16} />
              ) : (
                <CloudUploadIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        ) : (
          <Button
            size="small"
            variant="contained"
            className="subdomain-evidence-compact__btn subdomain-evidence-compact__btn--upload"
            startIcon={
              isUploading ? (
                <CircularProgress size={12} color="inherit" />
              ) : (
                <CloudUploadIcon sx={{ fontSize: "0.95rem !important" }} />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              handlePickFile();
            }}
            disabled={isUploading}
            sx={{
              bgcolor: colors.primary.blue,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.7rem",
              minWidth: 0,
              px: 1,
              py: 0.35,
              lineHeight: 1.2,
              boxShadow: "none",
              "&:hover": { bgcolor: colors.primary.dark, boxShadow: "none" },
            }}
          >
            {hasEvidence ? "Replace" : "Upload"}
          </Button>
        )
      ) : null;

    const compactContent = (
      <Box
        className={`subdomain-evidence-compact ${hasEvidence ? "subdomain-evidence-compact--done" : ""} ${isPhone ? "subdomain-evidence-compact--mobile" : ""} ${isTablet ? "subdomain-evidence-compact--tablet" : ""} ${className}`.trim()}
      >
        {isLoading ? (
          <Box className="subdomain-evidence-compact__loading">
            <CircularProgress size={isPhone ? 20 : 16} />
          </Box>
        ) : (
          <>
            <Box className="subdomain-evidence-compact__lead">
              <Box className="subdomain-evidence-compact__icon-wrap">
                {hasEvidence ? (
                  <CheckCircleIcon className="subdomain-evidence-compact__icon subdomain-evidence-compact__icon--done" />
                ) : (
                  <AttachFileIcon className="subdomain-evidence-compact__icon" />
                )}
              </Box>
              <Box className="subdomain-evidence-compact__text">
                <Typography className="subdomain-evidence-compact__label">
                  Evidence
                </Typography>
                <Typography className="subdomain-evidence-compact__status">
                  {hasEvidence ? "Uploaded" : "Required · Max 5 MB"}
                </Typography>
              </Box>
            </Box>

            {showActions ? (
              <Box className="subdomain-evidence-compact__actions">
                {renderViewAction()}
                {renderUploadAction()}
              </Box>
            ) : null}
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
          <Tooltip title={tooltipTitle} arrow placement="top">
            {compactContent}
          </Tooltip>
        )}

        <EvidenceViewDialog
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          evidence={evidence}
          viewUrl={viewUrl}
          isPdf={isPdf}
          isLoading={isFetching && !viewUrl}
          isMobile={isPhone}
          isTabletView={isTablet}
        />
      </>
    );
  }

  return (
    <Box className={`subdomain-evidence-panel ${className}`.trim()}>
      <Box className="subdomain-evidence-panel__body">
        {isLoading ? (
          <Box className="subdomain-evidence-panel__loading">
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            {hasEvidence ? (
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={handleOpenView}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                View evidence
              </Button>
            ) : null}

            {!readOnly ? (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept={EVIDENCE_ACCEPT}
                  hidden
                  onChange={handleFileChange}
                />
                <Button
                  variant="contained"
                  startIcon={
                    isUploading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  onClick={handlePickFile}
                  disabled={isUploading}
                  className="subdomain-evidence-panel__upload-btn"
                  sx={{
                    bgcolor: colors.primary.blue,
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  {evidence?.fileName ? "Replace Evidence" : "Upload Evidence"}
                </Button>
              </>
            ) : null}
          </>
        )}
      </Box>

      <EvidenceViewDialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        evidence={evidence}
        viewUrl={viewUrl}
        isPdf={isPdf}
        isLoading={isFetching && !viewUrl}
        isMobile={isPhone}
        isTabletView={isTablet}
      />
    </Box>
  );
}
