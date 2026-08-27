/**
 * Prefer a single row per questionId when APIs return duplicated answer joins.
 * FLN (type 4) rows are kept as-is (one per class/std); callers already dedupe for display.
 * For other types, prefers an answered row, then null class/section (general).
 */
export function dedupeQuestionsById(questions = []) {
  if (!Array.isArray(questions) || questions.length === 0) return [];

  const flnQuestions = [];
  const map = new Map();

  for (const question of questions) {
    const questionId = question?.questionId;
    if (questionId == null) continue;

    const questionType = Number(question?.questionType);
    if (questionType === 4) {
      flnQuestions.push(question);
      continue;
    }

    const existing = map.get(questionId);
    if (!existing) {
      map.set(questionId, question);
      continue;
    }

    const score = (q) =>
      (q?.answerId || q?.selectedOptionId ? 2 : 0) +
      (q?.class == null && q?.section == null ? 1 : 0);

    if (score(question) > score(existing)) {
      map.set(questionId, question);
    }
  }

  return [...Array.from(map.values()), ...flnQuestions];
}
