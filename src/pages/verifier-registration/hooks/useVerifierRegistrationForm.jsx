import { useMemo, useState } from "react";
import { enqueueSnackbar } from "notistack";
import {
  useGetAllDistrictsQuery,
  useGetDistrictWiseBlocksQuery,
} from "../../../services/adminService";
import {
  registerVerifier,
  resolveLocalFileName,
} from "../../../services/verifierRegistrationService";
import {
  INITIAL_VERIFIER_FORM,
  STATIC_GUJARAT_DISTRICTS,
} from "../constants/verifierRegistrationOptions";
import {
  calculateAgeFromDob,
  validateVerifierRegistrationForm,
} from "../utils/verifierRegistrationValidation";

function useDistrictOptions() {
  const { data } = useGetAllDistrictsQuery();
  const apiDistricts = data?.data || [];

  return useMemo(
    () => (apiDistricts.length > 0 ? apiDistricts : STATIC_GUJARAT_DISTRICTS),
    [apiDistricts],
  );
}

function useTalukaOptions(districtId) {
  const { data } = useGetDistrictWiseBlocksQuery(districtId || undefined);
  return data?.data || [];
}

function toPayload(form, fileNames) {
  return {
    fullName: form.fullName.trim(),
    email: form.email.trim(),
    dateOfBirth: form.dateOfBirth,
    mobileNumber: form.mobileNumber.trim(),
    educationalQualification: form.educationalQualification,
    professionalQualifications: form.professionalQualifications || [],
    computerKnowledge: form.computerKnowledge,
    languageSkills: form.languageSkills || [],
    occupation: form.occupation,
    organizationType:
      form.occupation === "employed" ? form.organizationType : null,
    experienceYears: Number(form.experienceYears),
    previousAccreditationWork: form.previousAccreditationWork,
    previousAccreditationDuration:
      form.previousAccreditationWork === "yes"
        ? form.previousAccreditationDuration.trim()
        : null,
    otherVerificationExperience: form.otherVerificationExperience,
    otherVerificationDetails:
      form.otherVerificationExperience === "yes"
        ? form.otherVerificationDetails.trim()
        : null,
    preferredDistrict1: Number(form.preferredDistrict1),
    preferredDistrict2: Number(form.preferredDistrict2),
    preferredDistrict3: Number(form.preferredDistrict3),
    preferredTaluka1: form.preferredTaluka1.trim(),
    preferredTaluka2: form.preferredTaluka2.trim(),
    preferredTaluka3: form.preferredTaluka3.trim(),
    hasVehicle: form.hasVehicle,
    vehicleType: form.hasVehicle === "yes" ? form.vehicleType : null,
    hasDrivingLicense:
      form.hasVehicle === "yes" ? form.hasDrivingLicense : null,
    workDuration: form.workDuration,
    aadhaarNumber: form.aadhaarNumber.trim(),
    confirmAadhaarNumber: form.confirmAadhaarNumber.trim(),
    aadhaarFileName: fileNames.aadhaarFileName,
    bankAccountName: form.bankAccountName.trim(),
    bankAccountNumber: form.bankAccountNumber.trim(),
    bankIfsc: form.bankIfsc.trim().toUpperCase(),
    bankBranch: form.bankBranch.trim(),
    bankName: form.bankName.trim(),
    bankAddress: form.bankAddress.trim(),
    nocFileName:
      form.occupation === "employed" ? fileNames.nocFileName : null,
    selfDeclaration: true,
    selfDeclarationFileName: fileNames.selfDeclarationFileName || null,
  };
}

export function useVerifierRegistrationForm() {
  const [form, setForm] = useState(INITIAL_VERIFIER_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const districts = useDistrictOptions();
  const talukaOptions1 = useTalukaOptions(form.preferredDistrict1);
  const talukaOptions2 = useTalukaOptions(form.preferredDistrict2);
  const talukaOptions3 = useTalukaOptions(form.preferredDistrict3);

  const age = useMemo(
    () => calculateAgeFromDob(form.dateOfBirth),
    [form.dateOfBirth],
  );

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateField = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "preferredDistrict1") next.preferredTaluka1 = "";
      if (field === "preferredDistrict2") next.preferredTaluka2 = "";
      if (field === "preferredDistrict3") next.preferredTaluka3 = "";

      if (field === "occupation" && value !== "employed") {
        next.organizationType = "";
        next.nocFile = null;
      }

      if (field === "previousAccreditationWork" && value !== "yes") {
        next.previousAccreditationDuration = "";
      }

      if (field === "otherVerificationExperience" && value !== "yes") {
        next.otherVerificationDetails = "";
      }

      if (field === "hasVehicle" && value !== "yes") {
        next.vehicleType = "";
        next.hasDrivingLicense = "";
      }

      return next;
    });

    clearError(field);
  };

  const updateFile = (field) => (event) => {
    const file = event.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, [field]: file }));
    clearError(field);
  };

  const toggleMultiValue = (field) => (value) => {
    setForm((prev) => {
      const current = prev[field] || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
    clearError(field);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateVerifierRegistrationForm(form);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      enqueueSnackbar("Please correct the highlighted fields.", {
        variant: "warning",
      });
      return;
    }

    setSubmitting(true);

    try {
      const aadhaarFileName = resolveLocalFileName(form.aadhaarFile);
      const nocFileName =
        form.occupation === "employed"
          ? resolveLocalFileName(form.nocFile)
          : null;
      const selfDeclarationFileName = resolveLocalFileName(
        form.selfDeclarationFile,
      );

      if (!aadhaarFileName) {
        throw new Error("Please select an Aadhaar document");
      }
      if (form.occupation === "employed" && !nocFileName) {
        throw new Error("Please select an NOC document");
      }

      const payload = toPayload(form, {
        aadhaarFileName,
        nocFileName,
        selfDeclarationFileName,
      });

      const response = await registerVerifier(payload);

      enqueueSnackbar(
        response?.message || "Verifier registered successfully.",
        { variant: "success" },
      );
      setForm(INITIAL_VERIFIER_FORM);
      setErrors({});
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Registration failed. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    errors,
    age,
    submitting,
    districts,
    talukaOptions: {
      1: talukaOptions1,
      2: talukaOptions2,
      3: talukaOptions3,
    },
    updateField,
    updateFile,
    toggleMultiValue,
    handleSubmit,
  };
}
