import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

const CustomerScreen = () => {
  const [people, setPeople] = useState<any[]>([]);
  const router = useRouter();

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
      <TouchableOpacity
        onPress={() => router.push(`/customers/transactions/${item.id}`)}
      >
        <Text>{item.name}</Text>
        <Text>{item.phone}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={people}
        renderItem={renderPerson}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/customers/contacts/contact")}
      >
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>+</Text>
          <Text style={styles.buttonLabel}>Add Customer</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 5,
  },
  personCard: {
    padding: 5,
    marginVertical: 5,
    backgroundColor: "#f0f0f0",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#4CAF50",
    borderRadius: 50,
    padding: 15,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20,
    color: "#fff",
    marginRight: 5,
  },
  buttonLabel: {
    fontSize: 16,
    color: "#fff",
  },
});

export default CustomerScreen;
