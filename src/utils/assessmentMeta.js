export function formatKakshaLabel(level, t) {
  if (level == null || level === "" || Number.isNaN(Number(level))) {
    return null;
  }
  const kaksha = Number(level);
  if (kaksha < 0) return null;
  if (typeof t === "function") {
    return t("selfAssessment.level", { level: kaksha });
  }
  return `કક્ષા ${kaksha}`;
}

export function parseQuestionOptions(options) {
  let list = [];
  try {
    if (Array.isArray(options)) list = options;
    else if (typeof options === "string") list = JSON.parse(options);
    else list = options || [];
  } catch {
    list = [];
  }

  if (!Array.isArray(list)) return [];

  return [...list]
    .sort((a, b) => Number(a?.optionId || 0) - Number(b?.optionId || 0))
    .map((option, index) => {
      const fromApi = Number(option?.kakshaLevel);
      return {
        ...option,
        kakshaLevel: Number.isFinite(fromApi) ? fromApi : index,
      };
    });
}

export function getOptionKakshaLevel(option, fallbackIndex = 0) {
  const fromOption = Number(option?.kakshaLevel);
  if (Number.isFinite(fromOption) && fromOption >= 0) return fromOption;
  return fallbackIndex;
}

export function getKakshaLevelFromQuestion(question, selectedOptionId) {
  if (!question) return null;

  const questionType = question.questionType || (question.isClassroomObservation === 1 ? 2 : 1);

  if (questionType === 4 || questionType === "4") {
    return null;
  }

  const fromApi = Number(question.selectedKakshaLevel);
  if (
    (selectedOptionId == null || selectedOptionId === "") &&
    Number.isFinite(fromApi) &&
    fromApi >= 0
  ) {
    return fromApi;
  }

  const optionId =
    selectedOptionId ?? question.selectedOptionId ?? question.optionId;
  if (optionId == null || optionId === "") {
    return Number.isFinite(fromApi) && fromApi >= 0 ? fromApi : null;
  }

  const options = parseQuestionOptions(question.options);
  const selected = options.find(
    (option) => String(option.optionId) === String(optionId),
  );
  if (!selected) {
    return Number.isFinite(fromApi) && fromApi >= 0 ? fromApi : null;
  }

  return getOptionKakshaLevel(selected, options.indexOf(selected));
}

export function formatRoundLabel(round, t) {
  if (round == null || round === "") return null;
  if (typeof t === "function") {
    return t("common.roundValue", { round });
  }
  return `Round ${round}`;
}

export function formatAcademicYearLabel(academicYear, t) {
  if (!academicYear) return null;
  if (typeof t === "function") {
    return t("common.academicYearValue", { year: academicYear });
  }
  return academicYear;
}

export const ENV_ACADEMIC_YEAR =
  import.meta.env.VITE_ACADEMIC_YEAR || "2026-27";
export const ENV_ROUND = Number(import.meta.env.VITE_ROUND ?? 1);

export function resolveAssessmentPeriod(assessment = {}) {
  const academicYear = assessment?.academicYear || ENV_ACADEMIC_YEAR;
  const roundValue = assessment?.round ?? ENV_ROUND;
  const round =
    roundValue === "" || roundValue == null ? ENV_ROUND : Number(roundValue);

  return {
    academicYear,
    round: Number.isFinite(round) ? round : ENV_ROUND,
  };
}

export function formatAssessmentPeriod(assessment, t) {
  const period = resolveAssessmentPeriod(assessment);
  const parts = [
    formatAcademicYearLabel(period.academicYear, t),
    formatRoundLabel(period.round, t),
  ].filter(Boolean);
  return parts.join(" · ");
}

export function getAssessmentPeriodFromList(items = []) {
  const withPeriod = items.find(
    (item) => item?.academicYear || item?.round != null,
  );
  return resolveAssessmentPeriod(withPeriod);
}
