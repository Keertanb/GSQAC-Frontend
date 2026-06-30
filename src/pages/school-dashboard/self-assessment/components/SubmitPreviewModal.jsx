import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Preview as PreviewIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { colors } from "../../../../constants/colors";

export function SubmitPreviewModal({
  open,
  onClose,
  onConfirm,
  previewData,
  isLoading,
  error,
  title,
  description,
  emptyMessage,
  confirmText,
  cancelText,
  totalAnswered,
}) {
  const hasData =
    Array.isArray(previewData) &&
    previewData.some((domain) =>
      domain.subdomains?.some((subdomain) => subdomain.questions?.length > 0),
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          mx: { xs: 1.5, sm: 2 },
          maxHeight: "90vh",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <DialogTitle sx={{ p: 0, position: "relative" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: { xs: 2.25, sm: 3 },
            pb: 2,
            borderBottom: `2px solid ${colors.primary.blue}30`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: { xs: 48, sm: 56 },
              height: { xs: 48, sm: 56 },
              borderRadius: "50%",
              bgcolor: `${colors.primary.blue}14`,
              color: colors.primary.blue,
              flexShrink: 0,
            }}
          >
            <PreviewIcon sx={{ fontSize: { xs: 26, sm: 32 } }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.text.primary,
                fontSize: { xs: "1.0625rem", sm: "1.25rem" },
                lineHeight: 1.35,
              }}
            >
              {title}
            </Typography>
            {typeof totalAnswered === "number" && totalAnswered > 0 && (
              <Typography
                variant="caption"
                sx={{ color: colors.text.secondary, fontWeight: 600 }}
              >
                {totalAnswered} responses
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            disabled={isLoading}
            sx={{
              color: colors.text.secondary,
              "&:hover": {
                bgcolor: colors.neutral.gray100,
                color: colors.text.primary,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2.25, sm: 3 },
          pt: { xs: 2, sm: 2.5 },
          bgcolor: colors.background.secondary,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: colors.text.secondary,
            lineHeight: 1.6,
            fontSize: "0.9375rem",
            mb: 2,
          }}
        >
          {description}
        </Typography>

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
              py: 6,
            }}
          >
            <CircularProgress size={32} />
            <Typography variant="body2" color="text.secondary">
              Loading your submitted answers...
            </Typography>
          </Box>
        )}

        {!isLoading && error && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: `${colors.semantic.error}12`,
              border: `1px solid ${colors.semantic.error}35`,
            }}
          >
            <Typography variant="body2" sx={{ color: colors.semantic.error }}>
              {error}
            </Typography>
          </Box>
        )}

        {!isLoading && !error && !hasData && (
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              textAlign: "center",
              bgcolor: colors.background.primary,
              border: `1px dashed ${colors.neutral.gray300}`,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          </Box>
        )}

        {!isLoading && !error && hasData && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {previewData.map((domain) => (
              <Box
                key={`${domain.domainIndex}-${domain.domainName}`}
                sx={{
                  borderRadius: 2,
                  overflow: "hidden",
                  border: `1px solid ${colors.neutral.gray200}`,
                  bgcolor: colors.background.primary,
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.25,
                    bgcolor: `${colors.primary.blue}10`,
                    borderBottom: `1px solid ${colors.neutral.gray200}`,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 800, color: colors.primary.blue }}
                  >
                    {domain.domainIndex}. {domain.domainName}
                  </Typography>
                </Box>

                {domain.subdomains.map((subdomain) => (
                  <Box
                    key={`${domain.domainIndex}-${subdomain.subdomainIndex}`}
                    sx={{ px: 2, py: 1.5 }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: colors.text.primary,
                        mb: 1,
                      }}
                    >
                      {domain.domainIndex}.{subdomain.subdomainIndex}{" "}
                      {subdomain.subdomainName}
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {subdomain.questions.map((question) => (
                        <Box
                          key={`${question.questionId}-${question.questionNumber}-${question.context || ""}`}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: colors.background.secondary,
                            border: `1px solid ${colors.neutral.gray200}`,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 1,
                              mb: 0.75,
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              label={`Q ${question.questionNumber}`}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                bgcolor: `${colors.accent.orangeDark}18`,
                                color: colors.accent.orangeDark,
                              }}
                            />
                            {question.context && (
                              <Chip
                                label={question.context}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 22,
                                  fontSize: "0.68rem",
                                  maxWidth: "100%",
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.text.primary,
                              fontSize: "0.8125rem",
                              lineHeight: 1.5,
                              mb: 0.5,
                            }}
                          >
                            {question.questionText}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.primary.blue,
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                            }}
                          >
                            {question.answerLabel}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2.25, sm: 3 },
          pt: 2,
          gap: 1.5,
          borderTop: `1px solid ${colors.neutral.gray200}`,
          bgcolor: colors.background.primary,
          flexDirection: { xs: "column-reverse", sm: "row" },
          "& > button": {
            width: { xs: "100%", sm: "auto" },
            minHeight: 48,
          },
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{
            minWidth: { sm: 100 },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isLoading || !!error}
          sx={{
            minWidth: { sm: 120 },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: colors.primary.blue,
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
