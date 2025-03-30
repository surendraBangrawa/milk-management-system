import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
  Image,
} from "react-native";
import * as Contacts from "expo-contacts";
import { Stack, useRouter } from "expo-router";

const getInitials = (name: string) => {
  const nameParts = name.split(" ");
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial =
    nameParts.length > 1 ? nameParts[1].charAt(0).toUpperCase() : "";
  return firstInitial + lastInitial;
};

const RandomAvatar = ({ name }: { name: string }) => {
  const backgroundColor = "#6200ea";
  const initials = getInitials(name); // Generate initials from the contact name
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const AddCustomerScreen = () => {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);

  // Function to clean and format the phone number
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";

    // Remove any non-numeric characters
    let cleanedPhone = phone.replace(/[^\d]/g, "");

    // If country code is present (e.g., +91), remove it
    if (cleanedPhone.startsWith("91") && cleanedPhone.length === 12) {
      cleanedPhone = cleanedPhone.substring(2);
    }

    return cleanedPhone;
  };

  useEffect(() => {
    async function fetchContacts() {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
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
    // Use the formatPhoneNumber function to clean the phone number
    const mobile = formatPhoneNumber(contact.phoneNumbers?.[0]?.number || "");
    router.push(
      `/(app)/customers/contacts/add-contact?name=${name}&mobile=${mobile}`
    );
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactCard}>
      <TouchableOpacity
        onPress={() => handleContactSelect(item)}
        style={styles.contactContainer}
      >
        {item.image ? (
          <Image source={{ uri: item.image.uri }} style={styles.avatar} />
        ) : (
          <RandomAvatar name={item.name} /> // Fallback to Random Avatar if no image
        )}
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.phoneNumbers && item.phoneNumbers[0] && (
            <Text style={styles.contactPhone}>
              {formatPhoneNumber(item.phoneNumbers[0].number)}
            </Text>
          )}
        </View>
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
        placeholderTextColor="#888"
      />

      <Pressable
        style={styles.addButton}
        onPress={() => router.push(`/customers/contacts/add-contact`)}
      >
        <Text style={styles.addButtonText}>Add Customer</Text>
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
    backgroundColor: "#f9f9f9",
  },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  addButton: {
    backgroundColor: "#6200ea",
    paddingVertical: 12,
    borderRadius: 25,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5, // Add shadow effect
  },
  addButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  contactCard: {
    padding: 10,
    backgroundColor: "#fff",
    marginVertical: 8,
    borderRadius: 12,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    borderWidth: 2,
    borderColor: "#6200ea", // Avatar border color
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 55,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  contactPhone: {
    fontSize: 16,
    color: "#888",
    marginTop: 5,
  },
  contactList: {
    marginTop: 20,
  },
});

export default AddCustomerScreen;
