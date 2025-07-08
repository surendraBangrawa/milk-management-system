import { useEffect, useState } from "react";
import { StyleSheet, View, Text, Image, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { getProfileApi } from "@/redux/slice/profile/profileApi";
import { Stack } from "expo-router";
const Avatar = require("../../../assets/images/avatar.jpg");

import useTheme from "@/context/theme/useTheme";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  const { colors } = useTheme();

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Profile",
          headerStyle: {
            backgroundColor: colors.surface, // Use surface color for header background
          },
          headerTintColor: colors.textPrimary, // Use primary text color for title and icons
          headerTitleStyle: {
            color: colors.textPrimary, // Ensure title color is also themed
          },
        }}
      />
      <View style={styles.header}>
        <Image source={Avatar} style={styles.profilePic} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {userData?.name}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {userData?.mobile}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor applied inline from theme
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor applied inline from theme
  },
  errorText: {
    // color applied inline from theme
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    // color applied inline from theme
  },
  userEmail: {
    fontSize: 16,
    // color applied inline from theme
  },
  // Example styles for potential future elements, themed
  input: {
    // backgroundColor applied inline from theme
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    // borderColor applied inline from theme
    // color applied inline from theme for text input
  },
  editButton: {
    // backgroundColor applied inline from theme
    paddingVertical: 12,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff", // Keep white text for contrast on colored buttons
    fontSize: 16,
  },
  saveButton: {
    // backgroundColor applied inline from theme
    paddingVertical: 12,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff", // Keep white text for contrast on colored buttons
    fontSize: 16,
  },
  logoutButton: {
    // backgroundColor applied inline from theme
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff", // Keep white text for contrast on colored buttons
    fontSize: 16,
  },
  deleteButton: {
    // backgroundColor applied inline from theme
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff", // Keep white text for contrast on colored buttons
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    marginTop: 10,
    // color applied inline from theme
  },
});
