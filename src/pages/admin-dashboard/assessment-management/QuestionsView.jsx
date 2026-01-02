import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  Fade,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
} from "@mui/material";
import { ArrowBack, Add, Edit, Delete } from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import {
  useGetSubdomainQuestionsQuery,
  useUpsertQuestionMutation,
  useUpsertQuestionOptionMutation,
  useDeleteQuestionMutation,
  useDeleteQuestionOptionMutation,
} from "../../../services/adminService";
import { queryKeys } from "../../../config/queryClient";
import useAuthStore from "../../../store/useAuthStore";
import { getRoleId, roleIdMap } from "../../../constants/roles";
import { enqueueSnackbar } from "notistack";
import ConfirmationModal from "../../../components/ConfirmationModal/ConfirmationModal";

const QuestionsView = ({ subdomainData, onBack, currentLanguage }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  // eslint-disable-next-line no-unused-vars
  const { userId } = useAuthStore();

  // Map language code: en -> EN, hi -> HI, gu -> GU
  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  const subDomainId = subdomainData?.subDomainId || subdomainData?.id;

  // Get roleId from subdomain's domain data or default to admin (1)
  // We need to get roleId from the domain that contains this subdomain
  const roleId = subdomainData?.roleId || 1;

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null); // Store questionId after question is added
  const [showOptionsForm, setShowOptionsForm] = useState(false); // Show options form after question is added
  const [newQuestionText, setNewQuestionText] = useState({
    en: "",
    hi: "",
    gu: "",
  });
  const [newOptions, setNewOptions] = useState([
    { id: 1, text: { en: "", hi: "", gu: "" } },
    { id: 2, text: { en: "", hi: "", gu: "" } },
  ]);
  const [isClassroomObservation, setIsClassroomObservation] = useState(0);
  const [observationCount, setObservationCount] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  // Initialize selected role based on roleId
  const getRoleByRoleId = (rId) => {
    return (
      Object.keys(roleIdMap).find((key) => roleIdMap[key] === rId) || "admin"
    );
  };

  const [selectedQuestionRole, setSelectedQuestionRole] = useState(
    getRoleByRoleId(roleId)
  );

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useGetSubdomainQuestionsQuery({
    subDomainId,
    roleId,
    languageCode,
    enabled: !!subdomainData && !!subDomainId,
  });

  const questions = questionsData?.data || [];

  const upsertQuestionMutation = useUpsertQuestionMutation();
  const upsertQuestionOptionMutation = useUpsertQuestionOptionMutation();
  const deleteQuestionMutation = useDeleteQuestionMutation({
    onSuccess: () => {
      // Invalidate and refetch questions query after deletion
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.subdomainQuestions(
          subDomainId,
          roleId,
          languageCode
        ),
      });
      // Close modal
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    },
    onError: () => {
      setDeleteModalOpen(false);
    },
  });
  const deleteQuestionOptionMutation = useDeleteQuestionOptionMutation({
    onSuccess: () => {
      // Invalidate and refetch questions query after deletion
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.subdomainQuestions(
          subDomainId,
          roleId,
          languageCode
        ),
      });
    },
  });

  // Helper function to extract questionId from API response
  const extractQuestionId = (response) => {
    // Try various response structures
    if (response?.data?.questionId) return response.data.questionId;
    if (response?.data?.data?.questionId) return response.data.data.questionId;
    if (response?.questionId) return response.questionId;
    if (Array.isArray(response?.data) && response.data.length > 0) {
      return response.data[0]?.questionId || response.data[0]?.id;
    }
    return null;
  };

  // Parse options JSON string
  const parseOptions = (optionsString) => {
    try {
      if (typeof optionsString === "string") {
        return JSON.parse(optionsString);
      }
      return optionsString || [];
    } catch (e) {
      console.error("Error parsing options:", e);
      return [];
    }
  };

  const handleAddOption = () => {
    const newOptionId = Math.max(...newOptions.map((opt) => opt.id), 0) + 1;
    setNewOptions([
      ...newOptions,
      { id: newOptionId, text: { en: "", hi: "", gu: "" } },
    ]);
  };

  const handleDeleteOption = (optionId) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((opt) => opt.id !== optionId));
    }
  };

  const handleOptionChange = (optionId, field, value) => {
    setNewOptions(
      newOptions.map((opt) =>
        opt.id === optionId
          ? { ...opt, text: { ...opt.text, [field]: value } }
          : opt
      )
    );
  };

  // Step 1: Add/Update the question first
  const handleAddQuestion = async () => {
    if (!newQuestionText.en.trim() || !selectedQuestionRole) {
      enqueueSnackbar(
        "Please fill in the question text (English is required)",
        {
          variant: "warning",
        }
      );
      return;
    }

    try {
      const questionPayload = {
        subDomainId,
        roleId: getRoleId(selectedQuestionRole),
        questionTextEn: newQuestionText.en.trim(),
        questionTextHi: newQuestionText.hi.trim(),
        questionTextGu: newQuestionText.gu.trim(),
        isClassroomObservation: isClassroomObservation,
      };

      // Include observationCount only if isClassroomObservation is 1
      if (isClassroomObservation === 1 && observationCount) {
        questionPayload.observationCount = parseInt(observationCount, 10);
      }

      // If editing, include questionId
      if (editingQuestion) {
        questionPayload.questionId = editingQuestion.questionId;
      }

      // Call question API
      const questionResponse = await upsertQuestionMutation.mutateAsync(
        questionPayload
      );

      // Extract questionId from response
      let questionId = extractQuestionId(questionResponse);

      // If editing and questionId not in response, use the existing one
      if (!questionId && editingQuestion) {
        questionId = editingQuestion.questionId;
      }

      if (!questionId) {
        enqueueSnackbar("Failed to get question ID. Please try again.", {
          variant: "error",
        });
        return;
      }

      // Store questionId first
      setCurrentQuestionId(questionId);

      // If editing, load existing options
      if (editingQuestion) {
        const parsedOptions = parseOptions(editingQuestion.options);
        if (parsedOptions && parsedOptions.length > 0) {
          const formattedOptions = parsedOptions.map((opt, index) => ({
            id: opt.optionId || index + 1,
            optionId: opt.optionId,
            text: {
              en: opt.optionTextEn || opt.optionText || "",
              hi: opt.optionTextHi || opt.optionText || "",
              gu: opt.optionTextGu || opt.optionText || "",
            },
          }));
          setNewOptions(formattedOptions);
        }
      } else {
        // Reset options for new question
        setNewOptions([
          { id: 1, text: { en: "", hi: "", gu: "" } },
          { id: 2, text: { en: "", hi: "", gu: "" } },
        ]);
      }

      // Use React's state batching - set both states together
      // This ensures they update in the same render cycle
      setShowAddQuestion(false);
      setShowOptionsForm(true);

      enqueueSnackbar(
        editingQuestion
          ? "Question updated successfully. Now add options."
          : "Question added successfully. Now add options.",
        {
          variant: "success",
        }
      );

      // DO NOT invalidate queries here - this causes a re-render that can interfere
      // with the options form display. We'll invalidate after options are added instead.
    } catch (error) {
      console.error("Error adding question:", error);
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save question",
        {
          variant: "error",
        }
      );
    }
  };

  // Step 2: Add/Update options for the question
  const handleAddOptions = async () => {
    if (!currentQuestionId) {
      enqueueSnackbar("Question ID is missing. Please add question first.", {
        variant: "error",
      });
      return;
    }

    // Validate that at least 2 options have English text
    const validOptions = newOptions.filter((opt) => opt.text.en.trim());
    if (validOptions.length < 2) {
      enqueueSnackbar("Please add at least 2 options with English text", {
        variant: "warning",
      });
      return;
    }

    try {
      // Add/Update options for the question
      const optionPromises = validOptions.map(async (opt) => {
        const optionPayload = {
          questionId: currentQuestionId,
          optionTextEn: opt.text.en.trim(),
          optionTextHi: opt.text.hi.trim(),
          optionTextGu: opt.text.gu.trim(),
        };

        // If editing and option has optionId, include it
        if (opt.optionId) {
          optionPayload.optionId = opt.optionId;
        }

        return upsertQuestionOptionMutation.mutateAsync(optionPayload);
      });

      // Wait for all options to be added
      await Promise.all(optionPromises);

      // Success - refresh and reset form
      enqueueSnackbar(
        editingQuestion
          ? "Options updated successfully"
          : "Options added successfully",
        {
          variant: "success",
        }
      );

      // Invalidate and refetch questions query
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.subdomainQuestions(
          subDomainId,
          roleId,
          languageCode
        ),
      });

      setNewQuestionText({ en: "", hi: "", gu: "" });
      setNewOptions([
        { id: 1, text: { en: "", hi: "", gu: "" } },
        { id: 2, text: { en: "", hi: "", gu: "" } },
      ]);
      setIsClassroomObservation(0);
      setObservationCount("");
      setShowAddQuestion(false);
      setShowOptionsForm(false);
      setEditingQuestion(null);
      setCurrentQuestionId(null);
    } catch (error) {
      console.error("Error adding options:", error);
      enqueueSnackbar(
        error?.response?.data?.message || "Failed to save options",
        {
          variant: "error",
        }
      );
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setCurrentQuestionId(question.questionId);
    // Set question text for all languages
    setNewQuestionText({
      en: question.questionTextEn || question.questionText || "",
      hi: question.questionTextHi || question.questionText || "",
      gu: question.questionTextGu || question.questionText || "",
    });
    // Set classroom observation fields
    setIsClassroomObservation(question.isClassroomObservation || 0);
    setObservationCount(
      question.observationCount ? String(question.observationCount) : ""
    );

    // Parse and set options
    const parsedOptions = parseOptions(question.options);
    if (parsedOptions && parsedOptions.length > 0) {
      const formattedOptions = parsedOptions.map((opt, index) => ({
        id: opt.optionId || index + 1,
        optionId: opt.optionId,
        text: {
          en: opt.optionTextEn || opt.optionText || "",
          hi: opt.optionTextHi || opt.optionText || "",
          gu: opt.optionTextGu || opt.optionText || "",
        },
      }));
      setNewOptions(formattedOptions);
      setShowOptionsForm(true); // Show options form when editing
    } else {
      setNewOptions([
        { id: 1, text: { en: "", hi: "", gu: "" } },
        { id: 2, text: { en: "", hi: "", gu: "" } },
      ]);
      setShowOptionsForm(false);
    }

    // Set role based on question's roleId if available
    if (question.roleId) {
      setSelectedQuestionRole(getRoleByRoleId(question.roleId));
    }
    setShowAddQuestion(true);
  };

  const handleDeleteQuestion = (question) => {
    setQuestionToDelete(question);
    setDeleteModalOpen(true);
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete) {
      deleteQuestionMutation.mutate(questionToDelete.questionId);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleDeleteQuestionOption = (questionId) => {
    if (
      window.confirm(
        `Are you sure you want to delete all options for this question?`
      )
    ) {
      deleteQuestionOptionMutation.mutate(questionId);
    }
  };

  const getQuestionText = (question) => {
    // API returns questionText directly (not language-specific in the new format)
    return question.questionText || "";
  };

  const getOptionText = (option) => {
    // API returns optionText directly (not language-specific in the new format)
    return option.optionText || "";
  };

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
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          {t("common.back")}
        </Button>
        <Alert severity="error">{error?.message || t("common.error")}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={onBack}
          variant="outlined"
          sx={{ borderColor: colors.primary.blue, color: colors.primary.blue }}
        >
          {t("common.back")}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {subdomainData?.subDomainNameEn ||
            subdomainData?.subDomainName ||
            subdomainData?.name?.[currentLanguage] ||
            subdomainData?.name?.en ||
            "Subdomain"}
        </Typography>
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          bgcolor: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
              {t("assessment.question.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {questions.length} {t("assessment.question.title")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingQuestion(null);
              setCurrentQuestionId(null);
              setShowOptionsForm(false);
              setNewQuestionText({ en: "", hi: "", gu: "" });
              setNewOptions([
                { id: 1, text: { en: "", hi: "", gu: "" } },
                { id: 2, text: { en: "", hi: "", gu: "" } },
              ]);
              setIsClassroomObservation(0);
              setObservationCount("");
              setShowAddQuestion(!showAddQuestion);
            }}
            sx={{
              bgcolor: colors.primary.blue,
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            {t("assessment.question.addQuestion")}
          </Button>
        </Box>

        {/* Add/Edit Question Form */}
        {showAddQuestion && (
          <Fade in={showAddQuestion}>
            <Card
              elevation={2}
              sx={{
                mb: 3,
                p: 3,
                borderRadius: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 700, mb: 3 }}
              >
                {editingQuestion
                  ? t("assessment.question.editQuestion")
                  : t("assessment.question.addQuestion")}
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
              >
                <FormControl fullWidth size="small">
                  <InputLabel>{t("assessment.domain.selectRole")}</InputLabel>
                  <Select
                    value={selectedQuestionRole}
                    onChange={(e) => setSelectedQuestionRole(e.target.value)}
                    label={t("assessment.domain.selectRole")}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="school">School</MenuItem>
                    <MenuItem value="inspector">School Verifier</MenuItem>
                    <MenuItem value="parent">Parent</MenuItem>
                  </Select>
                </FormControl>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label={`${t("assessment.question.questionText")} (English)`}
                    value={newQuestionText.en}
                    onChange={(e) =>
                      setNewQuestionText({
                        ...newQuestionText,
                        en: e.target.value,
                      })
                    }
                    variant="outlined"
                    size="small"
                    required
                    multiline
                    rows={3}
                  />
                  <TextField
                    fullWidth
                    label={`${t("assessment.question.questionText")} (Hindi)`}
                    value={newQuestionText.hi}
                    onChange={(e) =>
                      setNewQuestionText({
                        ...newQuestionText,
                        hi: e.target.value,
                      })
                    }
                    variant="outlined"
                    size="small"
                    multiline
                    rows={3}
                  />
                  <TextField
                    fullWidth
                    label={`${t(
                      "assessment.question.questionText"
                    )} (Gujarati)`}
                    value={newQuestionText.gu}
                    onChange={(e) =>
                      setNewQuestionText({
                        ...newQuestionText,
                        gu: e.target.value,
                      })
                    }
                    variant="outlined"
                    size="small"
                    multiline
                    rows={3}
                  />
                </Box>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 1 }}>
                    Is Classroom Observation
                  </FormLabel>
                  <RadioGroup
                    row
                    value={isClassroomObservation}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setIsClassroomObservation(value);
                      // Reset observationCount when switching to No
                      if (value === 0) {
                        setObservationCount("");
                      }
                    }}
                  >
                    <FormControlLabel
                      value={1}
                      control={<Radio />}
                      label="Yes"
                    />
                    <FormControlLabel
                      value={0}
                      control={<Radio />}
                      label="No"
                    />
                  </RadioGroup>
                </FormControl>
                {isClassroomObservation === 1 && (
                  <TextField
                    fullWidth
                    label="Observation Count"
                    type="number"
                    value={observationCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive integers
                      if (value === "" || /^\d+$/.test(value)) {
                        setObservationCount(value);
                      }
                    }}
                    variant="outlined"
                    size="small"
                    inputProps={{ min: 1 }}
                    helperText="Enter the number of observations"
                  />
                )}
              </Box>

              {/* Question Submit Button */}
              <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={
                    upsertQuestionMutation.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <Add />
                    )
                  }
                  onClick={handleAddQuestion}
                  disabled={upsertQuestionMutation.isPending}
                  sx={{
                    bgcolor: colors.primary.blue,
                    "&:hover": { bgcolor: colors.primary.dark },
                  }}
                >
                  {upsertQuestionMutation.isPending
                    ? "Saving Question..."
                    : editingQuestion
                    ? "Update Question"
                    : "Add Question"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowAddQuestion(false);
                    setShowOptionsForm(false);
                    setNewQuestionText({ en: "", hi: "", gu: "" });
                    setNewOptions([
                      { id: 1, text: { en: "", hi: "", gu: "" } },
                      { id: 2, text: { en: "", hi: "", gu: "" } },
                    ]);
                    setIsClassroomObservation(0);
                    setObservationCount("");
                    setEditingQuestion(null);
                    setCurrentQuestionId(null);
                  }}
                  disabled={upsertQuestionMutation.isPending}
                >
                  {t("common.cancel")}
                </Button>
              </Box>
            </Card>
          </Fade>
        )}

        {/* Options Form - Separate Card */}
        {showOptionsForm && (
          <Fade in={showOptionsForm}>
            <Card
              elevation={2}
              sx={{
                mb: 3,
                p: 3,
                borderRadius: 2,
                bgcolor: "#f9fafb",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ fontWeight: 700, mb: 3 }}
              >
                {editingQuestion
                  ? t("assessment.question.editOptions")
                  : t("assessment.question.addOptions")}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {t("assessment.question.options")}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleAddOption}
                    sx={{
                      borderColor: colors.primary.blue,
                      color: colors.primary.blue,
                      "&:hover": {
                        borderColor: colors.primary.dark,
                        bgcolor: colors.primary.blue + "10",
                      },
                    }}
                  >
                    {t("assessment.question.addOption")}
                  </Button>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {newOptions.map((option, optIndex) => (
                    <Card
                      key={option.id}
                      elevation={1}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "white",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          label={`${t("assessment.question.options")} ${
                            optIndex + 1
                          }`}
                          size="small"
                          sx={{
                            bgcolor: colors.primary.lightest,
                            color: colors.primary.blue,
                            fontWeight: 600,
                          }}
                        />
                        {newOptions.length > 2 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteOption(option.id)}
                            sx={{
                              bgcolor: colors.semantic.error + "15",
                              "&:hover": {
                                bgcolor: colors.semantic.error + "25",
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                          fullWidth
                          label={`${t(
                            "assessment.question.options"
                          )} (English)`}
                          value={option.text.en}
                          onChange={(e) =>
                            handleOptionChange(option.id, "en", e.target.value)
                          }
                          variant="outlined"
                          size="small"
                          required
                          multiline
                          rows={2}
                        />
                        <TextField
                          fullWidth
                          label={`${t("assessment.question.options")} (Hindi)`}
                          value={option.text.hi}
                          onChange={(e) =>
                            handleOptionChange(option.id, "hi", e.target.value)
                          }
                          variant="outlined"
                          size="small"
                          multiline
                          rows={2}
                        />
                        <TextField
                          fullWidth
                          label={`${t(
                            "assessment.question.options"
                          )} (Gujarati)`}
                          value={option.text.gu}
                          onChange={(e) =>
                            handleOptionChange(option.id, "gu", e.target.value)
                          }
                          variant="outlined"
                          size="small"
                          multiline
                          rows={2}
                        />
                      </Box>
                    </Card>
                  ))}
                </Box>

                {/* Options Submit Button */}
                <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={
                      upsertQuestionOptionMutation.isPending ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Add />
                      )
                    }
                    onClick={handleAddOptions}
                    disabled={upsertQuestionOptionMutation.isPending}
                    sx={{
                      bgcolor: colors.accent.green,
                      "&:hover": { bgcolor: colors.accent.greenDark },
                    }}
                  >
                    {upsertQuestionOptionMutation.isPending
                      ? "Saving Options..."
                      : editingQuestion
                      ? "Update Options"
                      : "Add Options"}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowOptionsForm(false);
                      setNewOptions([
                        { id: 1, text: { en: "", hi: "", gu: "" } },
                        { id: 2, text: { en: "", hi: "", gu: "" } },
                      ]);
                      setCurrentQuestionId(null);
                    }}
                    disabled={upsertQuestionOptionMutation.isPending}
                  >
                    {t("common.cancel")}
                  </Button>
                </Box>
              </Box>
            </Card>
          </Fade>
        )}

        {questions && questions.length > 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {questions.map((question, index) => {
              const options = parseOptions(question.options);
              return (
                <Card
                  key={question.questionId}
                  elevation={1}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.08)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Chip
                        label={`Q${index + 1}`}
                        size="small"
                        sx={{
                          bgcolor: colors.primary.blue,
                          color: "white",
                          fontWeight: 700,
                          minWidth: "40px",
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            fontSize: "1rem",
                            lineHeight: 1.6,
                            mb:
                              question.isClassroomObservation === 1 &&
                              question.observationCount
                                ? 0.5
                                : 0,
                          }}
                        >
                          {getQuestionText(question)}
                        </Typography>
                        {question.isClassroomObservation === 1 &&
                          question.observationCount && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 0.5,
                              }}
                            >
                              {/* <Chip
                                label="Classroom Observation"
                                size="small"
                                sx={{
                                  bgcolor: colors.semantic.warning + "20",
                                  color: colors.semantic.warning,
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              /> */}
                              <Chip
                                label={`Observation Count: ${question.observationCount}`}
                                size="small"
                                sx={{
                                  bgcolor: colors.primary.blue + "20",
                                  color: colors.primary.blue,
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />
                            </Box>
                          )}
                      </Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditQuestion(question)}
                        sx={{
                          bgcolor: colors.accent.green + "15",
                          "&:hover": { bgcolor: colors.accent.green + "25" },
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteQuestion(question)}
                        sx={{
                          bgcolor: colors.semantic.error + "15",
                          "&:hover": { bgcolor: colors.semantic.error + "25" },
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>

                    {options && options.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            color: "text.secondary",
                          }}
                        >
                          {t("assessment.question.options")}:
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                          }}
                        >
                          {options.map((option, optIndex) => (
                            <Box
                              key={option.optionId || optIndex}
                              sx={{
                                p: 2,
                                borderRadius: 1.5,
                                bgcolor: "#f9fafb",
                                border: "1px solid rgba(0,0,0,0.06)",
                                transition: "all 0.2s ease",
                                "&:hover": {
                                  bgcolor: "#f3f4f6",
                                  borderColor: colors.primary.lightest,
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 1.5,
                                }}
                              >
                                <Chip
                                  label={String.fromCharCode(65 + optIndex)}
                                  size="small"
                                  sx={{
                                    bgcolor: colors.primary.lightest,
                                    color: colors.primary.blue,
                                    fontWeight: 600,
                                    minWidth: "28px",
                                    height: "28px",
                                  }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    flex: 1,
                                    lineHeight: 1.6,
                                    color: "text.primary",
                                  }}
                                >
                                  {getOptionText(option)}
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box
            sx={{
              p: 4,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <Typography variant="body1">
              {t("assessment.question.noQuestions")}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setQuestionToDelete(null);
        }}
        onConfirm={confirmDeleteQuestion}
        title="Delete Question"
        message={
          questionToDelete
            ? `Are you sure you want to delete this question? This will also delete all associated options. This action cannot be undone.`
            : "Are you sure you want to delete this question?"
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteQuestionMutation.isPending}
      />
    </Box>
  );
};

export default QuestionsView;
