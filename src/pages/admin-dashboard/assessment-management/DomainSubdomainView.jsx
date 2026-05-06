import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Typography,
  TableContainer,
  Button,
  TextField,
  Fade,
  Card,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  Visibility,
  Add,
  Delete,
  Language,
  Translate,
  Edit,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import {
  useUpsertSubdomainMutation,
  useTranslateTextMutation,
  useDeleteSubdomainMutation,
} from "../../../services/adminService";
import { roleIdMap } from "../../../constants/roles";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";

const DomainSubdomainView = ({
  domain,
  languageCode,
  roleId,
  onNavigateToCriteria,
  onSubdomainAdded,
}) => {
  const { t } = useTranslation();

  // Map language code: EN -> en, HI -> hi, GU -> gu
  const languageCodeToLower = {
    EN: "en",
    HI: "hi",
    GU: "gu",
  };
  const initialLanguage = languageCodeToLower[languageCode] || "en";

  // Local language state for DomainSubdomainView
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);

  const [showAddSubdomain, setShowAddSubdomain] = useState(false);
  const [newSubdomainName, setNewSubdomainName] = useState({
    en: "",
    hi: "",
    gu: "",
  });
  const [selectedSubdomainRole, setSelectedSubdomainRole] = useState(
    roleId
      ? Object.keys(roleIdMap).find((key) => roleIdMap[key] === roleId) ||
          "admin"
      : "admin",
  );
  const [editingSubdomain, setEditingSubdomain] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [subdomainToDelete, setSubdomainToDelete] = useState(null);
  const [translationId, setTranslationId] = useState(null);

  const upsertSubdomainMutation = useUpsertSubdomainMutation({
    onSuccess: (data, variables) => {
      // Show success message - check if it's an edit by checking if subDomainId exists in payload
      const isEdit = variables?.subDomainId !== undefined;
      enqueueSnackbar(
        isEdit
          ? data?.message || "Subdomain updated successfully"
          : data?.message || "Subdomain added successfully",
        { variant: "success" },
      );
      setNewSubdomainName({ en: "", hi: "", gu: "" });
      setShowAddSubdomain(false);
      setEditingSubdomain(null);
      setTranslationId(null);
      if (onSubdomainAdded) {
        onSubdomainAdded();
      }
    },
  });

  const deleteSubdomainMutation = useDeleteSubdomainMutation({
    onSuccess: () => {
      setDeleteModalOpen(false);
      setSubdomainToDelete(null);
      if (onSubdomainAdded) {
        onSubdomainAdded();
      }
    },
  });

  const translateTextMutation = useTranslateTextMutation({
    onSuccess: (data) => {
      // Extract translation data from response
      const translatedData = data?.data || data;

      // Store translation ID for future updates
      if (translatedData?.id) {
        setTranslationId(translatedData.id);
      }

      // Populate English and Hindi fields with translated text
      if (translatedData?.transEn) {
        setNewSubdomainName((prev) => ({
          ...prev,
          en: translatedData.transEn,
        }));
      }
      // API returns transHn for Hindi
      if (translatedData?.transHn || translatedData?.transHi) {
        setNewSubdomainName((prev) => ({
          ...prev,
          hi: translatedData.transHn || translatedData.transHi,
        }));
      }
    },
  });

  const handleTranslateSubdomain = async () => {
    if (!newSubdomainName.gu.trim()) {
      enqueueSnackbar("Please enter Gujarati text to translate.", {
        variant: "warning",
      });
      return;
    }

    try {
      const payload = {
        id: translationId || null,
        transGu: newSubdomainName.gu.trim(),
      };

      await translateTextMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error translating subdomain:", error);
    }
  };

  const getSubdomainName = (subdomain) => {
    switch (selectedLanguage) {
      case "en":
        return subdomain.subDomainNameEn || subdomain.subDomainName || "";
      case "hi":
        return subdomain.subDomainNameHi || subdomain.subDomainName || "";
      case "gu":
        return subdomain.subDomainNameGu || subdomain.subDomainName || "";
      default:
        return subdomain.subDomainNameEn || subdomain.subDomainName || "";
    }
  };

  const subdomains = domain.subDomain || [];

  const handleAddSubdomain = () => {
    // Count how many languages are filled
    const filledLanguages = [
      newSubdomainName.en.trim(),
      newSubdomainName.hi.trim(),
      newSubdomainName.gu.trim(),
    ].filter((name) => name.length > 0);

    // Check if at least 2 languages are provided
    if (filledLanguages.length < 2) {
      enqueueSnackbar(
        "Please add subdomain name in at least 2 languages (Gujarati, English).",
        {
          variant: "warning",
        },
      );
      return;
    }

    const payload = {
      domainId: domain.domainId,
      subDomainNameEn: newSubdomainName.en.trim(),
      subDomainNameHi: newSubdomainName.hi.trim(),
      subDomainNameGu: newSubdomainName.gu.trim(),
    };

    // If editing, include subDomainId
    if (editingSubdomain) {
      payload.subDomainId = editingSubdomain.subDomainId || editingSubdomain.id;
    }

    upsertSubdomainMutation.mutate(payload);
  };

  const handleEditSubdomain = (subdomain) => {
    setEditingSubdomain(subdomain);

    setNewSubdomainName({
      en: subdomain.subDomainNameEn || subdomain.subDomainName || "",
      hi: subdomain.subDomainNameHi || subdomain.subDomainName || "",
      gu: subdomain.subDomainNameGu || subdomain.subDomainName || "",
    });

    // Set selected role based on domain's roleId
    const subdomainRole = Object.keys(roleIdMap).find(
      (key) => roleIdMap[key] === domain.roleId,
    );
    if (subdomainRole) {
      setSelectedSubdomainRole(subdomainRole);
    }
    setShowAddSubdomain(true);

    // Scroll to the form after a brief delay to ensure it's rendered
    setTimeout(() => {
      document.querySelector(".MuiCard-root")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 100);
  };

  const handleDeleteSubdomain = (subdomain, event) => {
    event?.stopPropagation();
    setSubdomainToDelete(subdomain);
    setDeleteModalOpen(true);
  };

  const confirmDeleteSubdomain = () => {
    if (subdomainToDelete) {
      const subDomainId = subdomainToDelete.subDomainId || subdomainToDelete.id;
      if (subDomainId) {
        deleteSubdomainMutation.mutate(subDomainId);
      } else {
        console.error("Cannot delete subdomain: Missing subDomainId");
        enqueueSnackbar("Error: Cannot delete subdomain - Missing ID", {
          variant: "error",
        });
        setDeleteModalOpen(false);
        setSubdomainToDelete(null);
      }
    }
  };

  return (
    <Box>
      {/* Language Selector and Add Subdomain Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={() => setShowAddSubdomain(!showAddSubdomain)}
          sx={{
            borderColor: colors.primary.blue,
            color: colors.primary.blue,
            "&:hover": {
              borderColor: colors.primary.dark,
              bgcolor: colors.primary.blue + "10",
            },
          }}
        >
          {t("assessment.subdomain.addSubdomain")}
        </Button>
      </Box>

      {showAddSubdomain && (
        <Fade in={showAddSubdomain}>
          <Card
            elevation={1}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 2,
              bgcolor: "#f9fafb",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {editingSubdomain
                  ? t("assessment.subdomain.editSubdomain")
                  : t("assessment.subdomain.addSubdomain")}
              </Typography>
              {/* <Button
                variant="outlined"
                onClick={handleTranslateSubdomain}
                disabled={
                  !newSubdomainName.gu.trim() || translateTextMutation.isPending
                }
                startIcon={<Translate />}
                size="small"
                sx={{
                  borderColor: colors.primary.blue,
                  color: colors.primary.blue,
                  "&:hover": {
                    borderColor: colors.primary.dark,
                    bgcolor: colors.primary.blue + "10",
                  },
                }}
              >
                Translate to EN & HI
              </Button> */}
            </Box>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
            >
              {/* <FormControl fullWidth size="small">
                <InputLabel>{t("assessment.domain.selectRole")}</InputLabel>
                <Select
                  value={selectedSubdomainRole}
                  onChange={(e) => setSelectedSubdomainRole(e.target.value)}
                  label={t("assessment.domain.selectRole")}
                  disabled
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="school">School</MenuItem>
                  <MenuItem value="inspector">School Verifier</MenuItem>
                  <MenuItem value="parent">Parent</MenuItem>
                </Select>
              </FormControl> */}
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label={`${t(
                    "assessment.subdomain.subdomainName",
                  )} (Gujarati)`}
                  value={newSubdomainName.gu}
                  onChange={(e) =>
                    setNewSubdomainName({
                      ...newSubdomainName,
                      gu: e.target.value,
                    })
                  }
                  variant="outlined"
                  size="small"
                  required
                />
                <TextField
                  fullWidth
                  label={`${t("assessment.subdomain.subdomainName")} (English)`}
                  value={newSubdomainName.en}
                  onChange={(e) =>
                    setNewSubdomainName({
                      ...newSubdomainName,
                      en: e.target.value,
                    })
                  }
                  variant="outlined"
                  size="small"
                  required
                />
                <TextField
                  fullWidth
                  label={`${t("assessment.subdomain.subdomainName")} (Hindi)`}
                  value={newSubdomainName.hi}
                  onChange={(e) =>
                    setNewSubdomainName({
                      ...newSubdomainName,
                      hi: e.target.value,
                    })
                  }
                  variant="outlined"
                  size="small"
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddSubdomain}
                disabled={upsertSubdomainMutation.isPending}
                sx={{ bgcolor: colors.primary.blue }}
              >
                {editingSubdomain ? "Save Subdomain" : "Add Subdomain"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddSubdomain(false);
                  setNewSubdomainName({ en: "", hi: "", gu: "" });
                  setEditingSubdomain(null);
                  setTranslationId(null);
                }}
                disabled={upsertSubdomainMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
            </Box>
          </Card>
        </Fade>
      )}
      {subdomains && subdomains.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: colors.accent.green + "10" }}>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("assessment.subdomain.title")}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {t("common.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subdomains.map((subdomain) => (
                <TableRow
                  key={subdomain.subDomainId || subdomain.id}
                  sx={{
                    "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                  }}
                >
                  <TableCell>
                    <Typography fontWeight={500}>
                      {getSubdomainName(subdomain)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onNavigateToCriteria(subdomain, true)}
                        sx={{
                          bgcolor: colors.primary.blue + "15",
                          "&:hover": { bgcolor: colors.primary.blue + "25" },
                        }}
                        title="View Questions (Read-only)"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditSubdomain(subdomain)}
                        sx={{
                          bgcolor: colors.accent.purple + "15",
                          "&:hover": { bgcolor: colors.accent.purple + "25" },
                        }}
                        title="Edit Subdomain"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onNavigateToCriteria(subdomain, false)}
                        sx={{
                          bgcolor: colors.accent.green + "15",
                          "&:hover": { bgcolor: colors.accent.green + "25" },
                        }}
                        title="Manage Questions"
                      >
                        <Add />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteSubdomain(subdomain, e)}
                        sx={{
                          bgcolor: colors.semantic.error + "15",
                          "&:hover": { bgcolor: colors.semantic.error + "25" },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          elevation={0}
          sx={{ p: 2, textAlign: "center", borderRadius: 2 }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("assessment.subdomain.noSubdomains")}
          </Typography>
        </Paper>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSubdomainToDelete(null);
        }}
        onConfirm={confirmDeleteSubdomain}
        title="Delete Subdomain"
        message={
          subdomainToDelete
            ? `Are you sure you want to delete "${getSubdomainName(
                subdomainToDelete,
              )}"? This action cannot be undone.`
            : "Are you sure you want to delete this subdomain?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={false}
      />
    </Box>
  );
};

export default DomainSubdomainView;
