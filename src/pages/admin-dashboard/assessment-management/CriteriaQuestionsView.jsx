import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  TextField,
  Fade,
} from "@mui/material";
import { ArrowBack, Menu as MenuIcon, Add } from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import { useGetCriteriaQuestionsQuery } from "../../../services/adminService";

const CriteriaQuestionsView = ({ subdomainData, onBack, currentLanguage }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down("md"));

  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  const roleId = 2;

  const [selectedCriteriaId, setSelectedCriteriaId] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showAddCriteria, setShowAddCriteria] = useState(false);
  const [newCriteriaName, setNewCriteriaName] = useState({
    en: "",
    hi: "",
    gu: "",
  });

  const subDomainId = subdomainData?.subDomainId || subdomainData?.id;

  const {
    data: criteriaData,
    isLoading,
    isError,
    error,
  } = useGetCriteriaQuestionsQuery({
    subDomainId,
    roleId,
    languageCode,
    enabled: !!subdomainData && !!subDomainId,
  });
  const criteriaList = criteriaData?.data || [];
  const selectedCriteria =
    criteriaList.find((c) => c.criteriaId === selectedCriteriaId) ||
    (criteriaList.length > 0 ? criteriaList[0] : null);

  // Auto-select first criteria if none selected
  React.useEffect(() => {
    if (criteriaList.length > 0 && !selectedCriteriaId) {
      setSelectedCriteriaId(criteriaList[0].criteriaId);
    }
  }, [criteriaList, selectedCriteriaId]);

  const handleAddCriteria = () => {
    if (!newCriteriaName.en.trim()) {
      return;
    }
    // TODO: Add API call to save criteria
    // For now, just reset the form
    setNewCriteriaName({ en: "", hi: "", gu: "" });
    setShowAddCriteria(false);
  };

  const getCriteriaName = (criteria) => {
    if (languageCode === "EN") {
      return criteria.criteriaNameEn || criteria.criteriaName;
    } else if (languageCode === "HI") {
      return criteria.criteriaNameHi || criteria.criteriaName;
    } else {
      return criteria.criteriaNameGu || criteria.criteriaName;
    }
  };

  const getQuestionText = (question) => {
    if (languageCode === "EN") {
      return question.questionTextEn || question.questionText;
    } else if (languageCode === "HI") {
      return question.questionTextHi || question.questionText;
    } else {
      return question.questionTextGu || question.questionText;
    }
  };

  const getOptionText = (option) => {
    if (languageCode === "EN") {
      return option.optionTextEn || option.optionText;
    } else if (languageCode === "HI") {
      return option.optionTextHi || option.optionText;
    } else {
      return option.optionTextGu || option.optionText;
    }
  };

  const CriteriaList = () => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f9fafb",
        borderRight: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
            {t("assessment.criteria.title")}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowAddCriteria(!showAddCriteria)}
            sx={{
              bgcolor: colors.primary.blue,
              color: "white",
              "&:hover": { bgcolor: colors.primary.dark },
            }}
          >
            <Add fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {criteriaList.length} {t("assessment.criteria.criteria")}
        </Typography>
      </Box>

      {/* Add Criteria Form */}
      <Fade in={showAddCriteria}>
        <Card
          elevation={1}
          sx={{
            m: 1.5,
            p: 2,
            borderRadius: 2,
            bgcolor: "#f9fafb",
            display: showAddCriteria ? "block" : "none",
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {t("assessment.criteria.addCriteria")}
          </Typography>
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}
          >
            <TextField
              fullWidth
              label={`${t("assessment.criteria.criteriaName")} (English)`}
              value={newCriteriaName.en}
              onChange={(e) =>
                setNewCriteriaName({ ...newCriteriaName, en: e.target.value })
              }
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              label={`${t("assessment.criteria.criteriaName")} (Hindi)`}
              value={newCriteriaName.hi}
              onChange={(e) =>
                setNewCriteriaName({ ...newCriteriaName, hi: e.target.value })
              }
              variant="outlined"
              size="small"
            />
            <TextField
              fullWidth
              label={`${t("assessment.criteria.criteriaName")} (Gujarati)`}
              value={newCriteriaName.gu}
              onChange={(e) =>
                setNewCriteriaName({ ...newCriteriaName, gu: e.target.value })
              }
              variant="outlined"
              size="small"
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleAddCriteria}
              sx={{ bgcolor: colors.primary.blue, flex: 1 }}
            >
              {t("common.add")}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowAddCriteria(false);
                setNewCriteriaName({ en: "", hi: "", gu: "" });
              }}
              sx={{ flex: 1 }}
            >
              {t("common.cancel")}
            </Button>
          </Box>
        </Card>
      </Fade>
      <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
        {criteriaList.map((criteria) => {
          const isSelected = criteria.criteriaId === selectedCriteriaId;
          return (
            <Card
              key={criteria.criteriaId}
              onClick={() => {
                setSelectedCriteriaId(criteria.criteriaId);
                if (matchDownMD) setMobileDrawerOpen(false);
              }}
              sx={{
                mb: 1.5,
                cursor: "pointer",
                transition: "all 0.2s ease",
                border: isSelected
                  ? `2px solid ${colors.primary.blue}`
                  : "2px solid transparent",
                bgcolor: isSelected ? "#eff6ff" : "white",
                boxShadow: isSelected
                  ? `0 4px 12px ${colors.primary.blue}20`
                  : "0 1px 3px rgba(0,0,0,0.08)",
                "&:hover": {
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Chip
                    label={getCriteriaName(criteria)}
                    size="small"
                    sx={{
                      bgcolor: isSelected
                        ? colors.primary.blue
                        : colors.primary.lightest,
                      color: isSelected ? "white" : colors.primary.blue,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: "0.7rem" }}
                  >
                    {criteria.questions?.length || 0}{" "}
                    {t("assessment.question.title")}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {matchDownMD && (
            <IconButton
              onClick={() => setMobileDrawerOpen(true)}
              sx={{ color: colors.primary.blue }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Button
            startIcon={<ArrowBack />}
            onClick={onBack}
            variant="outlined"
            sx={{
              borderColor: colors.primary.blue,
              color: colors.primary.blue,
            }}
          >
            {t("common.back")}
          </Button>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {subdomainData?.subDomainNameEn ||
            subdomainData?.subDomainName ||
            subdomainData?.name?.[currentLanguage] ||
            subdomainData?.name?.en ||
            "Subdomain"}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          height: "calc(100vh - 250px)",
          minHeight: "600px",
        }}
      >
        {/* Desktop Criteria List */}
        {!matchDownMD && (
          <Box sx={{ width: "320px", flexShrink: 0 }}>
            <CriteriaList />
          </Box>
        )}

        {/* Mobile Drawer */}
        {matchDownMD && (
          <Drawer
            anchor="left"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            PaperProps={{
              sx: { width: "280px" },
            }}
          >
            <CriteriaList />
          </Drawer>
        )}

        {/* Questions Content */}
        <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
          {selectedCriteria ? (
            <Box>
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
                      {getCriteriaName(selectedCriteria)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCriteria.questions?.length || 0}{" "}
                      {t("assessment.question.title")}
                    </Typography>
                  </Box>
                </Box>

                {selectedCriteria.questions &&
                selectedCriteria.questions.length > 0 ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    {selectedCriteria.questions.map((question, index) => (
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
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                flex: 1,
                                fontSize: "1rem",
                                lineHeight: 1.6,
                              }}
                            >
                              {getQuestionText(question)}
                            </Typography>
                          </Box>

                          {question.options && question.options.length > 0 && (
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
                                {question.options.map((option, optIndex) => (
                                  <Box
                                    key={option.optionId}
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
                                        label={String.fromCharCode(
                                          65 + optIndex,
                                        )}
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
                    ))}
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
            </Box>
          ) : (
            <Paper
              elevation={1}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {t("assessment.criteria.noCriteria")}
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CriteriaQuestionsView;
