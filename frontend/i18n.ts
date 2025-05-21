import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <-- Import AsyncStorage
import * as en from "./locals/en/translation";
import * as hi from "./locals/hi/translation";

// Make sure your paths are correct.
// If your i18n.js is at the root, and locales are in src/locales,
// then the paths should be relative to i18n.js.
// For example, if i18n.js is in the root and translation files are in `src/locales/en/translation.json`,
// then the import path should be `./src/locales/en/translation.json`.
// I've adjusted them based on the common structure from earlier.

const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
  // Add other languages here if you have them, e.g.:
  // mr: {
  //   translation: require("./locales/mr/translation.json"),
  // },
};

// Function to get the preferred language based on device settings
const getPreferredLanguage = () => {
  const locales = Localization.getLocales(); // Get all user preferred locales
  // The first locale in the list is usually the most preferred one
  const preferredLanguage = locales[0]?.languageCode || "en";

  // You can implement more sophisticated logic here,
  // for example, checking if preferredLanguage is in your supported list
  // If not, you might want to return 'en' or your app's default language.
  return preferredLanguage;
};

// Optional: Language Detector if you want more control or async storage
const languageDetector = {
  type: "languageDetector",
  async: true, // Set to true if you plan to use AsyncStorage or similar
  init: () => {},
  // Use `getLocales()[0].languageTag` for full tag like 'en-US', or `.languageCode` for 'en'
  detect: async (callback) => {
    try {
      const savedLanguage = await AsyncStorage.getItem("user-language"); // Example: if you save language manually
      if (savedLanguage) {
        return callback(savedLanguage);
      }
    } catch (error) {
      console.error("Failed to load language from AsyncStorage", error);
    }
    callback(getPreferredLanguage()); // Use device locale if no saved language
  },
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem("user-language", lng); // Example: save user's chosen language
    } catch (error) {
      console.error("Failed to save language to AsyncStorage", error);
    }
  },
};

i18n
  .use(languageDetector) // <-- Now uncomment this line to use the custom language detector
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    // If using a custom language detector, `lng` here will be overridden by `detect`
    // but it's good to have a default for initial setup or if detector fails.
    lng: getPreferredLanguage(),
    fallbackLng: "en", // Fallback language if translation is missing
    debug: true, // Set to false in production
    compatibilityJSON: "v3", // Important for older Android versions
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

// Important for Android: Listen for device language changes
// On iOS, the app typically restarts when the device language changes,
// but on Android, it might not. You'll need to handle this manually
// if you want your app to update its language without a full restart.
// For simplicity, `expo-localization` usually handles this well enough
// by providing the updated locale on subsequent app starts.
// If you need real-time updates without restarting the app on Android,
// you might need to combine this with AppState listeners or reload the app.
// For most cases, the default `expo-localization` behavior is sufficient.

export default i18n;
