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

import useTheme from "@/context/theme/useTheme"; // Import useTheme

export default function Subscription() {
  const { colors } = useTheme(); // Use the useTheme hook

  const subscriptionPlans = [
    {
      id: 1,
      name: "Basic Plan",
      price: "0.99",
      features: [
        "Feature 1: Access to basic content",
        "Feature 2: 24/7 support",
        "Feature 3: Limited storage",
      ],
      upiId: "8875353053@ybl", // Example UPI ID
    },
    {
      id: 2,
      name: "Premium Plan",
      price: "1.99",
      features: [
        "Feature 1: Access to all content",
        "Feature 2: Priority support",
        "Feature 3: Unlimited storage",
      ],
      upiId: "8875353053@ybl", // Example UPI ID
    },
    {
      id: 3,
      name: "Ultimate Plan",
      price: "2.99",
      features: [
        "Feature 1: Access to exclusive content",
        "Feature 2: VIP support",
        "Feature 3: Unlimited storage",
        "Feature 4: Free premium features for 1 year",
      ],
      upiId: "8875353053@ybl", // Example UPI ID
    },
  ];

  // Generate UPI payment link
  const generateUpiLink = (plan: {
    name: string;
    price: string;
    upiId: string;
  }) => {
    // Explicitly type plan
    const amount = parseFloat(plan.price).toFixed(2);
    // Using a simple timestamp for transaction ID - consider a more robust unique ID generation
    const transactionId = `txn${Date.now()}${Math.floor(Math.random() * 1000)}`; // Added random suffix
    const transactionNote = `Payment for ${plan.name}`;
    // Ensure all components are correctly encoded for the URL
    const upiLink = `upi://pay?pa=${encodeURIComponent(
      plan.upiId
    )}&pn=${encodeURIComponent("Merchant")}&tid=${encodeURIComponent(
      transactionId
    )}&tr=${encodeURIComponent(transactionId)}&tn=${encodeURIComponent(
      transactionNote
    )}&am=${encodeURIComponent(amount)}&cu=INR`;

    return upiLink;
  };

  // Open UPI app with payment link
  const handlePayment = async (plan: {
    name: string;
    price: string;
    upiId: string;
  }) => {
    // Explicitly type plan
    try {
      const upiLink = generateUpiLink(plan);
      console.log("Generated UPI Link:", upiLink); // Log the generated link

      // Check if any app can handle the UPI scheme
      const supported = await Linking.canOpenURL(upiLink);
      if (supported) {
        await Linking.openURL(upiLink);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "No UPI apps found on your device or UPI link is invalid.", // Improved message
        });
        console.warn("UPI link not supported:", upiLink); // Log warning
      }
    } catch (error) {
      console.error("Error handling payment:", error); // Log the error
      Toast.show({
        type: "error",
        text1: "Payment Failed",
        text2: "There was an issue opening the UPI app or generating the link.", // Improved message
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      {" "}
      {/* Use background color */}
      <Stack.Screen
        options={{
          title: "Subscription Plans",
          headerStyle: {
            backgroundColor: colors.surface, // Example header background
          },
          headerTintColor: colors.textPrimary, // Example header text color
        }}
      />
      {subscriptionPlans.map((plan) => (
        <View
          key={plan.id}
          style={[styles.planCard, { backgroundColor: colors.surface }]}
        >
          {" "}
          {/* Use surface color */}
          <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
            {plan.name}
          </Text>{" "}
          {/* Use textPrimary color */}
          <Text style={[styles.planPrice, { color: colors.primary }]}>
            ₹{parseFloat(plan.price).toFixed(2)}/month
          </Text>{" "}
          {/* Use primary color and format price */}
          <Text style={[styles.featuresTitle, { color: colors.textPrimary }]}>
            Features:
          </Text>{" "}
          {/* Use textPrimary color */}
          {plan.features.map((feature, index) => (
            <Text
              key={index}
              style={[styles.featureItem, { color: colors.textSecondary }]}
            >
              {" "}
              {/* Use textSecondary color */}
              {feature}
            </Text>
          ))}
          <Pressable
            style={({ pressed }) => [
              // Use pressed state for feedback
              styles.subscribeButton,
              {
                backgroundColor: pressed ? colors.primaryDark : colors.primary, // Darker on press
              },
            ]}
            onPress={() => handlePayment(plan)}
            android_ripple={{ color: colors.primaryDark }} // Add ripple effect for Android
          >
            <Text
              style={[styles.subscribeButtonText, { color: colors.surface }]}
            >
              Subscribe Now
            </Text>{" "}
            {/* Use surface color */}
          </Pressable>
        </View>
      ))}
      {/* Toast Message component - ensure this is at the root of your app or screen */}
      {/* <Toast /> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color from theme applied inline
    padding: 16, // Adjusted padding for consistency
  },
  title: {
    // This style is not used in the current component structure
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    // Color from theme applied inline if used
  },
  planCard: {
    // Background color from theme applied inline
    borderRadius: 10, // Adjusted border radius
    padding: 16, // Adjusted padding
    marginVertical: 8, // Adjusted vertical margin
  },
  planTitle: {
    fontSize: 20, // Adjusted font size
    fontWeight: "600",
    // Color from theme applied inline
  },
  planPrice: {
    fontSize: 17, // Adjusted font size
    fontWeight: "500",
    marginVertical: 8, // Adjusted vertical margin
    // Color from theme applied inline
  },
  featuresTitle: {
    fontSize: 15, // Adjusted font size
    fontWeight: "600",
    marginTop: 12, // Adjusted margin
    // Color from theme applied inline
  },
  featureItem: {
    fontSize: 14,
    // Color from theme applied inline
    marginBottom: 4, // Added margin between features
  },
  subscribeButton: {
    // Background color from theme applied inline
    paddingVertical: 12, // Adjusted padding
    marginTop: 16, // Adjusted margin
    borderRadius: 8, // Adjusted border radius
    alignItems: "center",
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "600", // Bolder text
    // Color from theme applied inline
  },
});
