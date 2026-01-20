import { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  auth: {
    sendOtp: (userName) => ["auth", "send-otp", userName],
    verifyOtp: (userName, otp) => ["auth", "verify-otp", userName, otp],
    logout: () => ["auth", "logout"],
  },
  admin: {
    domains: (roleId, languageCode) => ["admin", "domains", roleId, languageCode],
    criteriaQuestions: (subDomainId, roleId, languageCode) => [
      "admin",
      "criteria-questions",
      subDomainId,
      roleId,
      languageCode,
    ],
    subdomainQuestions: (subDomainId, roleId, languageCode = null, classNumber = null, section = null) => [
      "admin",
      "subdomain-questions",
      subDomainId,
      roleId,
      languageCode,
      classNumber,
      section,
    ],
    upsertDomain: () => ["admin", "upsert-domain"],
    upsertSubdomain: () => ["admin", "upsert-subdomain"],
    upsertQuestion: () => ["admin", "upsert-question"],
    upsertQuestionOption: () => ["admin", "upsert-question-option"],
    deleteDomain: () => ["admin", "delete-domain"],
    deleteQuestion: () => ["admin", "delete-question"],
    deleteQuestionOption: () => ["admin", "delete-question-option"],
    assessments: (academicYear) => ["admin", "assessments", academicYear],
  },
  school: {
    domains: (roleId, languageCode) => ["school", "domains", roleId, languageCode],
    schoolData: (schoolId, academicYear) => ["school", "school-data", schoolId, academicYear],
    classWiseSections: (userId, classNumber) => ["school", "class-wise-sections", userId, classNumber],
    schoolSections: (schoolId) => ["school", "school-sections", schoolId],
    submitSubdomainWiseAnswers: () => ["school", "submit-subdomain-wise-answers"],
    infrastructure: (schoolId) => ["school", "infrastructure", schoolId],
    updateInfrastructure: () => ["school", "update-infrastructure"],
  },
  inspector: {
    allocatedSchools: (districtId) => ["inspector", "allocated-schools", districtId],
  },
};
