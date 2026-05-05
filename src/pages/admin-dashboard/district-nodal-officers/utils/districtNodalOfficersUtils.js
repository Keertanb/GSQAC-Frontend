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

  const rawMobile = String(editingOfficer?.mobileNumber ?? "").replace(
    /\D/g,
    "",
  );

  return {
    userId: editingOfficer?.userId || null,
    userName: editingOfficer?.userName || "",
    mobileNumber: rawMobile.slice(0, 10),
    districts: districtsArray,
    isActive:
      editingOfficer?.isActive === true || editingOfficer?.isActive === 1
        ? 1
        : 0,
  };
}
