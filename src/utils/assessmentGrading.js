export function getAssessmentGradeInfo(percentage) {
  const pct = Number(percentage) || 0;

  if (pct >= 96) return { grade: "A+", stars: 5, colorCategory: "green", legendLabel: "A5" };
  if (pct >= 91) return { grade: "A+", stars: 4, colorCategory: "green", legendLabel: "A4" };
  if (pct >= 86) return { grade: "A+", stars: 3, colorCategory: "green", legendLabel: "A3" };
  if (pct >= 81) return { grade: "A", stars: 2, colorCategory: "green", legendLabel: "A2" };
  if (pct >= 76) return { grade: "A", stars: 1, colorCategory: "green", legendLabel: "A1" };
  if (pct >= 51) return { grade: "B", stars: 0, colorCategory: "yellow", legendLabel: "B" };
  if (pct >= 26) return { grade: "C", stars: 0, colorCategory: "red", legendLabel: "C" };
  return { grade: "D", stars: 0, colorCategory: "grey", legendLabel: "D" };
}

export function getScoreBarColor(percentage) {
  const pct = Number(percentage) || 0;
  if (pct >= 76) return "#22c55e";
  if (pct >= 51) return "#eab308";
  if (pct >= 26) return "#ef4444";
  return "#9ca3af";
}

export const GRADING_LEGEND = [
  { label: "> 95%", grade: "A", stars: 5, color: "#166534" },
  { label: "> 90% to <= 95%", grade: "A", stars: 4, color: "#15803d" },
  { label: "> 85% to <= 90%", grade: "A", stars: 3, color: "#22c55e" },
  { label: "> 80% to <= 85%", grade: "A", stars: 2, color: "#4ade80" },
  { label: "> 75% to <= 80%", grade: "A", stars: 1, color: "#86efac" },
  { label: "> 50% to <= 75%", grade: "B", stars: 0, color: "#eab308" },
  { label: "> 25% to <= 50%", grade: "C", stars: 0, color: "#f87171" },
  { label: "> 0% to <= 25%", grade: "D", stars: 0, color: "#9ca3af" },
];
