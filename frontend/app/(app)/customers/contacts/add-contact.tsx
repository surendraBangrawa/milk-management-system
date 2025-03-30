import React, { useState } from "react";
import { TextInput, Button, StyleSheet, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { saveContact } from "@/api";

const AddCustomerFormScreen = () => {
  const { name: filledName, phone: filledPhone } = useLocalSearchParams();
  const [name, setName] = useState(filledName ?? "");
  const [phone, setPhone] = useState(filledPhone ?? "");

  const handleAddCustomer = async () => {
    try {
      if (name && phone) {
        console.log(`Customer Added: ${name} - ${phone}`);
        await saveContact({ name, phone });
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Add Customer" }} />
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
