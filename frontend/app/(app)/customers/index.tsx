import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { formatDistanceToNow } from "date-fns"; // For time formatting
import { getSellerSummaryApi } from "@/redux/slice/transactions/transactionApi";

const getInitials = (name: string) => {
  const nameParts = name.split(" ");
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial =
    nameParts.length > 1 ? nameParts[1].charAt(0).toUpperCase() : "";
  return firstInitial + lastInitial;
};

const RandomAvatar = ({ name }: { name: string }) => {
  const backgroundColor = "#6200ea"; // You can customize this color
  const initials = getInitials(name); // Generate initials from the name
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const CustomerScreen = () => {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const res = await getSellerSummaryApi();
        if (res.status === 200) {
          const sortedData = res?.data?.seller_details.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
          });
          setPeople(sortedData);
        }
      } catch (err: any) {
        setError(
          err?.response?.data?.detail
            ? err?.response?.data?.detail
            : "Something went wrong"
        );
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to load customer data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const renderPerson = ({ item }) => (
    <View style={styles.personCard} key={item?.mobile}>
      <TouchableOpacity
        style={styles.personButton}
        onPress={() =>
          router.push(
            `/(app)/customers/transactions/${item.mobile}?name=${item.name}`
          )
        }
      >
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <RandomAvatar name={item.name} /> // Fallback to initials avatar
          )}
          <View style={styles.textContainer}>
            <Text style={styles.personName}>{item.name}</Text>
            <Text style={styles.personPhone}>{item.mobile}</Text>
            {/* Only display the date if it's not null */}
            {item.date && (
              <Text style={styles.personDate}>{formatDate(item.date)}</Text>
            )}
          </View>
        </View>
        {/* Move balance to the other side of the card */}
        <View style={styles.balanceContainer}>
          <Text style={styles.personBalance}>₹{item.balance.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#6200ea" />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={people}
          renderItem={renderPerson}
          keyExtractor={(item) => item.mobile}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => router.push("/customers/contacts/contact")}
      >
        <Text style={styles.buttonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9", // Light background
    padding: 10,
  },
  listContainer: {
    paddingBottom: 50,
  },
  personCard: {
    marginVertical: 5,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Added this to position elements
  },
  personButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
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
  textContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  personName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  personPhone: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
  personBalance: {
    fontSize: 16,
    color: "#4CAF50", // Green for balance
    marginTop: 5,
  },
  personDate: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 5,
  },
  balanceContainer: {
    justifyContent: "center",
    alignItems: "flex-end", // Align balance to the right
    flex: 1, // This will ensure balance stays on the right side
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 30,
    backgroundColor: "#6200ea",
    borderRadius: 50,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 30,
    color: "#fff",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
});

export default CustomerScreen;
