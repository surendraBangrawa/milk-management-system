import { Text, SafeAreaView, Pressable, View } from "react-native";
import React from "react";
import { useSession } from "@/context/AuthProvider";
import { Redirect, useRouter } from "expo-router";
import { StyleSheet } from "react-native";

const HeroScreen = () => {
  const router = useRouter();
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)/(home)" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.heroContent}>
        <Text style={styles.title}>Welcome to Diaru</Text>
        <Text style={styles.subtitle}>Your journey starts here</Text>

        <Pressable
          style={styles.button}
          onPress={() => {
            router.push("/auth/signin");
          }}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={() => {
            router.push("/auth/signup");
          }}
        >
          <Text style={styles.secondaryButtonText}>Sign Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#6200ea",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  secondaryButton: {
    backgroundColor: "#03dac5",
  },
  secondaryButtonText: {
    color: "#6200ea",
  },
  loadingText: {
    fontSize: 20,
    textAlign: "center",
    marginTop: "50%",
    color: "#333",
  },
});

export default HeroScreen;
