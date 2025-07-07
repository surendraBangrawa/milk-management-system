import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { formatDistanceToNow } from "date-fns";
import { getSupplierSummaryApi } from "@/redux/slice/supplier/supplierApi";

import useTheme from "@/context/theme/useTheme";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";

interface SupplierSummary {
  mobile: string;
  name: string;
  date?: string | null;
  balance: number;
  avatar?: string | null;
  [key: string]: any;
}

const getInitials = (name: string | undefined | null): string => {
  if (!name) return "";
  const nameParts = name.split(" ").filter((part) => part.length > 0);
  const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || "";
  const lastInitial =
    nameParts.length > 1
      ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() || ""
      : "";
  return firstInitial + lastInitial;
};

const RandomAvatar = ({ name }: { name: string | undefined | null }) => {
  const { colors } = useTheme();
  const backgroundColor = colors.primaryLight;
  const initials = getInitials(name);
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const SupplierScreen = () => {
  const { colors } = useTheme();
  const [people, setPeople] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // State for search query
  const [searchQuery, setSearchQuery] = useState("");

  // Memoized list of people filtered by the search query
  const filteredPeople = useMemo(() => {
    if (!searchQuery) {
      return people; // If no search query, show all people
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return people.filter(
      (supplier) =>
        // Add checks to ensure name and mobile are strings before calling toLowerCase and includes
        (typeof supplier.name === "string" &&
          supplier.name.toLowerCase().includes(lowerCaseQuery)) ||
        (typeof supplier.mobile === "string" &&
          supplier.mobile.toLowerCase().includes(lowerCaseQuery))
    );
  }, [people, searchQuery]); // Recalculate when people or searchQuery changes

  useEffect(() => {
    const fetchSupplierData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getSupplierSummaryApi();
        if (
          res.status === 200 &&
          res?.data?.buyer_details &&
          Array.isArray(res.data.buyer_details)
        ) {
          const rawData: SupplierSummary[] = res.data.buyer_details;

          const sortedData = rawData.sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : null;
            const dateB = b.date ? new Date(b.date) : null;

            if (!dateA || isNaN(dateA.getTime())) return 1;
            if (!dateB || isNaN(dateB.getTime())) return -1;

            return dateB.getTime() - dateA.getTime();
          });

          setPeople(sortedData);
        } else if (
          res.status === 200 &&
          (!res?.data?.buyer_details || !Array.isArray(res.data.buyer_details))
        ) {
          console.warn(
            "API returned 200 but buyer_details is missing or not an array:",
            res.data
          );
          setPeople([]);
        } else {
          const errorMsg = `Error fetching data: Status ${res.status}`;
          setError(errorMsg);
          Toast.show({
            type: "error",
            text1: "Fetch Error",
            text2: errorMsg,
          });
        }
      } catch (err: any) {
        console.error(
          "Error fetching supplier data:",
          err.response?.data || err
        );
        const errorMessage = err?.response?.data?.detail
          ? err?.response?.data?.detail
          : "Something went wrong while fetching data.";
        setError(errorMessage);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSupplierData();
  }, []);

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return "Invalid date format";
    }
  };

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filtering is handled automatically by the useMemo hook
  };

  const renderPerson = ({ item }: { item: SupplierSummary }) => (
    <View style={[styles.personCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.personButton}
        onPress={() => {
          if (
            typeof item.mobile === "string" &&
            typeof item.name === "string"
          ) {
            router.push(
              `/(app)/suppliers/transactions/${
                item.mobile
              }?name=${encodeURIComponent(item.name)}`
            );
          } else {
            console.warn(
              "Cannot navigate: Mobile or Name is missing/invalid",
              item
            );
          }
        }}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          {item.avatar &&
          typeof item.avatar === "string" &&
          item.avatar.startsWith("http") ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <RandomAvatar name={item.name} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[styles.personName, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name || "Unknown Supplier"}
          </Text>
          <Text style={[styles.personPhone, { color: colors.textSecondary }]}>
            {item.mobile || "N/A"}
          </Text>
          {item.date &&
          typeof item.date === "string" &&
          !isNaN(new Date(item.date).getTime()) ? (
            <Text style={[styles.personDate, { color: colors.textSecondary }]}>
              {formatDate(item.date)}
            </Text>
          ) : (
            <Text style={[styles.personDate, { color: colors.textSecondary }]}>
              No date provided
            </Text>
          )}
        </View>
        <View style={styles.balanceContainer}>
          {typeof item.balance === "number" ? (
            <Text
              style={[
                styles.personBalance,
                { color: item.balance >= 0 ? colors.success : colors.error },
              ]}
            >
              {item.balance < 0
                ? `-₹${Math.abs(item.balance).toFixed(2)}`
                : `₹${item.balance.toFixed(2)}`}
            </Text>
          ) : (
            <Text
              style={[styles.personBalance, { color: colors.textSecondary }]}
            >
              N/A
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaWrapper backgroundColor={colors.background}>
      <View style={styles.container}>
        <TextInput
          style={[
            styles.searchInput,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Search suppliers by name or mobile"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearch} // Use the handleSearch function
          clearButtonMode="while-editing"
        />

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loadingIndicator}
          />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
        ) : filteredPeople.length === 0 && searchQuery !== "" ? ( // No results for the search query
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No suppliers found matching your search.
          </Text>
        ) : people.length === 0 && searchQuery === "" ? ( // No data fetched initially
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No supplier data available.
          </Text>
        ) : (
          <FlatList
            data={filteredPeople} // Use the filtered list
            renderItem={renderPerson}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e0e0e0", // Fallback border
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#ffffff", // Fallback background
    color: "#212121", // Fallback text color
  },
  listContainer: {
    paddingBottom: 20,
  },
  personCard: {
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff", // Fallback background
  },
  personButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#b39ddb", // Fallback background
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 0,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 48,
    color: "#fff",
  },
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
    flex: 1,
    paddingRight: 10,
  },
  personName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#212121", // Fallback text color
    marginBottom: 2,
  },
  personPhone: {
    fontSize: 13,
    marginTop: 2,
    color: "#757575", // Fallback text color
  },
  personBalance: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 2,
    // Color handled inline based on value, using theme colors
  },
  personDate: {
    fontSize: 11,
    marginTop: 2,
    color: "#757575", // Fallback text color
  },
  balanceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 14,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    color: "#c62828", // Fallback color
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    color: "#757575", // Fallback color
  },
});

export default SupplierScreen;
