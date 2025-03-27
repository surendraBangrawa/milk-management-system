import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as Contacts from "expo-contacts";
import { Stack, useNavigation } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";

const AddCustomerScreen = () => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const navigation = useNavigation();

  useEffect(() => {
    async function fetchContacts() {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        setContacts(data);
        setFilteredContacts(data); // Initially, show all contacts
      }
    }
    fetchContacts();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filteredData = contacts.filter((contact) =>
        contact.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredContacts(filteredData);
    } else {
      setFilteredContacts(contacts); // If search is cleared, show all contacts
    }
  };

  const handleContactSelect = (contact) => {
    // Pass selected contact to AddCustomerFormScreen
    navigation.navigate("AddCustomerForm", {
      name: contact.name,
      phone: contact.phoneNumbers ? contact.phoneNumbers[0].number : "",
    });
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <TouchableOpacity onPress={() => handleContactSelect(item)}>
        <ThemedText>{item.name}</ThemedText>
        {item.phoneNumbers && item.phoneNumbers[0] && (
          <ThemedText>{item.phoneNumbers[0].number}</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Customer",
        }}
      />
      <TextInput
        style={styles.searchBar}
        placeholder="Search contacts"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contactList}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  contactCard: {
    padding: 15,
    backgroundColor: "#f9f9f9",
    marginVertical: 5,
    borderRadius: 5,
  },
  contactList: {
    marginTop: 20,
  },
});

export default AddCustomerScreen;
