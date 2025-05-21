import React from "react";
import { useSession } from "@/context/AuthProvider";
import { useRouter } from "expo-router";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import useTheme from "@/context/theme/useTheme";

// Define the structure for an option
interface Option {
  label: string;
  path?: string; // Path for navigation
  type?: "logout" | "language"; // Special type for actions like logout or language selector
  icon: keyof typeof Ionicons.glyphMap; // Type for Ionicons names
  iconColor?: string; // Optional: specific color for the icon
  hideChevron?: boolean; // Optional: hide navigation arrow
}

// Define the structure for a section
interface Section {
  title?: string; // Optional title for the section
  data: Option[];
}

// Placeholder for LanguageSelector component - assuming it exists elsewhere
const LanguageSelector = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.optionButton, { backgroundColor: colors.surface }]}>
      <View style={styles.optionContent}>
        <Ionicons
          name="language-outline"
          size={24}
          color={colors.textPrimary}
          style={styles.optionIcon}
        />
        <Text style={[styles.optionText, { color: colors.textPrimary }]}>
          English
        </Text>
        <Ionicons
          name="chevron-forward-outline"
          size={20}
          color={colors.textSecondary}
          style={styles.chevronIcon}
        />
      </View>
    </View>
  );
};

// Define the structured list of options in sections
const sections: Section[] = [
  {
    title: "Account",
    data: [
      { label: "Profile", path: "/(app)/profile", icon: "person-outline" },
      {
        label: "Summary",
        path: "/(app)/summary",
        icon: "document-text-outline",
      },
      {
        label: "Manage Subscription",
        path: "/(app)/subscription",
        icon: "card-outline",
      },
    ],
  },
  {
    data: [
      { label: "Rate List", path: "/(app)/ratelist", icon: "star-outline" },
    ],
  },
  {
    title: "Support",
    data: [
      { label: "Help", icon: "help-circle-outline" },
      { label: "About", icon: "information-circle-outline" },
    ],
  },
  {
    title: "Language", // Changed title to "Language" for consistency
    data: [
      // This section will now render the LanguageSelector component directly
      {
        label: "Language Selector",
        type: "language",
        icon: "language-outline",
        hideChevron: false,
      },
    ],
  },
  {
    data: [
      {
        label: "Logout",
        type: "logout",
        icon: "log-out-outline",
        hideChevron: true,
      },
    ],
  },
];

export default function TabTwoScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const { colors } = useTheme(); // Get colors from your theme context

  const handleOptionPress = (option: Option) => {
    console.log(`${option.label} pressed`);

    if (option.type === "logout") {
      signOut();
    } else if (option.path) {
      // Navigate if a path is defined
      router.push(option.path);
    } else {
      // Handle options without a path or specific type
      console.log(`${option.label}: Action not implemented or handled.`);
      // Add specific logic here if needed for 'Help', 'About', etc.
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {sections.map((section, sectionIndex) => (
        <View key={`section-${sectionIndex}`} style={styles.sectionContainer}>
          {section.title && (
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {section.title}
            </Text>
          )}
          <View
            style={[styles.optionsList, { backgroundColor: colors.surface }]}
          >
            {section.data.map((option, optionIndex) => {
              // Conditionally render LanguageSelector if type is 'language'
              if (option.type === "language") {
                return <LanguageSelector key={option.label} />;
              }
              return (
                <Pressable
                  key={option.label}
                  style={({ pressed }) => [
                    styles.optionButton,
                    {
                      backgroundColor: colors.surface,
                    },
                  ]}
                  onPress={() => handleOptionPress(option)}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} option`}
                >
                  <View style={styles.optionContent}>
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={option.iconColor || colors.textPrimary}
                      style={styles.optionIcon}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            option.type === "logout"
                              ? colors.error
                              : colors.textPrimary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>

                    {option.path && !option.hideChevron && (
                      <Ionicons
                        name="chevron-forward-outline"
                        size={20}
                        color={colors.textSecondary}
                        style={styles.chevronIcon}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  optionsList: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  chevronIcon: {
    marginLeft: 16,
  },
});
