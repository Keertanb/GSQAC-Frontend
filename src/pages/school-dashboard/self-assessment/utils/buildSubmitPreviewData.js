import { getSubdomainQuestions } from "../../../../services/schoolService";

function parseOptions(options) {
  try {
    if (Array.isArray(options)) return options;
    if (typeof options === "string") return JSON.parse(options);
    return options || [];
  } catch {
    return [];
  }
}

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

  const options = parseOptions(question.options);
  const selected = options.find(
    (option) => String(option.optionId) === String(question.selectedOptionId),
  );

  return selected?.optionText || `Option ${question.selectedOptionId}`;
}

function buildQuestionContext(question) {
  const questionType = getQuestionType(question);
  const parts = [];

  if (question.cls != null || question.std != null) {
    parts.push(`Class ${question.cls ?? question.std}`);
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
  return [];
}

export async function buildSubmitPreviewData({
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
