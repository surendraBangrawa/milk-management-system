import React, { useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { FontAwesome } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchSellerTransactionsById,
  Transaction,
} from "@/redux/slice/transactions/transactionsSlice";

import useTheme from "@/context/theme/useTheme";
import CustomerTransaction from "@/components/Transaction/CustomerTransaction";

// Helper function to get initials for avatar
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

// Avatar component
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

  const deleteTransactionError = useSelector(
    (state: RootState) => state.transactions.deleteTransactionError
  );

  // Fetch transactions when the screen loads or sellerId changes
  useEffect(() => {
    if (sellerId) {
      dispatch(fetchSellerTransactionsById(sellerId));
    }
  }, [dispatch, sellerId]);

  // Show a toast message if transaction deletion fails
  useEffect(() => {
    if (deleteTransactionError) {
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: deleteTransactionError,
      });
    }
  }, [deleteTransactionError]);

  // Helper function to calculate balance/credit status using + or -
  const formatBalanceStatus = (transactions: Transaction[]) => {
    const totalAmount = transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );

    // If balance is positive, use "+"
    if (totalAmount > 0) {
      return `+₹${totalAmount}`;
    }
    // If balance is negative, use "-"
    else if (totalAmount < 0) {
      return `-₹${Math.abs(totalAmount)}`;
    }
    // If balance is zero
    else {
      return "₹0";
    }
  };

  const handleReminder = () => {
    const balanceStatus = formatBalanceStatus(transactions);

    // Show alert to choose SMS or WhatsApp
    Alert.alert("Send Reminder", "Choose how to send this reminder:", [
      {
        text: "SMS",
        onPress: () => {
          if (sellerId) {
            const url = `sms:${sellerId}?body=${encodeURIComponent(
              `Friendly Reminder from DigiDairy! Your current balance is: ${balanceStatus}\n\nThank you for being a valued customer!`
            )}`;
            Linking.openURL(url).catch((err) =>
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to open SMS app.",
              })
            );
          } else {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Customer contact number is missing.",
            });
          }
        },
      },
      {
        text: "WhatsApp",
        onPress: () => {
          if (sellerId) {
            // Ensure sellerId is a valid mobile number (10 digits in India)
            const url = `whatsapp://send?phone=91${sellerId}&text=${encodeURIComponent(
              `Friendly Reminder from DigiDairy! Your current balance is: ${balanceStatus}\n\nThank you for being a valued customer!`
            )}`;
            Linking.openURL(url).catch((err) =>
              Toast.show({
                type: "error",
                text1: "Error",
                text2:
                  "Failed to open WhatsApp. Please ensure WhatsApp is installed.",
              })
            );
          } else {
            Toast.show({
              type: "error",
              text1: "Error",
              text2: "Customer contact number is missing.",
            });
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  // Handlers for navigation to add different transaction types
  const handlePressTransaction = (transactionType: "Gave" | "Got") => {
    if (!sellerId || !customerName) {
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

  const handleReport = () => {
    router.push(
      `/(app)/customers/transactions/report?seller_mobile=${sellerId}&name=${encodeURIComponent(
        customerName
      )}`
    );
  };

  // Render individual transaction item
  const renderTransaction = ({ item }: { item: Transaction }) => {
    return (
      <CustomerTransaction
        item={item}
        customer={customerName}
        sellerId={sellerId}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
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

      <View
        style={[styles.customHeaderBar, { backgroundColor: colors.surface }]}
      >
        {/* Breadcrumb Navigation */}
        <View style={styles.breadcrumbContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.breadcrumbItem}
            accessibilityLabel="Go back to customers list"
          >
            <FontAwesome
              name="arrow-left"
              size={16}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.breadcrumbText, { color: colors.textSecondary }]}
            >
              Customers
            </Text>
          </TouchableOpacity>
          <FontAwesome
            name="chevron-right"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={[styles.breadcrumbText, { color: colors.textPrimary }]}>
            {customerName || "Customer"}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={handleReport}
            style={styles.actionButton}
            activeOpacity={0.7}
            accessibilityLabel="Generate report"
            accessibilityHint="Generate a detailed report for this customer"
          >
            <FontAwesome name="file-text-o" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleReminder}
            style={styles.actionButton}
            activeOpacity={0.7}
            accessibilityLabel="Send reminder"
            accessibilityHint="Send a reminder message to this customer"
          >
            <FontAwesome name="bell-o" size={18} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>
              Reminder
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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

      <View
        style={[
          styles.bottomActionBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.actionBarHeader}>
          <Text style={[styles.actionBarTitle, { color: colors.textPrimary }]}>
            Quick Actions
          </Text>
        </View>

        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={[
              styles.bottomActionButton,
              { backgroundColor: colors.primaryLight },
            ]}
            onPress={handlePressMilk}
            activeOpacity={0.9}
            accessibilityLabel="Add milk transaction"
            accessibilityHint="Add a new milk transaction for this customer"
          >
            <FontAwesome name="tint" size={20} color={colors.surface} />
            <Text style={styles.bottomActionButtonText}>Milk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bottomActionButton,
              { backgroundColor: colors.error },
            ]}
            onPress={() => handlePressTransaction("Gave")}
            activeOpacity={0.9}
            accessibilityLabel="Add expense transaction"
            accessibilityHint="Record money given to this customer"
          >
            <FontAwesome name="money" size={20} color={colors.surface} />
            <Text style={styles.bottomActionButtonText}>Gave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bottomActionButton,
              { backgroundColor: colors.success },
            ]}
            onPress={() => handlePressTransaction("Got")}
            activeOpacity={0.9}
            accessibilityLabel="Add income transaction"
            accessibilityHint="Record money received from this customer"
          >
            <FontAwesome name="plus" size={20} color={colors.surface} />
            <Text style={styles.bottomActionButtonText}>Got</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
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
  customHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 8,
  },
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  breadcrumbItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  breadcrumbText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 5,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  transactionList: {
    paddingBottom: 80,
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
  bottomActionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  bottomActionButton: {
    flex: 1,
    borderRadius: 25,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  bottomActionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  actionBarHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionBarTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
  },
});

export default TransactionScreen;
