import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

const RangeInputScreen = () => {
  const router = useRouter();

  const [startFat, setStartFat] = useState("2.0");
  const [endFat, setEndFat] = useState("12.0");
  const [startSnf, setStartSnf] = useState("6.0");
  const [endSnf, setEndSnf] = useState("11.0");

  const handleGenerateTable = () => {
    const sFat = parseFloat(startFat);
    const eFat = parseFloat(endFat);
    const sSnf = parseFloat(startSnf);
    const eSnf = parseFloat(endSnf);

    if (isNaN(sFat) || isNaN(eFat) || isNaN(sSnf) || isNaN(eSnf)) {
      Alert.alert(
        "Invalid Input",
        "Please enter valid numbers for all ranges."
      );
      return;
    }

    if (sFat <= 0 || eFat <= 0 || sSnf <= 0 || eSnf <= 0) {
      Alert.alert("Invalid Range", "Ranges must be positive values.");
      return;
    }

    if (sFat > eFat || sSnf > eSnf) {
      Alert.alert(
        "Invalid Range",
        "Starting values must be less than or equal to ending values."
      );
      return;
    }

    if (eFat - sFat > 20 || eSnf - sSnf > 20) {
      Alert.alert(
        "Warning",
        "Very large ranges might create a huge table which could affect performance. Proceed?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Proceed",
            onPress: () => {
              // Navigate anyway if user confirms
              router.push(
                `/(app)/ratelist/inputtable?sf=${sFat}&ef=${eFat}&ss=${sSnf}&es=${eSnf}`
              );
            },
          },
        ]
      );
      return; // Stop here and wait for user confirmation
    }

    router.push(
      `/(app)/ratelist/inputtable?sf=${sFat}&ef=${eFat}&ss=${sSnf}&es=${eSnf}`
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Define Rate Ranges</Text>
        <Text style={styles.infoText}>
          Enter the starting and ending values for Fat and SNF. Rates will be
          generated for every 0.1 increment within these ranges.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fat Range (%):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Start Fat (e.g., 2.0)"
              value={startFat}
              onChangeText={setStartFat}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.rangeSeparator}>to</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="End Fat (e.g., 12.0)"
              value={endFat}
              onChangeText={setEndFat}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>SNF Range (%):</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Start SNF (e.g., 6.0)"
              value={startSnf}
              onChangeText={setStartSnf}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.rangeSeparator}>to</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="End SNF (e.g., 11.0)"
              value={endSnf}
              onChangeText={setEndSnf}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.generateButton} // New button style
          onPress={handleGenerateTable}
        >
          <Text style={styles.generateButtonText}>Generate Rates Table</Text>
        </TouchableOpacity>
        <Text style={styles.infoTextSmall}>
          On the next screen, you will enter the rate for each Fat/SNF
          combination.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  infoTextSmall: {
    fontSize: 14,
    color: "#888",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
    fontWeight: "bold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  rangeSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#555",
  },
  generateButton: {
    backgroundColor: "#007BFF", // Blue color
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RangeInputScreen;
