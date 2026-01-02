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
} from "@mui/material";
import {
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { colors } from "../../constants/colors";

/**
 * ConfirmationModal - A reusable confirmation modal component
 * @param {boolean} open - Whether the modal is open
 * @param {function} onClose - Function to call when modal is closed
 * @param {function} onConfirm - Function to call when user confirms
 * @param {string} title - Title of the modal
 * @param {string} message - Message to display in the modal
 * @param {string} confirmText - Text for the confirm button (default: "Yes")
 * @param {string} cancelText - Text for the cancel button (default: "Cancel")
 * @param {string} variant - Variant of the modal: "danger" | "warning" | "info" (default: "danger")
 * @param {boolean} isLoading - Whether the confirm action is loading
 */
const ConfirmationModal = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Yes",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  // Variant colors based on theme
  const variantStyles = {
    danger: {
      icon: <ErrorIcon sx={{ fontSize: 32 }} />,
      iconBg: colors.semantic.error + "15",
      iconColor: colors.semantic.error,
      buttonBg: colors.semantic.error,
      buttonHover: "#dc2626",
      borderColor: colors.semantic.error + "30",
    },
    warning: {
      icon: <WarningIcon sx={{ fontSize: 32 }} />,
      iconBg: colors.semantic.warning + "15",
      iconColor: colors.semantic.warning,
      buttonBg: colors.semantic.warning,
      buttonHover: "#d97706",
      borderColor: colors.semantic.warning + "30",
    },
    info: {
      icon: <InfoIcon sx={{ fontSize: 32 }} />,
      iconBg: colors.semantic.info + "15",
      iconColor: colors.semantic.info,
      buttonBg: colors.semantic.info,
      buttonHover: "#2563eb",
      borderColor: colors.semantic.info + "30",
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.danger;

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
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 0,
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: 3,
            pb: 2,
            borderBottom: `2px solid ${currentVariant.borderColor}`,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: currentVariant.iconBg,
              color: currentVariant.iconColor,
              flexShrink: 0,
            }}
          >
            {currentVariant.icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.text.primary,
                fontSize: "1.25rem",
                lineHeight: 1.4,
              }}
            >
              {title}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: colors.text.secondary,
              "&:hover": {
                bgcolor: colors.neutral.gray100,
                color: colors.text.primary,
              },
            }}
            disabled={isLoading}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 3,
          pt: 2.5,
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: colors.text.secondary,
            lineHeight: 1.6,
            fontSize: "0.9375rem",
          }}
        >
          {message}
        </Typography>
      </DialogContent>

      <DialogActions
        sx={{
          p: 3,
          pt: 2,
          gap: 1.5,
          borderTop: `1px solid ${colors.neutral.gray200}`,
          bgcolor: colors.background.secondary,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={isLoading}
          sx={{
            minWidth: 100,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            borderColor: colors.neutral.gray300,
            color: colors.text.primary,
            "&:hover": {
              borderColor: colors.neutral.gray400,
              bgcolor: colors.neutral.white,
            },
            "&:disabled": {
              opacity: 0.5,
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={isLoading}
          startIcon={
            isLoading ? (
              <CircularProgress size={16} sx={{ color: "inherit" }} />
            ) : null
          }
          sx={{
            minWidth: 100,
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: currentVariant.buttonBg,
            color: colors.text.inverse,
            boxShadow: `0 4px 6px -1px ${currentVariant.buttonBg}40`,
            "&:hover": {
              bgcolor: currentVariant.buttonHover,
              boxShadow: `0 6px 8px -1px ${currentVariant.buttonBg}50`,
              transform: "translateY(-1px)",
            },
            "&:active": {
              transform: "translateY(0)",
            },
            "&:disabled": {
              bgcolor: currentVariant.buttonBg,
              opacity: 0.6,
            },
            transition: "all 0.2s ease-in-out",
          }}
        >
          {isLoading ? "Processing..." : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
