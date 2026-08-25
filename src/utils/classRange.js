export const DEFAULT_LOWER_CLASS = 1;
export const DEFAULT_UPPER_CLASS = 12;
export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

/** CTS Pre-Primary (lowclass=1, highclass=-1) → show questions for classes 1–2. */
export const PRE_PRIMARY_CLASS_RANGE = { lowerClass: 1, upperClass: 2 };

/**
 * Normalize school class bounds for filters / class pickers.
 * Maps Pre-Primary sentinel (1 / -1) and category 12 to 1–2.
 */
export function resolveEffectiveSchoolClassRange(
  lowerClass,
  upperClass,
  schoolCategoryId = null,
) {
  const lower = Number(lowerClass);
  const upper = Number(upperClass);

  if (
    !Number.isNaN(lower) &&
    !Number.isNaN(upper) &&
    lower > 0 &&
    upper > 0 &&
    lower <= upper
  ) {
    return { lowerClass: lower, upperClass: upper };
  }

  if (Number(schoolCategoryId) === 12) {
    return { ...PRE_PRIMARY_CLASS_RANGE };
  }

  if (
    !Number.isNaN(lower) &&
    lower === 1 &&
    (Number.isNaN(upper) || upper <= 0 || upper < lower)
  ) {
    return { ...PRE_PRIMARY_CLASS_RANGE };
  }

  return {
    lowerClass: !Number.isNaN(lower) && lower > 0 ? lower : null,
    upperClass: !Number.isNaN(upper) && upper > 0 ? upper : null,
  };
}

export function classRangesOverlap(entityLower, entityUpper, schoolLower, schoolUpper) {
  if (schoolLower == null || schoolUpper == null) return true;

  const el = Number(entityLower ?? DEFAULT_LOWER_CLASS);
  const eu = Number(entityUpper ?? DEFAULT_UPPER_CLASS);
  const sl = Number(schoolLower);
  const su = Number(schoolUpper);

  if (Number.isNaN(el) || Number.isNaN(eu) || Number.isNaN(sl) || Number.isNaN(su)) {
    return true;
  }

  return el <= su && eu >= sl;
}

export function formatClassRange(lowerClass, upperClass) {
  const lower = Number(lowerClass ?? DEFAULT_LOWER_CLASS);
  const upper = Number(upperClass ?? DEFAULT_UPPER_CLASS);
  return `${lower}–${upper}`;
}

export function filterQuestionsByClassRange(
  questions,
  schoolLower,
  schoolUpper,
  selectedClass = null,
) {
  if (!Array.isArray(questions)) return questions;

  if (selectedClass != null && selectedClass !== "") {
    const cls = Number(selectedClass);
    if (Number.isNaN(cls)) return questions;
    return questions.filter((question) => {
      const el = Number(question.lowerClass ?? DEFAULT_LOWER_CLASS);
      const eu = Number(question.upperClass ?? DEFAULT_UPPER_CLASS);
      if (Number.isNaN(el) || Number.isNaN(eu)) return true;
      return el <= cls && eu >= cls;
    });
  }

  if (schoolLower == null || schoolUpper == null) return questions;

  return questions.filter((question) =>
    classRangesOverlap(
      question.lowerClass,
      question.upperClass,
      schoolLower,
      schoolUpper,
    ),
  );
}

