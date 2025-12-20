import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Breadcrumbs,
  Link,
  Card,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  Add,
  Delete,
  Home,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";

const QuestionView = ({
  questionData,
  domains,
  setDomains,
  onBack,
  currentLanguage,
}) => {
  const { t, i18n } = useTranslation();
  
  // Get questions from the category in domains state
  const getCurrentCategory = () => {
    const domain = domains.find((d) => d.id === questionData.domain.id);
    const subdomain = domain?.subdomains.find(
      (s) => s.id === questionData.subdomain.id
    );
    return subdomain?.categories.find(
      (c) => c.id === questionData.category.id
    );
  };

  const currentCategory = getCurrentCategory();
  const [questions, setQuestions] = useState(
    currentCategory?.questions || []
  );

  // Sync questions when domains change
  useEffect(() => {
    const category = getCurrentCategory();
    if (category?.questions) {
      setQuestions(category.questions);
    }
  }, [domains, questionData]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: { en: "", hi: "", gu: "" },
    options: [
      { id: 1, text: { en: "", hi: "", gu: "" } },
      { id: 2, text: { en: "", hi: "", gu: "" } },
      { id: 3, text: { en: "", hi: "", gu: "" } },
      { id: 4, text: { en: "", hi: "", gu: "" } },
    ],
  });

  const handleAddOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [
        ...newQuestion.options,
        {
          id: newQuestion.options.length + 1,
          text: { en: "", hi: "", gu: "" },
        },
      ],
    });
  };

  const handleDeleteOption = (optionId) => {
    if (newQuestion.options.length > 2) {
      setNewQuestion({
        ...newQuestion,
        options: newQuestion.options.filter((opt) => opt.id !== optionId),
      });
    }
  };

  const handleOptionChange = (optionId, field, value) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.map((opt) =>
        opt.id === optionId
          ? { ...opt, text: { ...opt.text, [field]: value } }
          : opt
      ),
    });
  };

  const handleAddQuestion = () => {
    if (!newQuestion.text.en.trim()) {
      return;
    }

    const question = {
      id: Date.now(),
      ...newQuestion,
      createdAt: new Date().toISOString(),
    };

    const updatedQuestions = [...questions, question];
    setQuestions(updatedQuestions);

    // Update domains state
    const updatedDomains = domains.map((d) => {
      if (d.id === questionData.domain.id) {
        return {
          ...d,
          subdomains: d.subdomains.map((s) => {
            if (s.id === questionData.subdomain.id) {
              return {
                ...s,
                categories: (s.categories || []).map((c) => {
                  if (c.id === questionData.category.id) {
                    return {
                      ...c,
                      questions: updatedQuestions,
                    };
                  }
                  return c;
                }),
              };
            }
            return s;
          }),
        };
      }
      return d;
    });
    setDomains(updatedDomains);

    setNewQuestion({
      text: { en: "", hi: "", gu: "" },
      options: [
        { id: 1, text: { en: "", hi: "", gu: "" } },
        { id: 2, text: { en: "", hi: "", gu: "" } },
        { id: 3, text: { en: "", hi: "", gu: "" } },
        { id: 4, text: { en: "", hi: "", gu: "" } },
      ],
    });
    setShowAddQuestion(false);
  };

  const handleDeleteQuestion = (questionId) => {
    const updatedQuestions = questions.filter((q) => q.id !== questionId);
    setQuestions(updatedQuestions);

    // Update domains state
    const updatedDomains = domains.map((d) => {
      if (d.id === questionData.domain.id) {
        return {
          ...d,
          subdomains: d.subdomains.map((s) => {
            if (s.id === questionData.subdomain.id) {
              return {
                ...s,
                categories: (s.categories || []).map((c) => {
                  if (c.id === questionData.category.id) {
                    return {
                      ...c,
                      questions: updatedQuestions,
                    };
                  }
                  return c;
                }),
              };
            }
            return s;
          }),
        };
      }
      return d;
    });
    setDomains(updatedDomains);
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={onBack}
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <Home fontSize="small" />
          {t("assessment.domain.title")}
        </Link>
        <Typography color="text.primary">
          {questionData.domain.name[currentLanguage] ||
            questionData.domain.name.en}
        </Typography>
        <Typography color="text.primary">
          {questionData.subdomain.name[currentLanguage] ||
            questionData.subdomain.name.en}
        </Typography>
        <Typography color="text.primary">
          {questionData.category.name[currentLanguage] ||
            questionData.category.name.en}
        </Typography>
        <Typography color="text.primary">
          {t("assessment.question.title")}
        </Typography>
      </Breadcrumbs>

      <Button
        startIcon={<ArrowBack />}
        onClick={onBack}
        sx={{ mb: 3 }}
        variant="outlined"
      >
        {t("common.cancel")}
      </Button>

      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
              {questionData.category.name[currentLanguage] ||
                questionData.category.name.en}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("assessment.question.title")} -{" "}
              {questionData.domain.name[currentLanguage] ||
                questionData.domain.name.en}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowAddQuestion(!showAddQuestion)}
            sx={{ bgcolor: colors.primary.blue }}
          >
            {t("assessment.question.addQuestion")}
          </Button>
        </Box>

        {showAddQuestion && (
          <Card elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {t("assessment.question.addQuestion")}
            </Typography>

            {/* Question Text in 3 languages */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {t("assessment.question.questionText")}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Question (English)"
                  value={newQuestion.text.en}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      text: { ...newQuestion.text, en: e.target.value },
                    })
                  }
                  variant="outlined"
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  label="Question (Hindi)"
                  value={newQuestion.text.hi}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      text: { ...newQuestion.text, hi: e.target.value },
                    })
                  }
                  variant="outlined"
                  multiline
                  rows={2}
                />
                <TextField
                  fullWidth
                  label="Question (Gujarati)"
                  value={newQuestion.text.gu}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      text: { ...newQuestion.text, gu: e.target.value },
                    })
                  }
                  variant="outlined"
                  multiline
                  rows={2}
                />
              </Box>
            </Box>

            {/* Options */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("assessment.question.options")}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={handleAddOption}
                >
                  {t("assessment.question.addOption")}
                </Button>
              </Box>

              {newQuestion.options.map((option, index) => (
                <Card
                  key={option.id}
                  elevation={1}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: "1px solid #e5e7eb",
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: colors.primary.blue,
                      boxShadow: `0 2px 8px ${colors.primary.blue}20`,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={`Option ${index + 1}`}
                      size="small"
                      sx={{
                        bgcolor: colors.primary.blue + "15",
                        color: colors.primary.blue,
                        fontWeight: 600,
                      }}
                    />
                    {newQuestion.options.length > 2 && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteOption(option.id)}
                        sx={{
                          bgcolor: colors.semantic.error + "10",
                          "&:hover": {
                            bgcolor: colors.semantic.error + "20",
                          },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Option (English)"
                      value={option.text.en}
                      onChange={(e) =>
                        handleOptionChange(option.id, "en", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Option (Hindi)"
                      value={option.text.hi}
                      onChange={(e) =>
                        handleOptionChange(option.id, "hi", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Option (Gujarati)"
                      value={option.text.gu}
                      onChange={(e) =>
                        handleOptionChange(option.id, "gu", e.target.value)
                      }
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Card>
              ))}
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleAddQuestion}
                sx={{ bgcolor: colors.primary.blue }}
              >
                {t("common.add")} {t("assessment.question.title")}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setShowAddQuestion(false);
                  setNewQuestion({
                    text: { en: "", hi: "", gu: "" },
                    options: [
                      { id: 1, text: { en: "", hi: "", gu: "" } },
                      { id: 2, text: { en: "", hi: "", gu: "" } },
                      { id: 3, text: { en: "", hi: "", gu: "" } },
                      { id: 4, text: { en: "", hi: "", gu: "" } },
                    ],
                  });
                }}
              >
                {t("common.cancel")}
              </Button>
            </Box>
          </Card>
        )}

        {/* Questions List */}
        {questions.length > 0 ? (
          <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: colors.primary.blue + "10" }}>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {t("assessment.question.questionText")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {t("assessment.question.options")}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    {t("common.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map((question, index) => (
                  <TableRow
                    key={question.id}
                    sx={{
                      "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {question.text[currentLanguage] || question.text.en}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {question.options.map((opt, idx) => (
                          <Chip
                            key={opt.id}
                            label={`${idx + 1}. ${
                              opt.text[currentLanguage] || opt.text.en
                            }`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: colors.primary.blue + "40",
                              color: colors.primary.blue,
                            }}
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteQuestion(question.id)}
                        sx={{
                          bgcolor: colors.semantic.error + "15",
                          "&:hover": { bgcolor: colors.semantic.error + "25" },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Card elevation={1} sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              {t("assessment.question.noQuestions")}
            </Typography>
          </Card>
        )}
      </Paper>
    </Box>
  );
};

export default QuestionView;

