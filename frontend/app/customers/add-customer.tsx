import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import { useNavigation } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const AddCustomerFormScreen = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const navigation = useNavigation();

  const handleAddCustomer = () => {
    if (name && phone) {
      // Add customer logic (e.g., save to Redux, API, etc.)
      console.log(`Customer Added: ${name} - ${phone}`);
      navigation.goBack(); // Go back to the previous screen (e.g., Home screen)
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.header}>
        Add Customer
      </ThemedText>

      <TextInput
        style={styles.input}
        placeholder="Enter name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Button title="Add Customer" onPress={handleAddCustomer} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    marginVertical: 10,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
});

export default AddCustomerFormScreen;
