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
import { Add, Delete } from "@mui/icons-material";
import { colors } from "../../../../constants/colors";
import {
  useDeleteEvidenceSlotMutation,
  useEvidenceSlotsQuery,
  useUpsertEvidenceSlotMutation,
} from "../../../../services/evidenceService";

export function EvidenceSlotEditor({ subDomainId, initialSlots = [], disabled = false }) {
  const [slotName, setSlotName] = useState("");
  const [isMandatory, setIsMandatory] = useState("yes");
  const [localSlots, setLocalSlots] = useState(initialSlots);

  const { data: slotsData, refetch } = useEvidenceSlotsQuery(subDomainId, !!subDomainId);

  const upsertMutation = useUpsertEvidenceSlotMutation({
    onSuccess: () => {
      setSlotName("");
      setIsMandatory("yes");
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
    }
  }, [slotsData, initialSlots]);

  const handleAddSlot = async () => {
    if (!subDomainId) return;
    const trimmed = slotName.trim();
    if (!trimmed) return;

    await upsertMutation.mutateAsync({
      subDomainId,
      slotName: trimmed,
      isMandatory: isMandatory === "yes" ? 1 : 0,
    });
  };

  const handleDeleteSlot = (evidenceSlotId) => {
    if (!evidenceSlotId) return;
    deleteMutation.mutate(evidenceSlotId);
    setLocalSlots((prev) =>
      prev.filter((slot) => slot.evidenceSlotId !== evidenceSlotId),
    );
  };

  const mandatoryCount = localSlots.filter(
    (slot) =>
      slot.isMandatory === 1 || slot.isMandatory === true || slot.isMandatory === "1",
  ).length;

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
          Evidence slots (આધાર)
        </Typography>
        <Chip
          size="small"
          label={`${localSlots.length} total · ${mandatoryCount} mandatory`}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        Schools must upload files for mandatory slots. Optional slots can be skipped.
      </Typography>

      {localSlots.length > 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {localSlots.map((slot, index) => (
            <Box
              key={slot.evidenceSlotId || index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                borderRadius: 1.5,
                bgcolor: colors.neutral.gray100,
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                {slot.slotName || slot.slotNameEn}
              </Typography>
              <Chip
                size="small"
                label={
                  slot.isMandatory === 1 ||
                  slot.isMandatory === true ||
                  slot.isMandatory === "1"
                    ? "Mandatory"
                    : "Optional"
                }
                color={
                  slot.isMandatory === 1 ||
                  slot.isMandatory === true ||
                  slot.isMandatory === "1"
                    ? "error"
                    : "default"
                }
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
              {!disabled ? (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteSlot(slot.evidenceSlotId)}
                  disabled={deleteMutation.isPending}
                >
                  <Delete fontSize="small" />
                </IconButton>
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
          <TextField
            size="small"
            fullWidth
            label="Evidence name"
            placeholder="e.g. Classroom photo, attendance register"
            value={slotName}
            onChange={(e) => setSlotName(e.target.value)}
          />
          <FormControl component="fieldset" size="small">
            <RadioGroup
              row
              value={isMandatory}
              onChange={(e) => setIsMandatory(e.target.value)}
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddSlot}
            disabled={!slotName.trim() || upsertMutation.isPending}
            sx={{
              alignSelf: "flex-start",
              bgcolor: colors.primary.blue,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Add evidence
          </Button>
        </Box>
      ) : !subDomainId ? (
        <Typography variant="caption" color="text.secondary">
          Save the subdomain first, then add evidence slots.
        </Typography>
      ) : null}
    </Box>
  );
}
