import { getAssessmentMandatoryEvidenceProgress } from "../services/evidenceService";

/** Keep progress display/logic in the valid 0–100 range. */
export function clampProgressPercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return numeric;
}

export function isAssessmentSubmitted(assessment) {
  return Number(assessment?.isSubmitted) === 1;
}

export function getDomainProgressFromApi(domain) {
  if (domain?.answerPercentage !== undefined && domain?.answerPercentage !== null) {
    return clampProgressPercentage(domain.answerPercentage);
  }

  const subdomains = domain?.subDomain || [];
  if (!subdomains.length) return 0;

  const total = subdomains.reduce(
    (sum, subdomain) =>
      sum + clampProgressPercentage(subdomain.answerPercentage),
    0,
  );
  return clampProgressPercentage(total / subdomains.length);
}

/** Cap API progress fields so UI never receives >100% from domain payloads. */
export function sanitizeDomainsProgress(domains = []) {
  if (!Array.isArray(domains)) return [];

  return domains.map((domain) => ({
    ...domain,
    answerPercentage: clampProgressPercentage(domain?.answerPercentage),
    totalAnswer: Math.min(
      Number(domain?.totalAnswer) || 0,
      Number(domain?.totalQuestions) || 0,
    ),
    subDomain: (domain.subDomain || []).map((subdomain) => ({
      ...subdomain,
      answerPercentage: clampProgressPercentage(subdomain?.answerPercentage),
      totalAnswer: Math.min(
        Number(subdomain?.totalAnswer) || 0,
        Number(subdomain?.totalQuestions) || 0,
      ),
    })),
  }));
}

export function isAssessmentAnswersComplete(assessment) {
  const domains = assessment?.domains || [];
  if (!domains.length) return false;

  return domains.every(
    (domain) => Math.round(getDomainProgressFromApi(domain)) === 100,
  );
}

export function isAssessmentFullyComplete(assessment) {
  const domains = assessment?.domains || [];
  if (!domains.length) return false;

  return (
    isAssessmentAnswersComplete(assessment) &&
    getAssessmentMandatoryEvidenceProgress(domains).isComplete
  );
}

export function getIncompleteAssessments(assessments = []) {
  return assessments.filter((assessment) => !isAssessmentFullyComplete(assessment));
}
