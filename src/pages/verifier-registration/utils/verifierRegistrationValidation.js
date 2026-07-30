import * as Yup from "yup";

const NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const AADHAAR_REGEX = /^[2-9][0-9]{11}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isAllSameDigits(value) {
  return Boolean(value) && /^(\d)\1+$/.test(value);
}

function isBlockedMobileSequence(value) {
  return value === "1234567890" || value === "9876543210";
}

export const personNameSchema = (label = "Name") =>
  Yup.string()
    .trim()
    .required("Field is required")
    .matches(NAME_REGEX, "Only alphabets and single spaces are allowed")
    .min(2, `${label} must be at least 2 characters`)
    .max(100, `${label} cannot exceed 100 characters`);

export const mobileNumberSchema = Yup.string()
  .trim()
  .required("Field is required")
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
  .required("Field is required")
  .matches(AADHAAR_REGEX, "Enter a valid 12-digit Aadhaar Number")
  .test(
    "not-all-same",
    "Invalid Aadhaar Number",
    (value) => !value || !isAllSameDigits(value),
  );

export function calculateAgeFromDob(dateOfBirth) {
  if (!dateOfBirth) return "";
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? String(age) : "";
}

export const verifierRegistrationSchema = Yup.object().shape({
  fullName: personNameSchema("Name"),
  email: Yup.string()
    .trim()
    .required("Field is required")
    .matches(EMAIL_REGEX, "Enter a valid email address")
    .max(150, "Email cannot exceed 150 characters"),
  dateOfBirth: Yup.string()
    .required("Field is required")
    .test("age-range", "Age must be between 18 and 75 years", (value) => {
      if (!value) return false;
      const age = Number(calculateAgeFromDob(value));
      return Number.isFinite(age) && age >= 18 && age <= 75;
    }),
  mobileNumber: mobileNumberSchema,
  educationalQualification: Yup.string().required("Field is required"),
  computerKnowledge: Yup.string().required("Field is required"),
  languageSkills: Yup.array()
    .of(Yup.string())
    .min(1, "Select at least one language skill (Read/Write)")
    .required("Field is required"),
  occupation: Yup.string().required("Field is required"),
  organizationType: Yup.string().when("occupation", {
    is: "employed",
    then: (schema) => schema.required("Field is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  experienceYears: Yup.number()
    .typeError("Only numbers are allowed")
    .required("Field is required")
    .integer("Only whole numbers are allowed")
    .min(0, "Experience cannot be negative")
    .max(60, "Experience cannot exceed 60 years"),
  previousAccreditationWork: Yup.string().required("Field is required"),
  previousAccreditationDuration: Yup.string().when("previousAccreditationWork", {
    is: "yes",
    then: (schema) =>
      schema.trim().required("Field is required").max(200, "Too long"),
    otherwise: (schema) => schema.notRequired(),
  }),
  otherVerificationExperience: Yup.string().required("Field is required"),
  otherVerificationDetails: Yup.string().when("otherVerificationExperience", {
    is: "yes",
    then: (schema) =>
      schema.trim().required("Field is required").max(2000, "Too long"),
    otherwise: (schema) => schema.notRequired(),
  }),
  preferredDistrict1: Yup.string().required("Field is required"),
  preferredDistrict2: Yup.string().required("Field is required"),
  preferredDistrict3: Yup.string().required("Field is required"),
  preferredTaluka1: Yup.string().trim().required("Field is required"),
  preferredTaluka2: Yup.string().trim().required("Field is required"),
  preferredTaluka3: Yup.string().trim().required("Field is required"),
  hasVehicle: Yup.string().required("Field is required"),
  vehicleType: Yup.string().when("hasVehicle", {
    is: "yes",
    then: (schema) => schema.required("Field is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  hasDrivingLicense: Yup.string().when("hasVehicle", {
    is: "yes",
    then: (schema) => schema.required("Field is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  workDuration: Yup.string().required("Field is required"),
  aadhaarNumber: aadhaarNumberSchema,
  confirmAadhaarNumber: Yup.string()
    .required("Field is required")
    .length(12, "Aadhaar Number must be exactly 12 digits")
    .matches(AADHAAR_REGEX, "Enter a valid 12-digit Aadhaar Number")
    .oneOf([Yup.ref("aadhaarNumber")], "Aadhaar Numbers must match"),
  aadhaarFile: Yup.mixed().required("Aadhaar card upload is required"),
  bankAccountName: personNameSchema("Account holder name"),
  bankAccountNumber: Yup.string()
    .trim()
    .required("Field is required")
    .matches(/^\d{9,18}$/, "Enter a valid bank account number"),
  bankIfsc: Yup.string()
    .trim()
    .required("Field is required")
    .transform((value) => (value ? value.toUpperCase() : value))
    .matches(IFSC_REGEX, "Enter a valid IFSC code"),
  bankBranch: Yup.string()
    .trim()
    .required("Field is required")
    .min(2, "Branch name must be at least 2 characters")
    .max(200, "Branch name cannot exceed 200 characters"),
  bankName: Yup.string()
    .trim()
    .required("Field is required")
    .min(2, "Bank name must be at least 2 characters")
    .max(200, "Bank name cannot exceed 200 characters"),
  bankAddress: Yup.string()
    .trim()
    .required("Field is required")
    .min(5, "Bank address must be at least 5 characters")
    .max(500, "Bank address cannot exceed 500 characters"),
  nocFile: Yup.mixed().when("occupation", {
    is: "employed",
    then: (schema) => schema.required("NOC upload is required"),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
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
