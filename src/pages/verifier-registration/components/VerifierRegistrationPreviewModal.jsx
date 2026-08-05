import React, { useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { buildVerifierRegistrationPreview } from "../utils/buildVerifierRegistrationPreview";

export default function VerifierRegistrationPreviewModal({
  open,
  form,
  districts,
  submitting,
  onClose,
  onConfirm,
}) {
  const sections = useMemo(
    () => (open && form ? buildVerifierRegistrationPreview(form, districts) : []),
    [open, form, districts],
  );

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
      scroll="paper"
      disablePortal
      aria-labelledby="vr-reg-preview-title"
      className="vr-reg-preview-dialog"
      PaperProps={{
        className: "vr-reg-preview-dialog__paper",
      }}
    >
      <DialogTitle id="vr-reg-preview-title" className="vr-reg-preview-dialog__title">
        અરજીની પૂર્વાવલોકન / Application Preview
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          કૃપા કરીને વિગતો ચકાસો અને પછી સબમિટ કરો. / Please review your answers,
          then submit.
        </Typography>
      </DialogTitle>
      <DialogContent dividers className="vr-reg-preview-dialog__content">
        <Box className="vr-reg-preview">
          {sections.map((section) => (
            <section key={section.title} className="vr-reg-preview__section">
              <Typography
                className="vr-reg-preview__section-title"
                component="h3"
              >
                {section.title}
              </Typography>
              <dl className="vr-reg-preview__list">
                {section.items.map((item) => (
                  <div
                    key={`${section.title}-${item.label}`}
                    className="vr-reg-preview__row"
                  >
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </Box>
      </DialogContent>
      <DialogActions className="vr-reg-preview-dialog__actions">
        <Button
          type="button"
          variant="outlined"
          className="vr-reg-preview-dialog__back"
          onClick={onClose}
          disabled={submitting}
        >
          પાછા જાઓ / Go Back
        </Button>
        <Button
          type="button"
          variant="contained"
          className="vr-reg-preview-dialog__submit"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting
            ? "સબમિટ થઈ રહ્યું છે... / Submitting..."
            : "અરજી સબમિટ કરો / Submit Application"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
