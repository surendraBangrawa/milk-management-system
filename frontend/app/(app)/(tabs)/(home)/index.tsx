import React, { useState } from "react";
import { Text, StyleSheet, SafeAreaView, Pressable, View } from "react-native";
import CustomerScreen from "../../customers";
import SupplierScreen from "../../suppliers";

const HomeScreen = () => {
  const [mode, setMode] = useState<"customer" | "supplier">("customer");
  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text>Milk Management</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, mode === "customer" && styles.activeButton]}
          onPress={() => setMode("customer")}
        >
          <Text style={styles.buttonText}>Customer</Text>
        </Pressable>
        <Pressable
          style={[styles.button, mode === "supplier" && styles.activeButton]}
          onPress={() => setMode("supplier")}
        >
          <Text style={styles.buttonText}>Supplier</Text>
        </Pressable>
      </View>
      {mode === "customer" ? <CustomerScreen /> : <SupplierScreen />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  button: {
    padding: 10,
  },
  activeButton: {},
  buttonText: {
    fontSize: 16,
  },
});

export default HomeScreen;
