import { useState, useEffect, useMemo } from "react";
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Text,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as Contacts from "expo-contacts";
import { Stack, useRouter } from "expo-router";

import useTheme from "@/context/theme/useTheme";
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
  const { colors } = useTheme();
  const backgroundColor = colors.primaryLight;
  const initials = getInitials(name);
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const AddCustomerScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const [contacts, setContacts] = useState<Contacts.Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Helper function to clean and format phone numbers for display and comparison
  const formatPhoneNumber = (phone: string | undefined | null): string => {
    if (!phone) return "";

    let cleanedPhone = phone.replace(/[^\d]/g, "");

    if (cleanedPhone.startsWith("91") && cleanedPhone.length === 12) {
      cleanedPhone = cleanedPhone.substring(2);
    } else if (cleanedPhone.startsWith("+91") && cleanedPhone.length === 13) {
      cleanedPhone = cleanedPhone.substring(3);
    }

    if (cleanedPhone.length < 7) {
      return "";
    }

    return cleanedPhone;
  };

  // Filter contacts based on search query using useMemo for performance
  const filteredContacts = useMemo(() => {
    // Normalize the search query once for both name and number comparison.
    // This `lowerCaseTrimmedQuery` will be used for name matching.
    const lowerCaseTrimmedQuery = searchQuery
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // If the normalized search query is empty, return all contacts.
    // This handles cases where the user clears the search or types only spaces.
    if (!lowerCaseTrimmedQuery) {
      return contacts;
    }

    // For phone number matching, we need a digit-only version of the query.
    // This is distinct from the name search query.
    const digitOnlySearchQuery = searchQuery.replace(/[^\d]/g, "");

    return contacts.filter((contact) => {
      // Normalize the contact's name for comparison
      const contactName =
        contact.name
          ?.toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") || "";

      // Get and format the primary phone number for comparison
      const primaryPhoneNumber =
        contact.phoneNumbers && contact.phoneNumbers.length > 0
          ? formatPhoneNumber(contact.phoneNumbers[0].number)
          : "";

      // Check if the contact's name includes the processed search query
      const nameMatches = contactName.includes(lowerCaseTrimmedQuery);

      // Check if the cleaned primary phone number includes the digit-only search query
      // Only check phone match if digitOnlySearchQuery is not empty
      const phoneMatches =
        digitOnlySearchQuery &&
        primaryPhoneNumber.includes(digitOnlySearchQuery);

      // A contact matches if either their name OR their phone number matches
      return nameMatches || phoneMatches;
    });
  }, [contacts, searchQuery]); // Dependencies: contacts array and the search query string

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      const { status } = await Contacts.requestPermissionsAsync();

      if (status === "granted") {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        });

        const contactsWithInfo = data.filter(
          (contact) =>
            contact.name &&
            contact.phoneNumbers &&
            contact.phoneNumbers.length > 0 &&
            contact.phoneNumbers[0]?.number
        );
        setContacts(contactsWithInfo);
      } else {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Please grant contacts permission to add from contacts.",
        });
      }
      setLoading(false);
    }
    fetchContacts();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleContactSelect = (contact: Contacts.Contact) => {
    const name = contact.name;
    const mobile = formatPhoneNumber(contact.phoneNumbers?.[0]?.number);

    if (!name || !mobile) {
      Toast.show({
        type: "error",
        text1: "Invalid Contact",
        text2: "Selected contact is missing a name or phone number.",
      });
      return;
    }

    router.push(
      `/(app)/customers/contacts/add-contact?name=${encodeURIComponent(
        name
      )}&mobile=${encodeURIComponent(mobile)}`
    );
  };

  const renderContact = ({ item }: { item: Contacts.Contact }) => (
    <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
      <TouchableOpacity
        onPress={() => handleContactSelect(item)}
        style={styles.contactContainer}
        activeOpacity={0.8}
      >
        {item.imageAvailable && item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.avatarImage} />
        ) : (
          <RandomAvatar name={item.name} />
        )}
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
      ) : filteredContacts.length === 0 && searchQuery.trim() !== "" ? (
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No contacts found matching your search.
        </Text>
      ) : contacts.length === 0 && searchQuery.trim() === "" ? (
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
          No contacts found on your device.
        </Text>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContact}
          keyExtractor={(item, index) => item.id || index.toString()}
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
    padding: 16,
  },
  searchBar: {
    height: 48,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
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
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
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
    fontSize: 17,
    fontWeight: "600",
  },
  contactCard: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginRight: 15,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 0,
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  contactList: {
    paddingBottom: 20,
  },
  loadingIndicator: {
    marginTop: 20,
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});

export default AddCustomerScreen;
