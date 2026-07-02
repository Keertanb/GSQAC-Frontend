import React, { useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  LinearProgress,
  Stack,
} from "@mui/material";
import {
  ArrowForward,
  ArrowBack,
  ChevronRight,
  PhotoCamera,
  Close,
  AccountTree,
  Save,
} from "@mui/icons-material";
import { colors } from "../../../../constants/colors";

function renderOptionLabel(option, optIndex, getOptionText, t, isMobile = false) {
  return (
    <Box
      className={`sa-mcq-option-label${
        isMobile ? " sa-mcq-option-label--stacked" : ""
      }`}
    >
      <Chip
        label={t("selfAssessment.level", { level: optIndex })}
        size="small"
        sx={{
          height: 26,
          fontWeight: 700,
          fontSize: "0.6875rem",
          bgcolor: `${colors.primary.blue}14`,
          color: colors.primary.blue,
          border: `1px solid ${colors.primary.blue}30`,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        className="sa-mcq-option-text"
        sx={{ lineHeight: 1.5, width: "100%" }}
      >
        {getOptionText(option)}
      </Typography>
    </Box>
  );
}

function ClassroomSubjectFilters({ c, tabId }) {
  const {
    selectedClassGroup,
    setSelectedClassGroup,
    selectedClass,
    setSelectedClass,
    selectedSection,
    setSelectedSection,
    selectedSubject,
    setSelectedSubject,
    selectedSubdomain,
    setClassWiseAnswers,
    setClassWiseTextAnswers,
    answers,
    textAnswers,
    isLoadingSchoolData,
    filteredClassOptions,
    isLoadingSections,
    sections,
    isLoadingSubjects,
    subjects,
    isReadOnly,
    getGroupFlagColor,
    getFlagColorValue,
    hasSubjectWiseQuestions,
  } = c;

  const isClassroom = tabId === "classroom";
  const isSubject = tabId === "subject";

  if (!isClassroom && !isSubject) return null;

  return (
    <Box className="sa-wizard-filters">
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        {isSubject
          ? "Select class group, class, section and subject"
          : "Select class group, class and section"}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
          <InputLabel>Class Group</InputLabel>
          <Select
            value={selectedClassGroup || ""}
            onChange={(e) => setSelectedClassGroup(e.target.value)}
            label="Class Group"
          >
            {["1-2", "3-5", "6-8"]
              .filter((groupRange) => {
                const flag = getGroupFlagColor(isClassroom ? 2 : 3, groupRange);
                return flag !== null && flag !== undefined && flag !== "gray";
              })
              .map((groupRange) => {
                const flag = getGroupFlagColor(isClassroom ? 2 : 3, groupRange);
                const flagColor = flag ? getFlagColorValue(flag) : null;
                return (
                  <MenuItem key={groupRange} value={groupRange}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {flagColor ? (
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            bgcolor: flagColor,
                          }}
                        />
                      ) : null}
                      Class {groupRange}
                    </Box>
                  </MenuItem>
                );
              })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
          <InputLabel>Select Class</InputLabel>
          <Select
            value={selectedClass || ""}
            onChange={(e) => {
              if (selectedSubdomain && selectedClass) {
                const subdomainId =
                  selectedSubdomain.subDomainId || selectedSubdomain.id;
                const storageKey = `${subdomainId}_${String(selectedClass)}`;
                setClassWiseAnswers((prev) => ({
                  ...prev,
                  [storageKey]: { ...answers },
                }));
                setClassWiseTextAnswers((prev) => ({
                  ...prev,
                  [storageKey]: { ...textAnswers },
                }));
              }
              setSelectedClass(e.target.value);
              setSelectedSection(null);
            }}
            label="Select Class"
            disabled={
              isLoadingSchoolData ||
              filteredClassOptions.length === 0 ||
              (!isPublished && !isReadOnly)
            }
          >
            {filteredClassOptions.map((cls) => (
              <MenuItem key={cls} value={cls}>
                Class {cls}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 160 } }}>
          <InputLabel>Section</InputLabel>
          <Select
            value={selectedSection || ""}
            onChange={(e) => setSelectedSection(e.target.value)}
            label="Section"
            disabled={!selectedClass || isLoadingSections || !isPublished}
          >
            {sections.map((section) => (
              <MenuItem key={section} value={section}>
                {section}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {isSubject && hasSubjectWiseQuestions ? (
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
            <InputLabel>Subject</InputLabel>
            <Select
              value={selectedSubject || ""}
              onChange={(e) => setSelectedSubject(e.target.value)}
              label="Subject"
              disabled={!selectedSection || isLoadingSubjects || !isPublished}
            >
              {subjects.map((subject) => (
                <MenuItem
                  key={subject.subjectId || subject.id}
                  value={subject.subjectId || subject.id}
                >
                  {subject.subjectName || subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Stack>
    </Box>
  );
}

function McqQuestionBody({ question, c, questionNumber, isMobile = false }) {
  const {
    answers,
    handleAnswerChange,
    parseOptions,
    getQuestionText,
    shouldShowApiAnswer,
    isPublished,
    isReadOnly,
    questionAllowsImageUpload,
    getMcqImagesForQuestion,
    getMcqImagePreviewSrc,
    getMcqImageLocation,
    handleMcqImageCaptureClick,
    handleMcqImageRemove,
    t,
    getOptionText,
  } = c;

  const options = parseOptions(question.options);
  const userSelectedAnswer = answers[question.questionId];
  const apiSelectedAnswer =
    shouldShowApiAnswer(question) && question.selectedOptionId
      ? String(question.selectedOptionId)
      : null;
  const selectedAnswer = userSelectedAnswer || apiSelectedAnswer;

  return (
    <Card className="sa-wizard-question-card" elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
          <Chip
            label={`Q ${questionNumber}`}
            size="small"
            sx={{
              bgcolor: colors.primary.dark,
              color: "white",
              fontWeight: 700,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, lineHeight: 1.55, color: colors.text.primary }}
          >
            {getQuestionText(question)}
          </Typography>
        </Box>

        {question.observationCount ? (
          <Chip
            label={`Observation count: ${question.observationCount}`}
            size="small"
            sx={{ mb: 2, fontWeight: 600 }}
          />
        ) : null}

        {options.length > 0 ? (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedAnswer || ""}
              onChange={(e) =>
                handleAnswerChange(question.questionId, e.target.value)
              }
            >
              {options.map((option, optIndex) => (
                <FormControlLabel
                  key={option.optionId || optIndex}
                  className="sa-mcq-option"
                  value={String(option.optionId)}
                  disabled={!isPublished || isReadOnly}
                  control={
                    <Radio
                      sx={{
                        color: colors.primary.blue,
                        "&.Mui-checked": { color: colors.primary.blue },
                        alignSelf: "flex-start",
                        mt: 0.25,
                      }}
                    />
                  }
                  label={renderOptionLabel(
                    option,
                    optIndex,
                    getOptionText,
                    t,
                    isMobile,
                  )}
                  sx={{
                    mb: 1.25,
                    mx: 0,
                    p: 1.5,
                    borderRadius: 2,
                    alignItems: "flex-start",
                    border: "1.5px solid",
                    borderColor:
                      selectedAnswer === String(option.optionId)
                        ? colors.primary.blue
                        : colors.neutral.gray200,
                    bgcolor:
                      selectedAnswer === String(option.optionId)
                        ? colors.primary.lightest
                        : "transparent",
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        ) : null}

        {questionAllowsImageUpload(question) ? (
          <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${colors.neutral.gray200}` }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Add photos (up to 2)
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {[0, 1].map((idx) => {
                const imgs = getMcqImagesForQuestion(question.questionId);
                const item = imgs[idx];
                const src = getMcqImagePreviewSrc(item);
                const location = getMcqImageLocation(item);
                return (
                  <Box key={idx} className="sa-mcq-image-slot">
                    {src ? (
                      <Box sx={{ position: "relative" }}>
                        <Box
                          component="img"
                          src={src}
                          alt=""
                          sx={{
                            width: 120,
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 2,
                            border: `1px solid ${colors.neutral.gray200}`,
                          }}
                        />
                        {!isReadOnly ? (
                          <Button
                            size="small"
                            onClick={() =>
                              handleMcqImageRemove(question.questionId, idx)
                            }
                            sx={{ mt: 0.5, minWidth: 0, p: 0.5 }}
                          >
                            <Close fontSize="small" />
                          </Button>
                        ) : null}
                        {location ? (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {location.address}
                          </Typography>
                        ) : null}
                      </Box>
                    ) : (
                      <Button
                        variant="outlined"
                        disabled={!isPublished || isReadOnly}
                        onClick={() =>
                          handleMcqImageCaptureClick(question.questionId, idx)
                        }
                        startIcon={<PhotoCamera />}
                        sx={{ textTransform: "none" }}
                      >
                        Capture image
                      </Button>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

function FlnQuestionBody({ question, c, questionNumber }) {
  const {
    textAnswers,
    handleTextAnswerChange,
    getQuestionText,
    gradesCounts,
    isPublished,
    isReadOnly,
  } = c;

  const textAnswer = textAnswers[question.questionId] || "";
  let flnData = {};
  try {
    flnData = textAnswer ? JSON.parse(textAnswer) : {};
  } catch {
    flnData = {};
  }

  return (
    <Card className="sa-wizard-question-card" elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 2 }}>
          <Chip
            label={`Q ${questionNumber}`}
            size="small"
            sx={{
              bgcolor: colors.semantic.warning,
              color: "white",
              fontWeight: 700,
              flexShrink: 0,
            }}
          />
          <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.55 }}>
            {getQuestionText(question)}
          </Typography>
        </Box>

        <Stack spacing={2}>
          {[2, 3].map((classNum) => {
            const classData = flnData[classNum] || {
              obtainedMarks: "",
              answerId: null,
            };
            const totalStudents = gradesCounts[classNum] || 0;
            const maxMarks = totalStudents * 10;

            return (
              <Box key={classNum} className="sa-fln-row">
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Class {classNum} · Total students: {totalStudents}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Obtained marks"
                    disabled={!isPublished || isReadOnly}
                    value={classData.obtainedMarks || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        (Number(value) >= 0 && Number(value) <= maxMarks)
                      ) {
                        const newData = {
                          ...flnData,
                          [classNum]: {
                            obtainedMarks: value,
                            answerId: classData.answerId || null,
                          },
                        };
                        handleTextAnswerChange(
                          question.questionId,
                          JSON.stringify(newData),
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E"].includes(e.key)) e.preventDefault();
                    }}
                    inputProps={{ min: 0, max: maxMarks }}
                    sx={{ width: { xs: "100%", sm: 180 } }}
                  />
                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                    Max: {maxMarks}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SubdomainQuestionFlow({
  c,
  matchDownMD,
  setMobileStep,
  scrollMobileToTop,
}) {
  const {
    t,
    selectedDomain,
    selectedSubdomain,
    setSelectedDomain,
    setSelectedSubdomain,
    setAnswers,
    domainNumber,
    subdomainNumber,
    getDomainName,
    getSubdomainName,
    isLoadingQuestions,
    isErrorQuestions,
    allQuestions,
    flattenedQuestions,
    currentQuestionEntry,
    currentQuestionIndex,
    isFirstQuestionInSubdomain,
    isLastQuestionInSubdomain,
    nextSubdomainInfo,
    handleNextQuestion,
    handlePreviousQuestion,
    handleGoToNextSubdomain,
    handleSubmit,
    isSaveAssessmentDisabled,
    submitSubdomainWiseAnswersMutation,
    isPublished,
    isReadOnly,
    selectedClass,
    selectedSection,
    selectedSubject,
    mcqImageInputRef,
    handleMcqImageFileChange,
  } = c;

  const needsClassFilters =
    currentQuestionEntry?.tabId === "classroom" ||
    currentQuestionEntry?.tabId === "subject";
  const filtersReady =
    !needsClassFilters ||
    (selectedClass &&
      selectedSection &&
      (currentQuestionEntry?.tabId !== "subject" || selectedSubject));

  const questionNumber = currentQuestionEntry
    ? `${domainNumber}.${subdomainNumber}.${currentQuestionEntry.questionIndexInTab + 1}`
    : "";

  const progressValue =
    flattenedQuestions.length > 0
      ? ((currentQuestionIndex + 1) / flattenedQuestions.length) * 100
      : 0;

  const questionScrollRef = useRef(null);

  useEffect(() => {
    if (questionScrollRef.current) {
      questionScrollRef.current.scrollTop = 0;
    }
  }, [currentQuestionIndex, selectedSubdomain?.subDomainId, selectedSubdomain?.id]);

  const handleCancel = () => {
    setSelectedDomain(null);
    setSelectedSubdomain(null);
    setAnswers({});
    if (matchDownMD) {
      setMobileStep(0);
      scrollMobileToTop?.();
    }
  };

  if (isLoadingQuestions) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!currentQuestionEntry) {
    return null;
  }

  const { question, tabId, tabLabel, tabColor } = currentQuestionEntry;

  return (
    <Box
      className="sa-question-wizard"
      sx={{
        flex: "1 1 0",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <input
        ref={mcqImageInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleMcqImageFileChange}
      />

      {/* Domain / subdomain context */}
      <Box
        className={`sa-wizard-context${
          matchDownMD ? " sa-wizard-context--compact" : ""
        }`}
      >
        {!matchDownMD ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <AccountTree sx={{ fontSize: 18, color: colors.primary.blue }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.text.secondary }}>
              {domainNumber}. {getDomainName(selectedDomain)}
              <ChevronRight sx={{ fontSize: 14, mx: 0.25, verticalAlign: "middle" }} />
              {domainNumber}.{subdomainNumber}. {getSubdomainName(selectedSubdomain)}
            </Typography>
          </Box>
        ) : null}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              className="sa-wizard-context-title"
              sx={{
                fontWeight: 800,
                lineHeight: 1.25,
                fontSize: { xs: "1rem", sm: "1.25rem" },
              }}
            >
              {getSubdomainName(selectedSubdomain)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Question {currentQuestionIndex + 1} of {flattenedQuestions.length}
            </Typography>
          </Box>
          <Chip
            label={tabLabel}
            size="small"
            sx={{
              fontWeight: 700,
              bgcolor: `${tabColor}18`,
              color: tabColor,
              border: `1px solid ${tabColor}40`,
              flexShrink: 0,
            }}
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            mt: { xs: 1, sm: 1.5 },
            height: { xs: 6, sm: 8 },
            borderRadius: 99,
            bgcolor: colors.neutral.gray200,
            "& .MuiLinearProgress-bar": {
              borderRadius: 99,
              bgcolor: tabColor || colors.primary.blue,
            },
          }}
        />
      </Box>

      <Box
        ref={questionScrollRef}
        className="sa-wizard-question-scroll"
        sx={{
          flex: "1 1 0",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <ClassroomSubjectFilters c={c} tabId={tabId} />

        {isErrorQuestions ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {isErrorQuestions?.message || t("selfAssessment.failedToLoadQuestions")}
          </Alert>
        ) : null}

        {needsClassFilters && !filtersReady && !isReadOnly ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please select the required class filters above to view this question.
          </Alert>
        ) : (
          <>
            {tabId === "fln" ? (
              <FlnQuestionBody
                question={question}
                c={c}
                questionNumber={questionNumber}
              />
            ) : (
              <McqQuestionBody
                question={question}
                c={c}
                questionNumber={questionNumber}
                isMobile={matchDownMD}
              />
            )}
          </>
        )}
      </Box>

      {/* Navigation footer — show prev/next in read-only too */}
      {isPublished ? (
        <Box className="sa-wizard-footer">
          <Box
            className={`sa-wizard-footer-actions${
              matchDownMD ? " sa-wizard-footer-actions--mobile" : ""
            }${isReadOnly ? " sa-wizard-footer-actions--readonly" : ""}`}
          >
            {matchDownMD ? (
              <>
                {!isFirstQuestionInSubdomain ? (
                  <Button
                    variant="outlined"
                    className="sa-wizard-footer-btn sa-wizard-footer-btn--prev"
                    onClick={() => {
                      handlePreviousQuestion();
                      scrollMobileToTop?.();
                    }}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    <span className="sa-wizard-btn-inline">
                      <ArrowBack sx={{ fontSize: 15 }} />
                      <span>Previous</span>
                    </span>
                  </Button>
                ) : null}

                {!isReadOnly ? (
                  <Button
                    variant="outlined"
                    color="success"
                    className="sa-wizard-footer-btn sa-wizard-footer-btn--save"
                    onClick={handleSubmit}
                    disabled={isSaveAssessmentDisabled()}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    {submitSubdomainWiseAnswersMutation.isPending ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <span className="sa-wizard-btn-inline">
                        <Save sx={{ fontSize: 15 }} />
                        <span className="sa-wizard-btn-stacked">
                          <span>Save</span>
                          <span>Assessment</span>
                        </span>
                      </span>
                    )}
                  </Button>
                ) : null}

                {!isLastQuestionInSubdomain ? (
                  <Button
                    variant="contained"
                    className="sa-wizard-footer-btn sa-wizard-footer-btn--next"
                    onClick={() => {
                      handleNextQuestion();
                      scrollMobileToTop?.();
                    }}
                    disabled={!isReadOnly && needsClassFilters && !filtersReady}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: colors.primary.blue,
                    }}
                  >
                    <span className="sa-wizard-btn-inline">
                      <span className="sa-wizard-btn-stacked">
                        <span>Next</span>
                        <span>Question</span>
                      </span>
                      <ArrowForward sx={{ fontSize: 15 }} />
                    </span>
                  </Button>
                ) : nextSubdomainInfo ? (
                  <Button
                    variant="contained"
                    className="sa-wizard-footer-btn sa-wizard-footer-btn--next"
                    onClick={() => {
                      handleGoToNextSubdomain();
                      scrollMobileToTop?.();
                    }}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      bgcolor: colors.primary.blue,
                    }}
                  >
                    <span className="sa-wizard-btn-inline">
                      <span className="sa-wizard-btn-stacked">
                        <span>Next</span>
                        <span>Subdomain</span>
                      </span>
                      <ArrowForward sx={{ fontSize: 15 }} />
                    </span>
                  </Button>
                ) : null}

                {!isReadOnly ? (
                  <Button
                    variant="outlined"
                    className="sa-wizard-footer-btn sa-wizard-footer-btn--cancel"
                    onClick={handleCancel}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                {!isReadOnly ? (
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Box />
                )}

                <Stack direction="row" spacing={1.5}>
                  {!isFirstQuestionInSubdomain ? (
                    <Button
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      onClick={() => {
                        handlePreviousQuestion();
                        scrollMobileToTop?.();
                      }}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    >
                      Previous
                    </Button>
                  ) : null}

                  {!isLastQuestionInSubdomain ? (
                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={() => {
                        handleNextQuestion();
                        scrollMobileToTop?.();
                      }}
                      disabled={!isReadOnly && needsClassFilters && !filtersReady}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        bgcolor: colors.primary.blue,
                      }}
                    >
                      Next question
                    </Button>
                  ) : (
                    <>
                      {nextSubdomainInfo ? (
                        <Button
                          variant="outlined"
                          endIcon={<ArrowForward />}
                          onClick={() => {
                            handleGoToNextSubdomain();
                            scrollMobileToTop?.();
                          }}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Next subdomain
                        </Button>
                      ) : null}
                      {!isReadOnly ? (
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          disabled={isSaveAssessmentDisabled()}
                          startIcon={
                            submitSubdomainWiseAnswersMutation.isPending ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : null
                          }
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            bgcolor: colors.accent.green,
                            "&:hover": { bgcolor: colors.accent.greenDark },
                          }}
                        >
                          {submitSubdomainWiseAnswersMutation.isPending
                            ? "Saving..."
                            : "Save assessment"}
                        </Button>
                      ) : null}
                    </>
                  )}
                </Stack>
              </>
            )}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
