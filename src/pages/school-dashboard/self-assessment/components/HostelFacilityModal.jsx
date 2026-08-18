import React, { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Hotel as HotelIcon } from "@mui/icons-material";
import { colors } from "../../../../constants/colors";

const SCHOOL_ONLY = "school";
const SCHOOL_WITH_HOSTEL = "hostel";

const OPTION_LABELS = {
  [SCHOOL_ONLY]: "છાત્રાલય વિનાની શાળા",
  [SCHOOL_WITH_HOSTEL]: "છાત્રાલય વાળી શાળા",
};

export function HostelFacilityModal({ open, onConfirm, isLoading = false }) {
  const [step, setStep] = useState("question");
  const [selectedValue, setSelectedValue] = useState(SCHOOL_ONLY);

  const selectedLabel = OPTION_LABELS[selectedValue];

  const handleCloseAttempt = () => {
    // Selection is required before assessment can proceed.
  };

  const handlePrimary = () => {
    if (step === "question") {
      setStep("confirm");
      return;
    }

    // hostel = 1 when school with hostel, else 0
    onConfirm?.(selectedValue === SCHOOL_WITH_HOSTEL ? 1 : 0);
  };

  const handleBack = () => {
    setStep("question");
  };

  const handleExited = () => {
    setStep("question");
    setSelectedValue(SCHOOL_ONLY);
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseAttempt}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      TransitionProps={{ onExited: handleExited }}
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: `${colors.primary.blue}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HotelIcon sx={{ color: colors.primary.blue }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              {step === "question" ? "શાળાનો પ્રકાર પસંદ કરો" : "ખાતરી કરો"}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {step === "question" ? (
          <Box>
            <Typography
              variant="body1"
              sx={{ mb: 2.5, fontWeight: 700, lineHeight: 1.7 }}
            >
              સ્વ-મૂલ્યાંકનની પ્રક્રિયા શરૂ કરવા માટે તમારી શાળાનો પ્રકાર પસંદ
              કરો.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {[
                { value: SCHOOL_ONLY, label: OPTION_LABELS[SCHOOL_ONLY] },
                {
                  value: SCHOOL_WITH_HOSTEL,
                  label: OPTION_LABELS[SCHOOL_WITH_HOSTEL],
                },
              ].map((option) => {
                const selected = selectedValue === option.value;
                return (
                  <Button
                    key={option.value}
                    variant={selected ? "contained" : "outlined"}
                    onClick={() => setSelectedValue(option.value)}
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      py: 1.5,
                      px: 2,
                      lineHeight: 1.45,
                      borderColor: selected
                        ? colors.primary.blue
                        : colors.neutral.gray200,
                      bgcolor: selected ? colors.primary.blue : "#fff",
                      color: selected ? "#fff" : colors.text.primary,
                      "&:hover": {
                        borderColor: colors.primary.blue,
                        bgcolor: selected
                          ? colors.primary.dark
                          : `${colors.primary.blue}0a`,
                      },
                    }}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography
              variant="body1"
              sx={{ mb: 2, fontWeight: 700, lineHeight: 1.7 }}
            >
              તમે <strong>{selectedLabel}</strong> નો વિકલ્પ પસંદ કર્યો છે.
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, lineHeight: 1.75 }}
            >
              આ વિકલ્પ સાથે તમે સ્વ-મૂલ્યાંકન માટે આગળ વધવા માંગતા હો તો{" "}
              <strong>હા</strong> પર ક્લિક/ટચ કરો. વિકલ્પમાં ફેરફાર કરવા માટે{" "}
              <strong>ના</strong> પર ક્લિક/ટચ કરો.
            </Typography>

            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.75,
                bgcolor: `${colors.primary.blue}08`,
                border: `1px solid ${colors.primary.blue}22`,
                borderRadius: 2,
                p: 1.5,
                color: colors.text.primary,
              }}
            >
              તમે <strong>{selectedLabel}</strong> નો વિકલ્પ પસંદ કર્યો છે. – આ
              વિધાનમાં જે બટન ક્લિક થયેલું હોય તે પ્રમાણે ‘શાળા’ કે ‘છાત્રાલય
              સાથેની શાળા’ આ બેમાંથી એક જ આવવું જોઈએ.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {step === "confirm" ? (
          <>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={isLoading}
              sx={{ textTransform: "none", fontWeight: 700, minWidth: 90 }}
            >
              ના
            </Button>
            <Button
              variant="contained"
              onClick={handlePrimary}
              disabled={isLoading}
              sx={{
                bgcolor: colors.primary.blue,
                textTransform: "none",
                fontWeight: 700,
                minWidth: 90,
              }}
            >
              {isLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                "હા"
              )}
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            onClick={handlePrimary}
            disabled={isLoading}
            sx={{
              bgcolor: colors.primary.blue,
              textTransform: "none",
              fontWeight: 700,
              minWidth: 110,
            }}
          >
            આગળ વધો
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
