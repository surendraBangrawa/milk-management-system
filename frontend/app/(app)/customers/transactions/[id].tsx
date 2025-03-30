import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Pressable, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

const TransactionScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const mockTransactions = [
      { id: "1", type: "You Gave", amount: 100, date: "2025-03-20" },
      { id: "2", type: "You Got", amount: 50, date: "2025-03-22" },
    ];
    setTransactions(mockTransactions);
  }, [id]);

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <Text>{item.date}</Text>
      <Text>Amount: ₹{item.amount}</Text>
      <Text>{item.type}</Text>
    </View>
  );

  const handlePress = (transactionType: string) => {
    router.push(
      `/transactions/add-transaction?type=${transactionType}&id=${id}`
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Transactions",
        }}
      />
      <Text style={styles.header}>Customer: {id}</Text>

      <Text style={styles.transactionHeader}>Transaction History</Text>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.transactionList}
      />

      <Pressable
        style={[styles.button, { backgroundColor: "red" }]}
        onPress={() => handlePress("Add Milk")}
      >
        <Text style={styles.buttonText}>Add Milk</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: "green" }]}
        onPress={() => handlePress("You Gave")}
      >
        <Text style={styles.buttonText}>You Gave</Text>
      </Pressable>

      <Pressable
        style={[styles.button, { backgroundColor: "blue" }]}
        onPress={() => handlePress("You Got")}
      >
        <Text style={styles.buttonText}>You Got</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
  },
  transactionCard: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    marginVertical: 5,
    borderRadius: 5,
  },
  transactionList: {
    marginTop: 20,
  },
  transactionHeader: {
    fontSize: 18,
    marginVertical: 10,
  },
  button: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});

export default TransactionScreen;
