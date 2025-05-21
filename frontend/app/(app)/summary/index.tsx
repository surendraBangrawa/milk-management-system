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

const SummaryScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();

  useEffect(() => {
    if (sellerId) {
      dispatch(fetchSellerTransactionsById(sellerId));
    }
  }, [dispatch, sellerId]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          // Use colors from your theme for header styling
          headerStyle: {
            backgroundColor: colors.surface, // Use surface color for header background
          },
          headerTintColor: colors.textPrimary, // Use primary text color for title and icons
          title: "", // Keep your empty title if you're using headerRight
          headerRight: () => (
            <View style={styles.headerRight}>
              <Text
                style={[styles.headerName, { color: colors.textPrimary }]} // Use primary text color for the name
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
    paddingBottom: 220,
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

export default SummaryScreen;
