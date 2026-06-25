import React, { useMemo } from "react";
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
  TextField,
} from "@mui/material";
import {
  RateReview as FeedbackIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { colors } from "../../../../constants/colors";

const MAX_FEEDBACK_WORDS = 250;

export function countFeedbackWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function limitFeedbackWords(text, maxWords = MAX_FEEDBACK_WORDS) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

export function SubmitFeedbackModal({
  open,
  onClose,
  onConfirm,
  feedback,
  onFeedbackChange,
  title,
  description,
  placeholder,
  optionalHint,
  wordLimitText,
  confirmText,
  cancelText,
  testingNotice,
  isLoading = false,
}) {
  const wordCount = useMemo(() => countFeedbackWords(feedback), [feedback]);
  const isOverLimit = wordCount > MAX_FEEDBACK_WORDS;

  const handleChange = (e) => {
    onFeedbackChange(limitFeedbackWords(e.target.value, MAX_FEEDBACK_WORDS));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          overflow: "hidden",
          mx: { xs: 1.5, sm: 2 },
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
            <FeedbackIcon sx={{ fontSize: { xs: 26, sm: 32 } }} />
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

      <DialogContent sx={{ p: { xs: 2.25, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
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

        {testingNotice && (
          <Box
            sx={{
              mb: 2,
              p: 1.75,
              borderRadius: 2,
              bgcolor: `${colors.semantic.warning}14`,
              border: `1px solid ${colors.semantic.warning}40`,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: colors.text.primary,
                lineHeight: 1.65,
                fontSize: "0.875rem",
                fontWeight: 500,
              }}
            >
              {testingNotice}
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={8}
          value={feedback}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={isLoading}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              bgcolor: colors.background.primary,
              fontSize: { xs: "16px", sm: "0.9375rem" },
              "& fieldset": {
                borderColor: colors.neutral.gray200,
              },
              "&:hover fieldset": {
                borderColor: colors.primary.light,
              },
              "&.Mui-focused fieldset": {
                borderColor: colors.primary.blue,
                borderWidth: 2,
              },
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mt: 1.25,
            flexWrap: "wrap",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: colors.text.secondary,
              fontSize: "0.75rem",
              fontWeight: 500,
            }}
          >
            {optionalHint}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
              color: isOverLimit ? colors.semantic.error : colors.text.secondary,
            }}
          >
            {wordLimitText}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: { xs: 2.25, sm: 3 },
          pt: 2,
          gap: 1.5,
          borderTop: `1px solid ${colors.neutral.gray200}`,
          bgcolor: colors.background.secondary,
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
            borderColor: colors.neutral.gray300,
            color: colors.text.primary,
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isLoading || isOverLimit}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} sx={{ color: "inherit" }} />
            ) : null
          }
          sx={{
            minWidth: { sm: 120 },
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: colors.primary.blue,
            boxShadow: `0 4px 6px -1px ${colors.primary.blue}40`,
            "&:hover": {
              bgcolor: colors.primary.dark,
            },
            "&:disabled": {
              bgcolor: colors.primary.blue,
              opacity: 0.6,
            },
          }}
        >
          {isLoading ? "Processing..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
