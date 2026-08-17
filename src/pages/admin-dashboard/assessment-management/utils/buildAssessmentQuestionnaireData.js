import { getSubdomainQuestions } from "../../../../services/adminService";
import { parseQuestionOptions } from "../../../../utils/assessmentMeta";

function pickLocalized(item, languageCode, enKey, hiKey, guKey, fallbackKeys = []) {
  const ordered =
    languageCode === "EN"
      ? [enKey, guKey, hiKey, ...fallbackKeys]
      : languageCode === "HI"
        ? [hiKey, guKey, enKey, ...fallbackKeys]
        : [guKey, enKey, hiKey, ...fallbackKeys];

  for (const key of ordered) {
    const value = item?.[key];
    if (value != null && String(value).trim() !== "") return String(value);
  }
  return "";
}

function normalizeQuestionsResponse(response) {
  if (response?.data?.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response)) return response;
  return [];
}

function getQuestionText(question, languageCode) {
  return (
    pickLocalized(question, languageCode, "questionTextEn", "questionTextHi", "questionTextGu", [
      "questionText",
    ]) || ""
  );
}

function getOptionText(option, languageCode) {
  return (
    pickLocalized(option, languageCode, "optionTextEn", "optionTextHi", "optionTextGu", [
      "optionText",
    ]) || ""
  );
}

function mapQuestion(question, languageCode, questionNumber) {
  const options = parseQuestionOptions(question.options).map((option) => ({
    optionId: option.optionId,
    optionText: getOptionText(option, languageCode),
    kakshaLevel: option.kakshaLevel,
  }));

  return {
    questionId: question.questionId,
    questionNumber,
    questionText: getQuestionText(question, languageCode),
    questionType: question.questionType,
    options,
    lowerClass: question.lowerClass ?? null,
    upperClass: question.upperClass ?? null,
  };
}

function getSubdomainList(domain) {
  const raw = domain?.subDomain;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function buildDomainsForAssessment({
  domains,
  languageCode,
  getDomainName,
  getSubdomainName,
}) {
  const previewDomains = [];

  for (let domainIndex = 0; domainIndex < domains.length; domainIndex += 1) {
    const domain = domains[domainIndex];
    const subdomainList = getSubdomainList(domain);
    const previewSubdomains = [];

    const subdomainResults = await Promise.all(
      subdomainList.map(async (subdomain) => {
        const subDomainId = subdomain.subDomainId || subdomain.id;
        if (!subDomainId) {
          return { subdomain, questions: [] };
        }
        try {
          const response = await getSubdomainQuestions({
            subDomainId,
            roleId: 1,
            languageCode,
          });
          return {
            subdomain,
            questions: normalizeQuestionsResponse(response),
          };
        } catch (error) {
          console.error("Failed to load subdomain questions for PDF:", error);
          return { subdomain, questions: [] };
        }
      }),
    );

    subdomainResults.forEach(({ subdomain, questions }, subdomainIndex) => {
      const mappedQuestions = questions.map((question, questionIndex) =>
        mapQuestion(
          question,
          languageCode,
          `${domainIndex + 1}.${subdomainIndex + 1}.${questionIndex + 1}`,
        ),
      );
      if (!mappedQuestions.length) return;

      previewSubdomains.push({
        subdomainName:
          getSubdomainName?.(subdomain) ||
          pickLocalized(
            subdomain,
            languageCode,
            "subDomainNameEn",
            "subDomainNameHi",
            "subDomainNameGu",
            ["subDomainName"],
          ),
        subdomainIndex: subdomainIndex + 1,
        questions: mappedQuestions,
      });
    });

    if (!previewSubdomains.length) continue;

    previewDomains.push({
      domainName:
        getDomainName?.(domain) ||
        pickLocalized(domain, languageCode, "domainNameEn", "domainNameHi", "domainNameGu", [
          "domainName",
        ]),
      domainIndex: domainIndex + 1,
      subdomains: previewSubdomains,
    });
  }

  return previewDomains;
}

export async function buildAssessmentQuestionnaireData({
  assessments,
  languageCode,
  getDomainName,
  getSubdomainName,
  getAssessmentName,
  getSchoolTypeLabel,
}) {
  const result = [];

  for (let assessmentIndex = 0; assessmentIndex < assessments.length; assessmentIndex += 1) {
    const assessment = assessments[assessmentIndex];
    const assessmentName =
      getAssessmentName?.(assessment) ||
      assessment.assessmentName ||
      `Assessment ${assessment.assessmentId || assessmentIndex + 1}`;
    const domains = await buildDomainsForAssessment({
      domains: assessment.domains || [],
      languageCode,
      getDomainName,
      getSubdomainName,
    });

    result.push({
      assessmentName,
      schoolTypeLabel: getSchoolTypeLabel?.(assessment) || null,
      academicYear: assessment.academicYear || null,
      round: assessment.round ?? null,
      domains,
    });
  }

  return result;
}

export function questionnaireHasContent(assessments) {
  return (assessments || []).some((assessment) =>
    (assessment.domains || []).some((domain) =>
      (domain.subdomains || []).some((subdomain) => subdomain.questions?.length > 0),
    ),
  );
}
