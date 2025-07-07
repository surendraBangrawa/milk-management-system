import axiosInstance from "./axiosIntance";

export interface TranslationResponse {
  language: string;
  translations: Record<string, any>;
}

export interface LanguagesResponse {
  languages: string[];
  default: string;
}

export const i18nApi = {
  // Get translations for a specific language
  getTranslations: async (language?: string): Promise<TranslationResponse> => {
    const params = language ? { lang: language } : {};
    const response = await axiosInstance.get("/i18n/translations", { params });
    return response.data;
  },

  // Get supported languages
  getLanguages: async (): Promise<LanguagesResponse> => {
    const response = await axiosInstance.get("/i18n/languages");
    return response.data;
  },

  // Update user language preference
  updateLanguage: async (language: string): Promise<void> => {
    await axiosInstance.post("/i18n/language", { language });
  },
};
