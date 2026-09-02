import { getAssessmentGradeInfo } from "./assessmentGrading";

const HOSTEL_EXACT_NAMES = new Set([
  "school hostel",
  "શાળા છાત્રાલય",
  "विद्यालय छात्रावास",
]);

const HOSTEL_PARTIAL_MARKERS = [
  "school hostel",
  "શાળા છાત્રાલય",
  "विद्यालय छात्रावास",
];

function normalizeDomainName(value) {
  return String(value).trim().replace(/\s+/g, " ");
}

function domainNameCandidates(domain) {
  return [
    domain?.domainNameEn,
    domain?.domainNameGu,
    domain?.domainNameHi,
    domain?.domainName,
  ]
    .filter((value) => value !== null && value !== undefined && String(value).trim())
    .map(normalizeDomainName);
}

export function isHostelDomain(domain) {
  if (!domain) return false;

  const candidates = domainNameCandidates(domain);
  if (!candidates.length) return false;

  return candidates.some((name) => {
    const lower = name.toLowerCase();
    if (HOSTEL_EXACT_NAMES.has(lower)) return true;

    return HOSTEL_PARTIAL_MARKERS.some(
      (marker) => name.includes(marker) || lower.includes(marker.toLowerCase()),
    );
  });
}

export function normalizeHostelFacilityValue(hostelFacility) {
  if (hostelFacility === null || hostelFacility === undefined || hostelFacility === "") {
    return null;
  }
  return Number(hostelFacility) === 1 ? 1 : 0;
}

export function filterDomainsByHostelFacility(domains, hostelFacility) {
  if (!Array.isArray(domains)) return domains;

  const normalizedHostel = normalizeHostelFacilityValue(hostelFacility);
  if (normalizedHostel === null) return domains;

  if (normalizedHostel === 1) return domains;

  return domains.filter((domain) => !isHostelDomain(domain));
}

export function sumProgressFromDomains(domains) {
  if (!Array.isArray(domains) || domains.length === 0) {
    return { totalQuestions: 0, totalAnswer: 0, answerPercentage: 0 };
  }

  const totalQuestions = domains.reduce(
    (sum, domain) => sum + (Number(domain.totalQuestions) || 0),
    0,
  );
  const totalAnswer = domains.reduce(
    (sum, domain) => sum + (Number(domain.totalAnswer) || 0),
    0,
  );
  const answerPercentage =
    totalQuestions > 0
      ? Math.min(100, Math.max(0, (Math.min(totalAnswer, totalQuestions) / totalQuestions) * 100))
      : 0;

  return {
    totalQuestions,
    totalAnswer: Math.min(totalAnswer, totalQuestions),
    answerPercentage,
  };
}

export function filterAssessmentsByHostelFacility(assessments, hostelFacility) {
  if (!Array.isArray(assessments)) return assessments;

  const normalizedHostel = normalizeHostelFacilityValue(hostelFacility);
  if (normalizedHostel === null) return assessments;

  return assessments.map((assessment) => {
    const filteredDomains = filterDomainsByHostelFacility(
      assessment.domains || [],
      normalizedHostel,
    );

    if (normalizedHostel !== 0) {
      return {
        ...assessment,
        domains: filteredDomains,
      };
    }

    const totals = sumProgressFromDomains(filteredDomains);
    return {
      ...assessment,
      domains: filteredDomains,
      totalQuestions: totals.totalQuestions,
      totalAnswer: totals.totalAnswer,
      answerPercentage: totals.answerPercentage,
    };
  });
}

function flattenReportSubDomains(domains = []) {
  const rows = [];
  domains.forEach((domain) => {
    (domain.subDomains || []).forEach((sub) => {
      rows.push({
        subDomainName: sub.subDomainName,
        percentage: Number(sub.percentage) || 0,
        subDomainOrder: Number(sub.subDomainOrder) || 0,
      });
    });
  });
  return rows;
}

function buildReportStrengths(domains) {
  if (!domains.length) {
    return { mainDomain: null, mainDomainPercentage: null, subDomains: [] };
  }
  const sorted = [...domains].sort(
    (a, b) => (Number(b.percentage) || 0) - (Number(a.percentage) || 0),
  );
  const top = sorted[0];
  const subDomains = flattenReportSubDomains(domains)
    .filter((sub) => sub.percentage >= 60)
    .sort((a, b) => b.percentage - a.percentage || a.subDomainOrder - b.subDomainOrder)
    .slice(0, 3)
    .map((sub) => sub.subDomainName);
  return {
    mainDomain: top?.domainName || null,
    mainDomainPercentage: top?.percentage ?? null,
    subDomains,
  };
}

function buildReportImprovements(domains) {
  if (!domains.length) {
    return { mainDomain: null, mainDomainPercentage: null, subDomains: [] };
  }
  const sorted = [...domains].sort(
    (a, b) => (Number(a.percentage) || 0) - (Number(b.percentage) || 0),
  );
  const lowest = sorted[0];
  const subDomains = flattenReportSubDomains(domains)
    .filter((sub) => sub.percentage < 80)
    .sort((a, b) => a.percentage - b.percentage || a.subDomainOrder - b.subDomainOrder)
    .slice(0, 3)
    .map((sub) => sub.subDomainName);
  return {
    mainDomain: lowest?.domainName || null,
    mainDomainPercentage: lowest?.percentage ?? null,
    subDomains,
  };
}

/** Apply hostel=no filter to submitted assessment report payload. */
export function applyHostelFacilityToAssessmentReport(report, hostelFacility) {
  if (!report?.isSubmitted || !Array.isArray(report.domains)) return report;

  const normalizedHostel = normalizeHostelFacilityValue(hostelFacility);
  if (normalizedHostel === null || normalizedHostel === 1) return report;

  const filteredDomains = filterDomainsByHostelFacility(report.domains, 0);
  if (filteredDomains.length === report.domains.length) return report;

  const totalObtained = filteredDomains.reduce(
    (sum, domain) => sum + (Number(domain.obtainedMarks) || 0),
    0,
  );
  const totalMaxMarks = filteredDomains.reduce(
    (sum, domain) => sum + (Number(domain.maxMarks) || 0),
    0,
  );
  const overallPercentage = filteredDomains.reduce(
    (sum, domain) => sum + (Number(domain.weightedScore) || 0),
    0,
  );

  return {
    ...report,
    domains: filteredDomains,
    summary: {
      ...(report.summary || {}),
      overallPercentage,
      totalObtained,
      totalMaxMarks,
      ...getAssessmentGradeInfo(overallPercentage),
    },
    strengths: buildReportStrengths(filteredDomains),
    improvements: buildReportImprovements(filteredDomains),
  };
}

export function formatHostelFacilityLabel(hostelFacility) {
  if (hostelFacility === null || hostelFacility === undefined || hostelFacility === "") {
    return "Not set";
  }
  return Number(hostelFacility) === 1 ? "Yes" : "No";
}
