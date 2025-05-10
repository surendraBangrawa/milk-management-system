import { useSession } from "@/context/AuthProvider";
import { useRouter } from "expo-router";
import { StyleSheet, View, Text, Pressable } from "react-native";

export default function TabTwoScreen() {
  const router = useRouter();
  const { signOut } = useSession();
  const handleOptionPress = (option: string) => {
    console.log(`${option} pressed`);
    if (option === "Profile") {
      router.push("/(app)/profile");
    }
    if (option === "Manage Subscription") {
      router.push("/(app)/subscription");
    }
    if (option === "Rate List") {
      router.push("/(app)/ratelist");
    }
    if (option === "Logout") {
      signOut();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        <Pressable
          style={styles.option}
          onPress={() => handleOptionPress("Profile")}
        >
          <Text style={styles.optionText}>Profile</Text>
        </Pressable>
        <Pressable
          style={styles.option}
          onPress={() => handleOptionPress("Manage Subscription")}
        >
          <Text style={styles.optionText}>Manage Subscription</Text>
        </Pressable>

        <Pressable
          style={styles.option}
          onPress={() => handleOptionPress("Help")}
        >
          <Text style={styles.optionText}>Help</Text>
        </Pressable>

        <Pressable
          style={styles.option}
          onPress={() => handleOptionPress("About")}
        >
          <Text style={styles.optionText}>About</Text>
        </Pressable>

        <Pressable
          style={styles.option}
          onPress={() => handleOptionPress("Rate List")}
        >
          <Text style={styles.optionText}>Rate List</Text>
        </Pressable>

        <Pressable
          style={styles.option}
          onPress={() => handleOptionPress("Logout")}
        >
          <Text style={styles.optionText}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: "column", // Vertical list of options
    gap: 15, // Space between options
  },
  option: {
    backgroundColor: "#6200ea", // Option button color
    padding: 15,
    borderRadius: 8,
    alignItems: "center", // Center the text inside the button
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
