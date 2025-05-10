import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  deleteRatelist,
  getRatelist,
} from "@/redux/slice/ratelist/rateListApi";

const RateListViewer = () => {
  const router = useRouter();
  const isFocused = useIsFocused();

  const [existingRateList, setExistingRateList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFocused) {
      fetchExistingRateList();
    }
  }, [isFocused]);

  const fetchExistingRateList = async () => {
    setLoading(true);
    try {
      const data = await getRatelist();
      setExistingRateList(data);
    } catch (error) {
      setExistingRateList([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteRateList = async () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete the existing rate list? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteRatelist();
            } catch (error) {
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const navigateToRangeInput = () => {
    router.push("/(app)/ratelist/rangeinput");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Milk Rate List Manager</Text>

        <Text style={styles.sectionTitle}>Existing Rate List</Text>
        {existingRateList.length > 0 ? (
          <View style={styles.rateListContainer}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableHeader, styles.fatColumn]}>
                Fat (%)
              </Text>
              <Text style={[styles.tableHeader, styles.snfColumn]}>
                SNF (%)
              </Text>
              <Text style={[styles.tableHeader, styles.rateColumn]}>
                Rate (₹)
              </Text>
            </View>
            {/* Table Rows */}
            {existingRateList.map((item, index) =>
              // Add basic validation before rendering to prevent crashes
              item &&
              item.fat !== undefined &&
              item.snf !== undefined &&
              item.rate !== undefined ? (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.fatColumn]}>
                    {item.fat.toFixed(1)}
                  </Text>
                  <Text style={[styles.tableCell, styles.snfColumn]}>
                    {item.snf.toFixed(1)}
                  </Text>
                  <Text style={[styles.tableCell, styles.rateColumn]}>
                    {item.rate.toFixed(2)}
                  </Text>
                </View>
              ) : (
                <Text key={`error-${index}`} style={styles.errorText}>
                  Invalid rate data found at index {index}
                </Text>
              )
            )}
          </View>
        ) : (
          <Text style={styles.noRateListText}>
            No existing rate list found. Tap "Add New Rate List" below to create
            one.
          </Text>
        )}

        {existingRateList.length > 0 && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteRateList}
          >
            <Text style={styles.deleteButtonText}>Delete Rate List</Text>
          </TouchableOpacity>
        )}

        {/* Button to navigate to the screen for adding a new list */}
        <TouchableOpacity
          style={styles.addButton} // Reusing addButton style
          onPress={navigateToRangeInput}
        >
          <Text style={styles.addButtonText}>Add New Rate List</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return <View style={styles.mainContainer}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    paddingTop: 20,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
    color: "#555",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },

  // --- Existing Rate List Styles ---
  rateListContainer: {
    maxHeight: 400, // Limit height for scrollability
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#fff",
    overflow: "hidden", // Hide overflowing content
  },
  tableHeaderRow: {
    backgroundColor: "#f0f0f0", // Light grey background for header
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    alignItems: "center",
  },
  tableHeader: {
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 5,
    color: "#333",
    fontSize: 16,
  },
  tableCell: {
    textAlign: "center",
    paddingHorizontal: 5,
    fontSize: 16,
    color: "#555",
  },
  fatColumn: {
    flex: 1,
  },
  snfColumn: {
    flex: 1,
  },
  rateColumn: {
    flex: 1.5, // Give rate column a bit more space
  },
  errorText: {
    color: "red",
    textAlign: "center",
    padding: 10,
  },
  noRateListText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  deleteButton: {
    backgroundColor: "#dc3545", // Red color
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // --- Add New Button Style (Placed at the bottom) ---
  addButton: {
    backgroundColor: "#007BFF", // Blue color
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10, // Added margin top
    marginBottom: 20, // Added margin bottom
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RateListViewer;
