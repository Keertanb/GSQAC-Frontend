import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  ExpandMore,
  Add,
  Publish,
  Settings,
  Unpublished,
  Delete,
  Edit,
  Check,
  Close,
  CameraAlt,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import DomainSubdomainView from "./DomainSubdomainView";
import QuestionsView from "./QuestionsView";
import {
  useGetDomainsQuery,
  useUpsertDomainMutation,
  useTranslateTextMutation,
  usePublishAssessmentMutation,
  useGetAssessmentsQuery,
  useUpdateAssessmentMutation,
  useDeleteDomainMutation,
  useGetAssessmentRoleAssignmentsQuery,
  useUpdateAssessmentRoleAssignmentMutation,
  useDeleteAssessmentMutation,
} from "../../../services/adminService";
import { getRoleId } from "../../../constants/roles";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";
import "./AssessmentManagement.css";

// Format API date (YYYY-MM-DD or ISO) to DD/MM/YYYY for display
const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const datePart = typeof dateStr === "string" ? dateStr.split("T")[0] : "";
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return dateStr || "";
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
};

// Parse DD/MM/YYYY string to YYYY-MM-DD for API
const parseDDMMYYYYToApi = (str) => {
  if (!str || typeof str !== "string") return "";
  const trimmed = str.trim().replace(/\s/g, "");
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
};

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
  const [selectedRole, setSelectedRole] = useState("all"); // all | school | inspector | crc
  const [editingDomain, setEditingDomain] = useState(null);
  const [translationId, setTranslationId] = useState(null);
  const [expandedAssessmentId, setExpandedAssessmentId] = useState(null);
  const [activeAssessmentForDomainForm, setActiveAssessmentForDomainForm] =
    useState(null); // { assessmentId, roleId } | null

  // Add/Edit Assessment Modal
  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [newAssessment, setNewAssessment] = useState({
    schoolType: "1", // Default to Primary (1-8)
    assessmentEn: "",
    assessmentHi: "",
    assessmentGu: "",
  });

  const handleAddAssessment = () => {
    setEditingAssessment(null);
    setNewAssessment({
      schoolType: "1",
      assessmentEn: "",
      assessmentHi: "",
      assessmentGu: "",
    });
    setAddAssessmentModalOpen(true);
  };

  const handleEditAssessment = (assessment) => {
    setEditingAssessment(assessment);
    setNewAssessment({
      schoolType: assessment.schoolType?.toString() || "1",
      assessmentEn: assessment.assessmentEn || "",
      assessmentHi: assessment.assessmentHi || "",
      assessmentGu: assessment.assessmentGu || "",
    });
    setAddAssessmentModalOpen(true);
  };

  const getRoleName = (roleId, format = "display") => {
    const roleMaps = {
      code: {
        2: "school",
        3: "inspector",
        4: "crc",
        5: "verifier",
      },
      display: {
        2: "School",
        3: "School Verifier",
        4: "CRC",
        5: "Verifier",
      },
    };

    const roleMap = roleMaps[format] || roleMaps.display;
    return roleMap[roleId] || (format === "display" ? `Role ${roleId}` : "");
  };

  // Settings Modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [roleAssignments, setRoleAssignments] = useState({
    2: {},
    3: {},
    4: {},
  });

  const [deleteDomainModalOpen, setDeleteDomainModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);

  const [deleteAssessmentModalOpen, setDeleteAssessmentModalOpen] =
    useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  // Assessment Settings modal: date fields display as DD/MM/YYYY
  const [editingDateKey, setEditingDateKey] = useState(null); // e.g. "2-startDate"
  const [editingDateValue, setEditingDateValue] = useState("");

  // Assessment editing state
  const [showEditAssessment, setShowEditAssessment] = useState(false);
  const [tempAssessmentName, setTempAssessmentName] = useState({
    en: "",
    hi: "",
    gu: "",
  });

  // View Only Mode
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);

  // Capture image from React Native WebView camera
  const [capturedImage, setCapturedImage] = useState(null);

  // Listen for messages from React Native WebView (IMAGE_CAPTURED with base64 payload)
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "IMAGE_CAPTURED" && data?.payload) {
          setCapturedImage(data.payload);
        }
      } catch (e) {
        // Ignore non-JSON or unrelated messages
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const openCamera = () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "OPEN_CAMERA" }),
      );
    } else {
      enqueueSnackbar("Not inside React Native WebView", { variant: "info" });
    }
  };

  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  // Fetch all domains and then group them by assessmentId
  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isError: isErrorDomains,
    error: domainsError,
    refetch: refetchDomains,
  } = useGetDomainsQuery({});

  const domainsByAssessmentId = useMemo(() => {
    if (!domainsData?.data) return {};
    return domainsData.data.reduce((acc, domain) => {
      const { assessmentId } = domain;
      if (!acc[assessmentId]) {
        acc[assessmentId] = [];
      }
      acc[assessmentId].push(domain);
      return acc;
    }, {});
  }, [domainsData]);

  // Fetch assessments (no academic year filter)
  const {
    data: assessmentsData,
    isLoading: isLoadingAssessments,
    isError: isErrorAssessments,
    error: assessmentsError,
    refetch: refetchAssessments,
  } = useGetAssessmentsQuery();

  const {
    data: assessmentRoleAssignmentsData,
    isLoading: isLoadingAssessmentRoleAssignments,
    refetch: refetchAssessmentRoleAssignments,
  } = useGetAssessmentRoleAssignmentsQuery();

  const initialRoleAssignments = useMemo(() => {
    if (assessmentRoleAssignmentsData?.data) {
      return assessmentRoleAssignmentsData.data.reduce(
        (acc, assignment) => {
          acc[assignment.roleId] = {
            id: assignment.id,
            assessmentId: assignment.assessmentId,
            startDate: assignment.startDate,
            endDate: assignment.endDate,
            isPublished: assignment.isPublished,
          };
          return acc;
        },
        { 2: {}, 3: {}, 4: {} },
      );
    }
    return { 2: {}, 3: {}, 4: {} };
  }, [assessmentRoleAssignmentsData]);

  useEffect(() => {
    setRoleAssignments(initialRoleAssignments);
  }, [initialRoleAssignments]);

  const upsertDomainMutation = useUpsertDomainMutation({
    onSuccess: (data, variables) => {
      // Show success message - check if it's an edit by checking if domainId exists in payload
      const isEdit = variables?.domainId !== undefined;
      enqueueSnackbar(
        isEdit
          ? data?.message || "Domain updated successfully"
          : data?.message || "Domain added successfully",
        { variant: "success" },
      );
      // Refetch domains
      refetchDomains();
      setNewDomainName({ en: "", hi: "", gu: "" });
      setShowAddDomain(false);
      setEditingDomain(null);
      setTranslationId(null);
      setActiveAssessmentForDomainForm(null);
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
    onSuccess: (data, variables) => {
      // Check if it was a publish or unpublish based on isPublished value
      const isPublish = variables?.isPublished === 1;
      enqueueSnackbar(
        isPublish
          ? data?.message || "Assessment published successfully"
          : data?.message || "Assessment unpublished successfully",
        { variant: "success" },
      );
      refetchAssessmentRoleAssignments();
    },
  });

  const updateAssessmentMutation = useUpdateAssessmentMutation({
    onSuccess: (data, variables) => {
      // Only show generic message here if not called from add/edit modal
      // The add/edit modal will show its own specific message
      refetchAssessments();
    },
  });

  const deleteDomainMutation = useDeleteDomainMutation({
    onSuccess: () => {
      refetchDomains();
    },
  });

  const deleteAssessmentMutation = useDeleteAssessmentMutation({
    onSuccess: () => {
      refetchAssessments();
    },
  });

  const handleOpenSettingsModal = () => {
    setSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    setSettingsModalOpen(false);
    // Reset roleAssignments to initial values
    setRoleAssignments(initialRoleAssignments);
    refetchAssessmentRoleAssignments(); // Refetch to discard any unsaved changes
  };

  const handleRoleAssignmentChange = (roleId, field, value) => {
    setRoleAssignments((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [field]: value,
      },
    }));
  };

  const updateAssessmentRoleAssignmentMutation =
    useUpdateAssessmentRoleAssignmentMutation({
      onSuccess: (data) => {
        enqueueSnackbar(
          data?.message || "Role assignment updated successfully",
          {
            variant: "success",
          },
        );
        refetchAssessmentRoleAssignments();
      },
    });

  const handleUpdateRoleAssignment = (roleId) => {
    const assignment = roleAssignments[roleId];
    if (!assignment || !assignment.assessmentId) {
      enqueueSnackbar("Please select an assessment for this role.", {
        variant: "warning",
      });
      return;
    }

    const payload = {
      id: assignment.id || null,
      roleId: roleId,
      assessmentId: assignment.assessmentId,
      startDate: assignment.startDate,
      endDate: assignment.endDate,
    };

    updateAssessmentRoleAssignmentMutation.mutate(payload);
  };

  const handleEditDomain = (domain, assessment, event) => {
    event.stopPropagation();
    setEditingDomain(domain);
    setNewDomainName({
      gu: domain.domainNameGu || "",
      en: domain.domainNameEn || "",
      hi: domain.domainNameHi || "",
    });
    setShowAddDomain(true);
    setActiveAssessmentForDomainForm({
      assessmentId: assessment.assessmentId,
    });
  };

  const handlePublishRoleAssignment = (roleId) => {
    const assignment = roleAssignments[roleId];
    if (!assignment || !assignment.assessmentId) {
      enqueueSnackbar(
        "Please select an assessment for this role before publishing.",
        { variant: "warning" },
      );
      return;
    }

    // Toggle publish/unpublish: if currently published (1), unpublish (0), otherwise publish (1)
    const currentIsPublished = assignment.isPublished === 1;
    const newIsPublished = currentIsPublished ? 0 : 1;

    const payload = {
      roleId: roleId,
      assessmentId: assignment.assessmentId,
      isPublished: newIsPublished,
    };
    publishAssessmentMutation.mutate(payload);
  };

  const handleDeleteDomain = (domain, event) => {
    event.stopPropagation();
    setDomainToDelete(domain);
    setDeleteDomainModalOpen(true);
  };

  const confirmDeleteDomain = () => {
    if (domainToDelete) {
      deleteDomainMutation.mutate(domainToDelete.domainId, {
        onSuccess: () => {
          setDeleteDomainModalOpen(false);
          setDomainToDelete(null);
        },
      });
    }
  };

  const handleDeleteAssessment = (assessment, event) => {
    if (event) event.stopPropagation();
    setAssessmentToDelete(assessment);
    setDeleteAssessmentModalOpen(true);
  };

  const confirmDeleteAssessment = () => {
    if (assessmentToDelete) {
      deleteAssessmentMutation.mutate(assessmentToDelete.assessmentId, {
        onSuccess: () => {
          setDeleteAssessmentModalOpen(false);
          setAssessmentToDelete(null);
        },
      });
    }
  };

  const handleAddDomain = (assessment) => {
    // Count how many languages are filled
    const filledLanguages = [
      newDomainName.en.trim(),
      newDomainName.hi.trim(),
      newDomainName.gu.trim(),
    ].filter((name) => name.length > 0);

    // Check if at least 2 languages are provided
    if (filledLanguages.length < 2) {
      enqueueSnackbar(
        "Please add domain name in at least 2 languages (Gujarati, English, or Hindi).",
        {
          variant: "warning",
        },
      );
      return;
    }

    const payload = {
      domainNameEn: newDomainName.en.trim(),
      domainNameHi: newDomainName.hi.trim(),
      domainNameGu: newDomainName.gu.trim(),
    };

    // Include assessmentId from accordion context
    if (assessment.assessmentId) payload.assessmentId = assessment.assessmentId;

    // If editing, include domainId
    if (editingDomain) {
      payload.domainId = editingDomain.domainId;
    }

    upsertDomainMutation.mutate(payload);
  };

  const handleLanguageChange = (lang) => {
    setCurrentLanguage(lang);
    i18n.changeLanguage(lang);
    // Refetch data when language changes
    refetchDomains();
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

  // const getRoleName = (roleId) => {
  //   const roleMap = {
  //     2: "School",
  //     3: "School Verifier",
  //     4: "CRC",
  //     5: "Verifier",
  //   };
  //   return roleMap[roleId] || `Role ${roleId}`;
  // };

  const getAssessmentName = (assessment) => {
    const name =
      languageCode === "EN"
        ? assessment.assessmentEn
        : languageCode === "HI"
          ? assessment.assessmentHi
          : assessment.assessmentGu;
    return name || `Assessment ${assessment.assessmentId}`;
  };

  const startEditingAssessment = (assessment, e) => {
    if (e) e.stopPropagation();
    setEditingAssessment(assessment);
    setTempAssessmentName({
      en: assessment.assessmentEn || "",
      hi: assessment.assessmentHi || "",
      gu: assessment.assessmentGu || "",
    });
    setShowEditAssessment(true);
  };

  const saveAssessmentName = async () => {
    if (!editingAssessment) return;

    try {
      const payload = {
        assessmentId: editingAssessment.assessmentId,
        isActive: editingAssessment.isActive,
        schoolType: editingAssessment.schoolType,
        assessmentEn: tempAssessmentName.en,
        assessmentHi: tempAssessmentName.hi,
        assessmentGu: tempAssessmentName.gu,
      };

      await updateAssessmentMutation.mutateAsync(payload);
      setShowEditAssessment(false);
      setEditingAssessment(null);
      refetchAssessments();
      enqueueSnackbar("Assessment updated successfully", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error updating assessment:", error);
      enqueueSnackbar("Failed to update assessment", { variant: "error" });
    }
  };

  const cancelEditAssessment = () => {
    setShowEditAssessment(false);
    setEditingAssessment(null);
    setTempAssessmentName({ en: "", hi: "", gu: "" });
  };

  const handleToggleActive = async (assessment, event) => {
    event.stopPropagation();
    const newIsActive = assessment.isActive ? 0 : 1;

    try {
      const payload = {
        assessmentId: assessment.assessmentId,
        assessmentEn: assessment.assessmentEn || "",
        assessmentHi: assessment.assessmentHi || "",
        assessmentGu: assessment.assessmentGu || "",
        schoolType: assessment.schoolType,
        isActive: newIsActive,
      };

      await updateAssessmentMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error toggling assessment status:", error);
    }
  };

  if (isLoadingDomains || isLoadingAssessments) {
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

  if (isErrorDomains || isErrorAssessments) {
    return (
      <Box>
        <Alert severity="error">
          {domainsError?.message ||
            assessmentsError?.message ||
            t("common.error") ||
            "Failed to load data"}
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
          setIsViewOnlyMode(false);
        }}
        currentLanguage={currentLanguage}
        isViewOnly={isViewOnlyMode}
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
          {/* <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("assessment.domain.selectRole")}</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
              }}
              label={t("assessment.domain.selectRole")}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="school">School</MenuItem>
              <MenuItem value="inspector">School Verifier</MenuItem>
              <MenuItem value="crc">CRC</MenuItem>
            </Select>
          </FormControl> */}
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setAddAssessmentModalOpen(true);
            }}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            Add Assessment
          </Button>
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={openCamera}
            sx={{
              borderColor: colors.primary.blue,
              color: colors.primary.blue,
              "&:hover": {
                borderColor: colors.primary.dark,
                bgcolor: colors.primary.blue + "10",
              },
            }}
          >
            Capture
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
        </Box>
      </Box>

      {/* Captured image preview (when opened in React Native WebView) */}
      {capturedImage && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            border: `1px solid ${colors.neutral.gray200}`,
            bgcolor: colors.background.secondary,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Captured Image
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box
              component="img"
              src={capturedImage}
              alt="Captured"
              sx={{
                maxWidth: 280,
                maxHeight: 280,
                objectFit: "contain",
                borderRadius: 2,
                border: `1px solid ${colors.neutral.gray300}`,
              }}
            />
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => setCapturedImage(null)}
            >
              Remove
            </Button>
          </Box>
        </Box>
      )}

      {/* Assessments as Accordions */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {isLoadingAssessments ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : assessmentsData?.data && assessmentsData.data.length > 0 ? (
          assessmentsData.data.map((assessment) => {
            const assessmentDomains =
              domainsByAssessmentId[assessment.assessmentId] || [];
            return (
              <Accordion
                key={assessment.assessmentId}
                expanded={expandedAssessmentId === assessment.assessmentId}
                onChange={() => {
                  setExpandedAssessmentId((prev) =>
                    prev === assessment.assessmentId
                      ? null
                      : assessment.assessmentId,
                  );
                  setExpandedDomain(null);
                }}
                sx={{ borderRadius: 2, overflow: "hidden" }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      flexWrap: "wrap",
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {getAssessmentName(assessment)}
                      </Typography>
                      {assessment.schoolType && (
                        <Chip
                          size="small"
                          label={
                            assessment.schoolType === 1 ||
                            assessment.schoolType === "1"
                              ? "Primary"
                              : "Secondary"
                          }
                          sx={{
                            bgcolor: colors.accent.purple + "15",
                            color: colors.accent.purple,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {assessment.roleId && (
                        <Chip
                          size="small"
                          label={getRoleName(assessment.roleId)}
                          sx={{
                            bgcolor: colors.primary.blue + "15",
                            color: colors.primary.blue,
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mr: 1 }}
                      >
                        {assessmentDomains.length} domain(s)
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={assessment.isActive === 1}
                            onChange={(e) => handleToggleActive(assessment, e)}
                            size="small"
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: colors.accent.green,
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                {
                                  backgroundColor: colors.accent.green,
                                },
                            }}
                          />
                        }
                        label={assessment.isActive ? "Active" : "Inactive"}
                        labelPlacement="end"
                        sx={{ m: 0 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingAssessment(assessment, e);
                        }}
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: colors.primary.blue + "15",
                            color: colors.primary.blue,
                          },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDeleteAssessment(assessment, e)}
                        sx={{
                          bgcolor: colors.semantic.error + "15",
                          "&:hover": {
                            bgcolor: colors.semantic.error + "25",
                          },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: "#f9fafb" }}>
                  <Box sx={{ mb: 2.5 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => {
                        setEditingDomain(null);
                        setNewDomainName({ en: "", hi: "", gu: "" });
                        setTranslationId(null);
                        setShowAddDomain(true);
                        setActiveAssessmentForDomainForm({
                          assessmentId: assessment.assessmentId,
                        });
                      }}
                    >
                      Add Domain
                    </Button>
                  </Box>

                  {/* Add Domain Form (inside accordion) */}
                  {showAddDomain &&
                    activeAssessmentForDomainForm?.assessmentId ===
                      assessment.assessmentId && (
                      <Fade in={showAddDomain}>
                        <Card
                          elevation={1}
                          sx={{ p: 2.5, borderRadius: 2, mb: 2.5 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 2,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700 }}>
                              {editingDomain ? "Edit Domain" : "Add Domain"}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 2,
                              mb: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <TextField
                              label="Domain Name (Gujarati)"
                              value={newDomainName.gu}
                              onChange={(e) =>
                                setNewDomainName({
                                  ...newDomainName,
                                  gu: e.target.value,
                                })
                              }
                              variant="outlined"
                              size="small"
                            />
                            <TextField
                              label="Domain Name (English)"
                              value={newDomainName.en}
                              onChange={(e) =>
                                setNewDomainName({
                                  ...newDomainName,
                                  en: e.target.value,
                                })
                              }
                              variant="outlined"
                              size="small"
                            />
                            <TextField
                              label="Domain Name (Hindi)"
                              value={newDomainName.hi}
                              onChange={(e) =>
                                setNewDomainName({
                                  ...newDomainName,
                                  hi: e.target.value,
                                })
                              }
                              variant="outlined"
                              size="small"
                            />
                          </Box>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Button
                              variant="contained"
                              onClick={() => handleAddDomain(assessment)}
                              disabled={upsertDomainMutation.isPending}
                              sx={{
                                bgcolor: colors.primary.blue,
                                "&:hover": { bgcolor: colors.primary.dark },
                              }}
                            >
                              Save Domain
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setShowAddDomain(false);
                                setNewDomainName({ en: "", hi: "", gu: "" });
                                setEditingDomain(null);
                                setTranslationId(null);
                                setActiveAssessmentForDomainForm(null);
                              }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Card>
                      </Fade>
                    )}

                  {/* Domains list for this assessment */}
                  {isLoadingDomains ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress size={28} />
                    </Box>
                  ) : isErrorDomains ? (
                    <Alert severity="error">
                      {domainsError?.message || "Failed to load domains"}
                    </Alert>
                  ) : assessmentDomains.length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                      }}
                    >
                      {assessmentDomains.map((domain) => (
                        <Card key={domain.domainId} sx={{ borderRadius: 2 }}>
                          <Box
                            onClick={() =>
                              setExpandedDomain((prev) =>
                                prev === domain.domainId
                                  ? null
                                  : domain.domainId,
                              )
                            }
                            sx={{
                              p: 2,
                              cursor: "pointer",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                            }}
                          >
                            <Typography sx={{ fontWeight: 700 }}>
                              {getDomainName(domain)}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <IconButton
                                size="small"
                                onClick={(e) =>
                                  handleEditDomain(domain, assessment, e)
                                }
                                sx={{ mr: 0.5 }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleDeleteDomain(domain, e)}
                                sx={{
                                  bgcolor: colors.semantic.error + "15",
                                  "&:hover": {
                                    bgcolor: colors.semantic.error + "25",
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                              <IconButton size="small">
                                <ExpandMore
                                  sx={{
                                    transform:
                                      expandedDomain === domain.domainId
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                  }}
                                />
                              </IconButton>
                            </Box>
                          </Box>
                          {expandedDomain === domain.domainId && (
                            <Box sx={{ px: 2, pb: 2 }}>
                              <DomainSubdomainView
                                domain={domain}
                                languageCode={languageCode}
                                roleId={domain.roleId}
                                onNavigateToCriteria={(
                                  subdomain,
                                  viewOnly = false,
                                ) => {
                                  setSelectedSubdomain({
                                    ...subdomain,
                                    subDomainId:
                                      subdomain.subDomainId || subdomain.id,
                                    roleId: domain.roleId,
                                  });
                                  setIsViewOnlyMode(viewOnly);
                                  setCurrentView("questions");
                                  setExpandedDomain(null);
                                }}
                                onSubdomainAdded={() => {
                                  refetchDomains();
                                }}
                              />
                            </Box>
                          )}
                        </Card>
                      ))}
                    </Box>
                  ) : (
                    <Card sx={{ p: 3, borderRadius: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No domains available for this assessment.
                      </Typography>
                    </Card>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })
        ) : (
          <Card
            elevation={2}
            sx={{ p: 4, textAlign: "center", borderRadius: 3 }}
          >
            <Typography variant="body1" color="text.secondary">
              No assessments available
            </Typography>
          </Card>
        )}
      </Box>

      {/* Edit Assessment Name Modal */}
      <Dialog
        open={showEditAssessment}
        onClose={cancelEditAssessment}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Assessment Name</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Assessment Name (Gujarati)"
              value={tempAssessmentName.gu}
              onChange={(e) =>
                setTempAssessmentName((prev) => ({
                  ...prev,
                  gu: e.target.value,
                }))
              }
              variant="outlined"
              size="small"
              fullWidth
            />
            <TextField
              label="Assessment Name (English)"
              value={tempAssessmentName.en}
              onChange={(e) =>
                setTempAssessmentName((prev) => ({
                  ...prev,
                  en: e.target.value,
                }))
              }
              variant="outlined"
              size="small"
              fullWidth
            />
            <TextField
              label="Assessment Name (Hindi)"
              value={tempAssessmentName.hi}
              onChange={(e) =>
                setTempAssessmentName((prev) => ({
                  ...prev,
                  hi: e.target.value,
                }))
              }
              variant="outlined"
              size="small"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelEditAssessment}>Cancel</Button>
          <Button
            variant="contained"
            onClick={saveAssessmentName}
            disabled={updateAssessmentMutation.isPending}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            {updateAssessmentMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Assessment Modal */}
      <Dialog
        open={addAssessmentModalOpen}
        onClose={() => {
          setAddAssessmentModalOpen(false);
          // Reset form data when modal closes
          setNewAssessment({
            schoolType: "1",
            assessmentEn: "",
            assessmentHi: "",
            assessmentGu: "",
          });
          setEditingAssessment(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingAssessment ? "Edit Assessment" : "Add Assessment"}
        </DialogTitle>
        <DialogContent sx={{ mt: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              marginTop: 2,
            }}
          >
            <FormControl fullWidth size="small">
              <InputLabel>School Type</InputLabel>
              <Select
                value={newAssessment.schoolType}
                label="School Type"
                onChange={(e) =>
                  setNewAssessment((prev) => ({
                    ...prev,
                    schoolType: e.target.value,
                  }))
                }
              >
                <MenuItem value="1">Primary (Class 1 to 8)</MenuItem>
                <MenuItem value="2">Secondary (Class 9 to 12)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Assessment Name (Gujarati)"
              value={newAssessment.assessmentGu}
              onChange={(e) =>
                setNewAssessment((prev) => ({
                  ...prev,
                  assessmentGu: e.target.value,
                }))
              }
              required
              InputLabelProps={{
                required: true,
              }}
            />
            <TextField
              size="small"
              label="Assessment Name (English)"
              value={newAssessment.assessmentEn}
              onChange={(e) =>
                setNewAssessment((prev) => ({
                  ...prev,
                  assessmentEn: e.target.value,
                }))
              }
              required
              InputLabelProps={{
                required: true,
              }}
            />
            <TextField
              size="small"
              label="Assessment Name (Hindi)"
              value={newAssessment.assessmentHi}
              onChange={(e) =>
                setNewAssessment((prev) => ({
                  ...prev,
                  assessmentHi: e.target.value,
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setAddAssessmentModalOpen(false);
              // Reset form data when modal closes
              setNewAssessment({
                schoolType: "1",
                assessmentEn: "",
                assessmentHi: "",
                assessmentGu: "",
              });
              setEditingAssessment(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={
              updateAssessmentMutation.isPending ||
              !newAssessment.assessmentEn?.trim() ||
              !newAssessment.assessmentGu?.trim()
            }
            onClick={() => {
              const nameEn = newAssessment.assessmentEn?.trim();
              const nameGu = newAssessment.assessmentGu?.trim();
              if (!nameEn || !nameGu) {
                enqueueSnackbar("Add proper assessment name", {
                  variant: "warning",
                });
                return;
              }
              const payload = {
                ...(editingAssessment && {
                  assessmentId: editingAssessment.assessmentId,
                }),
                schoolType: parseInt(newAssessment.schoolType),
                assessmentEn: nameEn,
                assessmentHi: newAssessment.assessmentHi?.trim() || "",
                assessmentGu: nameGu,
              };
              updateAssessmentMutation.mutate(payload, {
                onSuccess: (data) => {
                  // Show success message - check if it's an edit by checking if assessmentId exists
                  const isEdit = !!editingAssessment;
                  enqueueSnackbar(
                    isEdit
                      ? data?.message || "Assessment updated successfully"
                      : data?.message || "Assessment added successfully",
                    { variant: "success" },
                  );
                  setAddAssessmentModalOpen(false);
                  setNewAssessment({
                    schoolType: "1",
                    assessmentEn: "",
                    assessmentHi: "",
                    assessmentGu: "",
                  });
                  setEditingAssessment(null);
                  refetchAssessments();
                },
              });
            }}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            {updateAssessmentMutation.isPending
              ? editingAssessment
                ? "Updating..."
                : "Creating..."
              : editingAssessment
                ? "Update"
                : "Create"}
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
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assessment</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>End Date</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Status
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoadingAssessmentRoleAssignments || isLoadingAssessments ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : (
                  [
                    { roleId: 2, name: "School" },
                    { roleId: 3, name: "School Verifier" },
                    { roleId: 4, name: "CRC" },
                  ].map((role) => (
                    <TableRow key={role.roleId}>
                      <TableCell>{role.name}</TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={
                              roleAssignments[role.roleId]?.assessmentId || ""
                            }
                            onChange={(e) =>
                              handleRoleAssignmentChange(
                                role.roleId,
                                "assessmentId",
                                e.target.value,
                              )
                            }
                            disabled={roleAssignments[role.roleId]?.isPublished}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {assessmentsData?.data?.map((assessment) => (
                              <MenuItem
                                key={assessment.assessmentId}
                                value={assessment.assessmentId}
                              >
                                {getAssessmentName(assessment)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={
                            editingDateKey === `${role.roleId}-startDate`
                              ? editingDateValue
                              : formatDateToDDMMYYYY(
                                  roleAssignments[role.roleId]?.startDate,
                                )
                          }
                          onFocus={() => {
                            setEditingDateKey(`${role.roleId}-startDate`);
                            setEditingDateValue(
                              formatDateToDDMMYYYY(
                                roleAssignments[role.roleId]?.startDate,
                              ),
                            );
                          }}
                          onChange={(e) =>
                            setEditingDateValue(e.target.value)
                          }
                          onBlur={() => {
                            const parsed = parseDDMMYYYYToApi(editingDateValue);
                            if (editingDateKey === `${role.roleId}-startDate`) {
                              handleRoleAssignmentChange(
                                role.roleId,
                                "startDate",
                                parsed || "",
                              );
                              setEditingDateKey(null);
                            }
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={
                            editingDateKey === `${role.roleId}-endDate`
                              ? editingDateValue
                              : formatDateToDDMMYYYY(
                                  roleAssignments[role.roleId]?.endDate,
                                )
                          }
                          onFocus={() => {
                            setEditingDateKey(`${role.roleId}-endDate`);
                            setEditingDateValue(
                              formatDateToDDMMYYYY(
                                roleAssignments[role.roleId]?.endDate,
                              ),
                            );
                          }}
                          onChange={(e) =>
                            setEditingDateValue(e.target.value)
                          }
                          onBlur={() => {
                            const parsed = parseDDMMYYYYToApi(editingDateValue);
                            if (editingDateKey === `${role.roleId}-endDate`) {
                              handleRoleAssignmentChange(
                                role.roleId,
                                "endDate",
                                parsed || "",
                              );
                              setEditingDateKey(null);
                            }
                          }}
                          InputLabelProps={{ shrink: true }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            roleAssignments[role.roleId]?.isPublished
                              ? "Published"
                              : "Not Published"
                          }
                          size="small"
                          sx={{
                            bgcolor: roleAssignments[role.roleId]?.isPublished
                              ? colors.accent.green + "15"
                              : colors.semantic.warning + "15",
                            color: roleAssignments[role.roleId]?.isPublished
                              ? colors.accent.green
                              : colors.semantic.warning,
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                          }}
                        >
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() =>
                              handleUpdateRoleAssignment(role.roleId)
                            }
                            sx={{
                              bgcolor: colors.primary.blue,
                              "&:hover": { bgcolor: colors.primary.dark },
                            }}
                          >
                            Update
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                              handlePublishRoleAssignment(role.roleId)
                            }
                            disabled={
                              !roleAssignments[role.roleId]?.assessmentId ||
                              publishAssessmentMutation.isPending
                            }
                          >
                            {roleAssignments[role.roleId]?.isPublished === 1
                              ? "Unpublish"
                              : "Publish"}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseSettingsModal}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        open={deleteDomainModalOpen}
        onClose={() => setDeleteDomainModalOpen(false)}
        onConfirm={confirmDeleteDomain}
        title="Delete Domain"
        message={`Are you sure you want to delete the domain "${domainToDelete ? getDomainName(domainToDelete) : ""}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteDomainMutation.isPending}
      />

      <ConfirmationModal
        open={deleteAssessmentModalOpen}
        onClose={() => setDeleteAssessmentModalOpen(false)}
        onConfirm={confirmDeleteAssessment}
        title="Delete Assessment"
        message={`Are you sure you want to delete the assessment "${assessmentToDelete ? getAssessmentName(assessmentToDelete) : ""}"? This action cannot be undone and will delete all associated domains and questions.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteAssessmentMutation.isPending}
      />
    </Box>
  );
};

export default AssessmentManagement;
