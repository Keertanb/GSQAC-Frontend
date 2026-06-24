const SCHOOL_ROLE_ID = 2;
const VERIFIER_ROLE_ID = 3;
const CRC_ROLE_ID = 4;

export function getSchoolSelfAssessmentProgress(assessments = [], fallback = {}) {
  const schoolAssessments = assessments.filter(
    (item) => item.roleId === SCHOOL_ROLE_ID && Number(item.isPublished) === 1,
  );
  const hasSubmitted = schoolAssessments.some((item) => Number(item.isSubmitted) === 1);

  if (schoolAssessments.length > 0 || hasSubmitted) {
    return { completed: hasSubmitted ? 1 : 0, total: 1 };
  }

  const fallbackCompleted = Number(fallback.selfAssessmentsCompleted) || 0;
  return {
    completed: fallbackCompleted > 0 ? 1 : 0,
    total: 1,
  };
}

export function getRoleAssessmentProgress(assessments = [], roleId, fallback = {}) {
  if (roleId === SCHOOL_ROLE_ID) {
    return getSchoolSelfAssessmentProgress(assessments, fallback);
  }

  const roleAssessments = assessments.filter(
    (item) => item.roleId === roleId && Number(item.isPublished) === 1,
  );

  if (roleAssessments.length > 0) {
    return {
      completed: roleAssessments.filter((item) => Number(item.isSubmitted) === 1).length,
      total: roleAssessments.length,
    };
  }

  if (roleId === VERIFIER_ROLE_ID) {
    return {
      completed: Number(fallback.verifierAssessmentsCompleted) || 0,
      total: Number(fallback.verifierAssessmentsTotal) || 0,
    };
  }

  if (roleId === CRC_ROLE_ID) {
    return {
      completed: Number(fallback.crcAssessmentsCompleted) || 0,
      total: Number(fallback.crcAssessmentsTotal) || 0,
    };
  }

  return { completed: 0, total: 0 };
}

export function getSubmittedSchoolSelfAssessment(assessments = []) {
  return (
    assessments
      .filter((item) => item.roleId === SCHOOL_ROLE_ID && Number(item.isSubmitted) === 1)
      .sort((a, b) => String(b.lastUpdatedAt || "").localeCompare(String(a.lastUpdatedAt || "")))[0] ||
    null
  );
}
