import useTheme from "@/context/theme/useTheme";
import {
  deleteTransaction,
  Transaction,
} from "@/redux/slice/transactions/transactionsSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { FontAwesome } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "expo-router";
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";

const CustomerTransaction = ({
  item,
  customer,
  sellerId,
}: {
  item: Transaction;
  customer: string;
  sellerId: string | number;
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const isDeletingTransaction = useSelector(
    (state: RootState) => state.transactions.isDeletingTransaction
  );
  const handleReadMore = (detail: string | undefined | null) => {
    if (detail) {
      Alert.alert("Transaction Detail", detail);
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
      !customer ||
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
      )}&name=${encodeURIComponent(customer)}`;
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
      )}&rate=${item.rate}&name=${encodeURIComponent(customer)}&quantity=${
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
      router.push(navigateUrl as any);
    }
  };

  const detail =
    item.type === "expense" ? item.expense_detail : item.milk_detail;
  const truncatedDetail =
    detail && detail.length > 50 ? detail.slice(0, 50) + "..." : detail;
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

  return (
    <View
      style={[
        styles.transactionCard,
        {
          backgroundColor: colors.surface,
          borderLeftColor: item.amount < 0 ? colors.error : colors.success,
        },
      ]}
      accessibilityLabel={`${item.type} transaction for ${
        item.amount < 0 ? "debit" : "credit"
      } of ₹${Math.abs(item.amount || 0)}`}
      accessibilityHint="Double tap to edit this transaction"
    >
      <View style={styles.leftSection}>
        {/* Transaction Header */}
        <View style={styles.transactionHeader}>
          <View style={styles.typeContainer}>
            <FontAwesome
              name={item.type === "expense" ? "money" : "tint"}
              size={16}
              color={item.amount < 0 ? colors.error : colors.success}
            />
            <Text
              style={[styles.transactionType, { color: colors.textPrimary }]}
            >
              {item.type === "expense" ? "Expense" : "Milk"}
            </Text>
          </View>
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
        </View>

        {/* Amount Display */}
        {typeof item.amount === "number" ? (
          <Text
            style={[
              styles.transactionAmount,
              { color: item.amount < 0 ? colors.error : colors.success },
            ]}
          >
            {item.amount < 0
              ? `-₹${Math.abs(item.amount).toFixed(2)}`
              : `+₹${item.amount.toFixed(2)}`}
          </Text>
        ) : (
          <Text
            style={[styles.transactionAmount, { color: colors.textSecondary }]}
          >
            Amount: N/A
          </Text>
        )}

        {/* Transaction Details */}
        {detail && (
          <View style={styles.detailContainer}>
            <Text
              style={[
                styles.transactionDetailText,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {detail}
            </Text>
            {detail.length > 50 && (
              <TouchableOpacity onPress={() => handleReadMore(detail)}>
                <Text style={[styles.readMoreText, { color: colors.primary }]}>
                  Read More
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Milk Details */}
        {item.type === "milk" && (
          <View
            style={[
              styles.milkDetailsContainer,
              { borderTopColor: colors.border },
            ]}
          >
            <Text
              style={[styles.milkDetailsTitle, { color: colors.textPrimary }]}
            >
              Milk Details:
            </Text>
            <View style={styles.milkDetailsGrid}>
              {typeof item.quantity === "number" && (
                <View style={styles.milkDetailItem}>
                  <Text
                    style={[
                      styles.milkDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Quantity:
                  </Text>
                  <Text
                    style={[
                      styles.milkDetailValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.quantity} kg
                  </Text>
                </View>
              )}
              {typeof item.fat === "number" && (
                <View style={styles.milkDetailItem}>
                  <Text
                    style={[
                      styles.milkDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Fat:
                  </Text>
                  <Text
                    style={[
                      styles.milkDetailValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.fat}%
                  </Text>
                </View>
              )}
              {typeof item.snf === "number" && (
                <View style={styles.milkDetailItem}>
                  <Text
                    style={[
                      styles.milkDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    SNF:
                  </Text>
                  <Text
                    style={[
                      styles.milkDetailValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {item.snf}%
                  </Text>
                </View>
              )}
              {typeof item.rate === "number" && (
                <View style={styles.milkDetailItem}>
                  <Text
                    style={[
                      styles.milkDetailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Rate:
                  </Text>
                  <Text
                    style={[
                      styles.milkDetailValue,
                      { color: colors.textPrimary },
                    ]}
                  >
                    ₹{item.rate.toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
        {/* Running Balance */}
        {typeof item.total_till_record === "number" ? (
          <View style={styles.balanceContainer}>
            <Text
              style={[styles.balanceLabel, { color: colors.textSecondary }]}
            >
              Balance:
            </Text>
            <Text
              style={[styles.totalTillRecord, { color: colors.textPrimary }]}
            >
              ₹{item.total_till_record.toFixed(2)}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.totalTillRecord, { color: colors.textSecondary }]}
          >
            Balance: N/A
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handleEdit(item)}
            accessibilityLabel="Edit transaction"
            accessibilityHint="Tap to edit this transaction"
          >
            <FontAwesome name="edit" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: isDeletingTransaction ? 0.5 : 1,
              },
            ]}
            onPress={() => handleDelete(item)}
            disabled={isDeletingTransaction}
            accessibilityLabel="Delete transaction"
            accessibilityHint="Tap to delete this transaction"
          >
            <FontAwesome name="trash" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
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
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  detailContainer: {
    marginTop: 5,
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
  milkDetailsTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  milkDetailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  milkDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  milkDetailLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  milkDetailValue: {
    fontSize: 12,
  },
  rightSection: {
    flex: 0.8,
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 4,
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
    borderWidth: 1,
  },
});
export default CustomerTransaction;
