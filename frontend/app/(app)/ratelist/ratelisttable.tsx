import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { getRatelist } from "@/redux/slice/ratelist/rateListApi"; // Assuming the path is correct

const RateListTableScreen = () => {
  const [fullRateList, setFullRateList] = useState([]); // State to hold the original full list
  const [filteredRateList, setFilteredRateList] = useState([]); // State to hold the list displayed after filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRateList();
  }, []); // Fetch data only once on mount

  const fetchRateList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRatelist();
      console.log("Fetched Data for Table:", data); // Log to see the data structure
      if (data && data.data && Array.isArray(data.data.rates)) {
        const rates = data.data.rates;
        setFullRateList(rates); // Store the full list
        setFilteredRateList(rates); // Initially, filtered list is the full list
      } else {
        console.warn(
          "API returned non-array data or unexpected structure:",
          data
        );
        setFullRateList([]);
        setFilteredRateList([]);
        // Optionally set an error message if the structure is critically wrong
        // setError("Unexpected data format received from API.");
      }
    } catch (err) {
      console.error("Error fetching rate list for table:", err);
      setError("Failed to load rate list. Please try again.");
      setFullRateList([]);
      setFilteredRateList([]);
      Alert.alert("Error", "Failed to fetch rate list for display.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle search input changes
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text) {
      // If search text is empty, show the full list
      setFilteredRateList(fullRateList);
      return;
    }

    const lowerCaseQuery = text.toLowerCase();

    // Filter the full list based on search query
    const filtered = fullRateList.filter((item) => {
      // Convert numerical values to string for searching
      const fatString = item.fat ? item.fat.toString() : "";
      const snfString = item.snf ? item.snf.toString() : "";
      const rateString = item.rate ? item.rate.toString() : ""; // Optionally search by rate too

      // Check if the query matches part of Fat, SNF, or Rate (adjust criteria as needed)
      return (
        fatString.includes(lowerCaseQuery) ||
        snfString.includes(lowerCaseQuery) ||
        rateString.includes(lowerCaseQuery) // Keep or remove if you only want to search fat/snf
      );
    });

    setFilteredRateList(filtered);
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading Rate List...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (fullRateList.length === 0 && !loading && !error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>No rate list data found.</Text>
        </View>
      );
    }

    if (filteredRateList.length === 0 && searchQuery) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>
            No results found for "{searchQuery}".
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableHeaderCell, styles.fatHeader]}>Fat</Text>
          <Text style={[styles.tableHeaderCell, styles.snfHeader]}>SNF</Text>
          <Text style={[styles.tableHeaderCell, styles.rateHeader]}>Rate</Text>
          {/* Add more headers if you have more columns */}
        </View>

        {/* Table Rows - Mapping through filteredRateList */}
        {filteredRateList.map((item, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
            ]}
          >
            {/* Display data from the item. Adjust key names based on your data structure */}
            <Text style={[styles.tableCell, styles.fatCell]}>
              {item.fat !== undefined ? item.fat.toFixed(2) : "-"}
            </Text>
            <Text style={[styles.tableCell, styles.snfCell]}>
              {item.snf !== undefined ? item.snf.toFixed(2) : "-"}
            </Text>
            <Text style={[styles.tableCell, styles.rateCell]}>
              {item.rate !== undefined ? `₹${item.rate.toFixed(2)}` : "-"}
            </Text>
            {/* Add more cells for additional columns */}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <Text style={styles.title}>View & Search Rate List</Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Fat, SNF, or Rate..."
        value={searchQuery}
        onChangeText={handleSearch}
        clearButtonMode="while-editing" // iOS clear button
      />

      {/* Render the table content or messages */}
      {renderTableContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 20,
    paddingTop: 40, // Add some space at the top
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  searchInput: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: "#fff",
  },

  // --- Table Styles ---
  tableContainer: {
    flex: 1, // Allows the table to take available space
  },
  tableRow: {
    flexDirection: "row", // Arrange cells horizontally
    borderBottomWidth: 1,
    borderBottomColor: "#eee", // Light border between rows
    paddingVertical: 12, // Spacing within rows
    alignItems: "center", // Vertically align content in cells
  },
  evenRow: {
    backgroundColor: "#fff", // White background for even rows
  },
  oddRow: {
    backgroundColor: "#f9f9f9", // Slightly grey background for odd rows
  },
  tableHeaderCell: {
    flex: 1, // Makes columns take equal space
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    textAlign: "center", // Center header text
    paddingHorizontal: 5, // Padding within header cells
  },
  tableCell: {
    flex: 1, // Makes columns take equal space
    fontSize: 15,
    color: "#555",
    textAlign: "center", // Center cell text
    paddingHorizontal: 5, // Padding within cells
  },
  // Optional: Specific column width adjustments or alignment
  // For example, if Fat/SNF are always short and Rate is longer:
  // fatHeader: { flex: 0.8 },
  // snfHeader: { flex: 0.8 },
  // rateHeader: { flex: 1.4 },
  // fatCell: { flex: 0.8 },
  // snfCell: { flex: 0.8 },
  // rateCell: { flex: 1.4 },
});

export default RateListTableScreen;
