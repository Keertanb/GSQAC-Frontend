export const MOBILE_NUMBER_MAX_LENGTH = 10;
export const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

export const sanitizeMobileNumber = (value) =>
  String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, MOBILE_NUMBER_MAX_LENGTH);

export const getMobileNumberError = (mobileNumber) => {
  const mobile = sanitizeMobileNumber(mobileNumber);
  if (!mobile) {
    return "Mobile number is required";
  }
  if (mobile.length !== MOBILE_NUMBER_MAX_LENGTH) {
    return "Mobile number must be exactly 10 digits";
  }
  if (!INDIAN_MOBILE_REGEX.test(mobile)) {
    return "Enter a valid 10-digit mobile number (must start with 6, 7, 8, or 9)";
  }
  return "";
};

export const getPasswordError = (password) => {
  const value = String(password ?? "");
  if (!value) {
    return "Password is required";
  }
  if (value.length <= 6) {
    return "Password must be more than 6 characters";
  }
  return "";
};

/**
 * Normalize district id list from API-shaped officer rows (string JSON, object array, etc.).
 */
export function parseDistrictIds(officer) {
  let districtArray = [];

  if (typeof officer.districtIds === "string") {
    try {
      const parsed = JSON.parse(officer.districtIds);
      if (Array.isArray(parsed)) {
        districtArray = parsed
          .map((item) => {
            return typeof item === "object" && item.districtId !== undefined
              ? item.districtId
              : item;
          })
          .filter((id) => id !== undefined && id !== null);
      }
    } catch (e) {
      console.warn("Failed to parse districtIds string:", e);
    }
  } else if (Array.isArray(officer.districtIds)) {
    if (
      officer.districtIds.length > 0 &&
      typeof officer.districtIds[0] === "object" &&
      officer.districtIds[0].districtId !== undefined
    ) {
      districtArray = officer.districtIds.map((item) => item.districtId);
    } else {
      districtArray = officer.districtIds;
    }
  }

  if (districtArray.length === 0 && Array.isArray(officer.districts)) {
    districtArray = officer.districts;
  }

  return districtArray
    .map((id) => Number(id))
    .filter((id) => !isNaN(id) && id > 0);
}

/**
 * Formik initial values for add/edit nodal officer modal.
 * @param {object|null} editingOfficer
 * @param {Array<{ value: unknown, name: string }>} districts
 */
export function getNodalOfficerFormInitialValues(editingOfficer, districts = []) {
  let districtsArray = [];
  if (editingOfficer) {
    if (typeof editingOfficer.districtIds === "string") {
      try {
        const parsed = JSON.parse(editingOfficer.districtIds);
        if (Array.isArray(parsed)) {
          districtsArray = parsed
            .map((item) => item.districtId)
            .filter((id) => id !== undefined && id !== null);
        }
      } catch (e) {
        console.error("Error parsing districtIds:", e);
      }
    } else if (Array.isArray(editingOfficer.districtIds)) {
      if (
        editingOfficer.districtIds.length > 0 &&
        typeof editingOfficer.districtIds[0] === "object" &&
        editingOfficer.districtIds[0].districtId !== undefined
      ) {
        districtsArray = editingOfficer.districtIds.map(
          (item) => item.districtId,
        );
      } else {
        districtsArray = editingOfficer.districtIds;
      }
    } else if (Array.isArray(editingOfficer.districts)) {
      districtsArray = editingOfficer.districts;
    } else if (editingOfficer.district) {
      const district = districts.find((d) => d.name === editingOfficer.district);
      districtsArray = district ? [district.value] : [];
    }
  }

  return {
    userId: editingOfficer?.userId || null,
    userName: editingOfficer?.userName || "",
    mobileNumber: sanitizeMobileNumber(editingOfficer?.mobileNumber),
    password: editingOfficer?.password ?? "",
    districts: districtsArray,
    isActive:
      editingOfficer?.isActive === true || editingOfficer?.isActive === 1
        ? 1
        : 0,
  };
}
