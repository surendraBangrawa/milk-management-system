import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useTheme from "@/context/theme/useTheme"; // Assuming this hook provides theme colors
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// A more flexible and customizable button component
interface LanguageOptionButtonProps {
  label: string;
  onPress: () => void;
  isSelected: boolean;
  color: string; // Primary color from theme
  textColor: string; // Text color from theme
  borderColor: string; // Border color for unselected state
}

const LanguageOptionButton: React.FC<LanguageOptionButtonProps> = ({
  label,
  onPress,
  isSelected,
  color,
  textColor,
  borderColor,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.languageButton,
        {
          backgroundColor: isSelected ? color : "transparent",
          borderColor: isSelected ? color : borderColor,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.languageButtonText,
          { color: isSelected ? textColor : color }, // Text color changes based on selection
        ]}
      >
        {label}
      </Text>
      {isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={textColor}
          style={styles.checkmarkIcon}
        />
      )}
    </TouchableOpacity>
  );
};

// --- Main Component ---

function LanguageSettingsScreen() {
  const { i18n, t } = useTranslation(); // Destructure 't' for translations
  const { colors } = useTheme(); // Your custom theme hook

  // Correctly reference translation keys for language names
  const languages = [
    { code: "en", name: t("language_screen.english") },
    { code: "hi", name: t("language_screen.hindi") },
  ];

  // Fallback for safety, using the correct translation key
  const currentLanguageDisplayName =
    languages.find((lang) => lang.code === i18n.language)?.name ||
    t("language_screen.unknown_language");

  const changeLanguage = async (lng: string) => {
    if (i18n.language === lng) {
      // Don't do anything if the language is already selected
      return;
    }
    try {
      await i18n.changeLanguage(lng);
      await AsyncStorage.setItem("user-language", lng);
      // Optional: Show a toast/snackbar confirmation
      // Toast.show({ text: t("language_screen.change_success"), type: "success" });
    } catch (error) {
      console.error("Failed to change language:", error);
      // Use correct translation keys for error messages
      Alert.alert(t("common.error"), t("language_screen.change_error"));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: t("settings.language"), // Translate the header title
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: Platform.select({ ios: "600", android: "bold" }), // Platform-specific font weight
          },
        }}
      />

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t("language_screen.select_language")}
      </Text>

      <Text
        style={[styles.currentLanguageText, { color: colors.textSecondary }]}
      >
        {t("language_screen.current_language")}:{" "}
        <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>
          {currentLanguageDisplayName}
        </Text>
      </Text>

      <View style={styles.buttonContainer}>
        {languages.map((lang) => (
          <LanguageOptionButton
            key={lang.code}
            label={lang.name}
            onPress={() => changeLanguage(lang.code)}
            isSelected={i18n.language === lang.code}
            color={colors.primary}
            textColor={colors.onPrimary} // Text color for primary background
            borderColor={colors.border} // Neutral border for unselected
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40, // More top padding for better visual spacing
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  currentLanguageText: {
    fontSize: 16,
    marginBottom: 40, // Increased margin for better separation
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%", // Take full width
    gap: 15, // Space between buttons (React Native 0.71+ support)
    // For older RN versions, use marginVertical on LanguageOptionButton
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Center text and icon
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10, // Slightly more rounded
    borderWidth: 1,
    minWidth: 150, // Ensure a minimum width for buttons
  },
  languageButtonText: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 10, // Space between text and checkmark
  },
  checkmarkIcon: {
    marginLeft: "auto", // Push icon to the right
  },
});

export default LanguageSettingsScreen;
