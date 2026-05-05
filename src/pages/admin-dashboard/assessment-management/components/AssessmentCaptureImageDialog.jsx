import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { CameraAlt } from "@mui/icons-material";

/** Camera / file capture flow with hidden canvas + file input (refs from controller). */
export function AssessmentCaptureImageDialog({
  open,
  captureMode,
  captureLoading,
  captureVideoRef,
  captureCanvasRef,
  fileInputRef,
  onClose,
  onStartWebCamera,
  onCaptureFromVideo,
  onFileChange,
  onPickFileClick,
  t,
  colors,
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {t("assessment.management.captureImageWithLocation")}
      </DialogTitle>
      <DialogContent>
        <canvas
          ref={captureCanvasRef}
          style={{ display: "none" }}
          aria-hidden
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
          aria-hidden
        />
        {captureMode === null && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t("assessment.management.captureImageHelp")}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<CameraAlt />}
              onClick={onStartWebCamera}
              fullWidth
              sx={{
                borderColor: colors.primary.blue,
                color: colors.primary.blue,
                "&:hover": {
                  borderColor: colors.primary.dark,
                  bgcolor: colors.primary.blue + "10",
                },
              }}
            >
              {t("assessment.management.useCamera")}
            </Button>
            <Button variant="outlined" onClick={onPickFileClick} fullWidth>
              {t("assessment.management.chooseImageFile")}
            </Button>
          </Box>
        )}
        {captureMode === "camera" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box
              component="video"
              ref={captureVideoRef}
              autoPlay
              playsInline
              muted
              sx={{
                width: "100%",
                maxHeight: 360,
                bgcolor: "#000",
                borderRadius: 2,
                objectFit: "contain",
              }}
            />
            <Button
              variant="contained"
              startIcon={<CameraAlt />}
              onClick={onCaptureFromVideo}
              disabled={captureLoading}
              fullWidth
              sx={{
                bgcolor: colors.primary.blue,
                "&:hover": { bgcolor: colors.primary.dark },
              }}
            >
              {captureLoading
                ? t("assessment.management.gettingLocation")
                : t("assessment.management.capture")}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
      </DialogActions>
    </Dialog>
  );
}
