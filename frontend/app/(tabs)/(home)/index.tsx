import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router"; // Import useRouter
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context"; // Safe area for handling notches

const HomeScreen = () => {
  const [people, setPeople] = useState<any[]>([]); // List of people
  const router = useRouter(); // Initialize useRouter

  // Mock data
  useEffect(() => {
    const fetchedPeople = [
      { id: "1", name: "John Doe", phone: "1234567890" },
      { id: "2", name: "Jane Smith", phone: "0987654321" },
    ];
    setPeople(fetchedPeople);
  }, []);

  const renderPerson = ({ item }) => (
    <View style={styles.personCard}>
      <TouchableOpacity onPress={() => router.push(`/transactions/${item.id}`)}>
        <ThemedText type="title">{item.name}</ThemedText>
        <ThemedText>{item.phone}</ThemedText>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={people}
        renderItem={renderPerson}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/customers/customer")}
      >
        <View style={styles.buttonContent}>
          <ThemedText type="link" style={styles.buttonText}>
            +
          </ThemedText>
          <Text style={styles.buttonLabel}>Add Customer</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  personCard: {
    padding: 20,
    marginVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#4CAF50",
    borderRadius: 50,
    padding: 15,
    elevation: 5,
    flexDirection: "row", // Align text and icon horizontally
    alignItems: "center", // Center the content vertically
  },
  buttonContent: {
    flexDirection: "row", // Horizontally align "+" and "Add Customer"
    alignItems: "center",
  },
  buttonText: {
    fontSize: 30,
    color: "#fff",
    marginRight: 5, // Add some space between "+" and the text
  },
  buttonLabel: {
    fontSize: 16,
    color: "#fff",
  },
});

export default HomeScreen;
