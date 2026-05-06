// Format API date (YYYY-MM-DD or ISO) to DD/MM/YYYY for display
export const formatDateToDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const datePart = typeof dateStr === "string" ? dateStr.split("T")[0] : "";
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return dateStr || "";
  const [y, m, d] = datePart.split("-");
  return `${d}/${m}/${y}`;
};

// Parse DD/MM/YYYY string to YYYY-MM-DD for API
export const parseDDMMYYYYToApi = (str) => {
  if (!str || typeof str !== "string") return "";
  const trimmed = str.trim().replace(/\s/g, "");
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  const [, d, m, y] = match;
  const day = parseInt(d, 10);
  const month = parseInt(m, 10);
  const year = parseInt(y, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
};

// Parse API date (YYYY-MM-DD or ISO) to YYYY-MM-DD for date input
export const toDateInputValue = (dateStr) => {
  if (!dateStr) return "";
  const s = typeof dateStr === "string" ? dateStr.trim() : String(dateStr);
  const datePart = s.split("T")[0];
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  const parsed = parseDDMMYYYYToApi(s.replace(/[-/]/g, "/"));
  return parsed || "";
};

/** Private → 1, Public → 0 (matches GET /admin/assessment `managementName`) */
export const deriveManagementBinaryFromManagementName = (managementName) => {
  if (managementName == null || managementName === "") return null;
  const n = String(managementName).trim().toLowerCase();
  if (n === "private" || n.includes("private")) return 1;
  if (n === "public" || n.includes("public")) return 0;
  return null;
};

/**
 * Numeric `management` for POST /admin/assessment: prefer explicit id fields,
 * else map `managementName` (Private=1, Public=0).
 */
export const getAssessmentManagementForApi = (assessment) => {
  if (!assessment) return null;
  const explicit =
    assessment.management ?? assessment.smId ?? assessment.managementId;
  if (explicit !== undefined && explicit !== null && explicit !== "") {
    const num = Number(explicit);
    if (!Number.isNaN(num)) return num;
  }
  return deriveManagementBinaryFromManagementName(assessment.managementName);
};

/** Value for school-management Select: smId match, else "1"/"0" from managementName */
export const resolveAssessmentManagementSelectValue = (
  assessment,
  schoolManagementOptions = [],
) => {
  if (!assessment) return "";
  const explicit =
    assessment.management ?? assessment.smId ?? assessment.managementId;
  if (explicit !== undefined && explicit !== null && explicit !== "") {
    return String(explicit);
  }
  const name = assessment.managementName;
  if (name && Array.isArray(schoolManagementOptions) && schoolManagementOptions.length) {
    const match = schoolManagementOptions.find(
      (o) =>
        String(o.managementName ?? "")
          .trim()
          .toLowerCase() === String(name).trim().toLowerCase(),
    );
    if (match != null && match.smId !== undefined && match.smId !== null) {
      return String(match.smId);
    }
  }
  const derived = deriveManagementBinaryFromManagementName(name);
  if (derived === 1 || derived === 0) return String(derived);
  return "";
};
