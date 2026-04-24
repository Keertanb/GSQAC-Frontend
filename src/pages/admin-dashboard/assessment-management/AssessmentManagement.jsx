import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import {
  Box,
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
  ContentCopy,
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
  useCloneAssessmentMutation,
  useDeleteDomainMutation,
  useGetAssessmentRoleAssignmentsQuery,
  useUpdateAssessmentRoleAssignmentMutation,
  useDeleteAssessmentRoleAssignmentMutation,
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

// Parse API date (YYYY-MM-DD or ISO) to YYYY-MM-DD for date input
const toDateInputValue = (dateStr) => {
  if (!dateStr) return "";
  const s = typeof dateStr === "string" ? dateStr.trim() : String(dateStr);
  const datePart = s.split("T")[0];
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  const parsed = parseDDMMYYYYToApi(s.replace(/[-/]/g, "/"));
  return parsed || "";
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

  // Add/Edit Assessment Modal (and Duplicate mode)
  const [addAssessmentModalOpen, setAddAssessmentModalOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [duplicateSourceAssessment, setDuplicateSourceAssessment] =
    useState(null);
  const [newAssessment, setNewAssessment] = useState({
    schoolType: "1", // Default to Primary (1-8)
    assessmentEn: "",
    assessmentHi: "",
    assessmentGu: "",
  });

  const handleAddAssessment = () => {
    setEditingAssessment(null);
    setDuplicateSourceAssessment(null);
    setNewAssessment({
      schoolType: "1",
      assessmentEn: "",
      assessmentHi: "",
      assessmentGu: "",
    });
    setAddAssessmentModalOpen(true);
  };

  const handleDuplicateAssessment = (assessment) => {
    setEditingAssessment(null);
    setDuplicateSourceAssessment(assessment);
    setNewAssessment({
      schoolType: assessment.schoolType?.toString() || "1",
      assessmentEn: assessment.assessmentEn || "",
      assessmentHi: assessment.assessmentHi || "",
      assessmentGu: assessment.assessmentGu || "",
    });
    setAddAssessmentModalOpen(true);
  };

  const handleEditAssessment = (assessment) => {
    setDuplicateSourceAssessment(null);
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
        2: t("assessment.management.roles.school"),
        3: t("assessment.management.roles.schoolVerifier"),
        4: t("assessment.management.roles.crc"),
        5: t("assessment.management.roles.verifier"),
      },
    };

    const roleMap = roleMaps[format] || roleMaps.display;
    return roleMap[roleId] || (format === "display" ? `Role ${roleId}` : "");
  };

  // Settings Modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [roleAssignments, setRoleAssignments] = useState({
    2: [],
    3: [],
    4: [],
  });
  const [expandedSettingsRole, setExpandedSettingsRole] = useState(2);

  const [deleteDomainModalOpen, setDeleteDomainModalOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);

  const [deleteAssessmentModalOpen, setDeleteAssessmentModalOpen] =
    useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);

  // Assessment editing state
  const [showEditAssessment, setShowEditAssessment] = useState(false);
  const [tempAssessmentName, setTempAssessmentName] = useState({
    en: "",
    hi: "",
    gu: "",
  });

  // View Only Mode
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(false);

  // Capture image from React Native WebView camera (or web: file/camera + location)
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedImageMeta, setCapturedImageMeta] = useState(null); // { latitude, longitude, address }
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState(null); // 'camera' | 'file'
  const [captureLoading, setCaptureLoading] = useState(false);
  const captureVideoRef = React.useRef(null);
  const captureCanvasRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

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
      // Web: open capture modal (camera or file) and attach location + address
      setCaptureModalOpen(true);
      setCaptureMode(null);
    }
  };

  // Get address from lat/long using OpenStreetMap Nominatim (reverse geocoding)
  const getAddressFromCoords = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "User-Agent": "GSQAC-Assessment-Web" } },
      );
      const data = await res.json();
      return data?.display_name || `${lat}, ${lon}`;
    } catch {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  };

  const handleWebCaptureImage = async (imageDataUrl) => {
    setCaptureLoading(true);
    try {
      let latitude = null;
      let longitude = null;
      let address = "";

      if (navigator.geolocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        address = await getAddressFromCoords(latitude, longitude);
      } else {
        address = "Location not available";
      }

      setCapturedImage(imageDataUrl);
      setCapturedImageMeta({ latitude, longitude, address });
      setCaptureModalOpen(false);
      setCaptureMode(null);
      if (captureVideoRef.current?.srcObject) {
        captureVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      enqueueSnackbar("Image captured with location", { variant: "success" });
    } catch (err) {
      console.error(err);
      enqueueSnackbar(
        err?.message || "Could not get location or capture image",
        { variant: "error" },
      );
    } finally {
      setCaptureLoading(false);
    }
  };

  const startWebCamera = async () => {
    setCaptureMode("camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (captureVideoRef.current) {
        captureVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      enqueueSnackbar("Camera access denied or not available", {
        variant: "error",
      });
      setCaptureMode("file");
    }
  };

  const captureFromVideo = () => {
    const video = captureVideoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || !video.srcObject) return;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    handleWebCaptureImage(dataUrl);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => handleWebCaptureImage(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const closeCaptureModal = () => {
    setCaptureModalOpen(false);
    setCaptureMode(null);
    if (captureVideoRef.current?.srcObject) {
      captureVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
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
    const emptyAssignments = { 2: [], 3: [], 4: [] };

    if (!assessmentRoleAssignmentsData?.data) {
      return emptyAssignments;
    }

    return assessmentRoleAssignmentsData.data.reduce((acc, roleEntry) => {
      const roleId = Number(roleEntry?.roleId);
      if (![2, 3, 4].includes(roleId)) return acc;

      const assessments = Array.isArray(roleEntry?.assessments)
        ? roleEntry.assessments
        : [];

      // Ignore backend placeholder/blank rows (no assessmentId).
      acc[roleId] = assessments
        .filter(
          (assignment) =>
            assignment &&
            assignment.assessmentId !== null &&
            assignment.assessmentId !== undefined &&
            assignment.assessmentId !== ""
        )
        .map((assignment, index) => ({
          id: assignment?.id ?? null,
          assessmentId: assignment?.assessmentId ?? "",
          startDate: assignment?.startDate ?? "",
          endDate: assignment?.endDate ?? "",
          isPublished: assignment?.isPublished ?? 0,
          isNew: false,
          localKey: `${roleId}-${assignment?.assessmentId ?? "na"}-${index}`,
        }));

      return acc;
    }, emptyAssignments);
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
      refetchAssessmentRoleAssignments();
    },
  });

  const cloneAssessmentMutation = useCloneAssessmentMutation({
    onSuccess: () => {
      refetchAssessments();
      refetchDomains();
      refetchAssessmentRoleAssignments();
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
    setExpandedSettingsRole(2);
    refetchAssessmentRoleAssignments(); // Refetch to discard any unsaved changes
  };

  const handleRoleAssignmentChange = (roleId, index, field, value) => {
    setRoleAssignments((prev) => ({
      ...prev,
      [roleId]: (prev[roleId] || []).map((assignment, rowIndex) =>
        rowIndex === index ? { ...assignment, [field]: value } : assignment,
      ),
    }));
  };

  const handleAddRoleAssignmentRow = (roleId) => {
    setRoleAssignments((prev) => ({
      ...prev,
      [roleId]: [
        ...(prev[roleId] || []),
        {
          id: null,
          assessmentId: "",
          startDate: "",
          endDate: "",
          isPublished: 0,
          isNew: true,
          localKey: `new-${roleId}-${Date.now()}`,
        },
      ],
    }));
  };

  const handleRemoveRoleAssignmentRow = (roleId, index) => {
    setRoleAssignments((prev) => ({
      ...prev,
      [roleId]: (prev[roleId] || []).filter(
        (_, rowIndex) => rowIndex !== index,
      ),
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

  const deleteAssessmentRoleAssignmentMutation =
    useDeleteAssessmentRoleAssignmentMutation({
      onSuccess: () => {
        refetchAssessmentRoleAssignments();
      },
    });

  const handleUpdateRoleAssignment = (roleId, index) => {
    const assignment = roleAssignments[roleId]?.[index];
    if (!assignment || !assignment.assessmentId) {
      enqueueSnackbar("Please select an assessment for this role.", {
        variant: "warning",
      });
      return;
    }

    const payload = {
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

  const handlePublishRoleAssignment = (roleId, index) => {
    const assignment = roleAssignments[roleId]?.[index];
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

  const handleDeleteRoleAssignment = (roleId, index) => {
    const assignment = roleAssignments[roleId]?.[index];
    if (!assignment?.assessmentId) return;

    if (assignment.isPublished === 1) {
      enqueueSnackbar(
        "Unpublish this assessment-role assignment before deleting it.",
        {
          variant: "warning",
        },
      );
      return;
    }

    deleteAssessmentRoleAssignmentMutation.mutate({
      assessmentId: assignment.assessmentId,
      roleId,
    });
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

  const getAssessmentRoleIds = (assessment) => {
    if (!assessment) return [];

    if (Array.isArray(assessment.roles)) {
      return assessment.roles
        .map((role) =>
          typeof role === "object" ? Number(role?.roleId) : Number(role),
        )
        .filter((roleId) => [2, 3, 4].includes(roleId));
    }

    if (assessment.roleId) {
      const singleRoleId = Number(assessment.roleId);
      return [2, 3, 4].includes(singleRoleId) ? [singleRoleId] : [];
    }

    return [];
  };

  const todayDate = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

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
      // Error toaster is shown by useUpdateAssessmentMutation onError (single message)
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
            {t("assessment.management.addAssessment")}
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
            {t("assessment.management.capture")}
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

      {/* Captured image preview (when opened in React Native WebView or web capture) */}
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
            {t("assessment.management.capturedImage")}
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
            {capturedImageMeta && (
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  <strong>{t("assessment.management.latitude")}:</strong>{" "}
                  {capturedImageMeta.latitude != null
                    ? capturedImageMeta.latitude.toFixed(6)
                    : "—"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  <strong>{t("assessment.management.longitude")}:</strong>{" "}
                  {capturedImageMeta.longitude != null
                    ? capturedImageMeta.longitude.toFixed(6)
                    : "—"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  <strong>{t("assessment.management.address")}:</strong>{" "}
                  {capturedImageMeta.address || "—"}
                </Typography>
              </Box>
            )}
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                setCapturedImage(null);
                setCapturedImageMeta(null);
              }}
            >
              {t("assessment.management.remove")}
            </Button>
          </Box>
        </Box>
      )}

      {/* Web capture modal: camera or file + location */}
      <Dialog
        open={captureModalOpen}
        onClose={closeCaptureModal}
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
            onChange={handleFileSelect}
            style={{ display: "none" }}
            aria-hidden
          />
          {captureMode === null && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {t("assessment.management.captureImageHelp")}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CameraAlt />}
                onClick={startWebCamera}
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
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                fullWidth
              >
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
                onClick={captureFromVideo}
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
          <Button onClick={closeCaptureModal}>{t("common.cancel")}</Button>
        </DialogActions>
      </Dialog>

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
                              ? t("assessment.management.schoolTypes.primaryShort")
                              : t("assessment.management.schoolTypes.secondaryShort")
                          }
                          sx={{
                            bgcolor: colors.accent.purple + "15",
                            color: colors.accent.purple,
                            fontWeight: 600,
                          }}
                        />
                      )}
                      {getAssessmentRoleIds(assessment).map((roleId) => (
                        <Chip
                          key={`${assessment.assessmentId}-${roleId}`}
                          size="small"
                          label={getRoleName(roleId)}
                          sx={{
                            bgcolor: colors.primary.blue + "15",
                            color: colors.primary.blue,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mr: 1 }}
                      >
                        {t("assessment.management.domainCount", {
                          count: assessmentDomains.length,
                        })}
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
                        label={
                          assessment.isActive
                            ? t("assessment.management.active")
                            : t("assessment.management.inactive")
                        }
                        labelPlacement="end"
                        sx={{ m: 0 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateAssessment(assessment);
                        }}
                        title={t("assessment.management.duplicateAssessment")}
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            bgcolor: colors.primary.blue + "15",
                            color: colors.primary.blue,
                          },
                        }}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
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
                      {t("assessment.domain.addDomain")}
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
                              {editingDomain
                                ? t("assessment.domain.editDomain")
                                : t("assessment.domain.addDomain")}
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
                              label={t("assessment.management.domainNameGujarati")}
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
                              label={t("assessment.management.domainNameEnglish")}
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
                              label={t("assessment.management.domainNameHindi")}
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
                              {t("assessment.management.saveDomain")}
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
                              {t("common.cancel")}
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
                      {domainsError?.message ||
                        t("assessment.management.failedToLoadDomains")}
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
                        {t("assessment.management.noDomainsForAssessment")}
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
              {t("assessment.management.noAssessmentsAvailable")}
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
        <DialogTitle sx={{ fontWeight: 700 }}>
          {t("assessment.management.editAssessmentName")}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label={t("assessment.management.assessmentNameGujarati")}
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
              label={t("assessment.management.assessmentNameEnglish")}
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
              label={t("assessment.management.assessmentNameHindi")}
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
          <Button onClick={cancelEditAssessment}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={saveAssessmentName}
            disabled={updateAssessmentMutation.isPending}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            {updateAssessmentMutation.isPending
              ? t("assessment.management.saving")
              : t("assessment.management.saveChanges")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit/Duplicate Assessment Modal */}
      <Dialog
        open={addAssessmentModalOpen}
        onClose={() => {
          setAddAssessmentModalOpen(false);
          setNewAssessment({
            schoolType: "1",
            assessmentEn: "",
            assessmentHi: "",
            assessmentGu: "",
          });
          setEditingAssessment(null);
          setDuplicateSourceAssessment(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {duplicateSourceAssessment
            ? t("assessment.management.duplicateAssessment")
            : editingAssessment
              ? t("assessment.management.editAssessment")
              : t("assessment.management.addAssessment")}
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
            {duplicateSourceAssessment && (
              <TextField
                size="small"
                label={t("assessment.management.duplicateFrom")}
                value={getAssessmentName(duplicateSourceAssessment)}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            )}
            <FormControl fullWidth size="small">
              <InputLabel>{t("assessment.management.schoolType")}</InputLabel>
              <Select
                value={newAssessment.schoolType}
                label={t("assessment.management.schoolType")}
                onChange={(e) =>
                  setNewAssessment((prev) => ({
                    ...prev,
                    schoolType: e.target.value,
                  }))
                }
              >
                <MenuItem value="1">
                  {t("assessment.management.schoolTypes.primary")}
                </MenuItem>
                <MenuItem value="2">
                  {t("assessment.management.schoolTypes.secondary")}
                </MenuItem>
              </Select>
            </FormControl>
            <TextField
              size="small"
              label={t("assessment.management.assessmentNameGujarati")}
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
              label={t("assessment.management.assessmentNameEnglish")}
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
              label={t("assessment.management.assessmentNameHindi")}
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
              setNewAssessment({
                schoolType: "1",
                assessmentEn: "",
                assessmentHi: "",
                assessmentGu: "",
              });
              setEditingAssessment(null);
              setDuplicateSourceAssessment(null);
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={
              (duplicateSourceAssessment
                ? cloneAssessmentMutation.isPending
                : updateAssessmentMutation.isPending) ||
              !newAssessment.assessmentEn?.trim() ||
              !newAssessment.assessmentGu?.trim()
            }
            onClick={() => {
              const nameEn = newAssessment.assessmentEn?.trim();
              const nameGu = newAssessment.assessmentGu?.trim();
              const nameHi = newAssessment.assessmentHi?.trim() || "";
              if (!nameEn || !nameGu) {
                enqueueSnackbar(t("assessment.management.addProperAssessmentName"), {
                  variant: "warning",
                });
                return;
              }
              if (duplicateSourceAssessment) {
                cloneAssessmentMutation.mutate(
                  {
                    assessmentId: duplicateSourceAssessment.assessmentId,
                    newAssessmentGu: nameGu,
                    newAssessmentEn: nameEn,
                    newAssessmentHi: nameHi,
                    schoolType: parseInt(newAssessment.schoolType, 10),
                  },
                  {
                    onSuccess: () => {
                      setAddAssessmentModalOpen(false);
                      setNewAssessment({
                        schoolType: "1",
                        assessmentEn: "",
                        assessmentHi: "",
                        assessmentGu: "",
                      });
                      setDuplicateSourceAssessment(null);
                      refetchAssessments();
                      refetchDomains();
                      refetchAssessmentRoleAssignments();
                    },
                  },
                );
                return;
              }
              const payload = {
                ...(editingAssessment && {
                  assessmentId: editingAssessment.assessmentId,
                }),
                schoolType: parseInt(newAssessment.schoolType, 10),
                assessmentEn: nameEn,
                assessmentHi: nameHi,
                assessmentGu: nameGu,
              };
              updateAssessmentMutation.mutate(payload, {
                onSuccess: (data) => {
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
                  refetchAssessmentRoleAssignments();
                },
              });
            }}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            {duplicateSourceAssessment
              ? cloneAssessmentMutation.isPending
                ? t("assessment.management.cloning")
                : t("assessment.management.duplicate")
              : updateAssessmentMutation.isPending
                ? editingAssessment
                  ? t("assessment.management.updating")
                  : t("assessment.management.creating")
                : editingAssessment
                  ? t("assessment.management.update")
                  : t("assessment.management.create")}
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
          {t("assessment.management.assessmentSettings")}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {isLoadingAssessmentRoleAssignments || isLoadingAssessments ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}
            >
              {[
                { roleId: 2, name: t("assessment.management.roles.school") },
                {
                  roleId: 3,
                  name: t("assessment.management.roles.schoolVerifier"),
                },
                { roleId: 4, name: t("assessment.management.roles.crc") },
              ].map((role) => {
                const assignmentsForRole = roleAssignments[role.roleId] || [];

                return (
                  <Accordion
                    key={role.roleId}
                    expanded={expandedSettingsRole === role.roleId}
                    onChange={() =>
                      setExpandedSettingsRole((prev) =>
                        prev === role.roleId ? null : role.roleId,
                      )
                    }
                    disableGutters
                    sx={{
                      border: `1px solid ${colors.neutral.gray200}`,
                      borderRadius: "12px !important",
                      overflow: "hidden",
                      boxShadow: "none",
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      sx={{
                        bgcolor: colors.neutral.gray100,
                        minHeight: 64,
                        "& .MuiAccordionSummary-content": {
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2,
                        },
                      }}
                    >
                      <Typography sx={{ fontWeight: 700 }}>
                        {role.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={t("assessment.management.assignmentCount", {
                          count: assignmentsForRole.length,
                        })}
                        sx={{
                          bgcolor: colors.primary.blue + "15",
                          color: colors.primary.blue,
                          fontWeight: 600,
                        }}
                      />
                    </AccordionSummary>

                    <AccordionDetails sx={{ bgcolor: "#fff" }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          mb: 2,
                        }}
                      >
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Add />}
                          onClick={() =>
                            handleAddRoleAssignmentRow(role.roleId)
                          }
                        >
                          {t("assessment.management.addAssessment")}
                        </Button>
                      </Box>

                      {assignmentsForRole.length === 0 ? (
                        <Card
                          elevation={0}
                          sx={{
                            p: 2,
                            border: `1px dashed ${colors.neutral.gray300}`,
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {t("assessment.management.noAssessmentsAssignedYet")}
                          </Typography>
                        </Card>
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {assignmentsForRole.map((assignment, index) => (
                            <Card
                              key={
                                assignment.localKey || `${role.roleId}-${index}`
                              }
                              elevation={0}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: `2px solid ${colors.neutral.gray200}`,
                                // bgcolor: assignment.isPublished === 1 ? "#f8fffb" : "#fff",
                              }}
                            >
                              {(() => {
                                const startDateValue = toDateInputValue(
                                  assignment.startDate
                                );
                                const endDateMin =
                                  startDateValue && startDateValue > todayDate
                                    ? startDateValue
                                    : todayDate;

                                return (
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: {
                                    xs: "1fr",
                                    md: "2fr 1fr 1fr auto",
                                  },
                                  gap: 1.5,
                                  alignItems: "center",
                                }}
                              >
                                <FormControl size="small" fullWidth>
                                  <InputLabel>
                                    {t("assessment.management.assessment")}
                                  </InputLabel>
                                  <Select
                                    value={assignment.assessmentId || ""}
                                    label={t("assessment.management.assessment")}
                                    onChange={(e) =>
                                      handleRoleAssignmentChange(
                                        role.roleId,
                                        index,
                                        "assessmentId",
                                        e.target.value,
                                      )
                                    }
                                    disabled={
                                      assignment.isPublished === 1 &&
                                      !assignment.isNew
                                    }
                                  >
                                    <MenuItem value="">
                                      <em>{t("assessment.management.none")}</em>
                                    </MenuItem>
                                    {(assessmentsData?.data || [])
                                      .filter((assessmentOption) => {
                                        const optionId = Number(
                                          assessmentOption.assessmentId
                                        );
                                        const currentSelectedId = Number(
                                          assignment.assessmentId
                                        );

                                        // Keep currently selected option visible in this row.
                                        if (optionId === currentSelectedId) {
                                          return true;
                                        }

                                        // Hide assessments already assigned in other rows of same role.
                                        return !assignmentsForRole.some(
                                          (assignedRow, rowIndex) =>
                                            rowIndex !== index &&
                                            Number(assignedRow.assessmentId) === optionId
                                        );
                                      })
                                      .map((assessment) => (
                                        <MenuItem
                                          key={assessment.assessmentId}
                                          value={assessment.assessmentId}
                                        >
                                          {getAssessmentName(assessment)}
                                        </MenuItem>
                                      ))}
                                  </Select>
                                </FormControl>

                                <TextField
                                  size="small"
                                  type="date"
                                  label={t("assessment.management.startDate")}
                                  value={toDateInputValue(assignment.startDate)}
                                  onChange={(e) =>
                                    handleRoleAssignmentChange(
                                      role.roleId,
                                      index,
                                      "startDate",
                                      e.target.value || "",
                                    )
                                  }
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ min: todayDate, max: "9999-12-31" }}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: 2,
                                      bgcolor: "#f8fafc",
                                      "& fieldset": {
                                        borderColor: colors.neutral.gray300,
                                      },
                                      "&:hover fieldset": {
                                        borderColor: colors.primary.blue,
                                      },
                                      "&.Mui-focused fieldset": {
                                        borderWidth: "1.5px",
                                        borderColor: colors.primary.blue,
                                      },
                                    },
                                  }}
                                  fullWidth
                                />

                                <TextField
                                  size="small"
                                  type="date"
                                  label={t("assessment.management.endDate")}
                                  value={toDateInputValue(assignment.endDate)}
                                  onChange={(e) =>
                                    handleRoleAssignmentChange(
                                      role.roleId,
                                      index,
                                      "endDate",
                                      e.target.value || "",
                                    )
                                  }
                                  InputLabelProps={{ shrink: true }}
                                  inputProps={{ min: endDateMin, max: "9999-12-31" }}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      borderRadius: 2,
                                      bgcolor: "#f8fafc",
                                      "& fieldset": {
                                        borderColor: colors.neutral.gray300,
                                      },
                                      "&:hover fieldset": {
                                        borderColor: colors.primary.blue,
                                      },
                                      "&.Mui-focused fieldset": {
                                        borderWidth: "1.5px",
                                        borderColor: colors.primary.blue,
                                      },
                                    },
                                  }}
                                  fullWidth
                                />

                                <Chip
                                  size="small"
                                  label={
                                    assignment.isPublished === 1
                                      ? t("assessment.management.published")
                                      : t("assessment.management.draft")
                                  }
                                  sx={{
                                    justifySelf: {
                                      xs: "flex-start",
                                      md: "center",
                                    },
                                    bgcolor:
                                      assignment.isPublished === 1
                                        ? colors.accent.green + "15"
                                        : colors.semantic.warning + "15",
                                    color:
                                      assignment.isPublished === 1
                                        ? colors.accent.green
                                        : colors.semantic.warning,
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>
                                );
                              })()}

                              <Box
                                sx={{
                                  mt: 1.5,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  {assignment.isNew && (
                                    <Button
                                      variant="text"
                                      color="error"
                                      size="small"
                                      startIcon={<Close />}
                                      onClick={() =>
                                        handleRemoveRoleAssignmentRow(
                                          role.roleId,
                                          index,
                                        )
                                      }
                                    >
                                      {t("assessment.management.remove")}
                                    </Button>
                                  )}
                                </Box>

                                <Box sx={{ display: "flex", gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    title={
                                      assignment.isPublished === 1
                                        ? t(
                                            "assessment.management.unpublishBeforeDeleting",
                                          )
                                        : t(
                                            "assessment.management.deleteAssignment",
                                          )
                                    }
                                    onClick={() =>
                                      handleDeleteRoleAssignment(role.roleId, index)
                                    }
                                    disabled={
                                      assignment.isPublished === 1 ||
                                      deleteAssessmentRoleAssignmentMutation.isPending
                                    }
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() =>
                                      handleUpdateRoleAssignment(
                                        role.roleId,
                                        index,
                                      )
                                    }
                                    disabled={
                                      updateAssessmentRoleAssignmentMutation.isPending
                                    }
                                    sx={{
                                      bgcolor: colors.primary.blue,
                                      "&:hover": {
                                        bgcolor: colors.primary.dark,
                                      },
                                    }}
                                  >
                                    {assignment.isNew
                                      ? t("common.add")
                                      : t("assessment.management.update")}
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() =>
                                      handlePublishRoleAssignment(
                                        role.roleId,
                                        index,
                                      )
                                    }
                                    disabled={
                                      !assignment.assessmentId ||
                                      publishAssessmentMutation.isPending
                                    }
                                  >
                                    {assignment.isPublished === 1
                                      ? t("assessment.management.unpublish")
                                      : t("assessment.management.publish")}
                                  </Button>
                                </Box>
                              </Box>
                            </Card>
                          ))}
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseSettingsModal}>
            {t("assessment.management.close")}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationModal
        open={deleteDomainModalOpen}
        onClose={() => setDeleteDomainModalOpen(false)}
        onConfirm={confirmDeleteDomain}
        title={t("assessment.management.deleteDomain")}
        message={t("assessment.management.deleteDomainConfirm", {
          domainName: domainToDelete ? getDomainName(domainToDelete) : "",
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteDomainMutation.isPending}
      />

      <ConfirmationModal
        open={deleteAssessmentModalOpen}
        onClose={() => setDeleteAssessmentModalOpen(false)}
        onConfirm={confirmDeleteAssessment}
        title={t("assessment.management.deleteAssessment")}
        message={t("assessment.management.deleteAssessmentConfirm", {
          assessmentName: assessmentToDelete
            ? getAssessmentName(assessmentToDelete)
            : "",
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="danger"
        isLoading={deleteAssessmentMutation.isPending}
      />
    </Box>
  );
};

export default AssessmentManagement;
