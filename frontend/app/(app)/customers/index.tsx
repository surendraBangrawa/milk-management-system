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
import { formatDistanceToNow } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerSummaries } from "@/redux/slice/transactions/transactionsSlice";
import { AppDispatch, RootState } from "@/redux/store";
import useTheme from "@/context/theme/useTheme";
import { FontAwesome } from "@expo/vector-icons";

interface Customer {
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

const CustomerScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();

  const people = useSelector(
    (state: RootState) => state.transactions.sellerSummaries
  );
  const loading = useSelector(
    (state: RootState) => state.transactions.sellerSummariesLoading
  );
  const error = useSelector(
    (state: RootState) => state.transactions.sellerSummariesError
  );

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPeople = useMemo(() => {
    if (!searchQuery) {
      return people;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return people.filter(
      (customer) =>
        (typeof customer.name === "string" &&
          customer.name.toLowerCase().includes(lowerCaseQuery)) ||
        (typeof customer.mobile === "string" &&
          customer.mobile.toLowerCase().includes(lowerCaseQuery))
    );
  }, [people, searchQuery]);

  useEffect(() => {
    dispatch(fetchSellerSummaries());
  }, [dispatch]);

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

  const renderPerson = ({ item, index }: { item: Customer; index: number }) => (
    <View style={[styles.personCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.personButton}
        onPress={() => {
          if (
            typeof item.mobile === "string" &&
            typeof item.name === "string"
          ) {
            router.push(
              `/(app)/customers/transactions/${item.mobile}?name=${item.name}`
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
            {item.name || "Unknown Customer"}
          </Text>
          <Text style={[styles.personPhone, { color: colors.textSecondary }]}>
            {item.mobile || "N/A"}
          </Text>
          {item.date && (
            <Text style={[styles.personDate, { color: colors.textSecondary }]}>
              {formatDate(item.date)}
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
              Balance N/A
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.searchHeader, { backgroundColor: colors.surface }]}>
        <FontAwesome
          name="search"
          size={16}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Search by name or mobile"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          accessibilityLabel="Search customers"
          accessibilityHint="Search for customers by name or mobile number"
        />
      </View>

      {/* Results Count */}
      {!loading && filteredPeople.length > 0 && (
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {filteredPeople.length} customer
          {filteredPeople.length !== 1 ? "s" : ""} found
        </Text>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading customers...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <FontAwesome
            name="exclamation-triangle"
            size={48}
            color={colors.error}
          />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => dispatch(fetchSellerSummaries())}
            accessibilityLabel="Retry loading customers"
          >
            <Text style={[styles.retryButtonText, { color: colors.surface }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : filteredPeople.length === 0 && searchQuery !== "" ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="search" size={48} color={colors.textSecondary} />
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No customers found matching "{searchQuery}"
          </Text>
          <Text style={[styles.noDataSubtext, { color: colors.textSecondary }]}>
            Try adjusting your search terms
          </Text>
        </View>
      ) : people.length === 0 && searchQuery === "" ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="users" size={48} color={colors.textSecondary} />
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No customers yet
          </Text>
          <Text style={[styles.noDataSubtext, { color: colors.textSecondary }]}>
            Add your first customer to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPeople}
          renderItem={renderPerson}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          accessibilityLabel="Customer list"
        />
      )}

      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push("/customers/contacts/contact")}
        activeOpacity={0.85}
        accessibilityLabel="Add new customer"
        accessibilityHint="Tap to add a new customer"
      >
        <FontAwesome name="plus" size={24} color={colors.surface} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  searchIcon: {
    marginRight: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    flex: 1,
    fontSize: 15,
  },
  resultsCount: {
    fontSize: 13,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    padding: 16,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  noDataSubtext: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  listContainer: {
    paddingBottom: 100,
  },
  personCard: {
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 50,
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
    marginBottom: 1,
  },
  personPhone: {
    fontSize: 13,
    marginTop: 1,
  },
  personBalance: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 2,
  },
  personDate: {
    fontSize: 11,
    marginTop: 2,
  },
  balanceContainer: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingLeft: 14,
  },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default CustomerScreen;
