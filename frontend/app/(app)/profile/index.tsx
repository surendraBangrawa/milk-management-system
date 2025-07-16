import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Stack } from "expo-router";
import { getProfileApi } from "@/redux/slice/profile/profileApi";
import Toast from "react-native-toast-message";
import useTheme from "@/context/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";

interface UserData {
  name: string;
  email: string;
  phone: string;
  // Add other fields as needed
}

export default function Profile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  const { colors, themeMode, systemThemeMode, manualThemeMode, setTheme } =
    useTheme();

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfileApi();
      if (res.status === 200) {
        setUserData(res.data);
      } else {
        setError("Failed to load profile data.");
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load profile data.",
        });
      }
    } catch (err) {
      setError("Failed to load profile data.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load profile data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  const themeOptions = [
    { key: "system", label: "System", icon: "settings-outline" },
    { key: "light", label: "Light", icon: "sunny-outline" },
    { key: "dark", label: "Dark", icon: "moon-outline" },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: "Profile",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        {/* User Info Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            User Information
          </Text>
          {userData && (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Name:
                </Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  {userData.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Email:
                </Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  {userData.email}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Phone:
                </Text>
                <Text style={[styles.value, { color: colors.textPrimary }]}>
                  {userData.phone}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Theme Settings Section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Theme Settings
          </Text>
          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Choose your preferred theme
          </Text>

          {themeOptions.map((option) => {
            const isSelected =
              (option.key === "system" && manualThemeMode === "system") ||
              (option.key === "light" && manualThemeMode === "light") ||
              (option.key === "dark" && manualThemeMode === "dark");

            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + "20"
                      : "transparent",
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() =>
                  setTheme(option.key as "light" | "dark" | "system")
                }
              >
                <View style={styles.themeOptionContent}>
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={isSelected ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      {
                        color: isSelected ? colors.primary : colors.textPrimary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.key === "system" && (
                    <Text
                      style={[
                        styles.themeOptionSubtext,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ({systemThemeMode === "dark" ? "Dark" : "Light"})
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  themeOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  themeOptionSubtext: {
    fontSize: 14,
    marginLeft: 8,
  },
});
