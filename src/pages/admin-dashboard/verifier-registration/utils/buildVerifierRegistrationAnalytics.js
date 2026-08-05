import {
  CURRENT_SCHOOL_LEVEL_OPTIONS,
  EDUCATIONAL_QUALIFICATIONS,
  GENDER_OPTIONS,
  OCCUPATION_OPTIONS,
  ORGANIZATION_TYPES,
  PROFESSIONAL_QUALIFICATIONS,
  VEHICLE_TYPES,
  WORK_DURATION_OPTIONS,
} from "../../../verifier-registration/constants/verifierRegistrationOptions";
import { getDistrictLabel } from "./verifierRegistrationAdminUtils";

function labelOf(options, value) {
  if (
    value == null ||
    value === "" ||
    value === "none" ||
    value === "unspecified"
  ) {
    return "Not specified";
  }
  const match = options.find((item) => String(item.value) === String(value));
  return match?.labelEn || String(value);
}

function increment(map, key, by = 1) {
  if (key == null || key === "" || key === "none") return;
  const k = String(key);
  map.set(k, (map.get(k) || 0) + by);
}

function mapToSortedList(map, labelFn) {
  return [...map.entries()]
    .map(([key, count]) => ({
      key,
      name: labelFn ? labelFn(key) : key,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function splitCsv(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function experienceBucket(years) {
  const y = Number(years) || 0;
  if (y <= 2) return "0–2 years";
  if (y <= 5) return "3–5 years";
  if (y <= 10) return "6–10 years";
  if (y <= 20) return "11–20 years";
  return "20+ years";
}

/**
 * Build analytics aggregates from verifier registration rows.
 */
export function buildVerifierRegistrationAnalytics(rows = [], districts = []) {
  const total = rows.length;

  const genderMap = new Map();
  const occupationMap = new Map();
  const orgMap = new Map();
  const schoolLevelMap = new Map();
  const eduMap = new Map();
  const professionalMap = new Map();
  const experienceMap = new Map();
  const workDurationMap = new Map();
  const vehicleMap = new Map();
  const districtInterestMap = new Map(); // all preferred districts
  const districtFirstChoiceMap = new Map(); // preferredDistrict1 only
  const nativeDistrictMap = new Map();

  let computerYes = 0;
  let previousAccreditationYes = 0;
  let otherVerificationYes = 0;
  let specialAchievementYes = 0;
  let hasVehicleYes = 0;
  let drivingLicenseYes = 0;
  let employed = 0;
  let nivruti = 0;
  let phdCount = 0;
  let postgraduateCount = 0;
  let totalExperienceYears = 0;

  rows.forEach((row) => {
    increment(genderMap, row.gender || "unspecified");
    increment(occupationMap, row.occupation || "unspecified");
    if (row.occupation === "employed") employed += 1;
    if (row.occupation === "nivruti") nivruti += 1;

    if (row.organizationType) increment(orgMap, row.organizationType);
    increment(schoolLevelMap, row.currentSchoolLevel || "unspecified");
    increment(eduMap, row.educationalQualification || "unspecified");

    if (row.educationalQualification === "postgraduate") postgraduateCount += 1;

    splitCsv(row.professionalQualifications).forEach((code) => {
      increment(professionalMap, code);
      if (code === "phd") phdCount += 1;
    });

    increment(experienceMap, experienceBucket(row.experienceYears));
    totalExperienceYears += Number(row.experienceYears) || 0;

    if (row.workDuration) increment(workDurationMap, row.workDuration);
    if (row.hasVehicle === "yes") {
      hasVehicleYes += 1;
      if (row.vehicleType) increment(vehicleMap, row.vehicleType);
    }
    if (row.hasDrivingLicense === "yes") drivingLicenseYes += 1;
    if (row.computerKnowledge === "yes") computerYes += 1;
    if (row.previousAccreditationWork === "yes") previousAccreditationYes += 1;
    if (row.otherVerificationExperience === "yes") otherVerificationYes += 1;
    if (row.specialEducationalAchievement === "yes") specialAchievementYes += 1;

    increment(districtFirstChoiceMap, row.preferredDistrict1);
    [row.preferredDistrict1, row.preferredDistrict2, row.preferredDistrict3].forEach(
      (id) => increment(districtInterestMap, id),
    );
    increment(nativeDistrictMap, row.nativeDistrictId);
  });

  const districtInterest = mapToSortedList(districtInterestMap, (id) =>
    getDistrictLabel(districts, id),
  );
  const districtFirstChoice = mapToSortedList(districtFirstChoiceMap, (id) =>
    getDistrictLabel(districts, id),
  );

  const highestInterest = districtInterest[0] || null;
  const lowestInterest =
    districtInterest.length > 0
      ? districtInterest[districtInterest.length - 1]
      : null;

  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return {
    total,
    avgExperienceYears: total
      ? Math.round((totalExperienceYears / total) * 10) / 10
      : 0,
    cards: {
      total,
      employed,
      nivruti,
      phdCount,
      postgraduateCount,
      computerYes,
      previousAccreditationYes,
      specialAchievementYes,
      hasVehicleYes,
      districtsWithInterest: districtInterest.length,
    },
    insights: {
      highestInterest,
      lowestInterest,
      topFirstChoice: districtFirstChoice[0] || null,
    },
    gender: mapToSortedList(genderMap, (k) => labelOf(GENDER_OPTIONS, k)),
    occupation: mapToSortedList(occupationMap, (k) =>
      labelOf(OCCUPATION_OPTIONS, k),
    ),
    organizationType: mapToSortedList(orgMap, (k) =>
      labelOf(ORGANIZATION_TYPES, k),
    ),
    schoolLevel: mapToSortedList(schoolLevelMap, (k) =>
      labelOf(CURRENT_SCHOOL_LEVEL_OPTIONS, k),
    ),
    education: mapToSortedList(eduMap, (k) =>
      labelOf(EDUCATIONAL_QUALIFICATIONS, k),
    ),
    professional: mapToSortedList(professionalMap, (k) =>
      labelOf(PROFESSIONAL_QUALIFICATIONS, k),
    ),
    experience: mapToSortedList(experienceMap, (k) => k).sort((a, b) => {
      const order = [
        "0–2 years",
        "3–5 years",
        "6–10 years",
        "11–20 years",
        "20+ years",
      ];
      return order.indexOf(a.key) - order.indexOf(b.key);
    }),
    workDuration: mapToSortedList(workDurationMap, (k) =>
      labelOf(WORK_DURATION_OPTIONS, k),
    ),
    vehicleType: mapToSortedList(vehicleMap, (k) =>
      labelOf(VEHICLE_TYPES, k),
    ),
    districtInterest,
    districtFirstChoice,
    nativeDistrict: mapToSortedList(nativeDistrictMap, (id) =>
      getDistrictLabel(districts, id),
    ),
    yesNo: {
      computerKnowledge: [
        { name: "Yes", count: computerYes, key: "yes" },
        { name: "No", count: total - computerYes, key: "no" },
      ],
      previousAccreditation: [
        { name: "Yes", count: previousAccreditationYes, key: "yes" },
        { name: "No", count: total - previousAccreditationYes, key: "no" },
      ],
      otherVerification: [
        { name: "Yes", count: otherVerificationYes, key: "yes" },
        { name: "No", count: total - otherVerificationYes, key: "no" },
      ],
      specialAchievement: [
        { name: "Yes", count: specialAchievementYes, key: "yes" },
        { name: "No", count: total - specialAchievementYes, key: "no" },
      ],
      hasVehicle: [
        { name: "Yes", count: hasVehicleYes, key: "yes" },
        { name: "No", count: total - hasVehicleYes, key: "no" },
      ],
      drivingLicense: [
        {
          name: "Yes",
          count: drivingLicenseYes,
          key: "yes",
        },
        {
          name: "No / N/A",
          count: total - drivingLicenseYes,
          key: "no",
        },
      ],
    },
    percents: {
      employed: pct(employed),
      phd: pct(phdCount),
      postgraduate: pct(postgraduateCount),
      computer: pct(computerYes),
      previousAccreditation: pct(previousAccreditationYes),
      specialAchievement: pct(specialAchievementYes),
      hasVehicle: pct(hasVehicleYes),
    },
  };
}

export function emptyVerifierRegistrationAnalytics() {
  return buildVerifierRegistrationAnalytics([], []);
}
