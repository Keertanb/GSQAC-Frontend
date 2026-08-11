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
import {
  Add,
  Close,
  ContentCopy,
  ContentPaste,
  Delete,
  Edit,
} from "@mui/icons-material";
import { enqueueSnackbar } from "notistack";
import { colors } from "../../../../constants/colors";
import {
  upsertEvidenceSlot,
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

const CLIPBOARD_TYPE_SINGLE = "gsqac-evidence-slot";
const CLIPBOARD_TYPE_ALL = "gsqac-evidence-slots";

function isMandatorySlot(slot) {
  return (
    slot?.isMandatory === 1 ||
    slot?.isMandatory === true ||
    slot?.isMandatory === "1"
  );
}

function serializeSlot(slot) {
  const mandatory =
    isMandatorySlot(slot) ||
    slot.isMandatory === "yes" ||
    slot.isMandatory === true;

  return {
    slotNameGu: String(slot.slotNameGu || slot.gu || "").trim(),
    slotNameEn: String(
      slot.slotNameEn || slot.slotName || slot.en || "",
    ).trim(),
    slotNameHi: String(slot.slotNameHi || slot.hi || "").trim(),
    isMandatory: mandatory ? 1 : 0,
  };
}

function normalizePastedSlot(raw) {
  if (!raw || typeof raw !== "object") return null;

  const slotNameGu = String(raw.slotNameGu || raw.gu || "").trim();
  const slotNameEn = String(
    raw.slotNameEn || raw.slotName || raw.en || "",
  ).trim();
  const slotNameHi = String(raw.slotNameHi || raw.hi || "").trim();

  if (!slotNameGu && !slotNameEn) return null;

  return {
    slotNameGu,
    slotNameEn,
    slotNameHi,
    isMandatory:
      raw.isMandatory === 0 ||
      raw.isMandatory === false ||
      raw.isMandatory === "0" ||
      raw.isMandatory === "no"
        ? 0
        : 1,
  };
}

async function writeClipboard(payload) {
  await navigator.clipboard.writeText(JSON.stringify(payload));
}

async function readClipboardPayload() {
  const text = (await navigator.clipboard.readText()).trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function EvidenceSlotEditor({
  subDomainId = null,
  questionId = null,
  initialSlots = [],
  disabled = false,
}) {
  const entityId = questionId || subDomainId;
  const isQuestionScoped = !!questionId;

  const [form, setForm] = useState(EMPTY_FORM);
  const [localSlots, setLocalSlots] = useState(initialSlots);
  const [isPasting, setIsPasting] = useState(false);

  const { data: slotsData, refetch } = useEvidenceSlotsQuery(
    { subDomainId, questionId },
    !!entityId,
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

  const handleCopySlot = async (slot) => {
    try {
      const serialized = serializeSlot(slot);
      await writeClipboard({
        type: CLIPBOARD_TYPE_SINGLE,
        version: 1,
        slot: serialized,
      });
      enqueueSnackbar("Evidence slot copied (Gu / En / Hi).", {
        variant: "success",
      });
    } catch {
      enqueueSnackbar("Could not copy evidence slot. Check clipboard permission.", {
        variant: "error",
      });
    }
  };

  const handleCopyAllSlots = async () => {
    if (!localSlots.length) {
      enqueueSnackbar("No evidence slots to copy.", { variant: "warning" });
      return;
    }

    try {
      await writeClipboard({
        type: CLIPBOARD_TYPE_ALL,
        version: 1,
        slots: localSlots.map(serializeSlot),
      });
      enqueueSnackbar(
        `Copied ${localSlots.length} evidence slot${localSlots.length === 1 ? "" : "s"} (Gu / En / Hi).`,
        { variant: "success" },
      );
    } catch {
      enqueueSnackbar("Could not copy evidence slots. Check clipboard permission.", {
        variant: "error",
      });
    }
  };

  const applySlotToForm = (slot) => {
    setForm({
      evidenceSlotId: null,
      gu: slot.slotNameGu || "",
      en: slot.slotNameEn || "",
      hi: slot.slotNameHi || "",
      isMandatory: slot.isMandatory === 0 ? "no" : "yes",
    });
  };

  const handlePaste = async () => {
    if (!entityId || disabled) return;

    setIsPasting(true);
    try {
      const payload = await readClipboardPayload();
      if (!payload || typeof payload !== "object") {
        enqueueSnackbar(
          "Clipboard has no evidence slot data. Copy a slot first.",
          { variant: "warning" },
        );
        return;
      }

      if (payload.type === CLIPBOARD_TYPE_SINGLE) {
        const slot = normalizePastedSlot(payload.slot);
        if (!slot || !slot.slotNameGu || !slot.slotNameEn) {
          enqueueSnackbar("Copied evidence slot is incomplete.", {
            variant: "warning",
          });
          return;
        }
        applySlotToForm(slot);
        enqueueSnackbar(
          "Evidence slot pasted into the form. Review and click Add evidence.",
          { variant: "success" },
        );
        return;
      }

      if (payload.type === CLIPBOARD_TYPE_ALL) {
        const slots = (Array.isArray(payload.slots) ? payload.slots : [])
          .map(normalizePastedSlot)
          .filter((slot) => slot?.slotNameGu && slot?.slotNameEn);

        if (!slots.length) {
          enqueueSnackbar("Copied evidence slots list is empty or invalid.", {
            variant: "warning",
          });
          return;
        }

        for (const slot of slots) {
          await upsertEvidenceSlot({
            evidenceSlotId: null,
            ...(isQuestionScoped
              ? { questionId }
              : { subDomainId }),
            slotNameGu: slot.slotNameGu,
            slotNameEn: slot.slotNameEn,
            slotNameHi: slot.slotNameHi || null,
            isMandatory: slot.isMandatory,
          });
        }

        await refetch();
        enqueueSnackbar(
          `Pasted ${slots.length} evidence slot${slots.length === 1 ? "" : "s"} with Gu / En / Hi.`,
          { variant: "success" },
        );
        return;
      }

      // Fallback: raw single-slot object without wrapper type
      const looseSlot = normalizePastedSlot(payload);
      if (looseSlot?.slotNameGu && looseSlot?.slotNameEn) {
        applySlotToForm(looseSlot);
        enqueueSnackbar(
          "Evidence slot pasted into the form. Review and click Add evidence.",
          { variant: "success" },
        );
        return;
      }

      enqueueSnackbar(
        "Clipboard is not an evidence slot copy. Copy from Evidence slots first.",
        { variant: "warning" },
      );
    } catch {
      enqueueSnackbar("Could not paste. Check clipboard permission.", {
        variant: "error",
      });
    } finally {
      setIsPasting(false);
    }
  };

  const handleSave = async () => {
    if (!entityId) return;

    const slotNameGu = form.gu.trim();
    const slotNameEn = form.en.trim();
    const slotNameHi = form.hi.trim();

    if (!slotNameGu || !slotNameEn) {
      return;
    }

    await upsertMutation.mutateAsync({
      evidenceSlotId: form.evidenceSlotId || null,
      ...(isQuestionScoped ? { questionId } : { subDomainId }),
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
    deleteMutation.mutate({
      evidenceSlotId,
      questionId: isQuestionScoped ? questionId : undefined,
    });
    setLocalSlots((prev) =>
      prev.filter((slot) => slot.evidenceSlotId !== evidenceSlotId),
    );
  };

  const mandatoryCount = localSlots.filter(isMandatorySlot).length;
  const canSave = form.gu.trim() && form.en.trim() && !upsertMutation.isPending;
  const isEditing = !!form.evidenceSlotId;
  const busy = upsertMutation.isPending || deleteMutation.isPending || isPasting;

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            label={`${localSlots.length} total · ${mandatoryCount} mandatory`}
            sx={{ fontWeight: 600 }}
          />
          {!disabled && entityId ? (
            <>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentCopy />}
                onClick={handleCopyAllSlots}
                disabled={!localSlots.length || busy}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Copy all
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<ContentPaste />}
                onClick={handlePaste}
                disabled={busy}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Paste
              </Button>
            </>
          ) : null}
        </Box>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 1.5 }}
      >
        Enter evidence names in Gujarati, English and Hindi. Use Copy / Paste to
        reuse complete slots (all languages) on another subdomain — no
        translation fetch needed.
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
                    onClick={() => handleCopySlot(slot)}
                    disabled={busy}
                    title="Copy slot (Gu / En / Hi)"
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => startEdit(slot)}
                    disabled={busy}
                    title="Edit"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteSlot(slot.evidenceSlotId)}
                    disabled={busy}
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

      {!disabled && entityId ? (
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
              disabled={!canSave || isPasting}
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
            <Button
              variant="outlined"
              startIcon={<ContentPaste />}
              onClick={handlePaste}
              disabled={busy}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Paste
            </Button>
            {isEditing ? (
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={resetForm}
                disabled={busy}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Cancel
              </Button>
            ) : null}
          </Box>
        </Box>
      ) : !entityId ? (
        <Typography variant="caption" color="text.secondary">
          Save the {isQuestionScoped ? "question" : "subdomain"} first, then add
          evidence slots.
        </Typography>
      ) : null}
    </Box>
  );
}
