import React, { useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
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

  const deleteTransactionError = useSelector(
    (state: RootState) => state.transactions.deleteTransactionError
  );

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

  const handleReminder = () => {
    // You would typically open a modal or action sheet here
    // to let the user choose between SMS and WhatsApp.
    Alert.alert(
      "Send Reminder",
      "Choose how to send the reminder:\n\n- SMS\n- WhatsApp",
      [
        {
          text: "SMS",
          onPress: () => Alert.alert("SMS Reminder", "Sending SMS..."),
        },
        {
          text: "WhatsApp",
          onPress: () =>
            Alert.alert("WhatsApp Reminder", "Opening WhatsApp..."),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
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

  const handleReport = () => {
    router.push(
      `/(app)/customers/transactions/report?seller_mobile=${sellerId}&name=${encodeURIComponent(
        customerName
      )}`
    );
  };

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
        <TouchableOpacity
          onPress={handleReport}
          style={styles.customHeaderButton}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="file-text-o"
            size={20}
            color={colors.textPrimary}
          />
          <Text
            style={[
              styles.customHeaderButtonText,
              { color: colors.textPrimary },
            ]}
          >
            Report
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReminder}
          style={styles.customHeaderButton}
          activeOpacity={0.7}
        >
          <FontAwesome name="bell-o" size={20} color={colors.textPrimary} />
          <Text
            style={[
              styles.customHeaderButtonText,
              { color: colors.textPrimary },
            ]}
          >
            Reminder
          </Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          style={[
            styles.bottomActionButton,
            { backgroundColor: colors.primaryLight },
          ]}
          onPress={handlePressMilk}
          activeOpacity={0.9}
        >
          <Text style={styles.bottomActionButtonText}>Milk</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomActionButton, { backgroundColor: colors.error }]}
          onPress={() => handlePressTransaction("Gave")}
          activeOpacity={0.9}
        >
          <Text style={styles.bottomActionButtonText}>Gave</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.bottomActionButton,
            { backgroundColor: colors.success },
          ]}
          onPress={() => handlePressTransaction("Got")}
          activeOpacity={0.9}
        >
          <Text style={styles.bottomActionButtonText}>Got</Text>
        </TouchableOpacity>
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
  // Custom Header Bar Styles
  customHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee", // Use a light border color from your theme if available
    marginBottom: 10, // Space between this header and the list
    borderRadius: 8,
    marginHorizontal: 16, // Match screen padding
    marginTop: 8, // Space below native header
  },
  customHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  customHeaderButtonText: {
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
    borderTopWidth: 1,
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
  },
});

export default TransactionScreen;
