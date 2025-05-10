import { Stack } from "expo-router";
import React from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Linking,
} from "react-native";
import Toast from "react-native-toast-message";

export default function Subscription() {
  const subscriptionPlans = [
    {
      id: 1,
      name: "Basic Plan",
      price: "1.99",
      features: [
        "Feature 1: Access to basic content",
        "Feature 2: 24/7 support",
        "Feature 3: Limited storage",
      ],
      upiId: "8875353053@ybl",
    },
    {
      id: 2,
      name: "Premium Plan",
      price: "2.99",
      features: [
        "Feature 1: Access to all content",
        "Feature 2: Priority support",
        "Feature 3: Unlimited storage",
      ],
      upiId: "merchant@upi",
    },
    {
      id: 3,
      name: "Ultimate Plan",
      price: "3.99",
      features: [
        "Feature 1: Access to exclusive content",
        "Feature 2: VIP support",
        "Feature 3: Unlimited storage",
        "Feature 4: Free premium features for 1 year",
      ],
      upiId: "merchant@upi",
    },
  ];

  // Generate UPI payment link
  const generateUpiLink = (plan) => {
    const amount = parseFloat(plan.price).toFixed(2);
    const transactionId = `txn${Date.now()}`;
    const transactionNote = `Payment for ${plan.name}`;
    const upiLink = `upi://pay?pa=${plan.upiId}&pn=Merchant&tid=${transactionId}&tr=${transactionId}&tn=${transactionNote}&am=${amount}&cu=INR`;

    return upiLink;
  };

  // Open UPI app with payment link
  const handlePayment = async (plan) => {
    try {
      const upiLink = generateUpiLink(plan);
      // Open the UPI payment app using the generated link
      const supported = await Linking.canOpenURL(upiLink);
      if (supported) {
        await Linking.openURL(upiLink);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No UPI apps found on your device.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: "There was an issue opening the UPI app.",
      });
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          title: "Subscription Plans",
        }}
      />
      {subscriptionPlans.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <Text style={styles.planTitle}>{plan.name}</Text>
          <Text style={styles.planPrice}>₹{plan.price}/month</Text>
          <Text style={styles.featuresTitle}>Features:</Text>
          {plan.features.map((feature, index) => (
            <Text key={index} style={styles.featureItem}>
              {feature}
            </Text>
          ))}
          <Pressable
            style={styles.subscribeButton}
            onPress={() => handlePayment(plan)}
          >
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    elevation: 3,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  planPrice: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6200ea",
    marginVertical: 10,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  featureItem: {
    fontSize: 14,
    color: "#555",
  },
  subscribeButton: {
    backgroundColor: "#6200ea",
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});
