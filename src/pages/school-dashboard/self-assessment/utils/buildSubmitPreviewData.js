import {
  getSubdomainQuestions,
  getSubmitPreviewQuestions,
} from "../../../../services/schoolService";
import {
  getKakshaLevelFromQuestion,
  parseQuestionOptions,
} from "../../../../utils/assessmentMeta";

function getQuestionType(question) {
  return question.questionType || (question.isClassroomObservation === 1 ? 2 : 1);
}

function resolveAnswerLabel(question) {
  const questionType = getQuestionType(question);

  if (questionType === 4 || questionType === "4") {
    const marks = question.obtainedMarks ?? question.answerText;
    if (marks != null && marks !== "" && question.std != null) {
      return `${marks} marks`;
    }
    return null;
  }

  if (!question.selectedOptionId) return null;

  const options = parseQuestionOptions(question.options);
  const selected = options.find(
    (option) => String(option.optionId) === String(question.selectedOptionId),
  );

  return selected?.optionText || `Option ${question.selectedOptionId}`;
}

function buildQuestionContext(question) {
  const questionType = getQuestionType(question);
  const parts = [];

  if (question.cls != null || question.class != null || question.std != null) {
    parts.push(`Class ${question.cls ?? question.class ?? question.std}`);
  }
  if (question.section) {
    parts.push(`Section ${question.section}`);
  }
  if (
    (questionType === 3 || questionType === "3") &&
    (question.subjectName || question.subject)
  ) {
    parts.push(question.subjectName || question.subject);
  }

  return parts.length ? parts.join(" · ") : null;
}

function extractQuestions(questions) {
  const items = [];

  questions.forEach((question) => {
    const answerLabel = resolveAnswerLabel(question);
    if (!answerLabel) return;

    items.push({
      questionId: question.questionId,
      questionText: question.questionText || "",
      answerLabel,
      kakshaLevel: getKakshaLevelFromQuestion(question),
      context: buildQuestionContext(question),
    });
  });

  return items;
}

function normalizeQuestionsResponse(response) {
  if (response?.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
}

function groupQuestionsBySubDomain(questions = []) {
  const map = new Map();
  questions.forEach((question) => {
    const key = Number(question.subDomainId);
    if (!Number.isFinite(key)) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(question);
  });
  return map;
}

function buildPreviewFromQuestionMap({
  domains,
  questionsBySubDomain,
  getDomainName,
  getSubdomainName,
}) {
  const previewDomains = [];

  domains.forEach((domain, domainIndex) => {
    const subdomainList = domain.subDomain || [];
    const previewSubdomains = [];

    subdomainList.forEach((subdomain, subdomainIndex) => {
      const subDomainId = Number(subdomain.subDomainId || subdomain.id);
      const questions = questionsBySubDomain.get(subDomainId) || [];
      const answeredQuestions = extractQuestions(questions);
      if (!answeredQuestions.length) return;

      previewSubdomains.push({
        subdomainName: getSubdomainName(subdomain),
        subdomainIndex: subdomainIndex + 1,
        questions: answeredQuestions.map((item, questionIndex) => ({
          ...item,
          questionNumber: `${domainIndex + 1}.${subdomainIndex + 1}.${questionIndex + 1}`,
        })),
      });
    });

    if (previewSubdomains.length) {
      previewDomains.push({
        domainName: getDomainName(domain),
        domainIndex: domainIndex + 1,
        subdomains: previewSubdomains,
      });
    }
  });

  return previewDomains;
}

/** Legacy fallback: one request per subdomain (used if batch endpoint is unavailable). */
async function buildSubmitPreviewDataLegacy({
  domains,
  roleId,
  languageCode,
  userId,
  getDomainName,
  getSubdomainName,
}) {
  const previewDomains = [];

  for (let domainIndex = 0; domainIndex < domains.length; domainIndex += 1) {
    const domain = domains[domainIndex];
    const subdomainList = domain.subDomain || [];
    const previewSubdomains = [];

    const subdomainResults = await Promise.all(
      subdomainList.map(async (subdomain) => {
        const subDomainId = subdomain.subDomainId || subdomain.id;
        const response = await getSubdomainQuestions({
          subDomainId,
          roleId,
          languageCode,
          userId,
        });
        return {
          subdomain,
          questions: normalizeQuestionsResponse(response),
        };
      }),
    );

    subdomainResults.forEach(({ subdomain, questions }, subdomainIndex) => {
      const answeredQuestions = extractQuestions(questions);
      if (!answeredQuestions.length) return;

      previewSubdomains.push({
        subdomainName: getSubdomainName(subdomain),
        subdomainIndex: subdomainIndex + 1,
        questions: answeredQuestions.map((item, questionIndex) => ({
          ...item,
          questionNumber: `${domainIndex + 1}.${subdomainIndex + 1}.${questionIndex + 1}`,
        })),
      });
    });

    if (previewSubdomains.length) {
      previewDomains.push({
        domainName: getDomainName(domain),
        domainIndex: domainIndex + 1,
        subdomains: previewSubdomains,
      });
    }
  }

  return previewDomains;
}

export async function buildSubmitPreviewData({
  domains,
  roleId,
  languageCode,
  userId,
  getDomainName,
  getSubdomainName,
  questionsBySubDomain = null,
}) {
  if (questionsBySubDomain instanceof Map) {
    return buildPreviewFromQuestionMap({
      domains,
      questionsBySubDomain,
      getDomainName,
      getSubdomainName,
    });
  }

  return buildSubmitPreviewDataLegacy({
    domains,
    roleId,
    languageCode,
    userId,
    getDomainName,
    getSubdomainName,
  });
}

export async function buildSubmitPreviewDataForAssessments({
  assessments,
  roleId,
  languageCode,
  userId,
  schoolId,
  getDomainName,
  getSubdomainName,
  getAssessmentName,
}) {
  let questionsBySubDomain = null;

  try {
    const batchResponse = await getSubmitPreviewQuestions({
      roleId,
      languageCode,
      userId,
      schoolId,
    });
    const allQuestions = normalizeQuestionsResponse(batchResponse);
    questionsBySubDomain = groupQuestionsBySubDomain(allQuestions);
  } catch (error) {
    console.warn(
      "[submit-preview] Batch endpoint unavailable, falling back to per-subdomain fetches:",
      error?.message || error,
    );
  }

  const combinedPreview = [];

  for (let assessmentIndex = 0; assessmentIndex < assessments.length; assessmentIndex += 1) {
    const assessment = assessments[assessmentIndex];
    const assessmentLabel =
      getAssessmentName?.(assessment) ||
      assessment.assessmentName ||
      `Assessment ${assessmentIndex + 1}`;
    const previewDomains = await buildSubmitPreviewData({
      domains: assessment.domains || [],
      roleId,
      languageCode,
      userId,
      getDomainName,
      getSubdomainName,
      questionsBySubDomain,
    });

    previewDomains.forEach((domain) => {
      combinedPreview.push({
        ...domain,
        assessmentName: assessmentLabel,
        academicYear: assessment.academicYear || null,
        round: assessment.round ?? null,
        domainName: `${assessmentLabel} — ${domain.domainName}`,
      });
    });
  }

  return combinedPreview;
}
