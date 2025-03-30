import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Text,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import Toast from "react-native-toast-message";
import { FontAwesome } from "@expo/vector-icons";
import {
  deleteSellerTransactionApi,
  getSellerTransactionApi,
} from "@/redux/slice/transactions/transactionApi";

const getInitials = (name: string) => {
  const nameParts = name.split(" ");
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial =
    nameParts.length > 1 ? nameParts[1].charAt(0).toUpperCase() : "";
  return firstInitial + lastInitial;
};

const RandomAvatar = ({ name }: { name: string }) => {
  const backgroundColor = "#6200ea"; // You can customize this color
  const initials = getInitials(name); // Generate initials from the name
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const TransactionScreen = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams(); // Assuming 'name' is passed as a param
  const [transactions, setTransactions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch transaction data
  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const res = await getSellerTransactionApi(id);
      if (res.status === 200) {
        const sortedData = res?.data?.sort((a, b) => {
          const dateA = new Date(a.added_at); // Sort by 'added_at' for display purposes
          const dateB = new Date(b.added_at);
          return dateB - dateA;
        });
        setTransactions(sortedData);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.detail
          ? err?.response?.data?.detail
          : "Something went wrong"
      );
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load customer data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  // Function to format the 'added_at' date
  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Delete transaction handler
  const handleDelete = (item) => {
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
            try {
              const res = await deleteSellerTransactionApi({
                record_id: item.id,
                record_type: item.type,
                seller_mobile: item.seller_mobile,
              });
              if (res.status === 200) {
                Toast.show({
                  type: "success",
                  text1: "Success",
                  text2: "Transaction deleted successfully.",
                });
                fetchCustomerData();
              }
            } catch (err: any) {
              console.log(err.response);
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete the transaction.",
              });
            }
          },
        },
      ]
    );
  };

  // Edit transaction handler
  const handleEdit = (item) => {
    if (item.type === "expense") {
      router.push(
        `/(app)/customers/transactions/add-transaction?id=${
          item.id
        }&seller_mobile=${item.seller_mobile}&type=${
          item.amount < 0 ? "GAVE" : "GOT"
        }&desc=${item.expense_detail}&date=${
          item.custom_date
        }&amount=${Math.abs(item.amount)}&name=${name}`
      );
    } else {
      router.push(
        `/(app)/customers/transactions/add-milk?id=${item.id}&seller_mobile=${item.seller_mobile}&desc=${item.milk_detail}&date=${item.custom_date}&rate=${item.rate}&name=${name}&quantity=${item.quantity}&snf=${item.snf}&fat=${item.fat}&type=${item.type}`
      );
    }
  };

  // Function to handle "Read More" click
  const handleReadMore = (detail: string) => {
    Alert.alert("Transaction Detail", detail);
  };

  const renderTransaction = ({ item }) => {
    const truncatedDetail =
      item.expense_detail?.length > 50
        ? item.expense_detail.slice(0, 50) + "..."
        : item.expense_detail;

    return (
      <View
        style={[
          styles.transactionCard,
          { borderLeftColor: item.amount < 0 ? "#F44336" : "#4CAF50" },
        ]}
      >
        <View style={styles.leftSection}>
          <Text style={styles.transactionDate}>
            {formatDate(item.added_at)}
          </Text>
          <Text style={styles.transactionAmount}>
            Amount: ₹{Math.abs(item.amount)}
          </Text>
          <Text style={styles.transactionType}>
            {item.type === "expense" ? "Expense" : "Milk"}
          </Text>
          {item.expense_detail && (
            <View>
              <Text style={styles.transactionExpenseDetail}>
                Detail: {truncatedDetail}
              </Text>
              {item.expense_detail?.length > 50 && (
                <Pressable onPress={() => handleReadMore(item.expense_detail)}>
                  <Text style={styles.readMoreText}>Read More</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.runningBalance}>
            Running Balance: ₹{item.running_balance}
          </Text>
          <Text style={styles.totalTillRecord}>
            Total Till Record: ₹{item.total_till_record}
          </Text>
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleEdit(item)}
            >
              <FontAwesome name="edit" size={20} color="#333" />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleDelete(item)}
            >
              <FontAwesome name="trash" size={20} color="#F44336" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const handlePress = (transactionType: string) => {
    router.push(
      `/(app)/customers/transactions/add-transaction?type=${transactionType}&seller_mobile=${id}&name=${name}`
    );
  };
  const handlePressMilk = (transactionType: string) => {
    router.push(
      `/(app)/customers/transactions/add-milk?type=${transactionType}&seller_mobile=${id}&name=${name}`
    );
  };
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerRight: () => (
            <View style={styles.headerLeft}>
              {name ? (
                <RandomAvatar name={name as string} />
              ) : (
                <RandomAvatar name="N/A" />
              )}
              <Text style={styles.headerName}>{name}</Text>
            </View>
          ),
        }}
      />
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.transactionList}
      />

      <Pressable
        style={[styles.button, { backgroundColor: "#6200ea" }]}
        onPress={() => handlePressMilk("Add Milk")}
      >
        <Text style={styles.buttonText}>Add Milk</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: "#4CAF50" }]}
        onPress={() => handlePress("Gave")}
      >
        <Text style={styles.buttonText}>You Gave</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: "#2196F3" }]}
        onPress={() => handlePress("Got")}
      >
        <Text style={styles.buttonText}>You Got</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9", // Light background
    padding: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: "#6200ea",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 38,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  transactionCard: {
    padding: 15,
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    borderLeftWidth: 5,
  },
  leftSection: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
    color: "#aaa",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 5,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  transactionExpenseDetail: {
    fontSize: 14,
    color: "#777",
  },
  readMoreText: {
    color: "#2196F3",
    fontSize: 14,
    marginTop: 5,
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  runningBalance: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 5,
  },
  totalTillRecord: {
    fontSize: 14,
    color: "#777",
  },
  actionButtons: {
    marginTop: 10,
    flexDirection: "row",
  },
  actionButton: {
    backgroundColor: "transparent",
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 50,
  },
  transactionList: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default TransactionScreen;
