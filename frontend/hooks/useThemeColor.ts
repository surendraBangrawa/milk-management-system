import useTheme from "@/context/theme/useTheme";
import { StyleSheet } from "react-native";

/**
 * Hook to get theme-aware colors and styles
 * Provides consistent theming across the app
 */
export const useThemeColor = () => {
  const { colors, themeMode } = useTheme();

  return {
    // Colors
    colors,
    themeMode,

    // Common style objects
    styles: {
      // Text styles
      textPrimary: { color: colors.textPrimary },
      textSecondary: { color: colors.textSecondary },
      textError: { color: colors.error },
      textSuccess: { color: colors.success },
      textWarning: { color: colors.warning },
      textInfo: { color: colors.info },

      // Background styles
      background: { backgroundColor: colors.background },
      surface: { backgroundColor: colors.surface },
      cardBackground: { backgroundColor: colors.card },
      inputBackground: { backgroundColor: colors.inputBackground },

      // Border styles
      border: { borderColor: colors.border },
      divider: { borderColor: colors.divider },

      // Status bar
      statusBarLight: { barStyle: "light-content" as const },
      statusBarDark: { barStyle: "dark-content" as const },
      statusBarAuto: {
        barStyle:
          themeMode === "dark" ? "light-content" : ("dark-content" as const),
      },

      // Common component styles
      button: {
        primary: {
          backgroundColor: colors.primary,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          alignItems: "center" as const,
        },
        secondary: {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          alignItems: "center" as const,
        },
        error: {
          backgroundColor: colors.error,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          alignItems: "center" as const,
        },
      },

      input: {
        container: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 12,
          backgroundColor: colors.inputBackground,
        },
        text: {
          color: colors.textPrimary,
          fontSize: 16,
        },
        placeholder: {
          color: colors.placeholder,
        },
      },

      card: {
        container: {
          backgroundColor: colors.card,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2,
        },
      },

      list: {
        item: {
          backgroundColor: colors.surface,
          paddingVertical: 16,
          paddingHorizontal: 16,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        itemText: {
          color: colors.textPrimary,
          fontSize: 16,
          fontWeight: "500" as const,
        },
        itemSubtext: {
          color: colors.textSecondary,
          fontSize: 14,
        },
      },
    },

    // Utility functions
    getStatusBarStyle: () =>
      themeMode === "dark" ? "light-content" : "dark-content",
    getOverlayColor: () => colors.overlay,
    getShadowColor: () => colors.shadow,
  };
};
