import React, { useState } from "react";
import { Text, StyleSheet, SafeAreaView, Pressable, View } from "react-native";
import CustomerScreen from "../../customers";
import SupplierScreen from "../../suppliers";
import { useSession } from "@/context/AuthProvider";

const HomeScreen = () => {
  const [mode, setMode] = useState<"customer" | "supplier">("customer");
  const { signOut } = useSession();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Logo</Text>
        <View style={styles.navbar}>
          <Pressable
            style={[
              styles.navItem,
              mode === "customer" && styles.activeNavItem,
            ]}
            onPress={() => setMode("customer")}
          >
            <Text
              style={[
                styles.navText,
                mode === "customer" && styles.activeNavText,
              ]}
            >
              Customer
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.navItem,
              mode === "supplier" && styles.activeNavItem,
            ]}
            onPress={() => setMode("supplier")}
          >
            <Text
              style={[
                styles.navText,
                mode === "supplier" && styles.activeNavText,
              ]}
            >
              Supplier
            </Text>
          </Pressable>
          <Pressable onPress={() => signOut()}>
            <Text style={styles.logoutText}>Logout</Text>
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
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
  },
  navItem: {
    marginHorizontal: 10,
  },
  navText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  activeNavItem: {
    borderBottomWidth: 2,
    borderBottomColor: "#6200ea", // Active item color
  },
  activeNavText: {
    color: "#6200ea", // Active text color
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ff5722",
    marginLeft: 20,
  },
  screenContainer: {
    flex: 1,
  },
});

export default HomeScreen;
