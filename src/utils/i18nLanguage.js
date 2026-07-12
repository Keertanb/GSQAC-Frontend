export const SUPPORTED_LANGUAGES = ["gu", "en", "hi"];
export const DEFAULT_LANGUAGE = "gu";
export const LANGUAGE_STORAGE_KEY = "gsqac-i18nextLng";

export function resolveAppLanguage(language) {
  if (language && SUPPORTED_LANGUAGES.includes(language)) {
    return language;
  }
  return DEFAULT_LANGUAGE;
}

export function getStoredAppLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return resolveAppLanguage(stored);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function persistAppLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, resolveAppLanguage(language));
  } catch {
    // Ignore storage errors (private mode, etc.)
  }
}
