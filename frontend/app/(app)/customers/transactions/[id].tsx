import React, { useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import Toast from "react-native-toast-message";
import { FontAwesome } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchSellerTransactionsById,
  deleteTransaction,
  Transaction,
} from "@/redux/slice/transactions/transactionsSlice";

import useTheme from "@/context/theme/useTheme";

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

const TransactionScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();

  const params = useLocalSearchParams();
  const sellerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const customerName = Array.isArray(params.name)
    ? params.name[0]
    : params.name;

  const transactions = useSelector(
    (state: RootState) => state.transactions.sellerTransactions
  );
  const loading = useSelector(
    (state: RootState) => state.transactions.sellerTransactionsLoading
  );
  const error = useSelector(
    (state: RootState) => state.transactions.sellerTransactionsError
  );
  const isDeletingTransaction = useSelector(
    (state: RootState) => state.transactions.isDeletingTransaction
  );
  const deleteTransactionError = useSelector(
    (state: RootState) => state.transactions.deleteTransactionError
  );
  console.log(transactions);

  useEffect(() => {
    if (sellerId) {
      dispatch(fetchSellerTransactionsById(sellerId));
    }
  }, [dispatch, sellerId]);

  useEffect(() => {
    if (deleteTransactionError) {
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: deleteTransactionError,
      });
    }
  }, [deleteTransactionError]);

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

  const handleDelete = (item: Transaction) => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            dispatch(
              deleteTransaction({
                record_id: item.id,
                record_type: item.type,
                seller_mobile: item.seller_mobile,
              })
            )
              .unwrap()
              .then(() => {
                Toast.show({
                  type: "success",
                  text1: "Success",
                  text2: "Transaction deleted successfully.",
                });
              })
              .catch((error) => {
                console.error("Deletion failed:", error);
              });
          },
        },
      ]
    );
  };

  const handleEdit = (item: Transaction) => {
    if (
      !sellerId ||
      !customerName ||
      item.id === undefined ||
      item.type === undefined ||
      item.seller_mobile === undefined
    ) {
      console.error("Missing required details for edit navigation:", item);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot edit transaction: Missing details.",
      });
      return;
    }

    let navigateUrl = "";
    const baseEditUrl = `/(app)/customers/transactions`;

    if (item.type === "expense") {
      if (
        item.amount === undefined ||
        typeof item.custom_date !== "string" ||
        typeof item.expense_detail !== "string"
      ) {
        console.error("Missing expense details for edit navigation:", item);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Cannot edit expense: Missing details.",
        });
        return;
      }
      navigateUrl = `${baseEditUrl}/add-transaction?id=${
        item.id
      }&seller_mobile=${item.seller_mobile}&type=${
        item.amount < 0 ? "GAVE" : "GOT"
      }&desc=${encodeURIComponent(
        item.expense_detail
      )}&date=${encodeURIComponent(item.custom_date)}&amount=${Math.abs(
        item.amount
      )}&name=${encodeURIComponent(customerName)}`;
    } else if (item.type === "milk") {
      if (
        item.quantity === undefined ||
        item.fat === undefined ||
        item.snf === undefined ||
        item.rate === undefined ||
        typeof item.custom_date !== "string" ||
        typeof item.milk_detail !== "string"
      ) {
        console.error("Missing milk details for edit navigation:", item);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Cannot edit milk transaction: Missing details.",
        });
        return;
      }
      navigateUrl = `${baseEditUrl}/add-milk?id=${item.id}&seller_mobile=${
        item.seller_mobile
      }&desc=${encodeURIComponent(item.milk_detail)}&date=${encodeURIComponent(
        item.custom_date
      )}&rate=${item.rate}&name=${encodeURIComponent(customerName)}&quantity=${
        item.quantity
      }&snf=${item.snf}&fat=${item.fat}&type=${item.type}`;
    } else {
      console.warn("Unknown transaction type for edit:", item.type);
      Toast.show({
        type: "warning",
        text1: "Warning",
        text2: `Cannot edit unknown transaction type: ${item.type}`,
      });
      return;
    }

    if (navigateUrl) {
      router.push(navigateUrl);
    }
  };

  const handleReadMore = (detail: string | undefined | null) => {
    if (detail) {
      Alert.alert("Transaction Detail", detail);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const detail =
      item.type === "expense" ? item.expense_detail : item.milk_detail;
    const truncatedDetail =
      detail && detail.length > 50 ? detail.slice(0, 50) + "..." : detail;

    return (
      <View
        style={[
          styles.transactionCard,
          {
            backgroundColor: colors.surface,
            borderLeftColor: item.amount < 0 ? colors.error : colors.success,
          },
        ]}
      >
        <View style={styles.leftSection}>
          {typeof item.added_at === "string" ? (
            <Text
              style={[styles.transactionDate, { color: colors.textSecondary }]}
            >
              {formatDate(item.added_at)}
            </Text>
          ) : (
            <Text
              style={[styles.transactionDate, { color: colors.textSecondary }]}
            >
              No date
            </Text>
          )}

          {typeof item.amount === "number" ? (
            <Text
              style={[
                styles.transactionAmount,
                { color: item.amount < 0 ? colors.error : colors.success },
              ]}
            >
              {item.amount < 0
                ? `-₹${Math.abs(item.amount).toFixed(2)}`
                : `₹${item.amount.toFixed(2)}`}
            </Text>
          ) : (
            <Text
              style={[
                styles.transactionAmount,
                { color: colors.textSecondary },
              ]}
            >
              Amount: N/A
            </Text>
          )}

          <Text style={[styles.transactionType, { color: colors.textPrimary }]}>
            {item.type === "expense" ? "Expense" : "Milk"}
          </Text>
          {detail && (
            <View style={{ marginTop: 5 }}>
              <Text
                style={[
                  styles.transactionDetailText,
                  { color: colors.textSecondary },
                ]}
              >
                Detail: {truncatedDetail}
              </Text>
              {detail.length > 50 && (
                <Pressable onPress={() => handleReadMore(detail)}>
                  <Text
                    style={[styles.readMoreText, { color: colors.primary }]}
                  >
                    Read More
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          {item.type === "milk" && (
            <View
              style={[
                styles.milkDetailsContainer,
                { borderTopColor: colors.border },
              ]}
            >
              {typeof item.quantity === "number" && (
                <Text
                  style={[
                    styles.milkDetailText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Qty: {item.quantity} kg
                </Text>
              )}
              {typeof item.fat === "number" && (
                <Text
                  style={[
                    styles.milkDetailText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Fat: {item.fat}%
                </Text>
              )}
              {typeof item.snf === "number" && (
                <Text
                  style={[
                    styles.milkDetailText,
                    { color: colors.textSecondary },
                  ]}
                >
                  SNF: {item.snf}%
                </Text>
              )}
              {typeof item.rate === "number" && (
                <Text
                  style={[
                    styles.milkDetailText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Rate: ₹{item.rate.toFixed(2)}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          {typeof item.total_till_record === "number" ? (
            <Text
              style={[styles.totalTillRecord, { color: colors.textSecondary }]}
            >
              Total: ₹{item.total_till_record.toFixed(2)}
            </Text>
          ) : (
            <Text
              style={[styles.totalTillRecord, { color: colors.textSecondary }]}
            >
              Total: N/A
            </Text>
          )}

          <View style={styles.actionButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: pressed ? colors.border : "transparent",
                },
              ]}
              onPress={() => handleEdit(item)}
            >
              <FontAwesome name="edit" size={20} color={colors.textSecondary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: pressed ? colors.border : "transparent",
                  opacity: isDeletingTransaction ? 0.5 : 1,
                },
              ]}
              onPress={() => handleDelete(item)}
              disabled={isDeletingTransaction}
            >
              <FontAwesome name="trash" size={20} color={colors.error} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const handlePressTransaction = (transactionType: "Gave" | "Got") => {
    if (!sellerId || !customerName) {
      console.error("Missing seller ID or name for transaction navigation.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot add transaction: Missing customer details.",
      });
      return;
    }
    router.push(
      `/(app)/customers/transactions/add-transaction?type=${transactionType}&seller_mobile=${sellerId}&name=${encodeURIComponent(
        customerName
      )}`
    );
  };

  const handlePressMilk = () => {
    if (!sellerId || !customerName) {
      console.error(
        "Missing seller ID or name for milk transaction navigation."
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot add milk transaction: Missing customer details.",
      });
      return;
    }
    router.push(
      `/(app)/customers/transactions/add-milk?type=milk&seller_mobile=${sellerId}&name=${encodeURIComponent(
        customerName
      )}`
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <View style={styles.headerRight}>
              <Text
                style={[styles.headerName, { color: colors.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {customerName || "Customer"}
              </Text>
              <RandomAvatar name={customerName} />
            </View>
          ),
        }}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : transactions.length === 0 ? (
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No transactions found for this customer.
        </Text>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.transactionList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={[
            styles.floatingButton,
            { backgroundColor: colors.primaryLight },
          ]}
          onPress={handlePressMilk}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingButtonText}>Milk</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.error }]}
          onPress={() => handlePressTransaction("Gave")}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingButtonText}>Gave</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.floatingButton, { backgroundColor: colors.success }]}
          onPress={() => handlePressTransaction("Got")}
          activeOpacity={0.9}
        >
          <Text style={styles.floatingButtonText}>Got</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
    maxWidth: 150,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 38,
  },
  transactionCard: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    borderLeftWidth: 4,
  },
  leftSection: {
    flex: 1,
    paddingRight: 8,
  },
  transactionDate: {
    fontSize: 13,
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 2,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 4,
  },
  transactionDetailText: {
    fontSize: 13,
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 13,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  milkDetailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  milkDetailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  rightSection: {
    flex: 0.8,
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  runningBalance: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 0,
    marginBottom: 2,
  },
  totalTillRecord: {
    fontSize: 12,
    marginBottom: 8,
  },
  actionButtons: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  transactionList: {
    paddingBottom: 100,
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
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  floatingButton: {
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default TransactionScreen;
