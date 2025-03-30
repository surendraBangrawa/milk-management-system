import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
} from "react-native";
import * as Contacts from "expo-contacts";
import { Stack, useRouter } from "expo-router";

const AddCustomerScreen = () => {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchContacts() {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });
        setContacts(data);
        setFilteredContacts(data);
      }
    }
    fetchContacts();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filteredData = contacts.filter(
        (contact) =>
          contact.name
            .toLowerCase()
            .trim()
            .includes(query.toLowerCase().trim()) ||
          contact.phoneNumbers?.[0]?.number.includes(query)
      );
      setFilteredContacts(filteredData);
    } else {
      setFilteredContacts(contacts);
    }
  };

  const handleContactSelect = (contact) => {
    const name = contact.name;
    const phone = contact.phoneNumbers ? contact.phoneNumbers[0].number : "";
    router.push(`/customers/contacts/add-contact?name=${name}&phone=${phone}`);
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <TouchableOpacity onPress={() => handleContactSelect(item)}>
        <Text>{item.name}</Text>
        {item.phoneNumbers && item.phoneNumbers[0] && (
          <Text>{item.phoneNumbers[0].number}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Contacts",
        }}
      />
      <TextInput
        style={styles.searchBar}
        placeholder="Search contacts"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <Pressable onPress={() => router.push(`/customers/contacts/add-contact`)}>
        <Text>Add Customer</Text>
      </Pressable>

      <FlatList
        data={filteredContacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contactList}
      />
    </View>
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
