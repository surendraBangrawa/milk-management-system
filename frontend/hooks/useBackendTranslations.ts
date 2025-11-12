import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { i18nApi, TranslationResponse } from "../lib/api";
import logger from "../lib/logger";

export const useBackendTranslations = () => {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBackendTranslations = async (language: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: TranslationResponse = await i18nApi.getTranslations(
        language
      );

      // Add backend translations to i18n resources
      if (response.translations) {
        i18n.addResourceBundle(
          language,
          "translation",
          response.translations,
          true,
          true
        );
      }

      return response.translations;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load translations";
      setError(errorMessage);
      logger.error("Error loading backend translations", err as Error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLanguage = async (language: string) => {
    try {
      // Load backend translations for the new language
      await loadBackendTranslations(language);

      // Change the language
      await i18n.changeLanguage(language);

      // Update language preference in backend
      await i18nApi.updateLanguage(language);
    } catch (err) {
      logger.error("Error updating language", err as Error);
      throw err;
    }
  };

  // Load backend translations when component mounts
  useEffect(() => {
    const currentLanguage = i18n.language;
    if (currentLanguage) {
      loadBackendTranslations(currentLanguage);
    }
  }, []);

  return {
    loadBackendTranslations,
    updateLanguage,
    isLoading,
    error,
  };
};
