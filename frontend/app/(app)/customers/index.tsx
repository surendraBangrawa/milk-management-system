import { useEffect, useState, useMemo } from "react";
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
import { useTranslation } from "react-i18next";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";

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
  const { colors, themeMode } = useTheme();
  const { t } = useTranslation();

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
    if (!dateString) return t("customers.no_date");
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return t("customers.invalid_date");
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return t("customers.invalid_date_format");
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
            {item.name || t("customers.unknown_customer")}
          </Text>
          <Text style={[styles.personPhone, { color: colors.textSecondary }]}>
            {item.mobile || t("customers.na")}
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
    <SafeAreaWrapper edges={["bottom", "left", "right"]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        />
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loadingIndicator}
          />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {typeof error === "string"
              ? error
              : (error as any)?.message || "An error occurred"}
          </Text>
        ) : filteredPeople.length === 0 && searchQuery !== "" ? (
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No customers found matching your search.
          </Text>
        ) : people.length === 0 && searchQuery === "" ? (
          <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
            No customer data available.
          </Text>
        ) : (
          <FlatList
            data={filteredPeople}
            renderItem={renderPerson}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/customers/contacts/contact")}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { color: colors.surface }]}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 15,
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
  buttonText: {
    fontSize: 30,
    fontWeight: "normal",
    lineHeight: 54,
  },
  errorText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
});

export default CustomerScreen;
