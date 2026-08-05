import {
  ALL_DESIGNATION_OPTIONS,
  CURRENT_SCHOOL_LEVEL_OPTIONS,
  EDUCATIONAL_QUALIFICATIONS,
  GENDER_OPTIONS,
  LANGUAGE_SKILLS,
  OCCUPATION_OPTIONS,
  ORGANIZATION_TYPES,
  PROFESSIONAL_QUALIFICATIONS,
  VEHICLE_TYPES,
  WORK_DURATION_OPTIONS,
  YES_NO_OPTIONS,
  formatBilingualOption,
} from "../constants/verifierRegistrationOptions";

function findOption(options, value) {
  if (value == null || value === "") return null;
  return options.find((item) => String(item.value) === String(value)) || null;
}

function optionLabel(options, value) {
  const match = findOption(options, value);
  return match ? formatBilingualOption(match) : value || "-";
}

function yesNoLabel(value) {
  if (!value) return "-";
  return optionLabel(YES_NO_OPTIONS, value);
}

function districtName(districts, districtId) {
  if (!districtId || districtId === "none") {
    return districtId === "none" ? "NA" : "-";
  }
  const match = (districts || []).find(
    (d) => String(d.districtId ?? d.value ?? d.id) === String(districtId),
  );
  return match?.districtName || match?.name || match?.label || String(districtId);
}

function talukaLabel(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ") || "-";
  }
  return value || "-";
}

function designationLabel(form) {
  if (!form.currentDesignation) return "-";
  const match = findOption(ALL_DESIGNATION_OPTIONS, form.currentDesignation);
  if (match) return formatBilingualOption(match);
  return form.currentDesignation;
}

function pushRow(rows, section, label, value) {
  rows.push({ section, label, value: value || "-" });
}

/**
 * Build bilingual preview sections for the confirmation modal.
 */
export function buildVerifierRegistrationPreview(form, districts = []) {
  const rows = [];
  const personal = "વ્યક્તિગત વિગતો / Personal";
  const quals = "લાયકાત / Qualifications";
  const work = "કામગીરી / Work";
  const prefs = "પસંદગી / Preferences";
  const bank = "બેંક / Bank";
  const declaration = "ઘોષણા / Declaration";

  pushRow(rows, personal, "પૂરું નામ / Full Name", form.fullName);
  pushRow(rows, personal, "લિંગ / Gender", optionLabel(GENDER_OPTIONS, form.gender));
  pushRow(rows, personal, "શિક્ષક કોડ / Teacher Code", form.teacherCode || "-");
  pushRow(rows, personal, "શાળા DISE કોડ / School DISE", form.schoolDiseCode || "-");
  pushRow(
    rows,
    personal,
    "મૂળ જિલ્લો / Native District",
    districtName(districts, form.nativeDistrictId),
  );
  pushRow(
    rows,
    personal,
    "નોકરીનો જિલ્લો / Job District",
    districtName(districts, form.jobDistrictId),
  );
  pushRow(rows, personal, "ઈમેલ / Email", form.email);
  pushRow(rows, personal, "જન્મ તારીખ / Date of Birth", form.dateOfBirth || "-");
  pushRow(rows, personal, "મોબાઈલ / Mobile", form.mobileNumber);

  pushRow(
    rows,
    quals,
    "શૈક્ષણિક લાયકાત / Educational Qualification",
    optionLabel(EDUCATIONAL_QUALIFICATIONS, form.educationalQualification),
  );

  const professionalLabels = (form.professionalQualifications || [])
    .map((code) => optionLabel(PROFESSIONAL_QUALIFICATIONS, code))
    .join(", ");
  const professionalText =
    (form.professionalQualifications || []).includes("other") &&
    form.professionalQualificationOther
      ? `${professionalLabels || "-"} (${form.professionalQualificationOther})`
      : professionalLabels || "-";
  pushRow(
    rows,
    quals,
    "વ્યાવસાયિક લાયકાત / Professional Qualifications",
    professionalText,
  );
  pushRow(
    rows,
    quals,
    "કમ્પ્યુટર / IT જ્ઞાન / Computer Knowledge",
    yesNoLabel(form.computerKnowledge),
  );
  pushRow(
    rows,
    quals,
    "ભાષા કૌશલ્ય / Language Skills",
    (form.languageSkills || [])
      .map((code) => optionLabel(LANGUAGE_SKILLS, code))
      .join(", ") || "-",
  );

  pushRow(
    rows,
    work,
    "વ્યવસાય / Occupation",
    optionLabel(OCCUPATION_OPTIONS, form.occupation),
  );

  if (form.occupation === "employed") {
    pushRow(
      rows,
      work,
      "સંસ્થાનો પ્રકાર / Organization Type",
      optionLabel(ORGANIZATION_TYPES, form.organizationType),
    );
  }

  if (form.occupation === "employed" || form.occupation === "nivruti") {
    pushRow(
      rows,
      work,
      "શાળા પ્રકાર / School Type",
      optionLabel(CURRENT_SCHOOL_LEVEL_OPTIONS, form.currentSchoolLevel),
    );
    if (form.currentSchoolLevel === "other") {
      pushRow(
        rows,
        work,
        "અન્ય કામગીરીની વિગત / Other work details",
        form.currentSchoolLevelOther || "-",
      );
    }
    pushRow(
      rows,
      work,
      form.currentSchoolLevel === "higher_education"
        ? "વર્તમાન કામગીરીની વિગતો / Current work details"
        : "વર્તમાન હોદ્દો / Current Designation",
      designationLabel(form),
    );
  }

  const months =
    form.experienceMonths === "" || form.experienceMonths == null
      ? 0
      : form.experienceMonths;
  pushRow(
    rows,
    work,
    "અનુભવ / Experience",
    `${form.experienceYears || 0} વર્ષ / years, ${months} મહિના / months`,
  );
  pushRow(
    rows,
    work,
    "વિશેષ શૈક્ષણિક સિદ્ધિ / Special educational achievement",
    yesNoLabel(form.specialEducationalAchievement),
  );

  if (form.specialEducationalAchievement === "yes") {
    pushRow(
      rows,
      work,
      "સિદ્ધિ વિગત / Achievement details",
      form.specialEducationalAchievementDetails?.trim() || "-",
    );
    pushRow(
      rows,
      work,
      "દસ્તાવેજ / Document",
      form.specialEducationalAchievementFile?.name || "-",
    );
  }

  pushRow(
    rows,
    work,
    "અગાઉ એક્રેડિટેશન કામ / Prior accreditation work",
    yesNoLabel(form.previousAccreditationWork),
  );
  if (form.previousAccreditationWork === "yes") {
    pushRow(
      rows,
      work,
      "અવધિ (વર્ષ) / Duration (years)",
      form.previousAccreditationDuration || "-",
    );
  }
  pushRow(
    rows,
    work,
    "અન્ય વેરિફિકેશન અનુભવ / Other verification experience",
    yesNoLabel(form.otherVerificationExperience),
  );
  if (form.otherVerificationExperience === "yes") {
    pushRow(
      rows,
      work,
      "અન્ય વેરિફિકેશન વિગત / Other verification details",
      form.otherVerificationDetails || "-",
    );
  }

  pushRow(
    rows,
    prefs,
    "જિલ્લો 1 / District 1",
    districtName(districts, form.preferredDistrict1),
  );
  pushRow(rows, prefs, "તાલુકા 1 / Talukas 1", talukaLabel(form.preferredTaluka1));
  pushRow(
    rows,
    prefs,
    "જિલ્લો 2 / District 2",
    districtName(districts, form.preferredDistrict2),
  );
  pushRow(rows, prefs, "તાલુકા 2 / Talukas 2", talukaLabel(form.preferredTaluka2));
  pushRow(
    rows,
    prefs,
    "જિલ્લો 3 / District 3",
    districtName(districts, form.preferredDistrict3),
  );
  pushRow(rows, prefs, "તાલુકા 3 / Talukas 3", talukaLabel(form.preferredTaluka3));
  pushRow(rows, prefs, "વાહન / Has vehicle", yesNoLabel(form.hasVehicle));
  if (form.hasVehicle === "yes") {
    pushRow(
      rows,
      prefs,
      "વાહન પ્રકાર / Vehicle type",
      optionLabel(VEHICLE_TYPES, form.vehicleType),
    );
    pushRow(
      rows,
      prefs,
      "ડ્રાઈવિંગ લાયસન્સ / Driving license",
      yesNoLabel(form.hasDrivingLicense),
    );
  }
  pushRow(
    rows,
    prefs,
    "કામગીરી અવધિ / Work duration",
    optionLabel(WORK_DURATION_OPTIONS, form.workDuration),
  );

  pushRow(rows, bank, "આધાર નંબર / Aadhaar", form.aadhaarNumber || "-");
  pushRow(rows, bank, "ખાતા ધારકનું નામ / Account holder", form.bankAccountName || "-");
  pushRow(rows, bank, "ખાતા નંબર / Account number", form.bankAccountNumber || "-");
  pushRow(rows, bank, "IFSC", form.bankIfsc || "-");
  pushRow(rows, bank, "બ્રાન્ચ / Branch", form.bankBranch || "-");
  pushRow(rows, bank, "બેંક નામ / Bank name", form.bankName || "-");
  pushRow(rows, bank, "બેંક સરનામું / Bank address", form.bankAddress || "-");

  pushRow(
    rows,
    declaration,
    "સ્વઘોષણા / Self declaration",
    form.selfDeclaration ? "હા / Yes" : "ના / No",
  );
  pushRow(
    rows,
    declaration,
    "જોડાવા ઈચ્છા / Willing to join",
    form.willingToJoin ? "હા / Yes" : "ના / No",
  );

  const sections = [];
  const sectionMap = new Map();
  rows.forEach((row) => {
    if (!sectionMap.has(row.section)) {
      const section = { title: row.section, items: [] };
      sectionMap.set(row.section, section);
      sections.push(section);
    }
    sectionMap.get(row.section).items.push({
      label: row.label,
      value: row.value,
    });
  });

  return sections;
}
