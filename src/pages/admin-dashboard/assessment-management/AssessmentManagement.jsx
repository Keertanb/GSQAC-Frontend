import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Card,
  TextField,
  Button,
  Fade,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Visibility,
  Add,
  Delete,
  Language,
  Translate,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import DomainSubdomainView from "./DomainSubdomainView";
import QuestionsView from "./QuestionsView";
import {
  useGetDomainsQuery,
  useUpsertDomainMutation,
  useDeleteDomainMutation,
  useTranslateTextMutation,
} from "../../../services/adminService";
import { roleIdMap, getRoleId } from "../../../constants/roles";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import "./AssessmentManagement.css";

const AssessmentManagement = () => {
  const { t, i18n } = useTranslation();

  const [expandedDomain, setExpandedDomain] = useState(null);
  const [currentView, setCurrentView] = useState("domains"); // domains, questions
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState("gu");
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomainName, setNewDomainName] = useState({
    en: "",
    hi: "",
    gu: "",
  });
  const [selectedRole, setSelectedRole] = useState("all");
  const [editingDomain, setEditingDomain] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [translationId, setTranslationId] = useState(null);

  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  const roleId = selectedRole === "all" ? null : getRoleId(selectedRole);

  const {
    data: domainsDataAdmin,
    isLoading: isLoadingAdmin,
    refetch: refetchAdmin,
  } = useGetDomainsQuery({
    roleId: 1, // Admin
    languageCode,
    enabled: selectedRole === "all" || selectedRole === "admin",
  });

  const {
    data: domainsDataSchool,
    isLoading: isLoadingSchool,
    refetch: refetchSchool,
  } = useGetDomainsQuery({
    roleId: 2, // School
    languageCode,
    enabled: selectedRole === "all" || selectedRole === "school",
  });

  const {
    data: domainsDataInspector,
    isLoading: isLoadingInspector,
    refetch: refetchInspector,
  } = useGetDomainsQuery({
    roleId: 3, // Inspector
    languageCode,
    enabled: selectedRole === "all" || selectedRole === "inspector",
  });

  const {
    data: domainsDataParent,
    isLoading: isLoadingParent,
    refetch: refetchParent,
  } = useGetDomainsQuery({
    roleId: 4, // Parent
    languageCode,
    enabled: selectedRole === "all" || selectedRole === "parent",
  });

  const {
    data: domainsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDomainsQuery({
    roleId,
    languageCode,
    enabled: selectedRole !== "all" && !!roleId,
  });

  const allDomains = React.useMemo(() => {
    if (selectedRole !== "all") {
      return domainsData?.data || [];
    }
    const combined = [];
    if (domainsDataAdmin?.data) combined.push(...domainsDataAdmin.data);
    if (domainsDataSchool?.data) combined.push(...domainsDataSchool.data);
    if (domainsDataInspector?.data) combined.push(...domainsDataInspector.data);
    if (domainsDataParent?.data) combined.push(...domainsDataParent.data);
    return combined;
  }, [
    selectedRole,
    domainsData,
    domainsDataAdmin,
    domainsDataSchool,
    domainsDataInspector,
    domainsDataParent,
  ]);

  const isLoadingAll =
    selectedRole === "all"
      ? isLoadingAdmin ||
        isLoadingSchool ||
        isLoadingInspector ||
        isLoadingParent
      : isLoading;

  const upsertDomainMutation = useUpsertDomainMutation({
    onSuccess: () => {
      if (selectedRole === "all") {
        refetchAdmin();
        refetchSchool();
        refetchInspector();
        refetchParent();
      } else {
        refetch();
      }
      setNewDomainName({ en: "", hi: "", gu: "" });
      setShowAddDomain(false);
      setEditingDomain(null);
      setTranslationId(null);
    },
  });

  const deleteDomainMutation = useDeleteDomainMutation({
    onSuccess: (data, domainId) => {
      // Refetch domains after deletion
      if (selectedRole === "all") {
        refetchAdmin();
        refetchSchool();
        refetchInspector();
        refetchParent();
      } else {
        refetch();
      }
      // Close expanded domain if it was deleted
      if (expandedDomain === domainId) {
        setExpandedDomain(null);
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
        setNewDomainName((prev) => ({
          ...prev,
          en: translatedData.transEn,
        }));
      }
      // API returns transHn for Hindi
      if (translatedData?.transHn || translatedData?.transHi) {
        setNewDomainName((prev) => ({
          ...prev,
          hi: translatedData.transHn || translatedData.transHi,
        }));
      }
    },
  });

  const domains = allDomains;

  const handleToggleDomain = (domainId) => {
    setExpandedDomain(expandedDomain === domainId ? null : domainId);
  };

  const handleAddDomain = () => {
    if (!newDomainName.en.trim() || !selectedRole) {
      return;
    }

    const payload = {
      roleId: getRoleId(selectedRole),
      domainNameEn: newDomainName.en.trim(),
      domainNameHi: newDomainName.hi.trim(),
      domainNameGu: newDomainName.gu.trim(),
    };

    // If editing, include domainId
    if (editingDomain) {
      payload.domainId = editingDomain.domainId;
    }

    upsertDomainMutation.mutate(payload);
  };

  const handleEditDomain = (domain) => {
    setEditingDomain(domain);
    setNewDomainName({
      en: domain.domainNameEn || "",
      hi: domain.domainNameHi || "",
      gu: domain.domainNameGu || "",
    });
    // Set selected role based on domain's roleId
    const domainRole = Object.keys(roleIdMap).find(
      (key) => roleIdMap[key] === domain.roleId
    );
    if (domainRole) {
      setSelectedRole(domainRole);
    }
    setShowAddDomain(true);
  };

  const handleDeleteDomain = (domain) => {
    setDomainToDelete(domain);
    setDeleteModalOpen(true);
  };

  const confirmDeleteDomain = () => {
    if (domainToDelete) {
      deleteDomainMutation.mutate(domainToDelete.domainId);
    }
  };

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
    // Refetch data when language changes
    refetch();
  };

  const handleTranslateDomain = async () => {
    if (!newDomainName.gu.trim()) {
      // Use snackbar if available
      alert("Please enter Gujarati text to translate.");
      return;
    }

    try {
      const payload = {
        id: translationId || null,
        transGu: newDomainName.gu.trim(),
      };

      await translateTextMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error translating domain:", error);
    }
  };

  const getDomainName = (domain) => {
    if (languageCode === "EN") {
      return domain.domainNameEn || domain.domainName;
    } else if (languageCode === "HI") {
      return domain.domainNameHi || domain.domainName;
    } else {
      return domain.domainNameGu || domain.domainName;
    }
  };

  // const getSubdomainName = (subdomain) => {
  //   if (languageCode === "EN") {
  //     return subdomain.subDomainNameEn || subdomain.subDomainName;
  //   } else if (languageCode === "HI") {
  //     return subdomain.subDomainNameHi || subdomain.subDomainName;
  //   } else {
  //     return subdomain.subDomainNameGu || subdomain.subDomainName;
  //   }
  // };

  if (isLoadingAll) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Alert severity="error">
          {error?.message || t("common.error") || "Failed to load domains"}
        </Alert>
      </Box>
    );
  }

  if (currentView === "questions" && selectedSubdomain) {
    return (
      <QuestionsView
        subdomainData={selectedSubdomain}
        onBack={() => {
          setCurrentView("domains");
          setSelectedSubdomain(null);
        }}
        currentLanguage={currentLanguage}
      />
    );
  }

  return (
    <Box className="assessment-management-container">
      {/* Language Selector and Role Filter */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* <Language sx={{ color: colors.primary.blue, fontSize: 20 }} /> */}
          <ToggleButtonGroup
            value={currentLanguage}
            exclusive
            onChange={(e, newLanguage) => {
              if (newLanguage !== null) {
                handleLanguageChange(newLanguage);
              }
            }}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                px: 2,
                py: 0.5,
                fontSize: "0.8125rem",
                fontWeight: 600,
                textTransform: "uppercase",
                borderColor: colors.primary.blue + "40",
                color: colors.text.secondary,
                "&.Mui-selected": {
                  bgcolor: colors.primary.blue,
                  color: "white",
                  "&:hover": {
                    bgcolor: colors.primary.dark,
                  },
                },
                "&:hover": {
                  bgcolor: colors.primary.lightest,
                },
              },
            }}
          >
            <ToggleButton value="gu">ગુ</ToggleButton>
            <ToggleButton value="en">EN</ToggleButton>
            <ToggleButton value="hi">हिं</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("assessment.domain.selectRole")}</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                // Refetch domains when role changes
                if (e.target.value === "all") {
                  setTimeout(() => {
                    refetchAdmin();
                    refetchSchool();
                    refetchInspector();
                    refetchParent();
                  }, 100);
                } else {
                  setTimeout(() => refetch(), 100);
                }
              }}
              label={t("assessment.domain.selectRole")}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="school">School</MenuItem>
              <MenuItem value="inspector">School Verifier</MenuItem>
              <MenuItem value="parent">Parent</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingDomain(null);
              setNewDomainName({ en: "", hi: "", gu: "" });
              setTranslationId(null);
              setShowAddDomain(!showAddDomain);
            }}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            {t("assessment.domain.addDomain")}
          </Button>
        </Box>
      </Box>

      {/* Add/Edit Domain Form */}
      {showAddDomain && (
        <Fade in={showAddDomain}>
          <Card
            elevation={2}
            sx={{
              mb: 3,
              p: 3,
              borderRadius: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {editingDomain
                  ? t("assessment.domain.editDomain")
                  : t("assessment.domain.addDomain")}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleTranslateDomain}
                disabled={
                  !newDomainName.gu.trim() || translateTextMutation.isPending
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
              </Button>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label={`${t("assessment.domain.domainName")} (Gujarati)`}
                value={newDomainName.gu}
                onChange={(e) =>
                  setNewDomainName({ ...newDomainName, gu: e.target.value })
                }
                variant="outlined"
                size="small"
                required
              />
              <TextField
                fullWidth
                label={`${t("assessment.domain.domainName")} (English)`}
                value={newDomainName.en}
                onChange={(e) =>
                  setNewDomainName({ ...newDomainName, en: e.target.value })
                }
                variant="outlined"
                size="small"
              />
              <TextField
                fullWidth
                label={`${t("assessment.domain.domainName")} (Hindi)`}
                value={newDomainName.hi}
                onChange={(e) =>
                  setNewDomainName({ ...newDomainName, hi: e.target.value })
                }
                variant="outlined"
                size="small"
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddDomain}
                disabled={upsertDomainMutation.isPending}
                sx={{
                  bgcolor: colors.primary.blue,
                  "&:hover": { bgcolor: colors.primary.dark },
                }}
              >
                {editingDomain
                  ? t("common.save")
                  : `${t("common.add")} ${t("assessment.domain.title")}`}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddDomain(false);
                  setNewDomainName({ en: "", hi: "", gu: "" });
                  setEditingDomain(null);
                  setSelectedRole("admin");
                  setTranslationId(null);
                }}
                disabled={upsertDomainMutation.isPending}
              >
                {t("common.cancel")}
              </Button>
            </Box>
          </Card>
        </Fade>
      )}

      {/* Domains Table */}
      {domains.length > 0 ? (
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{ borderRadius: 3 }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: colors.primary.blue + "10" }}>
                <TableCell sx={{ fontWeight: 700, width: "50px" }}>
                  {/* Expand/Collapse column */}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {t("assessment.domain.title")}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>
                  {t("common.actions")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {domains.map((domain) => (
                <React.Fragment key={domain.domainId}>
                  <TableRow
                    sx={{
                      "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                      cursor: "pointer",
                    }}
                    onClick={() => handleToggleDomain(domain.domainId)}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDomain(domain.domainId);
                        }}
                      >
                        {expandedDomain === domain.domainId ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {getDomainName(domain)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDomain(domain.domainId);
                          }}
                          sx={{
                            bgcolor: colors.primary.blue + "15",
                            "&:hover": { bgcolor: colors.primary.blue + "25" },
                          }}
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDomain(domain);
                          }}
                          sx={{
                            bgcolor: colors.accent.green + "15",
                            "&:hover": { bgcolor: colors.accent.green + "25" },
                          }}
                        >
                          <Add />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDomain(domain);
                          }}
                          sx={{
                            bgcolor: colors.semantic.error + "15",
                            "&:hover": {
                              bgcolor: colors.semantic.error + "25",
                            },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  {expandedDomain === domain.domainId && (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ py: 3, bgcolor: "#f9fafb" }}>
                        <DomainSubdomainView
                          domain={domain}
                          languageCode={languageCode}
                          roleId={domain.roleId}
                          onNavigateToCriteria={(subdomain) => {
                            setSelectedSubdomain({
                              ...subdomain,
                              subDomainId:
                                subdomain.subDomainId || subdomain.id,
                              roleId: domain.roleId, // Pass roleId from domain
                            });
                            setCurrentView("questions");
                            setExpandedDomain(null);
                          }}
                          onSubdomainAdded={() => {
                            if (selectedRole === "all") {
                              refetchAdmin();
                              refetchSchool();
                              refetchInspector();
                              refetchParent();
                            } else {
                              refetch();
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Card elevation={2} sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1" color="text.secondary">
            {t("assessment.domain.noDomains")}
          </Typography>
        </Card>
      )}

      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDomainToDelete(null);
        }}
        onConfirm={confirmDeleteDomain}
        title="Delete Domain"
        message={
          domainToDelete
            ? `Are you sure you want to delete "${getDomainName(
                domainToDelete
              )}"? This action cannot be undone.`
            : "Are you sure you want to delete this domain?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteDomainMutation.isPending}
      />
    </Box>
  );
};

export default AssessmentManagement;
