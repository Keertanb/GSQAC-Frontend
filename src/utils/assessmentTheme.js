import { colors } from "../constants/colors";

export const ASSESSMENT_THEME_KIND = {
  ADMINISTRATIVE: "administrative",
  ACADEMIC: "academic",
};

const ADMIN_KEYWORDS = [
  "administrative",
  "administration",
  "પ્રશાસન",
  "શાસન",
  "प्रशासनिक",
  "प्रशासन",
];

const ACADEMIC_KEYWORDS = [
  "academic",
  "શૈક્ષણિક",
  "शैक्षणिक",
];

const ACADEMIC_THEME = {
  kind: ASSESSMENT_THEME_KIND.ACADEMIC,
  label: "Academic",
  primary: colors.primary.blue,
  dark: colors.primary.dark,
  light: colors.primary.light,
  lighter: colors.primary.lighter,
  lightest: colors.primary.lightest,
  gradient: `linear-gradient(135deg, ${colors.primary.blue} 0%, ${colors.primary.dark} 100%)`,
  panelGradient: `linear-gradient(180deg, ${colors.primary.lightest} 0%, #ffffff 100%)`,
};

const ADMINISTRATIVE_THEME = {
  kind: ASSESSMENT_THEME_KIND.ADMINISTRATIVE,
  label: "Administrative",
  primary: colors.saffron.main,
  dark: colors.saffron.dark,
  light: colors.saffron.light,
  lighter: colors.saffron.lighter,
  lightest: colors.saffron.lightest,
  gradient: `linear-gradient(135deg, ${colors.saffron.main} 0%, ${colors.saffron.dark} 100%)`,
  panelGradient: `linear-gradient(180deg, ${colors.saffron.lightest} 0%, #ffffff 100%)`,
};

const THEMES = {
  [ASSESSMENT_THEME_KIND.ACADEMIC]: ACADEMIC_THEME,
  [ASSESSMENT_THEME_KIND.ADMINISTRATIVE]: ADMINISTRATIVE_THEME,
};

function normalizeAssessmentHaystack(assessment) {
  if (!assessment) return "";
  return [
    assessment.assessmentName,
    assessment.assessmentEn,
    assessment.assessmentGu,
    assessment.assessmentHi,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function getAssessmentThemeKind(assessment) {
  const haystack = normalizeAssessmentHaystack(assessment);
  if (!haystack) return ASSESSMENT_THEME_KIND.ACADEMIC;

  if (ADMIN_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
    return ASSESSMENT_THEME_KIND.ADMINISTRATIVE;
  }

  if (ACADEMIC_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()))) {
    return ASSESSMENT_THEME_KIND.ACADEMIC;
  }

  return ASSESSMENT_THEME_KIND.ACADEMIC;
}

export function getAssessmentTheme(assessment) {
  return THEMES[getAssessmentThemeKind(assessment)] || ACADEMIC_THEME;
}

export function withThemeAlpha(theme, alphaHex) {
  return `${theme.primary}${alphaHex}`;
}
