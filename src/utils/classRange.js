export const DEFAULT_LOWER_CLASS = 1;
export const DEFAULT_UPPER_CLASS = 12;
export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

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

