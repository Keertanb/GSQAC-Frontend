import {
  EDUCATIONAL_QUALIFICATIONS,
  LANGUAGE_SKILLS,
  OCCUPATION_OPTIONS,
  ORGANIZATION_TYPES,
  PROFESSIONAL_QUALIFICATIONS,
  VEHICLE_TYPES,
  WORK_DURATION_OPTIONS,
  YES_NO_OPTIONS,
  GENDER_OPTIONS,
  CURRENT_SCHOOL_LEVEL_OPTIONS,
  ALL_DESIGNATION_OPTIONS,
} from "../../../verifier-registration/constants/verifierRegistrationOptions";

function findLabel(options, value) {
  if (value == null || value === "") return "-";
  const match = options.find((item) => String(item.value) === String(value));
  return match?.labelEn || String(value);
}

export function getDistrictLabel(districts, districtId) {
  if (districtId == null || districtId === "") return "-";
  const match = (districts || []).find(
    (d) =>
      String(d.districtId ?? d.value ?? d.id) === String(districtId),
  );
  return match?.districtName || match?.name || match?.label || String(districtId);
}

export function formatYesNo(value) {
  return findLabel(YES_NO_OPTIONS, value);
}

export function formatOptionLabel(options, value) {
  return findLabel(options, value);
}

export function formatCsvCodes(options, csv) {
  if (!csv) return "-";
  return String(csv)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((code) => findLabel(options, code))
    .join(", ");
}

export function formatDateDisplay(value) {
  if (!value) return "-";
  const raw = String(value).includes("T")
    ? String(value).split("T")[0]
    : String(value).slice(0, 10);
  const [y, m, d] = raw.split("-");
  if (!y || !m || !d) return String(value);
  return `${d}-${m}-${y}`;
}

export function formatDateTimeDisplay(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("en-IN");
  } catch {
    return String(value);
  }
}

export function enrichRegistrationRow(row, districts) {
  return {
    ...row,
    preferredDistrict1Name: getDistrictLabel(districts, row.preferredDistrict1),
    preferredDistrict2Name: getDistrictLabel(districts, row.preferredDistrict2),
    preferredDistrict3Name: getDistrictLabel(districts, row.preferredDistrict3),
    genderLabel: formatOptionLabel(GENDER_OPTIONS, row.gender),
    currentSchoolLevelLabel: formatOptionLabel(
      CURRENT_SCHOOL_LEVEL_OPTIONS,
      row.currentSchoolLevel,
    ),
    currentDesignationLabel: formatOptionLabel(
      ALL_DESIGNATION_OPTIONS,
      row.currentDesignation,
    ),
    educationalQualificationLabel: formatOptionLabel(
      EDUCATIONAL_QUALIFICATIONS,
      row.educationalQualification,
    ),
    professionalQualificationsLabel: formatCsvCodes(
      PROFESSIONAL_QUALIFICATIONS,
      row.professionalQualifications,
    ),
    languageSkillsLabel: formatCsvCodes(LANGUAGE_SKILLS, row.languageSkills),
    occupationLabel: formatOptionLabel(OCCUPATION_OPTIONS, row.occupation),
    organizationTypeLabel: formatOptionLabel(
      ORGANIZATION_TYPES,
      row.organizationType,
    ),
    computerKnowledgeLabel: formatYesNo(row.computerKnowledge),
    previousAccreditationWorkLabel: formatYesNo(row.previousAccreditationWork),
    otherVerificationExperienceLabel: formatYesNo(
      row.otherVerificationExperience,
    ),
    hasVehicleLabel: formatYesNo(row.hasVehicle),
    vehicleTypeLabel: formatOptionLabel(VEHICLE_TYPES, row.vehicleType),
    hasDrivingLicenseLabel: formatYesNo(row.hasDrivingLicense),
    workDurationLabel: formatOptionLabel(WORK_DURATION_OPTIONS, row.workDuration),
    dateOfBirthLabel: formatDateDisplay(row.dateOfBirth),
    createdAtLabel: formatDateTimeDisplay(row.createdAt),
    selfDeclarationLabel: row.selfDeclaration ? "Yes" : "No",
  };
}

export const EXCEL_COLUMNS = [
  { key: "registrationId", label: "Registration ID" },
  { key: "userName", label: "Username" },
  { key: "fullName", label: "Full Name" },
  { key: "genderLabel", label: "Gender" },
  { key: "teacherCode", label: "Teacher Code" },
  { key: "email", label: "Email" },
  { key: "dateOfBirthLabel", label: "Date of Birth" },
  { key: "mobileNumber", label: "Mobile Number" },
  { key: "educationalQualificationLabel", label: "Educational Qualification" },
  { key: "professionalQualificationsLabel", label: "Professional Qualifications" },
  { key: "computerKnowledgeLabel", label: "Computer/IT Knowledge" },
  { key: "languageSkillsLabel", label: "Language Skills" },
  { key: "occupationLabel", label: "Occupation" },
  { key: "organizationTypeLabel", label: "Organization Type" },
  { key: "currentSchoolLevelLabel", label: "Current School Level" },
  { key: "currentDesignationLabel", label: "Current Designation" },
  { key: "experienceYears", label: "Experience (Years)" },
  { key: "previousAccreditationWorkLabel", label: "Prior Accreditation Work" },
  { key: "previousAccreditationDuration", label: "Prior Accreditation Duration (Years)" },
  { key: "otherVerificationExperienceLabel", label: "Other Verification Experience" },
  { key: "otherVerificationDetails", label: "Other Verification Details" },
  { key: "preferredDistrict1Name", label: "Preferred District 1" },
  { key: "preferredTaluka1", label: "Preferred Block/Taluka 1" },
  { key: "preferredDistrict2Name", label: "Preferred District 2" },
  { key: "preferredTaluka2", label: "Preferred Block/Taluka 2" },
  { key: "preferredDistrict3Name", label: "Preferred District 3" },
  { key: "preferredTaluka3", label: "Preferred Block/Taluka 3" },
  { key: "hasVehicleLabel", label: "Has Vehicle" },
  { key: "vehicleTypeLabel", label: "Vehicle Type" },
  { key: "hasDrivingLicenseLabel", label: "Driving License" },
  { key: "workDurationLabel", label: "Work Duration Availability" },
  { key: "aadhaarNumber", label: "Aadhaar Number" },
  { key: "aadhaarFileName", label: "Aadhaar File" },
  { key: "bankAccountName", label: "Bank Account Holder Name" },
  { key: "bankAccountNumber", label: "Bank Account Number" },
  { key: "bankIfsc", label: "IFSC" },
  { key: "bankBranch", label: "Branch Name" },
  { key: "bankName", label: "Bank Name" },
  { key: "bankAddress", label: "Bank Address" },
  { key: "nocFileName", label: "NOC File" },
  { key: "selfDeclarationLabel", label: "Self Declaration Accepted" },
  { key: "selfDeclarationFileName", label: "Self Declaration File" },
  { key: "status", label: "Status" },
  { key: "createdAtLabel", label: "Registered At" },
];
