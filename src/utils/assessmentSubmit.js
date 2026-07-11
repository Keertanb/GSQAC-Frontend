import { getAssessmentMandatoryEvidenceProgress } from "../services/evidenceService";

export function isAssessmentSubmitted(assessment) {
  return Number(assessment?.isSubmitted) === 1;
}

export function getDomainProgressFromApi(domain) {
  if (domain?.answerPercentage !== undefined && domain?.answerPercentage !== null) {
    return Number(domain.answerPercentage);
  }

  const subdomains = domain?.subDomain || [];
  if (!subdomains.length) return 0;

  const total = subdomains.reduce(
    (sum, subdomain) => sum + (Number(subdomain.answerPercentage) || 0),
    0,
  );
  return total / subdomains.length;
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
