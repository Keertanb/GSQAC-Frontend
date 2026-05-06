import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";
import { colors } from "../../../../constants/colors";

import {
  getAssessmentManagementForApi,
  resolveAssessmentManagementSelectValue,
} from "../utils/assessmentManagementUtils";
import {
  useGetDomainsQuery,
  useUpsertDomainMutation,
  useTranslateTextMutation,
  usePublishAssessmentMutation,
  useGetAssessmentsQuery,
  useGetSchoolManagementQuery,
  useUpdateAssessmentMutation,
  useCloneAssessmentMutation,
  useDeleteDomainMutation,
  useGetAssessmentRoleAssignmentsQuery,
  useUpdateAssessmentRoleAssignmentMutation,
  useDeleteAssessmentRoleAssignmentMutation,
  useDeleteAssessmentMutation,
} from "../../../../services/adminService";

/**
 * Assessment management: queries, mutations, local state, and handlers.
 * UI must stay in presentational components; no JSX here.
 */
export function useAssessmentManagement() {
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
    management: "",
    assessmentEn: "",
    assessmentHi: "",
    assessmentGu: "",
  });

  const handleAddAssessment = () => {
    setEditingAssessment(null);
    setDuplicateSourceAssessment(null);
    setNewAssessment({
      schoolType: "1",
      management: "",
      assessmentEn: "",
      assessmentHi: "",
      assessmentGu: "",
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

  const { data: schoolManagementData } = useGetSchoolManagementQuery();
  const schoolManagementOptions = schoolManagementData?.data || [];

  const handleDuplicateAssessment = (assessment) => {
    setEditingAssessment(null);
    setDuplicateSourceAssessment(assessment);
    setNewAssessment({
      schoolType: assessment.schoolType?.toString() || "1",
      management: resolveAssessmentManagementSelectValue(
        assessment,
        schoolManagementOptions,
      ),
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
      management: resolveAssessmentManagementSelectValue(
        assessment,
        schoolManagementOptions,
      ),
      assessmentEn: assessment.assessmentEn || "",
      assessmentHi: assessment.assessmentHi || "",
      assessmentGu: assessment.assessmentGu || "",
    });
    setAddAssessmentModalOpen(true);
  };

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
            assignment.assessmentId !== "",
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

  /** Trash in settings: remove unsaved row locally, or delete persisted assignment via API */
  const handleRoleAssignmentTrashClick = (roleId, index) => {
    const assignment = roleAssignments[roleId]?.[index];
    if (!assignment) return;
    if (assignment.isNew) {
      handleRemoveRoleAssignmentRow(roleId, index);
      return;
    }
    handleDeleteRoleAssignment(roleId, index);
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
        "Please add domain name in at least 2 languages (Gujarati, English).",
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
        management: getAssessmentManagementForApi(editingAssessment),
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
        management: getAssessmentManagementForApi(assessment),
        isActive: newIsActive,
      };

      await updateAssessmentMutation.mutateAsync(payload);
    } catch (error) {
      console.error("Error toggling assessment status:", error);
    }
  };

  return {
    t,
    colors,
    i18n,
    expandedDomain,
    setExpandedDomain,
    currentView,
    setCurrentView,
    selectedSubdomain,
    setSelectedSubdomain,
    currentLanguage,
    setCurrentLanguage,
    showAddDomain,
    setShowAddDomain,
    newDomainName,
    setNewDomainName,
    selectedRole,
    setSelectedRole,
    editingDomain,
    setEditingDomain,
    translationId,
    setTranslationId,
    expandedAssessmentId,
    setExpandedAssessmentId,
    activeAssessmentForDomainForm,
    setActiveAssessmentForDomainForm,
    addAssessmentModalOpen,
    setAddAssessmentModalOpen,
    editingAssessment,
    setEditingAssessment,
    duplicateSourceAssessment,
    setDuplicateSourceAssessment,
    newAssessment,
    setNewAssessment,
    handleAddAssessment,
    getRoleName,
    settingsModalOpen,
    setSettingsModalOpen,
    roleAssignments,
    setRoleAssignments,
    expandedSettingsRole,
    setExpandedSettingsRole,
    deleteDomainModalOpen,
    setDeleteDomainModalOpen,
    domainToDelete,
    setDomainToDelete,
    deleteAssessmentModalOpen,
    setDeleteAssessmentModalOpen,
    assessmentToDelete,
    setAssessmentToDelete,
    showEditAssessment,
    setShowEditAssessment,
    tempAssessmentName,
    setTempAssessmentName,
    isViewOnlyMode,
    setIsViewOnlyMode,
    capturedImage,
    setCapturedImage,
    capturedImageMeta,
    setCapturedImageMeta,
    captureModalOpen,
    setCaptureModalOpen,
    captureMode,
    setCaptureMode,
    captureLoading,
    setCaptureLoading,
    captureVideoRef,
    captureCanvasRef,
    fileInputRef,
    openCamera,
    getAddressFromCoords,
    handleWebCaptureImage,
    startWebCamera,
    captureFromVideo,
    handleFileSelect,
    closeCaptureModal,
    languageCodeMap,
    languageCode,
    domainsData,
    isLoadingDomains,
    isErrorDomains,
    domainsError,
    refetchDomains,
    domainsByAssessmentId,
    assessmentsData,
    isLoadingAssessments,
    isErrorAssessments,
    assessmentsError,
    refetchAssessments,
    schoolManagementData,
    schoolManagementOptions,
    handleDuplicateAssessment,
    handleEditAssessment,
    assessmentRoleAssignmentsData,
    isLoadingAssessmentRoleAssignments,
    refetchAssessmentRoleAssignments,
    initialRoleAssignments,
    upsertDomainMutation,
    translateTextMutation,
    publishAssessmentMutation,
    updateAssessmentMutation,
    cloneAssessmentMutation,
    deleteDomainMutation,
    deleteAssessmentMutation,
    handleOpenSettingsModal,
    handleCloseSettingsModal,
    handleRoleAssignmentChange,
    handleAddRoleAssignmentRow,
    handleRemoveRoleAssignmentRow,
    updateAssessmentRoleAssignmentMutation,
    deleteAssessmentRoleAssignmentMutation,
    handleUpdateRoleAssignment,
    handleEditDomain,
    handlePublishRoleAssignment,
    handleDeleteRoleAssignment,
    handleRoleAssignmentTrashClick,
    handleDeleteDomain,
    confirmDeleteDomain,
    handleDeleteAssessment,
    confirmDeleteAssessment,
    handleAddDomain,
    handleLanguageChange,
    handleTranslateDomain,
    getDomainName,
    getAssessmentName,
    getAssessmentRoleIds,
    todayDate,
    startEditingAssessment,
    saveAssessmentName,
    cancelEditAssessment,
    handleToggleActive,
  };
}
