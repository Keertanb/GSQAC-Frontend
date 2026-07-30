const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const AADHAAR_REGEX = /^\d{12}$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

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

export function validateVerifierRegistrationForm(form) {
  const errors = {};
  const isEmployed = form.occupation === "employed";
  const hasVehicle = form.hasVehicle === "yes";

  if (!form.fullName?.trim()) {
    errors.fullName = "Full name is required.";
  }

  if (!form.email?.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!form.dateOfBirth) {
    errors.dateOfBirth = "Date of birth is required.";
  } else {
    const age = Number(calculateAgeFromDob(form.dateOfBirth));
    if (!Number.isFinite(age) || age < 18 || age > 75) {
      errors.dateOfBirth = "Age must be between 18 and 75 years.";
    }
  }

  if (!form.mobileNumber?.trim()) {
    errors.mobileNumber = "Mobile / WhatsApp number is required.";
  } else if (!MOBILE_REGEX.test(form.mobileNumber.trim())) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number.";
  }

  if (!form.educationalQualification) {
    errors.educationalQualification = "Educational qualification is required.";
  }

  if (!form.computerKnowledge) {
    errors.computerKnowledge = "Computer / IT knowledge is required.";
  }

  if (!form.languageSkills?.length) {
    errors.languageSkills = "Select at least one language skill (Read/Write).";
  }

  if (!form.occupation) {
    errors.occupation = "Occupation is required.";
  }

  if (isEmployed && !form.organizationType) {
    errors.organizationType = "Organization type is required for employed applicants.";
  }

  if (form.experienceYears === "" || form.experienceYears == null) {
    errors.experienceYears = "Experience in years is required.";
  } else if (Number(form.experienceYears) < 0 || Number(form.experienceYears) > 60) {
    errors.experienceYears = "Enter experience between 0 and 60 years.";
  }

  if (!form.previousAccreditationWork) {
    errors.previousAccreditationWork = "Please answer about previous accreditation work.";
  } else if (
    form.previousAccreditationWork === "yes" &&
    !form.previousAccreditationDuration?.trim()
  ) {
    errors.previousAccreditationDuration = "Duration is required when previous work is Yes.";
  }

  if (!form.otherVerificationExperience) {
    errors.otherVerificationExperience = "Please answer about other verification experience.";
  } else if (
    form.otherVerificationExperience === "yes" &&
    !form.otherVerificationDetails?.trim()
  ) {
    errors.otherVerificationDetails = "Please provide details when answer is Yes.";
  }

  if (!form.preferredDistrict1) {
    errors.preferredDistrict1 = "Preferred district (Priority 1) is required.";
  }
  if (!form.preferredDistrict2) {
    errors.preferredDistrict2 = "Preferred district (Priority 2) is required.";
  }
  if (!form.preferredDistrict3) {
    errors.preferredDistrict3 = "Preferred district (Priority 3) is required.";
  }

  if (!form.preferredTaluka1?.trim()) {
    errors.preferredTaluka1 = "Preferred taluka (Priority 1) is required.";
  }
  if (!form.preferredTaluka2?.trim()) {
    errors.preferredTaluka2 = "Preferred taluka (Priority 2) is required.";
  }
  if (!form.preferredTaluka3?.trim()) {
    errors.preferredTaluka3 = "Preferred taluka (Priority 3) is required.";
  }

  if (!form.hasVehicle) {
    errors.hasVehicle = "Vehicle facility answer is required.";
  }

  if (hasVehicle) {
    if (!form.vehicleType) {
      errors.vehicleType = "Vehicle type is required when you have a vehicle.";
    }
    if (!form.hasDrivingLicense) {
      errors.hasDrivingLicense = "Driving license answer is required when you have a vehicle.";
    }
  }

  if (!form.workDuration) {
    errors.workDuration = "Work availability duration is required.";
  }

  if (!form.aadhaarNumber?.trim()) {
    errors.aadhaarNumber = "Aadhaar number is required.";
  } else if (!AADHAAR_REGEX.test(form.aadhaarNumber.trim())) {
    errors.aadhaarNumber = "Enter a valid 12-digit Aadhaar number.";
  }

  if (!form.aadhaarFile) {
    errors.aadhaarFile = "Aadhaar card upload is required.";
  }

  if (!form.bankAccountName?.trim()) {
    errors.bankAccountName = "Account holder name is required.";
  }

  if (!form.bankAccountNumber?.trim()) {
    errors.bankAccountNumber = "Bank account number is required.";
  }

  if (!form.bankIfsc?.trim()) {
    errors.bankIfsc = "IFSC code is required.";
  } else if (!IFSC_REGEX.test(form.bankIfsc.trim().toUpperCase())) {
    errors.bankIfsc = "Enter a valid IFSC code.";
  }

  if (!form.bankBranch?.trim()) {
    errors.bankBranch = "Branch name is required.";
  }

  if (!form.bankName?.trim()) {
    errors.bankName = "Bank name is required.";
  }

  if (!form.bankAddress?.trim()) {
    errors.bankAddress = "Bank address is required.";
  }

  if (isEmployed && !form.nocFile) {
    errors.nocFile = "NOC upload is required for employed applicants.";
  }

  if (!form.selfDeclaration) {
    errors.selfDeclaration = "Self-declaration must be accepted.";
  }

  return errors;
}
