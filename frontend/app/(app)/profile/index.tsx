import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { getProfileApi } from "@/redux/slice/profile/profileApi";
import { Stack } from "expo-router";
import { useSession } from "@/context/AuthProvider";
const Avatar = require("../../../assets/images/avatar.jpg");

export default function Profile() {
  const { signOut } = useSession();
  const [userData, setUserData] = useState(null); // Initializing with null
  const [loading, setLoading] = useState(true); // State for loading
  const [error, setError] = useState<null | string>(null); // State to store errors

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfileApi();
      if (res.status === 200) {
        setUserData(res.data);
      }
    } catch (err) {
      setError("Failed to load profile data.");
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load profile data.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ea" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Profile",
        }}
      />
      <View style={styles.header}>
        <Image source={Avatar} style={styles.profilePic} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userData?.name}</Text>
          <Text style={styles.userEmail}>{userData?.mobile}</Text>
        </View>
      </View>

      <Pressable
        style={styles.logoutButton}
        onPress={() => {
          signOut();
        }}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profilePic: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  userEmail: {
    fontSize: 16,
    color: "#777",
  },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editButton: {
    backgroundColor: "#6200ea",
    paddingVertical: 12,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    marginVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#f44336",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: "#d32f2f", // Red color for destructive action
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
