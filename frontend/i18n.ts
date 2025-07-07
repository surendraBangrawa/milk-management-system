// i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import shared translation files
import enTranslation from "./locales/en/translation.json";
import hiTranslation from "./locales/hi/translation.json";

// Define your resources
const resources = {
  en: {
    translation: enTranslation, // Assign the imported object here
  },
  hi: {
    translation: hiTranslation, // Assign the imported object here
  },
};

// Function to fetch translations from backend
const fetchBackendTranslations = async (language: string) => {
  try {
    const { i18nApi } = await import("./lib/api");
    const response = await i18nApi.getTranslations(language);
    return response.translations;
  } catch (error) {
    console.error("Failed to fetch translations from backend:", error);
    return null;
  }
};

// AsyncStorage detector for react-i18next
const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string | undefined) => void) => {
    try {
      const language = await AsyncStorage.getItem("user-language");
      callback(language || undefined);
    } catch (error) {
      console.error("Failed to detect language from AsyncStorage", error);
      callback(undefined);
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem("user-language", language);
    } catch (error) {
      console.error("Failed to cache language to AsyncStorage", error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en", // Default language if detection fails or language is not found
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    // Set debug to true temporarily to see more i18next logs, then set to false for production
    debug: __DEV__, // Use __DEV__ for React Native to enable debug only in development
    compatibilityJSON: "v4", // Updated to v4 for newer i18next versions
  });

export default i18n;
