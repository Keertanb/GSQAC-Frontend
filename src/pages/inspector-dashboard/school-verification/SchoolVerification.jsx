import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Divider,
} from "@mui/material";
import {
  CheckCircle,
  ArrowForward,
  Assessment,
  Class,
  Assignment,
  ExpandMore,
  ExpandLess,
  WorkspacePremium,
  MenuBook,
  Groups,
  Business,
  School as SchoolIcon,
} from "@mui/icons-material";
import { colors } from "../../../constants/colors";
import {
  useGetDomainsQuery,
  useGetSubdomainQuestionsQuery,
  useSubmitAnswerMutation,
} from "../../../services/adminService";
import { getRoleId } from "../../../constants/roles";
import { enqueueSnackbar } from "notistack";
import { useSubmitSubdomainWiseAnswersMutation } from "../../../services/schoolService";
import useAuthStore from "../../../store/useAuthStore";

const SchoolVerification = () => {
  const { userId, userName } = useAuthStore();
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState(null);
  const [answers, setAnswers] = useState({});
  const [subdomainAnswers, setSubdomainAnswers] = useState({});
  const [questionBatch, setQuestionBatch] = useState(0);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  const languageCodeMap = {
    en: "EN",
    hi: "HI",
    gu: "GU",
  };
  const languageCode = languageCodeMap[currentLanguage] || "EN";

  // Use inspector role ID
  const roleId = getRoleId("inspector");

  const {
    data: domainsData,
    isLoading: isLoadingDomains,
    isError: isErrorDomains,
  } = useGetDomainsQuery({
    roleId,
    languageCode,
    enabled: true,
  });

  const {
    data: questionsData,
    isLoading: isLoadingQuestions,
    isError: isErrorQuestions,
  } = useGetSubdomainQuestionsQuery({
    subDomainId: selectedSubdomain?.subDomainId || selectedSubdomain?.id,
    roleId,
    languageCode,
    userId: userId ? Number(userId) : undefined,
    enabled: !!selectedSubdomain,
  });

  // Get domains from API response or use empty array
  const domains = useMemo(() => {
    if (domainsData?.data && Array.isArray(domainsData.data)) {
      return domainsData.data;
    }
    return [];
  }, [domainsData]);

  // Get questions from API response
  const allQuestions = useMemo(() => {
    if (!questionsData?.data) return [];
    return questionsData.data;
  }, [questionsData]);

  // Separate class-based and general questions
  const classBasedQuestions = useMemo(() => {
    return allQuestions.filter((q) => q.isClassroomObservation === 1);
  }, [allQuestions]);

  const generalQuestions = useMemo(() => {
    return allQuestions.filter((q) => q.isClassroomObservation !== 1);
  }, [allQuestions]);

  // Get domain name based on language
  const getDomainName = (domain) => {
    if (!domain) return "";
    if (currentLanguage === "hi") return domain.domainNameHi || domain.domainName || "";
    if (currentLanguage === "gu") return domain.domainNameGu || domain.domainName || "";
    return domain.domainNameEn || domain.domainName || "";
  };

  // Get subdomain name based on language
  const getSubdomainName = (subdomain) => {
    if (!subdomain) return "";
    if (currentLanguage === "hi") return subdomain.subDomainNameHi || subdomain.subDomainName || "";
    if (currentLanguage === "gu") return subdomain.subDomainNameGu || subdomain.subDomainName || "";
    return subdomain.subDomainNameEn || subdomain.subDomainName || "";
  };

  // Get question text based on language
  const getQuestionText = (question) => {
    if (!question) return "";
    if (currentLanguage === "hi") return question.questionHi || question.questionText || "";
    if (currentLanguage === "gu") return question.questionGu || question.questionText || "";
    return question.questionEn || question.questionText || "";
  };

  // Get option text based on language
  const getOptionText = (option) => {
    if (currentLanguage === "hi") return option.optionHi;
    if (currentLanguage === "gu") return option.optionGu;
    return option.optionEn;
  };

  // Calculate subdomain progress
  const getSubdomainProgress = (subdomain) => {
    if (!subdomain) return 0;
    const answered = subdomain.answeredQuestions || 0;
    const total = subdomain.totalQuestions || 0;
    if (total === 0) return 0;
    return (answered / total) * 100;
  };

  // Calculate domain progress
  const getDomainProgress = (domain) => {
    if (!domain?.subDomain || domain.subDomain.length === 0) return 0;
    const totalSubdomains = domain.subDomain.length;
    const totalProgress = domain.subDomain.reduce((sum, subdomain) => {
      return sum + getSubdomainProgress(subdomain);
    }, 0);
    return totalProgress / totalSubdomains;
  };

  // Get domain icon
  const getDomainIcon = (domain) => {
    if (!domain) return <Assessment sx={{ fontSize: 24 }} />;
    const domainName = getDomainName(domain);
    if (!domainName) return <Assessment sx={{ fontSize: 24 }} />;
    const domainNameLower = domainName.toLowerCase();
    if (domainNameLower.includes("teaching") || domainNameLower.includes("learning")) {
      return <MenuBook sx={{ fontSize: 24 }} />;
    } else if (domainNameLower.includes("infrastructure")) {
      return <Business sx={{ fontSize: 24 }} />;
    } else if (domainNameLower.includes("staff") || domainNameLower.includes("teacher")) {
      return <Groups sx={{ fontSize: 24 }} />;
    } else if (domainNameLower.includes("student")) {
      return <Class sx={{ fontSize: 24 }} />;
    }
    return <Assessment sx={{ fontSize: 24 }} />;
  };

  // Get progress color
  const getProgressColor = (progress) => {
    if (progress === 100) return colors.accent.green;
    if (progress >= 70) return colors.accent.yellow;
    if (progress >= 30) return colors.accent.orange;
    return colors.accent.red;
  };

  // Handle domain selection
  const handleDomainSelect = (domain) => {
    if (selectedDomain?.domainId === domain.domainId) {
      setSelectedDomain(null);
      setSelectedSubdomain(null);
    } else {
      setSelectedDomain(domain);
      setSelectedSubdomain(null);
    }
    setAnswers({});
    setQuestionBatch(0);
    setSelectedClass(null);
    setSelectedSection(null);
  };

  // Handle subdomain selection
  const handleSubdomainSelect = (subdomain) => {
    setSelectedSubdomain(subdomain);
    const subdomainId = subdomain.subDomainId || subdomain.id;
    // Restore previously saved answers for this subdomain
    if (subdomainAnswers[subdomainId]) {
      setAnswers(subdomainAnswers[subdomainId]);
    } else {
      setAnswers({});
    }
    setQuestionBatch(0);
    setSelectedClass(null);
    setSelectedSection(null);
  };

  // Handle answer selection
  const handleAnswerChange = (questionId, optionId) => {
    const newAnswers = {
      ...answers,
      [questionId]: optionId,
    };
    setAnswers(newAnswers);

    if (selectedSubdomain) {
      const subdomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;
      setSubdomainAnswers((prev) => ({
        ...prev,
        [subdomainId]: newAnswers,
      }));
    }
  };

  const submitAnswerMutation = useSubmitAnswerMutation({
    onSuccess: (data) => {
      console.log("Answer submitted successfully:", data);
    },
  });

  const submitSubdomainWiseAnswersMutation =
    useSubmitSubdomainWiseAnswersMutation({
      onSuccess: (data) => {
        if (selectedSubdomain) {
          const subdomainId =
            selectedSubdomain.subDomainId || selectedSubdomain.id;
          setSubdomainAnswers((prev) => ({
            ...prev,
            [subdomainId]: { ...answers },
          }));
        }
        console.log("Subdomain answers submitted successfully:", data);
      },
    });

  // Handle submit
  const handleSubmit = () => {
    if (!selectedSubdomain) {
      enqueueSnackbar("Please select a subdomain first.", {
        variant: "warning",
      });
      return;
    }

    const subDomainId = selectedSubdomain.subDomainId || selectedSubdomain.id;

    if (!answers || Object.keys(answers).length === 0) {
      enqueueSnackbar(
        "Please answer at least one question before submitting.",
        {
          variant: "warning",
        }
      );
      return;
    }

    const hasClassBasedQuestions = classBasedQuestions.length > 0;
    if (hasClassBasedQuestions && questionBatch === 0) {
      if (!selectedClass) {
        enqueueSnackbar("Please select a class before submitting.", {
          variant: "warning",
        });
        return;
      }
      if (!selectedSection) {
        enqueueSnackbar("Please select a section before submitting.", {
          variant: "warning",
        });
        return;
      }
    }

    let clsValue = 2;
    let sectionValue = "";
    const isClassSelected =
      hasClassBasedQuestions && questionBatch === 0 && selectedClass;

    if (isClassSelected) {
      clsValue = Number(selectedClass);
      sectionValue = selectedSection || "";
    } else {
      const firstQuestion = allQuestions[0];
      clsValue = firstQuestion?.class || 2;
      sectionValue = "";
    }

    const answersArray = allQuestions
      .filter((question) => {
        const userSelectedAnswer = answers[question.questionId];
        const apiSelectedAnswer = question.selectedOptionId
          ? String(question.selectedOptionId)
          : null;
        return userSelectedAnswer || apiSelectedAnswer;
      })
      .map((question) => {
        const userSelectedAnswer = answers[question.questionId];
        const apiSelectedAnswer = question.selectedOptionId
          ? String(question.selectedOptionId)
          : null;
        const selectedOptionId = userSelectedAnswer || apiSelectedAnswer;

        const answerObj = {
          answerId: question.answerId || null,
          questionId: question.questionId,
          optionId: Number(selectedOptionId),
        };

        if (isClassSelected) {
          answerObj.cls = clsValue;
          answerObj.section = sectionValue;
        }

        return answerObj;
      });

    if (answersArray.length === 0) {
      enqueueSnackbar(
        "Please answer at least one question before submitting.",
        {
          variant: "warning",
        }
      );
      return;
    }

    if (!userId) {
      enqueueSnackbar("User ID is missing. Please login again.", {
        variant: "error",
      });
      return;
    }

    const payload = {
      isAns: 1,
      subDomainId: subDomainId,
      userId: Number(userId),
      answers: answersArray,
    };

    submitSubdomainWiseAnswersMutation.mutate(payload);
  };

  if (isLoadingDomains && !isErrorDomains && !domainsData?.data) {
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

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#0f172a",
              mb: 0.5,
              fontSize: { xs: "1.75rem", md: "2.125rem" },
            }}
          >
            School Verification
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verify and assess school quality standards
          </Typography>
          {isErrorDomains && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to load domains. Please check your connection.
            </Alert>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {["en", "hi", "gu"].map((lang) => (
            <Chip
              key={lang}
              label={lang.toUpperCase()}
              onClick={() => setCurrentLanguage(lang)}
              color={currentLanguage === lang ? "primary" : "default"}
              sx={{
                cursor: "pointer",
                fontWeight: currentLanguage === lang ? 700 : 400,
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Main Content - Split Layout */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 2, md: 3 },
          minHeight: "calc(100vh - 300px)",
        }}
      >
        {/* Left Panel - Domains and Subdomains */}
        <Paper
          elevation={2}
          sx={{
            width: { xs: "100%", md: "380px" },
            minWidth: { md: "380px" },
            borderRadius: 3,
            bgcolor: "white",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 300px)",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* Left Panel Header */}
          <Box
            sx={{
              p: 3,
              borderBottom: `2px solid ${colors.neutral.gray200}`,
              bgcolor: colors.background.secondary,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.text.primary,
                mb: 0.5,
              }}
            >
              Assessment Domains
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: "0.8125rem" }}
            >
              Navigate through domains and sub-domains
            </Typography>
          </Box>

          {/* Domains/Subdomains List */}
          <Box
            sx={{
              flex: 1,
              overflowY: "auto",
              p: { xs: 2, md: 2.5 },
            }}
          >
            {domains.length > 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                {domains.map((domain) => {
                  const progress = getDomainProgress(domain);
                  const isDomainSelected =
                    selectedDomain?.domainId === domain.domainId;
                  const DomainIcon = getDomainIcon(domain);

                  return (
                    <Box key={domain.domainId}>
                      <Card
                        onClick={() => handleDomainSelect(domain)}
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          border: "1.5px solid",
                          borderColor: isDomainSelected
                            ? colors.primary.blue
                            : "transparent",
                          borderRadius: 2,
                          bgcolor: isDomainSelected
                            ? colors.primary.blue + "08"
                            : colors.background.primary,
                          boxShadow: isDomainSelected
                            ? `0 4px 12px ${colors.primary.blue}15`
                            : "0 2px 8px rgba(0,0,0,0.04)",
                          "&:hover": {
                            transform: "translateX(4px)",
                            boxShadow: `0 6px 16px ${colors.primary.blue}25`,
                            borderColor: colors.primary.blue,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              mb: 1.5,
                            }}
                          >
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.5,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                color: isDomainSelected
                                  ? colors.primary.blue
                                  : colors.text.secondary,
                              }}
                            >
                              {DomainIcon}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 600,
                                  color: isDomainSelected
                                    ? colors.primary.blue
                                    : colors.text.primary,
                                  fontSize: "0.9375rem",
                                  mb: 0.25,
                                }}
                              >
                                D{domain.domainId} {getDomainName(domain)}
                              </Typography>
                            </Box>
                            {progress === 100 && (
                              <CheckCircle
                                sx={{
                                  color: colors.accent.green,
                                  fontSize: 18,
                                }}
                              />
                            )}
                          </Box>
                          {/* Progress Bar */}
                          <Box sx={{ mt: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.7rem",
                                  color: colors.text.secondary,
                                  fontWeight: 500,
                                }}
                              >
                                Progress
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.7rem",
                                  color: getProgressColor(progress),
                                  fontWeight: 600,
                                }}
                              >
                                {Math.round(progress)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: colors.neutral.gray200,
                                "& .MuiLinearProgress-bar": {
                                  borderRadius: 3,
                                  bgcolor: getProgressColor(progress),
                                },
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Show Subdomains when domain is selected */}
                      {isDomainSelected &&
                        domain.subDomain &&
                        domain.subDomain.length > 0 && (
                          <Box
                            sx={{
                              mt: 1.5,
                              ml: 2,
                              pl: 2,
                              borderLeft: `2px solid ${colors.neutral.gray200}`,
                            }}
                          >
                            {domain.subDomain.map((subdomain, index) => {
                              const subdomainId =
                                subdomain.subDomainId || subdomain.id;
                              const subdomainProgress =
                                getSubdomainProgress(subdomain);
                              const isSubdomainSelected =
                                selectedSubdomain?.subDomainId === subdomainId;

                              return (
                                <Card
                                  key={subdomainId}
                                  onClick={() =>
                                    handleSubdomainSelect(subdomain)
                                  }
                                  sx={{
                                    cursor: "pointer",
                                    mb: 1,
                                    transition: "all 0.3s ease",
                                    border: "1px solid",
                                    borderColor: isSubdomainSelected
                                      ? colors.primary.blue
                                      : colors.neutral.gray200,
                                    borderRadius: 1.5,
                                    bgcolor: isSubdomainSelected
                                      ? colors.primary.blue + "05"
                                      : "white",
                                    boxShadow: isSubdomainSelected
                                      ? `0 2px 8px ${colors.primary.blue}10`
                                      : "none",
                                    "&:hover": {
                                      borderColor: colors.primary.blue,
                                      bgcolor: colors.primary.blue + "05",
                                    },
                                  }}
                                >
                                  <CardContent
                                    sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                      }}
                                    >
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 600,
                                          color: isSubdomainSelected
                                            ? colors.primary.blue
                                            : colors.text.primary,
                                          fontSize: "0.8125rem",
                                        }}
                                      >
                                        SD{index + 1}.{" "}
                                        {getSubdomainName(subdomain)}
                                      </Typography>
                                      {subdomainProgress === 100 && (
                                        <CheckCircle
                                          sx={{
                                            color: colors.accent.green,
                                            fontSize: 16,
                                          }}
                                        />
                                      )}
                                    </Box>
                                    <Box sx={{ mt: 1 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: "0.65rem",
                                          color:
                                            getProgressColor(subdomainProgress),
                                          fontWeight: 600,
                                        }}
                                      >
                                        {Math.round(subdomainProgress)}%
                                        Complete
                                      </Typography>
                                      <LinearProgress
                                        variant="determinate"
                                        value={subdomainProgress}
                                        sx={{
                                          height: 4,
                                          borderRadius: 2,
                                          mt: 0.5,
                                          bgcolor: colors.neutral.gray200,
                                          "& .MuiLinearProgress-bar": {
                                            borderRadius: 2,
                                            bgcolor:
                                              getProgressColor(
                                                subdomainProgress
                                              ),
                                          },
                                        }}
                                      />
                                    </Box>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </Box>
                        )}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No domains available
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Right Panel - Questions */}
        <Paper
          elevation={2}
          sx={{
            flex: 1,
            borderRadius: 3,
            bgcolor: "white",
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 300px)",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          }}
        >
          {!selectedSubdomain ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                p: 4,
              }}
            >
              <Assignment sx={{ fontSize: 80, color: "#cbd5e1", mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Select a Subdomain
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose a subdomain from the left panel to start verification
              </Typography>
            </Box>
          ) : (
            <>
              {/* Questions Header */}
              <Box
                sx={{
                  p: 3,
                  borderBottom: `2px solid ${colors.neutral.gray200}`,
                  bgcolor: colors.background.secondary,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.text.primary,
                    mb: 0.5,
                  }}
                >
                  {getSubdomainName(selectedSubdomain)}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.8125rem" }}
                >
                  Answer all questions to complete verification
                </Typography>
              </Box>

              {/* Questions Content */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 3,
                }}
              >
                {isLoadingQuestions ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "300px",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : allQuestions.length > 0 ? (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    {allQuestions.map((question, index) => (
                      <Card
                        key={question.questionId}
                        sx={{
                          borderRadius: 2,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 600,
                                color: colors.text.primary,
                                mb: 1,
                              }}
                            >
                              Q{index + 1}. {getQuestionText(question)}
                            </Typography>
                            {question.isClassroomObservation === 1 && (
                              <Chip
                                label="Classroom Observation"
                                size="small"
                                color="primary"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Box>

                          <RadioGroup
                            value={
                              answers[question.questionId] ||
                              (question.selectedOptionId
                                ? String(question.selectedOptionId)
                                : "")
                            }
                            onChange={(e) =>
                              handleAnswerChange(
                                question.questionId,
                                e.target.value
                              )
                            }
                          >
                            {question.options &&
                              question.options.map((option) => (
                                <FormControlLabel
                                  key={option.optionId}
                                  value={String(option.optionId)}
                                  control={<Radio />}
                                  label={getOptionText(option)}
                                  sx={{
                                    mb: 1,
                                    p: 1.5,
                                    borderRadius: 1.5,
                                    border: "1px solid",
                                    borderColor:
                                      answers[question.questionId] ===
                                        String(option.optionId) ||
                                      (!answers[question.questionId] &&
                                        question.selectedOptionId ===
                                          option.optionId)
                                        ? colors.primary.blue
                                        : colors.neutral.gray200,
                                    bgcolor:
                                      answers[question.questionId] ===
                                        String(option.optionId) ||
                                      (!answers[question.questionId] &&
                                        question.selectedOptionId ===
                                          option.optionId)
                                        ? colors.primary.blue + "05"
                                        : "transparent",
                                    "&:hover": {
                                      bgcolor: colors.primary.blue + "05",
                                      borderColor: colors.primary.blue,
                                    },
                                  }}
                                />
                              ))}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      No questions available
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Submit Button */}
              {allQuestions.length > 0 && (
                <Box
                  sx={{
                    p: 3,
                    borderTop: `2px solid ${colors.neutral.gray200}`,
                    bgcolor: colors.background.secondary,
                  }}
                >
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleSubmit}
                    disabled={submitSubdomainWiseAnswersMutation.isPending}
                    endIcon={<ArrowForward />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: "1rem",
                      textTransform: "none",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #5568d3 0%, #6a4193 100%)",
                      },
                    }}
                  >
                    {submitSubdomainWiseAnswersMutation.isPending
                      ? "Submitting..."
                      : "Submit Answers"}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default SchoolVerification;

