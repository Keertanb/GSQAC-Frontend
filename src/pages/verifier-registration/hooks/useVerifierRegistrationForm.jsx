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

function normalizeDistrictOptions(list) {
  return (list || [])
    .map((district) => {
      const districtId = String(
        district.value ?? district.districtId ?? district.id ?? "",
      );
      const districtName =
        district.name || district.districtName || district.label || districtId;
      if (!districtId) return null;
      return { ...district, districtId, districtName, value: districtId, name: districtName };
    })
    .filter(Boolean);
}

function normalizeBlockOptions(list) {
  return (list || [])
    .map((block) => {
      const blockId = String(block.value ?? block.blockId ?? block.id ?? "");
      const blockName = block.name || block.blockName || block.label || blockId;
      if (!blockName) return null;
      return { ...block, blockId, blockName, value: blockId, name: blockName };
    })
    .filter(Boolean);
}

function useDistrictOptions() {
  const { data } = useGetAllDistrictsQuery();
  const apiDistricts = data?.data || [];

  return useMemo(() => {
    const source =
      apiDistricts.length > 0 ? apiDistricts : STATIC_GUJARAT_DISTRICTS;
    return normalizeDistrictOptions(source);
  }, [apiDistricts]);
}

function resolveDistrictQueryId(districtId) {
  if (!districtId || districtId === "none") return undefined;
  return districtId;
}

function toDistrictPayload(value) {
  if (!value || value === "none") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toTalukaPayload(districtValue, talukaValue) {
  if (!districtValue || districtValue === "none") return null;
  const trimmed = String(talukaValue || "").trim();
  return trimmed || null;
}

function useTalukaOptions(districtId) {
  const queryId = resolveDistrictQueryId(districtId);
  const { data } = useGetDistrictWiseBlocksQuery(queryId);
  return useMemo(
    () => normalizeBlockOptions(data?.data || []),
    [data?.data],
  );
}

function getAadhaarConfirmError(aadhaarNumber, confirmAadhaarNumber) {
  if (!confirmAadhaarNumber || !aadhaarNumber) return "";
  if (confirmAadhaarNumber === aadhaarNumber) return "";
  if (
    confirmAadhaarNumber.length === 12 ||
    !aadhaarNumber.startsWith(confirmAadhaarNumber)
  ) {
    return "Aadhaar Numbers must match";
  }
  return "";
}

function toPayload(form, fileNames) {
  return {
    fullName: form.fullName.trim(),
    gender: form.gender,
    teacherCode: form.teacherCode.trim(),
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
    currentSchoolLevel:
      form.occupation === "employed" ? form.currentSchoolLevel : null,
    currentDesignation:
      form.occupation === "employed" ? form.currentDesignation : null,
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
    preferredDistrict1: toDistrictPayload(form.preferredDistrict1),
    preferredDistrict2: toDistrictPayload(form.preferredDistrict2),
    preferredDistrict3: toDistrictPayload(form.preferredDistrict3),
    preferredTaluka1: toTalukaPayload(
      form.preferredDistrict1,
      form.preferredTaluka1,
    ),
    preferredTaluka2: toTalukaPayload(
      form.preferredDistrict2,
      form.preferredTaluka2,
    ),
    preferredTaluka3: toTalukaPayload(
      form.preferredDistrict3,
      form.preferredTaluka3,
    ),
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
    nocFileName: null,
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
    let value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    if (field === "experienceYears" || field === "previousAccreditationDuration") {
      value = String(value ?? "").replace(/\D/g, "").slice(0, 2);
    }

    if (field === "teacherCode") {
      value = String(value ?? "").replace(/\D/g, "").slice(0, 20);
    }

    if (field === "bankIfsc") {
      value = String(value ?? "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 11);
    }

    if (
      field === "mobileNumber" ||
      field === "aadhaarNumber" ||
      field === "confirmAadhaarNumber" ||
      field === "bankAccountNumber"
    ) {
      const maxLen =
        field === "mobileNumber"
          ? 10
          : field === "bankAccountNumber"
            ? 18
            : 12;
      value = String(value ?? "").replace(/\D/g, "").slice(0, maxLen);
    }

    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "preferredDistrict1") next.preferredTaluka1 = "";
      if (field === "preferredDistrict2") next.preferredTaluka2 = "";
      if (field === "preferredDistrict3") next.preferredTaluka3 = "";

      if (field === "occupation" && value !== "employed") {
        next.organizationType = "";
        next.currentSchoolLevel = "";
        next.currentDesignation = "";
        next.nocFile = null;
      }

      if (field === "currentSchoolLevel") {
        next.currentDesignation = "";
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

      if (field === "willingToJoin" && !value) {
        next.selfDeclarationFile = null;
      }

      return next;
    });

    if (field === "aadhaarNumber" || field === "confirmAadhaarNumber") {
      const aadhaar = field === "aadhaarNumber" ? value : form.aadhaarNumber;
      const confirm =
        field === "confirmAadhaarNumber" ? value : form.confirmAadhaarNumber;
      const matchError = getAadhaarConfirmError(aadhaar, confirm);
      setErrors((prev) => {
        const next = { ...prev };
        if (field === "aadhaarNumber") delete next.aadhaarNumber;
        if (matchError) next.confirmAadhaarNumber = matchError;
        else delete next.confirmAadhaarNumber;
        return next;
      });
      return;
    }

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
      const selfDeclarationFileName = resolveLocalFileName(
        form.selfDeclarationFile,
      );

      if (!aadhaarFileName) {
        throw new Error("Please select an Aadhaar document");
      }

      const payload = toPayload(form, {
        aadhaarFileName,
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
