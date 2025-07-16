import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { getRatelist } from "@/redux/slice/ratelist/rateListApi"; // Assuming the path is correct
import { Stack } from "expo-router";
import useTheme from "@/context/theme/useTheme";
import Toast from "react-native-toast-message";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";

// Define a type for your rate list item for better type safety
interface RateItem {
  fat: number;
  snf: number;
  rate: number;
  // Add other properties if your rate list items have them
  [key: string]: any; // Allow other properties
}

const RateListTableScreen = () => {
  const { colors } = useTheme(); // Access theme colors
  const [fullRateList, setFullRateList] = useState<RateItem[]>([]);
  const [filteredRateList, setFilteredRateList] = useState<RateItem[]>([]); // Typed
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Typed error state

  useEffect(() => {
    fetchRateList();
  }, []);

  const fetchRateList = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const data = await getRatelist();

      if (
        data &&
        data.data &&
        Array.isArray(data.data.rates) &&
        data.data.rates.every(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            "fat" in item &&
            "snf" in item &&
            "rate" in item // Basic check for expected keys
        )
      ) {
        const rates: RateItem[] = data.data.rates;
        setFullRateList(rates); // Store the full list
        setFilteredRateList(rates); // Initially, filtered list is the full list
      } else {
        setFullRateList([]);
        setFilteredRateList([]);
        setError("Received unexpected data format from the server.");
      }
    } catch (err: any) {
      setError(
        `Failed to load rate list: ${
          err.message || "Unknown error"
        }. Please try again.`
      );
      setFullRateList([]);
      setFilteredRateList([]);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Fetch Error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle search input changes
  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (!text) {
        // If search text is empty, show the full list
        setFilteredRateList(fullRateList);
        return;
      }

      const lowerCaseQuery = text.toLowerCase();

      // Filter the full list based on search query
      const filtered = fullRateList.filter((item) => {
        // Convert relevant numerical values to string for searching
        const fatString =
          item.fat !== undefined && item.fat !== null
            ? item.fat.toString()
            : "";
        const snfString =
          item.snf !== undefined && item.snf !== null
            ? item.snf.toString()
            : "";
        const rateString =
          item.rate !== undefined && item.rate !== null
            ? item.rate.toFixed(2).toString()
            : ""; // Search formatted rate too

        return (
          fatString.includes(lowerCaseQuery) ||
          snfString.includes(lowerCaseQuery) ||
          rateString.includes(lowerCaseQuery)
        );
      });

      setFilteredRateList(filtered);
    },
    [fullRateList]
  ); // Recreate handleSearch only if fullRateList changes

  const renderTableContent = () => {
    if (loading) {
      return (
        <SafeAreaWrapper edges={["bottom", "left", "right"]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading Rate List...
          </Text>
        </SafeAreaWrapper>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        </View>
      );
    }

    if (fullRateList.length === 0 && !loading && !error) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            No rate list data found.
          </Text>
        </View>
      );
    }

    if (filteredRateList.length === 0 && searchQuery) {
      return (
        <View style={styles.centered}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            No results found for "{searchQuery}".
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.tableContainer}>
        <View
          style={[
            styles.tableRow,
            styles.tableHeaderRow,
            { borderBottomColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.tableHeaderCell,
              styles.fatHeader,
              { color: colors.textPrimary },
            ]}
          >
            Fat
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              styles.snfHeader,
              { color: colors.textPrimary },
            ]}
          >
            SNF
          </Text>
          <Text
            style={[
              styles.tableHeaderCell,
              styles.rateHeader,
              { color: colors.textPrimary },
            ]}
          >
            Rate
          </Text>
        </View>

        {filteredRateList.map((item, index) => (
          <View
            key={index}
            style={[
              styles.tableRow,
              { borderBottomColor: colors.border }, // Apply border color from theme
              index % 2 === 0
                ? { backgroundColor: colors.surface }
                : { backgroundColor: colors.background }, // Use theme colors for row backgrounds
            ]}
          >
            <Text
              style={[
                styles.tableCell,
                styles.fatCell,
                { color: colors.textPrimary },
              ]}
            >
              {item.fat !== undefined && item.fat !== null
                ? item.fat.toFixed(2)
                : "-"}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.snfCell,
                { color: colors.textPrimary },
              ]}
            >
              {item.snf !== undefined && item.snf !== null
                ? item.snf.toFixed(2)
                : "-"}
            </Text>
            <Text
              style={[
                styles.tableCell,
                styles.rateCell,
                { color: colors.textPrimary },
              ]}
            >
              {item.rate !== undefined && item.rate !== null
                ? `₹${item.rate.toFixed(2)}`
                : "-"}
            </Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: "Ratelist Table", // Changed title to reflect the screen content
          headerStyle: {
            backgroundColor: colors.surface, // Use theme surface color for header
          },
          headerTintColor: colors.textPrimary, // Use theme primary text color for header title
        }}
      />
      <TextInput
        style={[
          styles.searchInput,
          {
            borderColor: colors.border, // Use theme border color
            color: colors.textPrimary, // Use theme primary text color
            backgroundColor: colors.surface, // Use theme surface color
          },
        ]}
        placeholder="Search by Fat, SNF, or Rate..."
        placeholderTextColor={colors.textSecondary} // Use theme secondary text color for placeholder
        value={searchQuery}
        onChangeText={handleSearch}
        clearButtonMode="while-editing"
        accessibilityLabel="Search Rate List"
        accessibilityHint="Enter keywords to filter the rate list by Fat, SNF, or Rate"
      />
      {renderTableContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
    // Let Stack.Screen handle top padding/header space
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // Add padding to centered messages
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    // color handled by theme
  },
  errorText: {
    fontSize: 16,
    // color handled by theme
    textAlign: "center",
    fontWeight: "bold", // Make error text bold
  },
  infoText: {
    fontSize: 16,
    // color handled by theme
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20, // Keep if you add an internal title
    textAlign: "center",
    // color handled by theme
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
    marginTop: 10,
  },

  // --- Table Styles ---
  tableContainer: {
    flex: 1, // Allows the table to take available space
    // No background color here, rows handle their own
  },
  tableHeaderRow: {
    borderBottomWidth: 2, // Thicker border for header
    // borderBottomColor handled by theme
  },
  tableRow: {
    flexDirection: "row", // Arrange cells horizontally
    borderBottomWidth: 1,
    // borderBottomColor handled by theme
    paddingVertical: 12, // Spacing within rows
    alignItems: "center", // Vertically align content in cells
  },
  // evenRow and oddRow background colors handled inline based on theme
  tableHeaderCell: {
    flex: 1, // Makes columns take equal space
    fontWeight: "bold",
    fontSize: 16,
    // color handled by theme
    textAlign: "center", // Center header text
    paddingHorizontal: 5, // Padding within header cells
  },
  tableCell: {
    flex: 1, // Makes columns take equal space
    fontSize: 15,
    // color handled by theme
    textAlign: "center", // Center cell text
    paddingHorizontal: 5, // Padding within cells
    // Add padding to cells for better spacing
    paddingVertical: 5,
  },
});

export default RateListTableScreen;
