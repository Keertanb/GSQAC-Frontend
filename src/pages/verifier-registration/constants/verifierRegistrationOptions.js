export const STATIC_GUJARAT_DISTRICTS = [
  { districtId: "2401", districtName: "Ahmedabad" },
  { districtId: "2402", districtName: "Amreli" },
  { districtId: "2403", districtName: "Anand" },
  { districtId: "2404", districtName: "Aravalli" },
  { districtId: "2405", districtName: "Banaskantha" },
  { districtId: "2406", districtName: "Bharuch" },
  { districtId: "2407", districtName: "Bhavnagar" },
  { districtId: "2408", districtName: "Botad" },
  { districtId: "2409", districtName: "Chhota Udaipur" },
  { districtId: "2410", districtName: "Dahod" },
  { districtId: "2411", districtName: "Dang" },
  { districtId: "2412", districtName: "Devbhumi Dwarka" },
  { districtId: "2413", districtName: "Gandhinagar" },
  { districtId: "2414", districtName: "Gir Somnath" },
  { districtId: "2415", districtName: "Jamnagar" },
  { districtId: "2416", districtName: "Junagadh" },
  { districtId: "2417", districtName: "Panch Mahals" },
  { districtId: "2418", districtName: "Kheda" },
  { districtId: "2419", districtName: "Kutch" },
  { districtId: "2420", districtName: "Mahisagar" },
  { districtId: "2421", districtName: "Mehsana" },
  { districtId: "2422", districtName: "Morbi" },
  { districtId: "2423", districtName: "Narmada" },
  { districtId: "2424", districtName: "Navsari" },
  { districtId: "2425", districtName: "Patan" },
  { districtId: "2426", districtName: "Porbandar" },
  { districtId: "2427", districtName: "Rajkot" },
  { districtId: "2428", districtName: "Sabarkantha" },
  { districtId: "2429", districtName: "Surat" },
  { districtId: "2430", districtName: "Surendranagar" },
  { districtId: "2431", districtName: "Tapi" },
  { districtId: "2432", districtName: "Vadodara" },
  { districtId: "2433", districtName: "Valsad" },
];

export const EDUCATIONAL_QUALIFICATIONS = [
  { value: "class_10", labelEn: "Class 10", labelGu: "ધોરણ 10" },
  { value: "class_12", labelEn: "Class 12", labelGu: "ધોરણ 12" },
  { value: "graduate", labelEn: "Graduate", labelGu: "સ્નાતક" },
  { value: "postgraduate", labelEn: "Post-Graduate", labelGu: "અનુસ્નાતક" },
];

export const PROFESSIONAL_QUALIFICATIONS = [
  { value: "ptc_deled", labelEn: "PTC / D.El.Ed", labelGu: "પી.ટી.સી / ડી.એલ.એડ" },
  { value: "bed", labelEn: "B.Ed", labelGu: "બી.એડ" },
  { value: "med", labelEn: "M.Ed", labelGu: "એમ.એડ" },
  { value: "phd", labelEn: "Ph.D", labelGu: "પી.એચ.ડી" },
  { value: "gset_net", labelEn: "GSET / NET", labelGu: "જીસેટ / નેટ" },
];

export const LANGUAGE_SKILLS = [
  { value: "gujarati_read", labelEn: "Gujarati – Read", labelGu: "ગુજરાતી – વાંચન" },
  { value: "gujarati_write", labelEn: "Gujarati – Write", labelGu: "ગુજરાતી – લેખન" },
  { value: "english_read", labelEn: "English – Read", labelGu: "અંગ્રેજી – વાંચન" },
  { value: "english_write", labelEn: "English – Write", labelGu: "અંગ્રેજી – લેખન" },
];

export const OCCUPATION_OPTIONS = [
  { value: "employed", labelEn: "Employed", labelGu: "નોકરી" },
];

export const GENDER_OPTIONS = [
  { value: "male", labelEn: "Male", labelGu: "પુરુષ" },
  { value: "female", labelEn: "Female", labelGu: "સ્ત્રી" },
  { value: "other", labelEn: "Other", labelGu: "અન્ય" },
];

export const CURRENT_SCHOOL_LEVEL_OPTIONS = [
  { value: "primary", labelEn: "Primary School", labelGu: "પ્રાથમિક શાળા" },
  { value: "secondary", labelEn: "Secondary School", labelGu: "માધ્યમિક શાળા" },
  { value: "other", labelEn: "Other", labelGu: "અન્ય" },
];

export const PRIMARY_DESIGNATION_OPTIONS = [
  {
    value: "mukhya_shikshak",
    labelEn: "Head Teacher",
    labelGu: "મુખ્ય શિક્ષક",
  },
  {
    value: "mukhya_shikshak_h_tat",
    labelEn: "Head Teacher (H Tat)",
    labelGu: "મુખ્ય શિક્ષક (એચ તાત)",
  },
  {
    value: "crc_coordinator",
    labelEn: "CRC Coordinator",
    labelGu: "સીઆરસી કોઓર્ડિનેટર",
  },
  {
    value: "kedavni_nirikshak",
    labelEn: "Education Inspector",
    labelGu: "કેડાવણી નિરીક્ષક",
  },
];

export const SECONDARY_DESIGNATION_OPTIONS = [
  {
    value: "acharya_varg_2",
    labelEn: "Acharya (Class 2)",
    labelGu: "આચાર્ય (વર્ગ 2)",
  },
];

export const ALL_DESIGNATION_OPTIONS = [
  ...PRIMARY_DESIGNATION_OPTIONS,
  ...SECONDARY_DESIGNATION_OPTIONS,
];

export const ORGANIZATION_TYPES = [
  { value: "government", labelEn: "Government", labelGu: "સરકારી" },
  { value: "grant_in_aid", labelEn: "Grant-in-Aid", labelGu: "અનુદાનિત" },
  { value: "non_grant_in_aid", labelEn: "Non-Grant-in-Aid", labelGu: "બિન-અનુદાનિત" },
  { value: "private", labelEn: "Private", labelGu: "ખાનગી" },
  { value: "ngo", labelEn: "NGO", labelGu: "NGO" },
  { value: "freelance", labelEn: "Freelance", labelGu: "ફ્રી-લાન્સ" },
  { value: "nivrut", labelEn: "Nivrut", labelGu: "નિવૃત્ત" },
];

export const VEHICLE_TYPES = [
  { value: "two_wheeler", labelEn: "Two-wheeler", labelGu: "ટૂ-વ્હીલર" },
  { value: "four_wheeler", labelEn: "Four-wheeler", labelGu: "ફોર-વ્હીલર" },
];

export const WORK_DURATION_OPTIONS = [
  { value: "one_week", labelEn: "One week", labelGu: "એક અઠવાડિયું" },
  { value: "two_weeks", labelEn: "Two weeks", labelGu: "બે અઠવાડિયા" },
  { value: "more_than_two_weeks", labelEn: "More than two weeks", labelGu: "બે અઠવાડિયાથી વધુ" },
];

export const YES_NO_OPTIONS = [
  { value: "yes", labelEn: "Yes", labelGu: "હા" },
  { value: "no", labelEn: "No", labelGu: "ના" },
];

export function formatBilingualOption(item) {
  if (!item) return "";
  if (!item.labelGu || item.labelGu === item.labelEn) return item.labelEn;
  return `${item.labelGu} (${item.labelEn})`;
}

export const INITIAL_VERIFIER_FORM = {
  fullName: "",
  gender: "",
  teacherCode: "",
  email: "",
  dateOfBirth: "",
  mobileNumber: "",
  educationalQualification: "",
  professionalQualifications: [],
  computerKnowledge: "",
  languageSkills: [],
  occupation: "",
  organizationType: "",
  currentSchoolLevel: "",
  currentSchoolLevelOther: "",
  currentDesignation: "",
  experienceYears: "",
  experienceMonths: "",
  previousAccreditationWork: "",
  previousAccreditationDuration: "",
  otherVerificationExperience: "",
  otherVerificationDetails: "",
  preferredDistrict1: "",
  preferredDistrict2: "",
  preferredDistrict3: "",
  preferredTaluka1: "",
  preferredTaluka2: "",
  preferredTaluka3: "",
  hasVehicle: "",
  vehicleType: "",
  hasDrivingLicense: "",
  workDuration: "",
  aadhaarNumber: "",
  confirmAadhaarNumber: "",
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankBranch: "",
  bankName: "",
  bankAddress: "",
  selfDeclaration: false,
};
