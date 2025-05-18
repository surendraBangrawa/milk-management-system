import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
  Image,
  Platform, // Import Platform
  ActivityIndicator, // Added ActivityIndicator for contacts loading
} from "react-native";
import * as Contacts from "expo-contacts";
import { Stack, useRouter } from "expo-router";

import useTheme from "@/context/theme/useTheme"; // Import useTheme
import Toast from "react-native-toast-message";

const getInitials = (name: string | undefined | null): string => {
  if (!name) return "";
  const nameParts = name.split(" ").filter((part) => part.length > 0);
  const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || "";
  const lastInitial =
    nameParts.length > 1
      ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() || ""
      : "";
  return firstInitial + lastInitial;
};

const RandomAvatar = ({ name }: { name: string | undefined | null }) => {
  const { colors } = useTheme(); // Use useTheme hook
  const backgroundColor = colors.primaryLight; // Use lighter primary color from theme
  const initials = getInitials(name);
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const AddCustomerScreen = () => {
  const router = useRouter();
  const { colors } = useTheme(); // Use the useTheme hook

  const [contacts, setContacts] = useState<Contacts.Contact[]>([]); // Use Contacts.Contact type
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true); // State for loading contacts

  // Filter contacts based on search query using useMemo for performance
  const filteredContacts = useMemo(() => {
    if (!searchQuery) {
      return contacts; // If no search query, show all contacts
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        (contact.name &&
          contact.name.toLowerCase().trim().includes(lowerCaseQuery.trim())) ||
        (contact.phoneNumbers &&
          contact.phoneNumbers[0]?.number &&
          contact.phoneNumbers[0].number
            .replace(/[^\d]/g, "")
            .includes(lowerCaseQuery.replace(/[^\d]/g, ""))) // Clean and compare numbers
    );
  }, [contacts, searchQuery]); // Recalculate when contacts or searchQuery changes

  // Function to clean and format the phone number (re-using from previous code)
  const formatPhoneNumber = (phone: string | undefined | null): string => {
    if (!phone) return "";

    // Remove any non-numeric characters
    let cleanedPhone = phone.replace(/[^\d]/g, "");

    // If country code is present (e.g., +91), remove it (basic check, might need refinement)
    if (cleanedPhone.startsWith("91") && cleanedPhone.length > 10) {
      // Check length is > 10 for 10-digit numbers + 91
      cleanedPhone = cleanedPhone.substring(2);
    }

    // Basic check to ensure it's a potential phone number (e.g., at least 7 digits)
    if (cleanedPhone.length < 7) {
      return ""; // Or return original unformatted string if preferred
    }

    // Optionally format the number for display (e.g., add dashes)
    // For now, just return the cleaned number
    return cleanedPhone;
  };

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true); // Start loading
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        });
        // Filter out contacts without phone numbers or names before setting state
        const contactsWithInfo = data.filter(
          (contact) =>
            contact.name &&
            contact.phoneNumbers &&
            contact.phoneNumbers.length > 0
        );
        setContacts(contactsWithInfo);
        // filteredContacts will be updated automatically by useMemo
      } else {
        console.warn("Contacts permission not granted.");
        // Optionally show an error message to the user
      }
      setLoading(false); // Stop loading
    }
    fetchContacts();
  }, []); // Empty dependency array to run once on mount

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Filtering is now handled by useMemo
  };

  const handleContactSelect = (contact: Contacts.Contact) => {
    // Use Contact type
    const name = contact.name;
    // Use the formatPhoneNumber function to clean the first phone number
    const mobile = formatPhoneNumber(contact.phoneNumbers?.[0]?.number);

    if (!name || !mobile) {
      console.warn(
        "Cannot select contact: Missing name or phone number",
        contact
      );
      Toast.show({
        type: "error",
        text1: "Invalid Contact",
        text2: "Selected contact is missing a name or phone number.",
      });
      return;
    }

    // Navigate to add-contact screen with selected contact details
    router.push(
      `/(app)/customers/contacts/add-contact?name=${encodeURIComponent(
        name
      )}&mobile=${encodeURIComponent(mobile)}` // Encode params
    );
  };

  const renderContact = (
    { item }: { item: Contacts.Contact } // Use Contact type
  ) => (
    <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        onPress={() => handleContactSelect(item)}
        style={styles.contactContainer}
        activeOpacity={0.8} // Subtle press feedback
      >
        <RandomAvatar name={item.name} />
        <View style={styles.contactInfo}>
          <Text
            style={[styles.contactName, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name || "Unknown Contact"}
          </Text>
          {item.phoneNumbers && item.phoneNumbers[0] && (
            <Text
              style={[styles.contactPhone, { color: colors.textSecondary }]}
            >
              {formatPhoneNumber(item.phoneNumbers[0].number)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Add from Contacts",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />
      <TextInput
        style={[
          styles.searchBar,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
          },
        ]}
        placeholder="Search contacts by name or phone"
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={handleSearch}
        clearButtonMode="while-editing"
      />
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          {
            backgroundColor: pressed ? colors.primaryDark : colors.primary,
          },
        ]}
        onPress={() => router.push(`/(app)/customers/contacts/add-contact`)}
      >
        <Text style={[styles.addButtonText, { color: colors.surface }]}>
          Add Manually
        </Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loadingIndicator}
        />
      ) : filteredContacts.length === 0 && searchQuery !== "" ? (
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No contacts found matching your search.
        </Text>
      ) : contacts.length === 0 && searchQuery === "" ? (
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No contacts found on your device.
        </Text> // Message if no contacts fetched
      ) : (
        <FlatList
          data={filteredContacts} // Use the filtered list
          renderItem={renderContact}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.contactList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color from theme applied inline
    padding: 16, // Adjusted padding
  },
  searchBar: {
    height: 48, // Adjusted height
    borderWidth: 1,
    // Border color, background, text color from theme applied inline
    borderRadius: 24, // More rounded corners
    paddingHorizontal: 16, // Adjusted padding
    fontSize: 16,
    marginBottom: 16, // Adjusted margin
    // Shadow from theme applied inline
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addButton: {
    // Background color from theme applied inline
    paddingVertical: 14, // Adjusted padding
    borderRadius: 8, // Slightly less rounded than search bar
    width: "100%",
    alignItems: "center",
    marginBottom: 16, // Adjusted margin
    // Shadow from theme applied inline
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    fontSize: 17, // Adjusted font size
    fontWeight: "600",
    // Color from theme applied inline
  },
  contactCard: {
    padding: 12, // Adjusted padding
    // Background color from theme applied inline
    marginVertical: 6, // Adjusted vertical margin
    borderRadius: 10, // Adjusted border radius
    // Shadow from theme applied inline
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50, // Adjusted size
    height: 50,
    borderRadius: 25, // Perfectly round
    // Background color from theme applied inline
    borderWidth: 0, // Removed border for cleaner look
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    // Style for Image component when avatar URL is available
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 0, // Removed border
  },
  avatarText: {
    fontSize: 20, // Adjusted font size
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 48, // Adjusted line height
    // Color from theme applied inline
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17, // Adjusted font size
    fontWeight: "600",
    // Color from theme applied inline
    marginBottom: 2, // Added margin
  },
  contactPhone: {
    fontSize: 14, // Adjusted font size
    marginTop: 2, // Added margin
    // Color from theme applied inline
  },
  contactList: {
    // No specific margin top needed if spacing is handled by searchBar/addButton margin bottom
    // marginTop: 20,
    paddingBottom: 20, // Add some padding at the bottom
  },
  loadingIndicator: {
    // Style for loading indicator
    marginTop: 20,
    textAlign: "center", // Not applicable to ActivityIndicator, but good practice for text
  },
  noDataText: {
    // Style for no data/no results text
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
    // Color from theme applied inline
  },
});

export default AddCustomerScreen;
