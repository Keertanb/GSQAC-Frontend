import { getAssessmentGradeInfo, getScoreBarColor } from "../../../../utils/assessmentGrading";

export function formatYearLabel(academicYear) {
  return academicYear?.replace("-", " – ") || "2024 – 2025";
}

export function formatMarks(value) {
  const num = Number(value) || 0;
  return num % 1 === 0 ? String(num) : num.toFixed(1);
}

export function formatPercent(value) {
  const num = Number(value) || 0;
  return num % 1 === 0 ? `${num}%` : `${num.toFixed(1)}%`;
}

export function getPerformanceTier(percentage) {
  const pct = Number(percentage) || 0;
  if (pct >= 76) return { label: "ઉત્તમ", tone: "excellent" };
  if (pct >= 51) return { label: "સંતોષજનક", tone: "good" };
  if (pct >= 26) return { label: "સુધારણાની જરૂર", tone: "fair" };
  return { label: "નબળું", tone: "poor" };
}

export function computeReportStats(report) {
  const domains = report?.domains || [];
  let totalQuestions = 0;
  let answeredQuestions = 0;
  let subdomainCount = 0;

  domains.forEach((domain) => {
    totalQuestions += Number(domain.questionCount) || 0;
    (domain.subDomains || []).forEach((sub) => {
      subdomainCount += 1;
      (sub.questions || []).forEach((question) => {
        if (Number(question.isAnswered) === 1 || question.isAnswered === true) {
          answeredQuestions += 1;
        }
      });
    });
  });

  const sortedDomains = [...domains].sort(
    (a, b) => (Number(b.percentage) || 0) - (Number(a.percentage) || 0),
  );

  const summary = report?.summary || {};
  const gradeInfo = getAssessmentGradeInfo(summary.overallPercentage);

  return {
    domainCount: domains.length,
    subdomainCount,
    totalQuestions,
    answeredQuestions,
    completionRate:
      totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0,
    topDomain: sortedDomains[0] || null,
    lowestDomain: sortedDomains[sortedDomains.length - 1] || null,
    gradeInfo,
    generatedOn: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}

export function getDomainAccent(order) {
  const palette = [
    "#0d9488",
    "#4f46e5",
    "#7c3aed",
    "#db2777",
    "#ea580c",
    "#0891b2",
  ];
  return palette[(Number(order) - 1) % palette.length];
}

export { getScoreBarColor, getAssessmentGradeInfo };
