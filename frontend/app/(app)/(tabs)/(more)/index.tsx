import { useSession } from "@/context/AuthProvider";
import { useRouter } from "expo-router";
import { StyleSheet, View, Text, Pressable, Platform } from "react-native"; // Import Platform

import useTheme from "@/context/theme/useTheme"; // Import useTheme

export default function TabTwoScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const { colors } = useTheme(); // Use the useTheme hook

  const handleOptionPress = (option: string) => {
    console.log(`${option} pressed`);
    if (option === "Profile") {
      router.push("/(app)/profile");
    }
    if (option === "Manage Subscription") {
      router.push("/(app)/subscription");
    }
    if (option === "Rate List") {
      router.push("/(app)/ratelist");
    }
    // Add navigation for Help and About if they exist
    if (option === "Help") {
      // router.push("/(app)/help"); // Example path
      console.log("Help navigation not implemented"); // Placeholder
    }
    if (option === "About") {
      // router.push("/(app)/about"); // Example path
      console.log("About navigation not implemented"); // Placeholder
    }
    if (option === "Logout") {
      signOut();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.optionsContainer}>
        <Pressable
          style={({ pressed }) => [
            // Use pressed state for feedback
            styles.option,
            {
              backgroundColor: pressed ? colors.primaryDark : colors.primary, // Darker on press
            },
          ]}
          onPress={() => handleOptionPress("Profile")}
          android_ripple={{ color: colors.primaryDark }} // Add ripple effect for Android
        >
          <Text style={[styles.optionText, { color: colors.surface }]}>
            Profile
          </Text>
        </Pressable>

        {/* Manage Subscription Option */}
        <Pressable
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
            },
          ]}
          onPress={() => handleOptionPress("Manage Subscription")}
          android_ripple={{ color: colors.primaryDark }}
        >
          <Text style={[styles.optionText, { color: colors.surface }]}>
            Manage Subscription
          </Text>
        </Pressable>

        {/* Rate List Option */}
        <Pressable
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
            },
          ]}
          onPress={() => handleOptionPress("Rate List")}
          android_ripple={{ color: colors.primaryDark }}
        >
          <Text style={[styles.optionText, { color: colors.surface }]}>
            Rate List
          </Text>
        </Pressable>

        {/* Help Option */}
        <Pressable
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
            },
          ]}
          onPress={() => handleOptionPress("Help")}
          android_ripple={{ color: colors.primaryDark }}
        >
          <Text style={[styles.optionText, { color: colors.surface }]}>
            Help
          </Text>
        </Pressable>

        {/* About Option */}
        <Pressable
          style={({ pressed }) => [
            styles.option,
            {
              backgroundColor: pressed ? colors.primaryDark : colors.primary,
            },
          ]}
          onPress={() => handleOptionPress("About")}
          android_ripple={{ color: colors.primaryDark }}
        >
          <Text style={[styles.optionText, { color: colors.surface }]}>
            About
          </Text>
        </Pressable>

        {/* Logout Option */}
        <Pressable
          style={({ pressed }) => [
            styles.option,
            {
              // Use error color for logout button
              backgroundColor: pressed ? colors.error : colors.error, // Keep error color on press
            },
          ]}
          onPress={() => handleOptionPress("Logout")}
          android_ripple={{ color: colors.error }} // Ripple with error color
        >
          <Text style={[styles.optionText, { color: colors.surface }]}>
            Logout
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16, // Adjusted padding for consistency
    // Background color from theme applied inline
  },
  headerText: {
    // Optional header style
    fontSize: 24,
    fontWeight: "600",
    // Color from theme applied inline if used
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: "column",
    gap: 12, // Adjusted gap for consistency
  },
  option: {
    // Background color from theme applied inline
    paddingVertical: 14, // Adjusted padding
    paddingHorizontal: 16, // Added horizontal padding
    borderRadius: 8, // Adjusted border radius
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "500",
    // Color from theme applied inline
  },
});
