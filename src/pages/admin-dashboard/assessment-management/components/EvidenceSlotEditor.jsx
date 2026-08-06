import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Close } from "@mui/icons-material";
import { colors } from "../../../../constants/colors";
import {
  useDeleteEvidenceSlotMutation,
  useEvidenceSlotsQuery,
  useUpsertEvidenceSlotMutation,
} from "../../../../services/evidenceService";

const EMPTY_FORM = {
  evidenceSlotId: null,
  gu: "",
  en: "",
  hi: "",
  isMandatory: "yes",
};

function isMandatorySlot(slot) {
  return (
    slot?.isMandatory === 1 ||
    slot?.isMandatory === true ||
    slot?.isMandatory === "1"
  );
}

export function EvidenceSlotEditor({
  subDomainId,
  initialSlots = [],
  disabled = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [localSlots, setLocalSlots] = useState(initialSlots);

  const { data: slotsData, refetch } = useEvidenceSlotsQuery(
    subDomainId,
    !!subDomainId,
  );

  const upsertMutation = useUpsertEvidenceSlotMutation({
    onSuccess: () => {
      setForm(EMPTY_FORM);
      refetch();
    },
  });

  const deleteMutation = useDeleteEvidenceSlotMutation({
    onSuccess: () => refetch(),
  });

  useEffect(() => {
    const fetched = slotsData?.data || slotsData || [];
    if (Array.isArray(fetched) && fetched.length) {
      setLocalSlots(fetched);
    } else if (initialSlots?.length) {
      setLocalSlots(initialSlots);
    } else {
      setLocalSlots([]);
    }
  }, [slotsData, initialSlots]);

  const resetForm = () => setForm(EMPTY_FORM);

  const startEdit = (slot) => {
    setForm({
      evidenceSlotId: slot.evidenceSlotId,
      gu: slot.slotNameGu || "",
      en: slot.slotNameEn || slot.slotName || "",
      hi: slot.slotNameHi || "",
      isMandatory: isMandatorySlot(slot) ? "yes" : "no",
    });
  };

  const handleSave = async () => {
    if (!subDomainId) return;

    const slotNameGu = form.gu.trim();
    const slotNameEn = form.en.trim();
    const slotNameHi = form.hi.trim();

    if (!slotNameGu || !slotNameEn) {
      return;
    }

    await upsertMutation.mutateAsync({
      evidenceSlotId: form.evidenceSlotId || null,
      subDomainId,
      slotNameGu,
      slotNameEn,
      slotNameHi: slotNameHi || null,
      isMandatory: form.isMandatory === "yes" ? 1 : 0,
    });
  };

  const handleDeleteSlot = (evidenceSlotId) => {
    if (!evidenceSlotId) return;
    if (form.evidenceSlotId === evidenceSlotId) {
      resetForm();
    }
    deleteMutation.mutate(evidenceSlotId);
    setLocalSlots((prev) =>
      prev.filter((slot) => slot.evidenceSlotId !== evidenceSlotId),
    );
  };

  const mandatoryCount = localSlots.filter(isMandatorySlot).length;
  const canSave = form.gu.trim() && form.en.trim() && !upsertMutation.isPending;
  const isEditing = !!form.evidenceSlotId;

  return (
    <Box
      sx={{
        border: `1px solid ${colors.neutral.gray200}`,
        borderRadius: 2,
        p: 2,
        bgcolor: "#fff",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Evidence slots
        </Typography>
        <Chip
          size="small"
          label={`${localSlots.length} total · ${mandatoryCount} mandatory`}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 1.5 }}
      >
        Enter evidence names in Gujarati, English and Hindi. Schools must upload
        files for mandatory slots.
      </Typography>

      {localSlots.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {localSlots.map((slot, index) => (
            <Box
              key={slot.evidenceSlotId || index}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: colors.neutral.gray100,
                border:
                  form.evidenceSlotId === slot.evidenceSlotId
                    ? `1px solid ${colors.primary.blue}`
                    : "1px solid transparent",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  GU: {slot.slotNameGu || "—"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  EN: {slot.slotNameEn || slot.slotName || "—"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  HI: {slot.slotNameHi || "—"}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={isMandatorySlot(slot) ? "Mandatory" : "Optional"}
                color={isMandatorySlot(slot) ? "error" : "default"}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              {!disabled ? (
                <>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => startEdit(slot)}
                    disabled={upsertMutation.isPending}
                    title="Edit"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteSlot(slot.evidenceSlotId)}
                    disabled={deleteMutation.isPending}
                    title="Delete"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </>
              ) : null}
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No evidence slots added yet.
        </Typography>
      )}

      {!disabled && subDomainId ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {isEditing ? "Edit evidence slot" : "Add evidence slot"}
          </Typography>
          <TextField
            size="small"
            fullWidth
            label="Evidence name (Gujarati)"
            placeholder="e.g. Classroom photo"
            value={form.gu}
            onChange={(e) => setForm((p) => ({ ...p, gu: e.target.value }))}
          />
          <TextField
            size="small"
            fullWidth
            label="Evidence name (English)"
            placeholder="e.g. Classroom photo, attendance register"
            value={form.en}
            onChange={(e) => setForm((p) => ({ ...p, en: e.target.value }))}
          />
          <TextField
            size="small"
            fullWidth
            label="Evidence name (Hindi)"
            placeholder="e.g. Classroom photo"
            value={form.hi}
            onChange={(e) => setForm((p) => ({ ...p, hi: e.target.value }))}
          />
          <FormControl component="fieldset" size="small">
            <RadioGroup
              row
              value={form.isMandatory}
              onChange={(e) =>
                setForm((p) => ({ ...p, isMandatory: e.target.value }))
              }
            >
              <FormControlLabel
                value="yes"
                control={<Radio size="small" />}
                label="Mandatory"
              />
              <FormControlLabel
                value="no"
                control={<Radio size="small" />}
                label="Optional"
              />
            </RadioGroup>
          </FormControl>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={isEditing ? <Edit /> : <Add />}
              onClick={handleSave}
              disabled={!canSave}
              sx={{
                bgcolor: colors.primary.blue,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {upsertMutation.isPending
                ? "Saving..."
                : isEditing
                  ? "Update evidence"
                  : "Add evidence"}
            </Button>
            {isEditing ? (
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={resetForm}
                disabled={upsertMutation.isPending}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Cancel
              </Button>
            ) : null}
          </Box>
        </Box>
      ) : !subDomainId ? (
        <Typography variant="caption" color="text.secondary">
          Save the subdomain first, then add evidence slots.
        </Typography>
      ) : null}
    </Box>
  );
}
