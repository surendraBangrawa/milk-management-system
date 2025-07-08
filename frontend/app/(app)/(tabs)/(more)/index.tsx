import { useSession } from "@/context/AuthProvider";
import { useRouter } from "expo-router";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import useTheme from "@/context/theme/useTheme";

interface Option {
  labelKey: string;
  path?: string;
  type?: "logout";
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  hideChevron?: boolean;
}

interface Section {
  titleKey?: string;
  data: Option[];
}

const sections: Section[] = [
  {
    titleKey: "account.title",
    data: [
      {
        labelKey: "account.profile",
        path: "/(app)/profile",
        icon: "person-outline",
      },
      {
        labelKey: "account.summary",
        path: "/(app)/summary",
        icon: "document-text-outline",
      },
      {
        labelKey: "account.manage_subscription",
        path: "/(app)/subscription",
        icon: "card-outline",
      },
      {
        labelKey: "account.rate_list",
        path: "/(app)/ratelist",
        icon: "star-outline",
      },
    ],
  },
  {
    titleKey: "settings.title",
    data: [
      {
        labelKey: "account.language",
        path: "/(app)/language",
        icon: "language-outline",
      },
    ],
  },
  {
    titleKey: "more.information_and_support",
    data: [
      {
        labelKey: "more.about_us",
        path: "/(app)/about",
        icon: "information-circle-outline",
      },
      {
        labelKey: "more.contact_us",
        path: "/(app)/contact",
        icon: "mail-outline",
      },
      {
        labelKey: "more.terms_and_conditions",
        path: "/(app)/terms",
        icon: "document-text-outline",
      },
      {
        labelKey: "more.privacy_policy",
        path: "/(app)/privacy",
        icon: "shield-checkmark-outline",
      },
      {
        labelKey: "more.refund_policy",
        path: "/(app)/refund",
        icon: "cash-outline",
      },
      {
        labelKey: "more.help",
        path: "/(app)/help",
        icon: "help-circle-outline",
      },
    ],
  },
  {
    data: [
      {
        labelKey: "account.logout",
        type: "logout",
        icon: "log-out-outline",
        iconColor: "#e74c3c",
        hideChevron: true,
      },
    ],
  },
];

export default function TabTwoScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleOptionPress = (option: Option) => {
    if (option.type === "logout") {
      signOut();
    } else if (option.path) {
      router.push(option.path as any);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {sections.map((section, sectionIndex) => (
        <View key={`section-${sectionIndex}`} style={styles.sectionContainer}>
          {section.titleKey && (
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t(section.titleKey)}
            </Text>
          )}
          <View
            style={[styles.optionsList, { backgroundColor: colors.surface }]}
          >
            {section.data.map((option, optionIndex) => (
              <Pressable
                key={option.labelKey} // Use labelKey as key for stability
                style={({ pressed }) => [
                  styles.optionButton,
                  {
                    backgroundColor: colors.surface,
                    borderBottomWidth:
                      optionIndex === section.data.length - 1
                        ? 0
                        : StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={() => handleOptionPress(option)}
                accessibilityRole="button"
                accessibilityLabel={`${t(option.labelKey)} option`} // Translate accessibility label
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
                    {t(option.labelKey)}
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
            ))}
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
    shadowColor: "#000", // Add shadow color for consistent appearance
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
