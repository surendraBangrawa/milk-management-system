import { useState } from "react";
import { Text, StyleSheet, Pressable, View } from "react-native";
import CustomerScreen from "../../customers";
import SupplierScreen from "../../suppliers";
import { useTranslation } from "react-i18next";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";

import useTheme from "@/context/theme/useTheme"; // Import useTheme
import Logo from "@/components/Logo";

const HomeScreen = () => {
  const [mode, setMode] = useState<"customer" | "supplier">("customer");
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleModeChange = (newMode: "customer" | "supplier") => {
    setMode(newMode);
  };

  return (
    <SafeAreaWrapper>
      <View
        style={[styles.headerContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          <Logo />
        </Text>
        <View style={[styles.navbar, { backgroundColor: colors.surface }]}>
          <Pressable
            style={[
              styles.navItem,
              mode === "customer" && styles.activeNavItem,
              {
                borderBottomColor:
                  mode === "customer" ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleModeChange("customer")}
            android_ripple={{ color: colors.primaryLight }}
          >
            <Text
              style={[
                styles.navText,
                {
                  color:
                    mode === "customer" ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {t("home.customer")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.navItem,
              mode === "supplier" && styles.activeNavItem,
              {
                borderBottomColor:
                  mode === "supplier" ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleModeChange("supplier")}
            android_ripple={{ color: colors.primaryLight }}
          >
            <Text
              style={[
                styles.navText,
                {
                  color:
                    mode === "supplier" ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {t("home.supplier")}
            </Text>
          </Pressable>
        </View>
      </View>
      <View
        style={[styles.screenContainer, { backgroundColor: colors.background }]}
      >
        {mode === "customer" ? <CustomerScreen /> : <SupplierScreen />}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16, // Adjusted padding
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
