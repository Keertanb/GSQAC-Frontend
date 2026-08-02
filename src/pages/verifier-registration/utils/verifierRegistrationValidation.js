import * as Yup from "yup";

const NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const AADHAAR_REGEX = /^[2-9][0-9]{11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAllSameDigits(value) {
  return Boolean(value) && /^(\d)\1+$/.test(value);
}

function isBlockedMobileSequence(value) {
  return value === "1234567890" || value === "9876543210";
}

function requiredMsg(label) {
  return `${label} field is required`;
}

export const personNameSchema = (label = "Name") =>
  Yup.string()
    .trim()
    .required(requiredMsg(label))
    .matches(NAME_REGEX, "Only alphabets and single spaces are allowed")
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} cannot exceed 100 characters`);

export const mobileNumberSchema = Yup.string()
  .trim()
  .required(requiredMsg("Mobile number"))
  .matches(MOBILE_REGEX, "Enter a valid 10-digit mobile number")
  .test(
    "not-all-same",
    "Invalid mobile number",
    (value) => !value || !isAllSameDigits(value),
  )
  .test(
    "not-sequence",
    "Invalid mobile number",
    (value) => !value || !isBlockedMobileSequence(value),
  );

export const aadhaarNumberSchema = Yup.string()
  .trim()
  .required(requiredMsg("Aadhaar number"))
  .matches(AADHAAR_REGEX, "Enter a valid 12-digit Aadhaar Number")
  .test(
    "not-all-same",
    "Invalid Aadhaar Number",
    (value) => !value || !isAllSameDigits(value),
  );

export function calculateAgeFromDob(dateOfBirth) {
  if (!dateOfBirth) return "";
  const dob = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "";
}

function isValidCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getDobBounds() {
  const today = new Date();
  const max = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const min = new Date(today.getFullYear() - 75, today.getMonth(), today.getDate());
  const toIso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { min: toIso(min), max: toIso(max) };
}

export const DOB_BOUNDS = getDobBounds();

export const verifierRegistrationSchema = Yup.object().shape({
  fullName: personNameSchema("Full name"),
  email: Yup.string()
    .trim()
    .required(requiredMsg("Email"))
    .matches(EMAIL_REGEX, "Enter a valid email address")
    .max(150, "Email cannot exceed 150 characters"),
  dateOfBirth: Yup.string()
    .required(requiredMsg("Date of birth"))
    .test("valid-date", "Please select a valid date", (value) =>
      isValidCalendarDate(value),
    )
    .test("age-range", "Age must be between 18 and 75 years", (value) => {
      if (!value) return false;
      const age = Number(calculateAgeFromDob(value));
      return Number.isFinite(age) && age >= 18 && age <= 75;
    }),
  mobileNumber: mobileNumberSchema,
  gender: Yup.string()
    .oneOf(["male", "female", "other"], requiredMsg("Gender"))
    .required(requiredMsg("Gender")),
  teacherCode: Yup.string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => value || "")
    .test(
      "digits-if-present",
      "Only numbers are allowed",
      (value) => !value || /^\d{1,20}$/.test(value),
    ),
  educationalQualification: Yup.string()
    .oneOf(
      ["class_10", "class_12", "graduate", "postgraduate"],
      requiredMsg("Educational qualification"),
    )
    .required(requiredMsg("Educational qualification")),
  computerKnowledge: Yup.string().required(
    requiredMsg("Computer / IT knowledge"),
  ),
  languageSkills: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one language skill (Read/Write)")
    .required(requiredMsg("Language knowledge")),
  occupation: Yup.string()
    .oneOf(["employed"], requiredMsg("Occupation"))
    .required(requiredMsg("Occupation")),
  organizationType: Yup.string().when("occupation", {
    is: "employed",
    then: (schema) => schema.required(requiredMsg("Type of job institution")),
    otherwise: (schema) => schema.notRequired(),
  }),
  currentSchoolLevel: Yup.string().when("occupation", {
    is: "employed",
    then: (schema) =>
      schema
        .oneOf(["primary", "secondary", "other"], requiredMsg("School type"))
        .required(requiredMsg("School type")),
    otherwise: (schema) => schema.notRequired(),
  }),
  currentSchoolLevelOther: Yup.string().when("currentSchoolLevel", {
    is: "other",
    then: (schema) =>
      schema
        .trim()
        .required(requiredMsg("Other school type"))
        .min(2, "Other school type must be at least 2 characters")
        .max(200, "Other school type cannot exceed 200 characters"),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  currentDesignation: Yup.string().when("occupation", {
    is: "employed",
    then: (schema) =>
      schema.trim().required(requiredMsg("Current designation")),
    otherwise: (schema) => schema.notRequired(),
  }),
  experienceYears: Yup.number()
    .transform((value, original) =>
      original === "" || original == null ? undefined : value,
    )
    .typeError("Only numbers are allowed")
    .required(requiredMsg("Years of experience"))
    .integer("Only whole numbers are allowed")
    .min(0, "Experience cannot be negative")
    .max(60, "Experience cannot exceed 60 years"),
  experienceMonths: Yup.number()
    .transform((value, original) =>
      original === "" || original == null ? 0 : value,
    )
    .typeError("Only numbers are allowed")
    .integer("Only whole numbers are allowed")
    .min(0, "Months cannot be negative")
    .max(11, "Months cannot exceed 11"),
  previousAccreditationWork: Yup.string().required(
    requiredMsg("Previous accreditation work"),
  ),
  previousAccreditationDuration: Yup.string().when("previousAccreditationWork", {
    is: "yes",
    then: (schema) =>
      schema
        .required(requiredMsg("Accreditation duration"))
        .matches(/^\d{1,2}$/, "Only digits are allowed")
        .test(
          "duration-range",
          "Duration must be between 1 and 60 years",
          (value) => {
            const n = Number(value);
            return Number.isFinite(n) && n >= 1 && n <= 60;
          },
        ),
    otherwise: (schema) => schema.notRequired(),
  }),
  otherVerificationExperience: Yup.string().required(
    requiredMsg("Other verification experience"),
  ),
  otherVerificationDetails: Yup.string().when("otherVerificationExperience", {
    is: "yes",
    then: (schema) =>
      schema
        .trim()
        .required(requiredMsg("Other verification details"))
        .max(2000, "Too long"),
    otherwise: (schema) => schema.notRequired(),
  }),
  preferredDistrict1: Yup.string()
    .required(requiredMsg("District 1"))
    .test(
      "not-none",
      requiredMsg("District 1"),
      (value) => value && value !== "none",
    ),
  preferredDistrict2: Yup.string().required(requiredMsg("District 2")),
  preferredDistrict3: Yup.string().required(requiredMsg("District 3")),
  preferredTaluka1: Yup.string()
    .trim()
    .required(requiredMsg("Block / Taluka 1")),
  preferredTaluka2: Yup.string().when("preferredDistrict2", {
    is: (value) => value && value !== "none",
    then: (schema) =>
      schema.trim().required(requiredMsg("Block / Taluka 2")),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  preferredTaluka3: Yup.string().when("preferredDistrict3", {
    is: (value) => value && value !== "none",
    then: (schema) =>
      schema.trim().required(requiredMsg("Block / Taluka 3")),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  hasVehicle: Yup.string().required(requiredMsg("Vehicle facility")),
  vehicleType: Yup.string().when("hasVehicle", {
    is: "yes",
    then: (schema) => schema.required(requiredMsg("Vehicle type")),
    otherwise: (schema) => schema.notRequired(),
  }),
  hasDrivingLicense: Yup.string().when("hasVehicle", {
    is: "yes",
    then: (schema) => schema.required(requiredMsg("Driving license")),
    otherwise: (schema) => schema.notRequired(),
  }),
  workDuration: Yup.string().required(requiredMsg("Work duration")),
  aadhaarNumber: aadhaarNumberSchema,
  confirmAadhaarNumber: Yup.string()
    .required(requiredMsg("Confirm Aadhaar number"))
    .length(12, "Aadhaar Number must be exactly 12 digits")
    .matches(AADHAAR_REGEX, "Enter a valid 12-digit Aadhaar Number")
    .oneOf([Yup.ref("aadhaarNumber")], "Aadhaar Numbers must match"),
  bankAccountName: personNameSchema("Account holder name"),
  bankAccountNumber: Yup.string()
    .trim()
    .required(requiredMsg("Account number"))
    .matches(/^\d{9,18}$/, "Enter a valid bank account number"),
  bankIfsc: Yup.string()
    .trim()
    .required(requiredMsg("IFSC code"))
    .length(11, "IFSC code must be exactly 11 characters")
    .matches(
      /^[A-Z]{4}0[A-Z0-9]{6}$/,
      "Enter a valid IFSC (e.g. SBIN0001234 — 4 letters, 0, then 6 chars)",
    ),
  bankBranch: Yup.string()
    .trim()
    .required(requiredMsg("Bank branch"))
    .min(2, "Branch name must be at least 2 characters")
    .max(200, "Branch name cannot exceed 200 characters"),
  bankName: Yup.string()
    .trim()
    .required(requiredMsg("Bank name"))
    .min(2, "Bank name must be at least 2 characters")
    .max(200, "Bank name cannot exceed 200 characters"),
  bankAddress: Yup.string()
    .trim()
    .required(requiredMsg("Bank address"))
    .min(5, "Bank address must be at least 5 characters")
    .max(500, "Bank address cannot exceed 500 characters"),
  selfDeclaration: Yup.boolean().oneOf(
    [true],
    "You must accept the declaration to submit",
  ),
});

export function validateVerifierRegistrationForm(form) {
  const errors = {};

  try {
    verifierRegistrationSchema.validateSync(form, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (err) {
    if (err?.inner?.length) {
      err.inner.forEach((item) => {
        if (item.path && !errors[item.path]) {
          errors[item.path] = item.message;
        }
      });
    } else if (err?.path) {
      errors[err.path] = err.message;
    }
  }

  return errors;
}

export function validateVerifierRegistrationField(form, field) {
  if (!field) return "";
  if (!verifierRegistrationSchema.fields?.[field]) return "";
  try {
    verifierRegistrationSchema.validateSyncAt(field, form, {
      abortEarly: true,
    });
    return "";
  } catch (err) {
    if (err?.name === "ValidationError") {
      return err.message || "Invalid value";
    }
    return "";
  }
}

export function getRelatedValidationFields(field) {
  switch (field) {
    case "preferredDistrict1":
      return ["preferredDistrict1", "preferredTaluka1"];
    case "preferredDistrict2":
      return ["preferredDistrict2", "preferredTaluka2"];
    case "preferredDistrict3":
      return ["preferredDistrict3", "preferredTaluka3"];
    case "occupation":
      return [
        "occupation",
        "organizationType",
        "currentSchoolLevel",
        "currentSchoolLevelOther",
        "currentDesignation",
      ];
    case "currentSchoolLevel":
      return [
        "currentSchoolLevel",
        "currentSchoolLevelOther",
        "currentDesignation",
      ];
    case "currentSchoolLevelOther":
      return ["currentSchoolLevelOther"];
    case "experienceYears":
      return ["experienceYears", "experienceMonths"];
    case "experienceMonths":
      return ["experienceMonths", "experienceYears"];
    case "previousAccreditationWork":
      return ["previousAccreditationWork", "previousAccreditationDuration"];
    case "otherVerificationExperience":
      return ["otherVerificationExperience", "otherVerificationDetails"];
    case "hasVehicle":
      return ["hasVehicle", "vehicleType", "hasDrivingLicense"];
    case "aadhaarNumber":
      return ["aadhaarNumber"];
    case "confirmAadhaarNumber":
      return ["confirmAadhaarNumber"];
    default:
      return [field];
  }
}
