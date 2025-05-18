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
import { Stack, useRouter } from "expo-router";
import {
  deleteRatelist,
  getRatelist,
} from "@/redux/slice/ratelist/rateListApi"; // Assuming the path is correct
import useTheme from "@/context/theme/useTheme";

const RateListViewer = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { colors } = useTheme();

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
      if (data && data.data && Array.isArray(data.data.rates)) {
        setExistingRateList(data.data.rates); // Store the array (or just its length matters here)
      } else {
        setExistingRateList([]); // Treat as no list found
      }
    } catch (error) {
      setExistingRateList([]); // Assume no list on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRateList = async () => {
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
            setLoading(true); // You might want a separate delete loading state
            try {
              await deleteRatelist();
              Alert.alert("Success", "Rate list deleted successfully.");
              setExistingRateList([]); // Clear the local state to reflect deletion
            } catch (error) {
              console.error("Error deleting rate list:", error);
              Alert.alert("Error", "Failed to delete rate list.");
            } finally {
              setLoading(false); // Reset loading state
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const navigateToUploadRateList = () => {
    router.push("/(app)/ratelist/uploadratelist");
  };

  const navigateToEditRateList = () => {
    if (existingRateList.length > 0) {
      router.push("/(app)/ratelist/editratelist");
    } else {
      Alert.alert(
        "No Rate List",
        "No existing rate list found to edit. Please upload a new rate list first."
      );
    }
  };

  const navigateToViewTable = () => {
    router.push("/(app)/ratelist/ratelisttable");
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading status...</Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={navigateToUploadRateList}
        >
          <Text style={styles.actionButtonText}>Upload New Rate List</Text>
        </TouchableOpacity>
        {existingRateList.length > 0 && (
          <TouchableOpacity
            onPress={navigateToEditRateList}
            disabled={existingRateList.length === 0}
          >
            <Text>Edit Rate List</Text>
          </TouchableOpacity>
        )}
        {existingRateList.length > 0 && (
          <TouchableOpacity
            onPress={navigateToViewTable}
            disabled={existingRateList.length === 0}
          >
            <Text>View Rate List (Table)</Text>
          </TouchableOpacity>
        )}
        {existingRateList.length > 0 && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteRateList}
          >
            <Text style={styles.deleteButtonText}>Delete Rate List</Text>
          </TouchableOpacity>
        )}

        {existingRateList.length === 0 && !loading && (
          <Text style={styles.infoText}>
            No rate list found. Upload a new one to enable editing and deletion.
          </Text>
        )}

        {/* The actual display of the list content (items) is REMOVED from here */}
        {/* It's now handled by the RateListTableScreen */}
      </ScrollView>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <Stack.Screen
        options={{
          title: "Subscription Plans",
          headerStyle: {
            backgroundColor: colors.surface, // Example header background
          },
          headerTintColor: colors.textPrimary, // Example header text color
        }}
      />
      {renderContent()}
    </View>
  );
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
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
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

  // --- Action Button Styles ---
  actionButton: {
    backgroundColor: "#007BFF", // Blue color
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15, // Space between buttons
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cccccc", // Grey color for disabled state
  },
  disabledButtonText: {
    color: "#666666",
  },
  infoText: {
    textAlign: "center",
    fontSize: 14,
    color: "#777",
    marginTop: 20,
    paddingHorizontal: 10,
  },

  // --- Delete Button Style ---
  deleteButton: {
    backgroundColor: "#dc3545", // Red color
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20, // Added space above delete button
    marginBottom: 15,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RateListViewer;
