import {
  Text,
  SafeAreaView,
  Pressable,
  View,
  StatusBar,
  StyleSheet,
  ActivityIndicator, // Import ActivityIndicator for loading state
  ImageBackground, // Use ImageBackground for a potential background image
} from "react-native";
import React from "react";
import { useSession } from "@/context/AuthProvider";
import { Redirect, useRouter } from "expo-router";
// Import your useTheme hook
import useTheme from "@/context/theme/useTheme";

// Optional: Import a background image if you have one
// const backgroundImage = require("../assets/images/hero-background.jpg"); // Replace with your image path

const HeroScreen = () => {
  const router = useRouter();
  const { session, isLoading } = useSession();
  // Access theme colors and mode
  const { colors, themeMode } = useTheme();

  // Determine status bar style based on theme mode
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";

  // Show a themed loading indicator while checking session
  if (isLoading) {
    return (
      <View
        style={[
          styles.centeredContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar barStyle={statusBarStyle} backgroundColor={colors.surface} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: colors.textPrimary, marginTop: 10 },
          ]}
        >
          Loading session...
        </Text>
      </View>
    );
  }

  // Redirect if a session exists
  if (session) {
    return <Redirect href="/(app)/(tabs)/(home)" />;
  }

  // Main Hero Screen content
  return (
    // Use ImageBackground for a potential background image, falling back to theme background color
    <ImageBackground
      style={[styles.container, { backgroundColor: colors.background }]} // Fallback background color
      resizeMode="cover" // Cover the entire container
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.surface} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heroContent}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Welcome to DigiDairy
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your journey starts here
          </Text>

          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => {
              router.push("/auth/signin");
            }}
          >
            <Text style={[styles.buttonText, { color: colors.surface }]}>
              Sign In
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.secondaryButton,
              {
                backgroundColor: colors.surface, // Use surface for secondary button background
                borderColor: colors.primary, // Use primary for secondary button border
              },
            ]}
            onPress={() => {
              router.push("/auth/signup");
            }}
          >
            <Text
              style={[styles.secondaryButtonText, { color: colors.primary }]}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor handled by theme inline or ImageBackground
    justifyContent: "center", // Center content vertically
    alignItems: "center", // Center content horizontally
    paddingHorizontal: 20,
  },
  centeredContainer: {
    // Style for the loading state container
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor handled by theme inline
  },
  safeArea: {
    flex: 1,
    width: "100%", // Take full width
    justifyContent: "center", // Center content vertically within safe area
    alignItems: "center", // Center content horizontally within safe area
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    width: "100%", // Take full width
    maxWidth: 400, // Optional: Limit width on larger screens
  },
  appLogo: {
    // Optional style for a prominent app logo/name
    fontSize: 48,
    fontWeight: "bold",
    marginBottom: 30,
    // color handled by theme inline
  },
  title: {
    fontSize: 36, // Increased font size
    fontWeight: "bold",
    marginBottom: 15, // Increased spacing
    textAlign: "center", // Center text
    // color handled by theme inline
  },
  subtitle: {
    fontSize: 18,
    // color handled by theme inline
    marginBottom: 40, // Increased spacing
    textAlign: "center", // Center text
    paddingHorizontal: 20, // Add some horizontal padding
  },
  button: {
    // backgroundColor handled by theme inline
    paddingVertical: 15, // Increased padding
    paddingHorizontal: 30,
    borderRadius: 10, // More rounded corners
    marginBottom: 15, // Spacing between buttons
    width: "100%",
    alignItems: "center",
    justifyContent: "center", // Center text vertically
    // Added subtle shadow for depth
    shadowColor: "#000", // Default shadow color (can be themed if needed)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  buttonText: {
    // color handled by theme inline
    fontSize: 18,
    fontWeight: "600", // Slightly bolder text
  },
  secondaryButton: {
    // backgroundColor handled by theme inline
    borderWidth: 2, // Add a border for the secondary button
    // borderColor handled by theme inline
  },
  secondaryButtonText: {
    // color handled by theme inline
    fontSize: 18,
    fontWeight: "600",
  },
  loadingText: {
    fontSize: 18, // Adjusted size
    textAlign: "center",
    // color handled by theme inline
  },
});

export default HeroScreen;
