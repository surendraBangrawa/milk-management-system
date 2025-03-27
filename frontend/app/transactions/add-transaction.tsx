import React, { useState } from "react";
import { TextInput, Button, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

// Amount - INR
// Note - Text
// Date - Automatic populate present or manual date
// Submit -  Send this data to backend

const AddTransactionScreen = () => {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleAddTransaction = () => {
    console.log(
      `Added ${type} transaction for customer ${id}: ₹${amount} - ${description}`
    );
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: type ?? "",
        }}
      />
      <ThemedText type="title">{type} Transaction</ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
      />

      <Button
        title="Add Transaction"
        onPress={handleAddTransaction}
        disabled={!amount || !description}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});

export default AddTransactionScreen;
