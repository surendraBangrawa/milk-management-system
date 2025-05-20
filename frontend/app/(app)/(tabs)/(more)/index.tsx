import React from "react"; // useEffect might not be needed here, but keeping it if used elsewhere
import { useSession } from "@/context/AuthProvider";
import { useRouter } from "expo-router";
import { StyleSheet, View, Text, Pressable } from "react-native";

import useTheme from "@/context/theme/useTheme";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons

// Define the structure for an option
interface Option {
  label: string;
  path?: string; // Path for navigation
  type?: "logout"; // Special type for actions like logout
  icon: keyof typeof Ionicons.glyphMap; // Type for Ionicons names
  iconColor?: string; // Optional: specific color for the icon
  hideChevron?: boolean; // Optional: hide navigation arrow
}

// Define the structure for a section
interface Section {
  title?: string; // Optional title for the section
  data: Option[];
}

// Define the structured list of options in sections
const sections: Section[] = [
  {
    title: "Account",
    data: [
      { label: "Profile", path: "/(app)/profile", icon: "person-outline" },
      {
        label: "Manage Subscription",
        path: "/(app)/subscription",
        icon: "card-outline",
      },
    ],
  },
  {
    // No title for this section if you prefer
    data: [
      { label: "Rate List", path: "/(app)/ratelist", icon: "star-outline" },
    ],
  },
  {
    title: "Support",
    data: [
      // Using placeholder console logs for now if paths aren't defined
      { label: "Help", icon: "help-circle-outline" },
      { label: "About", icon: "information-circle-outline" },
    ],
  },
  {
    // Section specifically for actions like logout
    data: [
      {
        label: "Logout",
        type: "logout",
        icon: "log-out-outline",
        hideChevron: true,
      }, // Hide arrow for logout
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
    // Use background color from theme
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {sections.map((section, sectionIndex) => (
        <View key={`section-${sectionIndex}`} style={styles.sectionContainer}>
          {section.title && (
            // Apply theme color to section title
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {section.title}
            </Text>
          )}
          <View
            style={[styles.optionsList, { backgroundColor: colors.surface }]}
          >
            {section.data.map((option, optionIndex) => (
              <Pressable
                key={option.label} // Use label as key
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    // Subtle background change on press (optional, surface is fine)
                    // backgroundColor: pressed ? colors.border : colors.surface,
                    backgroundColor: colors.surface, // Keep surface for consistent background
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
                    // Use iconColor if specified, otherwise use textPrimary from theme
                    color={option.iconColor || colors.textPrimary}
                    style={styles.optionIcon}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      {
                        // Use error color for logout text, otherwise textPrimary from theme
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
                      // Use textSecondary from theme for chevron color
                      color={colors.textSecondary}
                      style={styles.chevronIcon}
                    />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16, // Padding around the whole screen content
    // backgroundColor applied inline from theme
  },
  sectionContainer: {
    marginBottom: 24, // Space between sections
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8, // Space between title and options list
    paddingHorizontal: 8, // Align title roughly with list padding
    // color applied inline from theme
  },
  optionsList: {
    borderRadius: 12, // Rounded corners for the option group container
    overflow: "hidden", // Ensures children respect border radius
    elevation: 2, // Android shadow
    // shadowColor applied inline from theme if needed for Android
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // iOS shadow opacity (can be adjusted)
    shadowRadius: 4, // iOS shadow blur radius
    // backgroundColor applied inline from theme
  },
  optionButton: {
    // Background color applied inline based on press state/type
    paddingVertical: 16, // Increased vertical padding
    paddingHorizontal: 16, // Horizontal padding for content
    // No border here, use a separator view if needed between items
  },
  optionContent: {
    flexDirection: "row", // Arrange icon, text, and chevron horizontally
    alignItems: "center", // Vertically align items
    justifyContent: "space-between", // Distribute space: icon left, text center/fill, chevron right
  },
  optionIcon: {
    marginRight: 16, // Space between icon and text
    // color applied inline from theme or option.iconColor
  },
  optionText: {
    flex: 1, // Allows the text to take up available space
    fontSize: 16,
    fontWeight: "500",
    // color applied inline based on type (logout/other)
  },
  chevronIcon: {
    marginLeft: 16, // Space between text and chevron
    // color applied inline from theme
  },
});
