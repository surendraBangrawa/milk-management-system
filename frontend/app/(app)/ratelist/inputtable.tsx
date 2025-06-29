import React, { useState, useEffect, useMemo, useRef } from "react"; // Import useRef
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import { useLocalSearchParams, useRouter } from "expo-router";

// Base URL for your backend API
const API_BASE_URL = "YOUR_BACKEND_API_BASE_URL"; // ** IMPORTANT: Replace with your actual backend URL **

// --- Memoized Component for a Single Table Row ---
const RateTableRow = React.memo(
  ({ item, value, onChangeText, columnWidths }) => {
    return (
      <View style={styles.tableRow}>
        <View style={[styles.cell, { width: columnWidths.fat }]}>
          <Text style={styles.cellText}>{item.fat.toFixed(1)}</Text>
        </View>
        <View style={[styles.cell, { width: columnWidths.snf }]}>
          <Text style={styles.cellText}>{item.snf.toFixed(1)}</Text>
        </View>
        <View
          style={[styles.cell, styles.rateCell, { width: columnWidths.rate }]}
        >
          <TextInput
            style={styles.rateInput}
            keyboardType="numeric"
            value={value}
            onChangeText={onChangeText}
            placeholder="0.00"
            textAlign="center"
            returnKeyType="done" // Or 'next'
            // autoFocus={...} // Consider autofocus for the first cell
          />
        </View>
      </View>
    );
  }
);

const InputTable = () => {
  const { sf, ef, ss, es } = useLocalSearchParams();
  const router = useRouter();

  const [tableData, setTableData] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [generatingTable, setGeneratingTable] = useState(true);

  // Ref to hold the latest rates state for the interval timer
  const latestRatesRef = useRef(rates);

  // Function to generate a unique storage key based on ranges
  // Use params directly as they come from the URL and define this table instance
  const getStorageKey = () => `rate_list_draft_${sf}_${ef}_${ss}_${es}`;

  // Function to save the current rates state to AsyncStorage
  const saveDraft = async () => {
    // Ensure ranges are available before trying to save
    if (!(sf && ef && ss && es)) {
      console.warn("Cannot save draft: Ranges not available.");
      return;
    }
    const key = getStorageKey();
    try {
      // Use the value from the ref to get the latest state
      await AsyncStorage.setItem(key, JSON.stringify(latestRatesRef.current));
      console.log(`Draft saved for key: ${key}`);
    } catch (error) {
      console.error(`Failed to save draft for key ${key}:`, error);
    }
  };

  // Effect to generate table data and load draft when parameters are available
  // FIX: Added sf, ef, ss, es to dependency array
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const loadAndGenerate = async () => {
      if (!(sf && ef && ss && es)) {
        // This case is unlikely with the dependency array, but good defensive check
        console.log("Ranges not available for generation/load.");
        setGeneratingTable(false); // Ensure loading stops
        return;
      }

      const startFat = parseFloat(sf);
      const endFat = parseFloat(ef);
      const startSnf = parseFloat(ss);
      const endSnf = parseFloat(es);

      if (
        isNaN(startFat) ||
        isNaN(endFat) ||
        isNaN(startSnf) ||
        isNaN(endSnf)
      ) {
        Alert.alert("Error", "Invalid range parameters received.");
        setGeneratingTable(false);
        return;
      }

      const generatedTableData = [];
      const initialRates = {}; // Structure from ranges

      const fatValues = [];
      const epsilon = 0.0001;
      for (
        let f = startFat;
        f <= endFat + epsilon;
        f = parseFloat((f + 0.1).toFixed(1))
      ) {
        fatValues.push(f);
      }

      const snfValues = [];
      for (
        let s = startSnf;
        s <= endSnf + epsilon;
        s = parseFloat((s + 0.1).toFixed(1))
      ) {
        snfValues.push(s);
      }

      if (fatValues.length === 0 || snfValues.length === 0) {
        Alert.alert(
          "Error",
          "Could not generate any Fat or SNF values with the provided ranges."
        );
        setGeneratingTable(false);
        return;
      }

      // Generate the flattened list of all combinations and initial rate structure
      fatValues.forEach((fat) => {
        snfValues.forEach((snf) => {
          const key = `${fat.toFixed(1)}_${snf.toFixed(1)}`;
          generatedTableData.push({
            fat: fat,
            snf: snf,
            key: key, // Use key for FlatList and state lookup
          });
          initialRates[key] = ""; // Default empty rate
        });
      });

      // Attempt to load draft from AsyncStorage
      const key = getStorageKey(); // Use the key function here
      let loadedRates = null;
      try {
        const draft = await AsyncStorage.getItem(key);
        if (draft !== null) {
          loadedRates = JSON.parse(draft);
          console.log(`Draft loaded for key: ${key}`);
        } else {
          console.log(`No draft found for key: ${key}`);
        }
      } catch (error) {
        console.error(`Failed to load draft for key ${key}:`, error);
      }

      // Merge loaded rates with the initial structure
      const mergedRates = { ...initialRates }; // Start with the structure from ranges
      if (loadedRates) {
        // Iterate through the keys from the *generated structure* (tableData)
        // This ensures we only apply rates that match the current ranges
        generatedTableData.forEach((item) => {
          // Use generatedTableData here
          const key = item.key;
          if (loadedRates.hasOwnProperty(key)) {
            // Basic validation for loaded value before applying
            const loadedValue = loadedRates[key];
            if (
              typeof loadedValue === "string" ||
              typeof loadedValue === "number"
            ) {
              mergedRates[key] = String(loadedValue).replace(/[^0-9.]/g, ""); // Clean loaded value
            } else {
              console.warn(
                `Skipping invalid loaded value for key ${key}:`,
                loadedValue
              );
            }
          }
        });
      }

      // Only update state if the component is still mounted
      if (isMounted) {
        setTableData(generatedTableData);
        setRates(mergedRates); // Set merged rates
        setGeneratingTable(false);
        console.log("Table data generated and draft loaded/merged.");
      }
    };

    loadAndGenerate();

    // Cleanup function for the effect (runs on unmount or dependency change)
    return () => {
      isMounted = false; // Prevent state updates if component unmounts during async operation
    };

    // Dependency array includes sf, ef, ss, es
    // This ensures the effect runs when these route params are available or change
  }, [sf, ef, ss, es]); // FIX: Correct Dependency Array

  // Effect to keep the ref updated with the latest rates state
  // This ref is used by the periodic save interval
  useEffect(() => {
    latestRatesRef.current = rates;
    // console.log("Rates ref updated."); // Uncomment to see ref updates
  }, [rates]); // Update ref whenever rates state changes

  // Effect to set up the periodic auto-save interval
  useEffect(() => {
    let intervalId = null;

    // Only start the interval if the table data has been generated successfully
    if (!generatingTable && tableData.length > 0) {
      console.log("Starting auto-save interval...");
      // Save every 15 seconds (adjust interval duration as needed, in milliseconds)
      intervalId = setInterval(saveDraft, 15000);
    }

    // Cleanup function to clear the interval when the component unmounts
    // or when the dependencies change (e.g., generatingTable becomes true again, or tableData becomes empty)
    return () => {
      if (intervalId !== null) {
        console.log("Clearing auto-save interval.");
        clearInterval(intervalId);
      }
    };

    // This effect depends on generatingTable and tableData.length
    // It starts the interval when generatingTable is false and tableData is populated.
    // It doesn't need 'rates' as it uses the ref, and the ranges are stable.
  }, [generatingTable, tableData.length]);

  // ... handleRateInputChange (remains the same, updates 'rates' state) ...
  const handleRateInputChange = (key, value) => {
    // Basic validation: Allow only digits, one decimal point, and empty string
    const numericValue = value.replace(/[^0-9.]/g, "");
    // Ensure no multiple decimal points
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return; // Don't update if more than one decimal point
    }

    setRates((prevRates) => ({
      ...prevRates,
      [key]: numericValue, // Store as string initially, keyed by fat_snf string
    }));
  };

  // Function to save the rate list to the backend and clear draft
  const saveRateList = async () => {
    setLoading(true);
    const rateListToSend = [];
    let validationError = false;

    // Iterate through the flattened table data to build the list to send
    for (const row of tableData) {
      const key = row.key;
      const rateString = rates[key]; // Get rate using the key
      const numericRate = parseFloat(rateString);

      // Check if the input is empty or not a valid non-negative number
      if (rateString === "" || isNaN(numericRate) || numericRate < 0) {
        validationError = true;
        console.warn(`Invalid or empty rate for row ${key}: "${rateString}"`);
        // Continue loop to potentially find more errors before showing alert
      }
      // Only push valid rates to the list to send
      if (!isNaN(numericRate) && numericRate >= 0) {
        rateListToSend.push({
          fat: parseFloat(row.fat.toFixed(1)), // Use fat from the row item
          snf: parseFloat(row.snf.toFixed(1)), // Use snf from the row item
          rate: parseFloat(numericRate.toFixed(2)), // Save rate with 2 decimal places
        });
      }
    }

    if (validationError) {
      setLoading(false);
      Alert.alert(
        "Validation Error",
        "Please ensure all rate fields are filled with valid positive numbers."
      );
      return;
    }

    if (rateListToSend.length === 0) {
      setLoading(false);
      Alert.alert("Validation Error", "No valid rates were entered.");
      return;
    }

    console.log("Saving rate list:", rateListToSend.length, "items");

    try {
      // ** NOTE: You need to implement an API endpoint to save the rate list **
      // Assuming an endpoint like /save_rate_list exists and accepts POST with JSON body
      const response = await fetch(`${API_BASE_URL}/save_rate_list`, {
        method: "POST", // Or PUT if updating
        headers: {
          "Content-Type": "application/json",
          // Add any necessary authentication headers
          // 'Authorization': `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify(rateListToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle non-200 responses
        console.error("Save API Error Response:", result);
        throw new Error(
          result.detail ||
            `Failed to save rate list (Status: ${response.status})`
        );
      } else {
        Alert.alert(
          "Success",
          result.message || "Rate list saved successfully!"
        );
        // --- Clear the draft from local storage on successful save ---
        // Ensure ranges are available before trying to clear
        if (sf && ef && ss && es) {
          const key = getStorageKey(); // Use the key function here
          try {
            await AsyncStorage.removeItem(key);
            console.log(`Draft cleared for key: ${key}`);
          } catch (removeError) {
            console.error(`Failed to clear draft for key ${key}:`, removeError);
          }
        } else {
          console.warn("Cannot clear draft: Ranges not available.");
        }
        // --- End Clear Draft ---

        // Navigate back to the main RateListViewer screen
        // Use replace to clear the rangeinput and inputtable screens from the stack
        router.replace("/(app)/ratelist");
      }
    } catch (error) {
      console.error("Error saving rate list:", error);
      Alert.alert("Error", `Failed to save rate list: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Define column widths using useMemo for performance and consistency
  // Adjust widths based on your design needs
  const columnWidths = useMemo(
    () => ({
      fat: 80,
      snf: 80,
      rate: 100, // Give rate input column more space
    }),
    []
  ); // Depend on nothing, these widths are fixed

  if (generatingTable) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Generating Table Data...</Text>
      </View>
    );
  }

  // Handle case where parameters led to no Fat or SNF values (after generation attempt)
  if (tableData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Error Generating Table</Text>
        <Text style={styles.errorText}>
          Could not generate any table data with the provided ranges. Please go
          back and check the values entered.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render the table headers and the FlatList
  return (
    // KeyboardAvoidingView helps prevent the keyboard from hiding inputs
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0} // Adjust offset as needed
    >
      <View style={styles.container}>
        <Text style={styles.title}>Define Rates Table</Text>
        <Text style={styles.infoText}>
          Enter the rate (₹) for each Fat and SNF combination.
        </Text>

        <View style={[styles.tableRow, styles.headerRow]}>
          <View style={[styles.headerCell, { width: columnWidths.fat }]}>
            <Text style={styles.headerText}>Fat (%)</Text>
          </View>
          <View style={[styles.headerCell, { width: columnWidths.snf }]}>
            <Text style={styles.headerText}>SNF (%)</Text>
          </View>
          <View style={[styles.headerCell, { width: columnWidths.rate }]}>
            <Text style={styles.headerText}>Rate (₹)</Text>
          </View>
        </View>

        <FlatList
          data={tableData}
          renderItem={({ item }) => (
            <RateTableRow
              item={item}
              value={rates[item.key]} // Pass the specific rate value for this row
              onChangeText={(value) => handleRateInputChange(item.key, value)} // Pass handler with key
              columnWidths={columnWidths} // Pass widths
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          initialNumToRender={20} // Optimize initial rendering
          maxToRenderPerBatch={10} // Optimize rendering during scroll
          windowSize={15} // Optimize rendering window
          removeClippedSubviews={true} // Good for performance with lists
          // Add keyboardShouldPersistTaps to handle taps within the list
          keyboardShouldPersistTaps="handled"
        />

        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveRateList}
          disabled={loading} // Disable button while saving
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Rate List</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  infoText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 10,
    textAlign: "center",
    paddingHorizontal: 5,
  },

  // Table styles
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    // No paddingVertical here, padding is on cells
  },
  headerRow: {
    backgroundColor: "#e9e9e9",
    borderTopWidth: 1, // Add top border to header
    borderColor: "#ddd",
  },
  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    // width is set dynamically via style prop
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
    color: "#333",
  },
  cell: {
    paddingVertical: 8, // Vertical padding for cell content
    paddingHorizontal: 5, // Horizontal padding
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#eee", // Lighter border for data cells
    // width is set dynamically via style prop
  },
  cellText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
  },
  rateCell: {
    // Specific styles for the rate input cell container
    justifyContent: "center",
    paddingVertical: 5, // Less vertical padding to fit input better
  },
  rateInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 5,
    fontSize: 15,
    backgroundColor: "#fff",
    textAlign: "center",
    minWidth: 50,
    height: 35, // Fixed height
  },

  saveButton: {
    backgroundColor: "#28a745", // Green color
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10, // Less space at the bottom, FlatList handles scrolling
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoTextSmall: {
    fontSize: 13,
    color: "#888",
    marginTop: 5,
    marginBottom: 10, // Space below FlatList
    textAlign: "center",
  },
});

export default InputTable;
