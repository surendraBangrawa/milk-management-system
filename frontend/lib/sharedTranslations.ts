import enTranslations from "../../shared/translations/en.json";
import hiTranslations from "../../shared/translations/hi.json";

export const sharedTranslations = {
  en: enTranslations,
  hi: hiTranslations,
};

export const getSharedTranslation = (key: string, language: string = "en") => {
  const translations =
    sharedTranslations[language as keyof typeof sharedTranslations];
  if (!translations) {
    console.warn(`Translation not found for language: ${language}`);
    return key;
  }

  // Split the key by dots to navigate nested structure
  const keys = key.split(".");
  let value: any = translations;

  try {
    for (const k of keys) {
      value = value[k];
    }

    if (typeof value === "string") {
      return value;
    } else {
      console.warn(`Translation key "${key}" is not a string`);
      return key;
    }
  } catch (error) {
    console.warn(`Translation key "${key}" not found in ${language}`);
    return key;
  }
};

export const getAllSharedTranslations = (language: string = "en") => {
  return sharedTranslations[language as keyof typeof sharedTranslations] || {};
};
