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
    totalQuestions > 0 ? (totalAnswer / totalQuestions) * 100 : 0;

  return { totalQuestions, totalAnswer, answerPercentage };
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

export function formatHostelFacilityLabel(hostelFacility) {
  if (hostelFacility === null || hostelFacility === undefined || hostelFacility === "") {
    return "Not set";
  }
  return Number(hostelFacility) === 1 ? "Yes" : "No";
}
