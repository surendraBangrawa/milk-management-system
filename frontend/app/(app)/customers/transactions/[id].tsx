import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Pressable, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns"; // For date formatting
import { getSellerTransactionApi } from "@/api";
import Toast from "react-native-toast-message";

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

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const res = await getSellerTransactionApi(id ? id[0] : id);
        if (res.status === 200) {
          const sortedData = res?.data?.seller_details.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
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

    fetchCustomerData();
  }, []);

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
      <Text style={styles.transactionAmount}>Amount: ₹{item.amount}</Text>
      <Text style={styles.transactionType}>{item.type}</Text>
    </View>
  );

  const handlePress = (transactionType: string) => {
    router.push(
      `/(app)/customers/transactions/add-transaction?type=${transactionType}&id=${id}`
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.transactionList}
      />

      {/* Action Buttons */}
      <Pressable
        style={[styles.button, { backgroundColor: "#6200ea" }]}
        onPress={() => handlePress("Add Milk")}
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
  },
  transactionDate: {
    fontSize: 14,
    color: "#aaa",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50", // Green color for amounts
    marginVertical: 5,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
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
    elevation: 2, // Add shadow to buttons
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default TransactionScreen;
