import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  View,
  Platform,
} from "react-native";
import CustomerScreen from "../../customers";
import SupplierScreen from "../../suppliers";

import useTheme from "@/context/theme/useTheme"; // Import useTheme

const HomeScreen = () => {
  const [mode, setMode] = useState<"customer" | "supplier">("customer");
  const { colors } = useTheme();

  const handleModeChange = (newMode: "customer" | "supplier") => {
    setMode(newMode);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={[styles.headerContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>Logo</Text>
        <View style={styles.navbar}>
          <Pressable
            style={[
              styles.navItem,
              mode === "customer" && styles.activeNavItem,
              mode === "customer" && { borderBottomColor: colors.primary }, // Active border color from theme
            ]}
            onPress={() => handleModeChange("customer")}
            android_ripple={{ color: colors.primaryLight }} // Add subtle ripple
          >
            <Text
              style={[
                styles.navText,
                { color: colors.textSecondary }, // Default text color
                mode === "customer" && styles.activeNavText,
                mode === "customer" && { color: colors.primary }, // Active text color from theme
              ]}
            >
              Customer
            </Text>
          </Pressable>
          {/* Supplier Tab */}
          <Pressable
            style={[
              styles.navItem,
              mode === "supplier" && styles.activeNavItem,
              mode === "supplier" && { borderBottomColor: colors.primary }, // Active border color from theme
            ]}
            onPress={() => handleModeChange("supplier")}
            android_ripple={{ color: colors.primaryLight }} // Add subtle ripple
          >
            <Text
              style={[
                styles.navText,
                { color: colors.textSecondary }, // Default text color
                mode === "supplier" && styles.activeNavText,
                mode === "supplier" && { color: colors.primary }, // Active text color from theme
              ]}
            >
              Supplier
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.screenContainer}>
        {mode === "customer" ? <CustomerScreen /> : <SupplierScreen />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color from theme applied inline
  },
  headerContainer: {
    // Background color from theme applied inline
    paddingVertical: 10,
    paddingHorizontal: 16, // Adjusted padding
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Optional subtle shadow for header
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    // Color from theme applied inline
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
  },
  navItem: {
    marginHorizontal: 8, // Adjusted horizontal margin
    paddingBottom: 8, // Add padding for the bottom border
  },
  navText: {
    fontSize: 16,
    fontWeight: "500",
    // Color from theme applied inline
  },
  activeNavItem: {
    borderBottomWidth: 2,
    // Border bottom color from theme applied inline
  },
  activeNavText: {
    fontWeight: "600", // Make active text bolder
    // Color from theme applied inline
  },

  screenContainer: {
    flex: 1,
  },
});

export default HomeScreen;
