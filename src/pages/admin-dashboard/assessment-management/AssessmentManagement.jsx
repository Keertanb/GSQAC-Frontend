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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Visibility,
  Add,
  Delete,
  Language,
  Translate,
  Publish,
  Settings,
  Edit,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import DomainSubdomainView from "./DomainSubdomainView";
import QuestionsView from "./QuestionsView";
import {
  useGetDomainsQuery,
  useUpsertDomainMutation,
  useDeleteDomainMutation,
  useTranslateTextMutation,
  usePublishAssessmentMutation,
  useGetAssessmentsQuery,
  useUpdateAssessmentMutation,
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
  const [selectedRole, setSelectedRole] = useState("school");
  const [editingDomain, setEditingDomain] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [translationId, setTranslationId] = useState(null);
  
  // Publish Assessment Modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishData, setPublishData] = useState({
    assessmentId: "",
    startDate: "",
    endDate: "",
    roleId: "",
  });
  
  // Settings Modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editedEndDates, setEditedEndDates] = useState({});

  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  const roleId = getRoleId(selectedRole);

  const {
    data: domainsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDomainsQuery({
    roleId,
    languageCode,
    enabled: !!roleId,
  });

  const domains = domainsData?.data || [];

  // Fetch assessments (no academic year filter)
  const {
    data: assessmentsData,
    isLoading: isLoadingAssessments,
    refetch: refetchAssessments,
  } = useGetAssessmentsQuery(null);

  const upsertDomainMutation = useUpsertDomainMutation({
    onSuccess: () => {
      refetch();
      setNewDomainName({ en: "", hi: "", gu: "" });
      setShowAddDomain(false);
      setEditingDomain(null);
      setTranslationId(null);
    },
  });

  const deleteDomainMutation = useDeleteDomainMutation({
    onSuccess: (data, domainId) => {
      // Refetch domains after deletion
      refetch();
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

  const publishAssessmentMutation = usePublishAssessmentMutation({
    onSuccess: () => {
      refetch();
      refetchAssessments();
    },
  });

  const updateAssessmentMutation = useUpdateAssessmentMutation({
    onSuccess: () => {
      refetchAssessments();
      setEditedEndDates({});
    },
  });

  const handleOpenPublishModal = () => {
    setPublishModalOpen(true);
  };

  const handleClosePublishModal = () => {
    setPublishModalOpen(false);
    setPublishData({
      assessmentId: "",
      startDate: "",
      endDate: "",
      roleId: "",
    });
  };

  const handlePublishAssessment = () => {
    if (!publishData.assessmentId || !publishData.startDate || !publishData.endDate || !publishData.roleId) {
      alert("Please fill all required fields");
      return;
    }

    const payload = {
      assessmentId: Number(publishData.assessmentId),
      roleId: getRoleId(publishData.roleId),
      isPublished: 0,
      startDate: publishData.startDate,
      endDate: publishData.endDate,
    };
    
    publishAssessmentMutation.mutate(payload, {
      onSuccess: () => {
        handleClosePublishModal();
      }
    });
  };

  const handleOpenSettingsModal = () => {
    setSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    setSettingsModalOpen(false);
    setEditedEndDates({});
  };

  const handleUpdateAssessment = (assessment) => {
    const endDate = editedEndDates[assessment.assessmentId] || assessment.endDate;
    
    const payload = {
      assessmentId: assessment.assessmentId,
      roleId: assessment.roleId,
      isPublished: assessment.isPublished ? 1 : 0,
      startDate: assessment.startDate,
      endDate: endDate,
    };

    updateAssessmentMutation.mutate(payload);
  };

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

  if (isLoading) {
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
                setTimeout(() => refetch(), 100);
              }}
              label={t("assessment.domain.selectRole")}
            >
              <MenuItem value="school">School</MenuItem>
              <MenuItem value="inspector">School Verifier</MenuItem>
              <MenuItem value="parent">CRC</MenuItem>
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
          <IconButton
            onClick={handleOpenSettingsModal}
            sx={{
              bgcolor: colors.neutral.gray200,
              "&:hover": { bgcolor: colors.neutral.gray300 },
            }}
          >
            <Settings />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Publish />}
            onClick={handleOpenPublishModal}
            disabled={publishAssessmentMutation.isPending}
            sx={{
              bgcolor: colors.accent.green,
              "&:hover": { bgcolor: colors.accent.greenDark },
            }}
          >
            {t("assessment.publishAssessment")}
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
              {/* <Button
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
              </Button> */}
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
                  setSelectedRole("school");
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
                            refetch();
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

      {/* Publish Assessment Modal */}
      <Dialog
        open={publishModalOpen}
        onClose={handleClosePublishModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            bgcolor: colors.primary.blue + "10",
            color: colors.primary.blue,
          }}
        >
          Publish Assessment
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Assessment</InputLabel>
              <Select
                value={publishData.assessmentId}
                onChange={(e) =>
                  setPublishData({ ...publishData, assessmentId: e.target.value })
                }
                label="Assessment"
                disabled={isLoadingAssessments}
              >
                {isLoadingAssessments ? (
                  <MenuItem disabled>Loading assessments...</MenuItem>
                ) : assessmentsData?.data && assessmentsData.data.length > 0 ? (
                  assessmentsData.data.map((assessment) => (
                    <MenuItem 
                      key={assessment.assessmentId} 
                      value={assessment.assessmentId}
                    >
                      Assessment {assessment.assessmentId} - {assessment.academicYear} (Round {assessment.round})
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No assessments available</MenuItem>
                )}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={publishData.startDate}
              onChange={(e) =>
                setPublishData({ ...publishData, startDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={publishData.endDate}
              onChange={(e) =>
                setPublishData({ ...publishData, endDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                value={publishData.roleId}
                onChange={(e) =>
                  setPublishData({ ...publishData, roleId: e.target.value })
                }
                label="Role"
              >
                <MenuItem value="school">School</MenuItem>
                <MenuItem value="inspector">School Verifier</MenuItem>
                <MenuItem value="parent">CRC</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={handleClosePublishModal}
            disabled={publishAssessmentMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePublishAssessment}
            disabled={publishAssessmentMutation.isPending}
            sx={{
              bgcolor: colors.accent.green,
              "&:hover": { bgcolor: colors.accent.greenDark },
            }}
          >
            {publishAssessmentMutation.isPending ? "Publishing..." : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Modal */}
      <Dialog
        open={settingsModalOpen}
        onClose={handleCloseSettingsModal}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            bgcolor: colors.primary.blue + "10",
            color: colors.primary.blue,
          }}
        >
          Assessment Settings
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.neutral.gray100 }}>
                  <TableCell sx={{ fontWeight: 700 }}>Assessment</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingAssessments ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : assessmentsData?.data && assessmentsData.data.length > 0 ? (
                  assessmentsData.data.map((assessment) => (
                    <TableRow key={assessment.assessmentId}>
                      <TableCell>
                        {assessment.assessmentId && assessment.academicYear && assessment.round
                          ? `Assessment ${assessment.assessmentId} - ${assessment.academicYear} (Round ${assessment.round})`
                          : "-"}
                      </TableCell>
                      <TableCell>{assessment.startDate || "-"}</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="date"
                          value={
                            editedEndDates[assessment.assessmentId] !== undefined
                              ? editedEndDates[assessment.assessmentId]
                              : assessment.endDate || ""
                          }
                          onChange={(e) =>
                            setEditedEndDates({
                              ...editedEndDates,
                              [assessment.assessmentId]: e.target.value,
                            })
                          }
                          InputLabelProps={{ shrink: true }}
                          sx={{ minWidth: 150 }}
                        />
                      </TableCell>
                      <TableCell>
                        {assessment.roleId ? (
                          <Chip
                            label={`Role ${assessment.roleId}`}
                            size="small"
                            sx={{
                              bgcolor: colors.primary.blue + "15",
                              color: colors.primary.blue,
                              fontWeight: 600,
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {assessment.isPublished !== undefined && assessment.isPublished !== null ? (
                          <Chip
                            label={assessment.isPublished ? "Published" : "Unpublished"}
                            size="small"
                            sx={{
                              bgcolor: assessment.isPublished
                                ? colors.accent.green + "15"
                                : colors.semantic.warning + "15",
                              color: assessment.isPublished
                                ? colors.accent.green
                                : colors.semantic.warning,
                              fontWeight: 600,
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleUpdateAssessment(assessment)}
                          disabled={
                            updateAssessmentMutation.isPending ||
                            !editedEndDates[assessment.assessmentId]
                          }
                          sx={{
                            bgcolor: colors.primary.blue,
                            "&:hover": { bgcolor: colors.primary.dark },
                          }}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No assessments available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseSettingsModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssessmentManagement;
