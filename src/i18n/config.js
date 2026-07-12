import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import enTranslations from "../locales/en/translation.json";
import hiTranslations from "../locales/hi/translation.json";
import guTranslations from "../locales/gu/translation.json";
import {
  getStoredAppLanguage,
  LANGUAGE_STORAGE_KEY,
} from "../utils/i18nLanguage";

const initialLanguage = getStoredAppLanguage();

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslations,
      },
      hi: {
        translation: hiTranslations,
      },
      gu: {
        translation: guTranslations,
      },
    },
    lng: initialLanguage,
    fallbackLng: "en",
    supportedLngs: ["gu", "en", "hi"],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
  });

export default i18n;
