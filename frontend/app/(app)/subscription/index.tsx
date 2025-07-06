import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Toast from "react-native-toast-message";
import useTheme from "@/context/theme/useTheme";
import axios from "@/lib/axiosIntance";
import {
  refreshSubscriptionStatus,
  checkCustomerLimit,
  checkTransactionLimit,
} from "@/lib/subscriptionUtils";
import PaymentWebView from "@/components/PaymentWebView";

export default function Subscription() {
  const { colors } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [usage, setUsage] = useState<any>(null);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string>("");

  const fetchPlansAndStatus = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes] = await Promise.all([
        axios.get("/subscriptions/fetch_plans"),
        axios.get("/subscriptions/check"),
      ]);
      setPlans(plansRes.data || []);
      setCurrent(statusRes.data);
    } catch (e: any) {
      console.error("Error fetching subscription data:", e);
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2:
          "Could not load subscription data. Please check your connection and try again.",
      });
      setPlans([]);
      setCurrent(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPlansAndStatus();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlansAndStatus();
  };

  const createPaymentIntent = async () => {
    setPaying(true);
    try {
      const res = await axios.post("/subscriptions/create_payment_intent");
      if (res.data && res.data.payment_url) {
        setPaymentUrl(res.data.payment_url);
        setShowPaymentWebView(true);
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not create payment order.",
        });
      }
    } catch (e: any) {
      console.error("Payment error:", e);
      const errorMessage =
        e?.response?.data?.detail || "Payment failed. Please try again.";
      Toast.show({
        type: "error",
        text1: "Payment Error",
        text2: errorMessage,
      });
    } finally {
      setPaying(false);
    }
  };

  const handlePaymentSuccess = () => {
    Toast.show({
      type: "success",
      text1: "Payment Successful!",
      text2: "Your Premium subscription has been activated.",
    });

    // Refresh subscription status immediately and after a delay
    fetchPlansAndStatus();
    setTimeout(() => {
      refreshSubscriptionStatus();
      fetchPlansAndStatus();
    }, 2000);
  };

  const handlePaymentError = (error: string) => {
    Toast.show({
      type: "error",
      text1: "Payment Failed",
      text2: error || "Payment could not be completed. Please try again.",
    });

    // Refresh subscription status after a short delay
    setTimeout(() => {
      fetchPlansAndStatus();
    }, 1000);
  };

  const handlePaymentClose = () => {
    setShowPaymentWebView(false);
    setPaymentUrl("");

    // Check subscription status after payment closes
    setTimeout(() => {
      fetchPlansAndStatus();
    }, 1000);
  };

  // Get current plan details
  const getCurrentPlanDetails = () => {
    if (!current) return null;

    const currentPlanName = current.subsription_type || current.message;

    // Map subscription types to plan names
    let mappedPlanName = currentPlanName;
    if (currentPlanName === "Full") {
      mappedPlanName = "Premium";
    } else if (currentPlanName === "Partial") {
      mappedPlanName = "Free";
    }

    return plans.find(
      (plan) =>
        plan.plan_name.toLowerCase() === mappedPlanName.toLowerCase() ||
        (currentPlanName.includes("trial") && plan.plan_name === "Trial") ||
        (currentPlanName.includes("free") && plan.plan_name === "Free")
    );
  };

  // Get premium plan
  const getPremiumPlan = () => {
    return plans.find((plan) => plan.plan_name === "Premium");
  };

  const currentPlanDetails = getCurrentPlanDetails();
  const premiumPlan = getPremiumPlan();

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Stack.Screen
          options={{
            title: "Subscription Plans",
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
          }}
        />
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : (
          <>
            {current && (
              <View
                style={[styles.statusCard, { backgroundColor: colors.surface }]}
              >
                <Text
                  style={[styles.statusTitle, { color: colors.textPrimary }]}
                >
                  Current Plan:
                </Text>
                <Text style={[styles.statusValue, { color: colors.primary }]}>
                  {current.subsription_type === "Full"
                    ? "Premium"
                    : current.subsription_type || current.message}
                </Text>
                {current.end_date && (
                  <Text style={{ color: colors.textSecondary }}>
                    Valid till: {current.end_date}
                  </Text>
                )}
                {currentPlanDetails && (
                  <View style={styles.currentPlanDetails}>
                    <Text
                      style={[
                        styles.featuresTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      Your Current Limits:
                    </Text>
                    <Text
                      style={[
                        styles.featureItem,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Customers:{" "}
                      {currentPlanDetails.customer_limit ?? "Unlimited"}
                    </Text>
                    <Text
                      style={[
                        styles.featureItem,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Suppliers:{" "}
                      {currentPlanDetails.supplier_limit ?? "Unlimited"}
                    </Text>
                    <Text
                      style={[
                        styles.featureItem,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Daily Transactions:{" "}
                      {currentPlanDetails.transaction_limit ?? "Unlimited"}
                    </Text>
                  </View>
                )}
              </View>
            )}
            {usage && (
              <View
                style={[styles.usageCard, { backgroundColor: colors.surface }]}
              >
                <Text
                  style={[styles.usageTitle, { color: colors.textPrimary }]}
                >
                  Current Usage:
                </Text>
                <Text
                  style={[styles.usageItem, { color: colors.textSecondary }]}
                >
                  Customers: {usage.customers}/5
                </Text>
                <Text
                  style={[styles.usageItem, { color: colors.textSecondary }]}
                >
                  Today's Transactions: {usage.dailyTransactions}/3
                </Text>
              </View>
            )}

            {/* Show Premium upgrade option only */}
            {premiumPlan &&
              (!current ||
                current.subsription_type?.toLowerCase() !== "full") && (
                <View
                  style={[styles.planCard, { backgroundColor: colors.surface }]}
                >
                  <Text
                    style={[styles.planTitle, { color: colors.textPrimary }]}
                  >
                    {premiumPlan.plan_name}
                  </Text>
                  <Text style={[styles.planPrice, { color: colors.primary }]}>
                    ₹{premiumPlan.price}/ {premiumPlan.validity} days
                  </Text>
                  <Text
                    style={[
                      styles.featuresTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Premium Features:
                  </Text>
                  <Text
                    style={[
                      styles.featureItem,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Customers: {premiumPlan.customer_limit ?? "Unlimited"}
                  </Text>
                  <Text
                    style={[
                      styles.featureItem,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Suppliers: {premiumPlan.supplier_limit ?? "Unlimited"}
                  </Text>
                  <Text
                    style={[
                      styles.featureItem,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Daily Transactions:{" "}
                    {premiumPlan.transaction_limit ?? "Unlimited"}
                  </Text>
                  <Text
                    style={[
                      styles.featureItem,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Description: {premiumPlan.description}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.subscribeButton,
                      {
                        backgroundColor: pressed
                          ? colors.primaryDark
                          : colors.primary,
                      },
                    ]}
                    onPress={createPaymentIntent}
                    disabled={paying}
                    android_ripple={{ color: colors.primaryDark }}
                  >
                    <Text
                      style={[
                        styles.subscribeButtonText,
                        { color: colors.surface },
                      ]}
                    >
                      {paying ? "Processing..." : "Upgrade to Premium"}
                    </Text>
                  </Pressable>
                </View>
              )}
          </>
        )}
      </ScrollView>

      {/* Payment WebView */}
      <PaymentWebView
        visible={showPaymentWebView}
        paymentUrl={paymentUrl}
        onClose={handlePaymentClose}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  planCard: {
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  planPrice: {
    fontSize: 17,
    fontWeight: "500",
    marginVertical: 8,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 8,
  },
  featureItem: {
    fontSize: 14,
    marginLeft: 8,
    marginVertical: 2,
  },
  subscribeButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusCard: {
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    alignItems: "flex-start",
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  currentPlanDetails: {
    marginTop: 12,
    width: "100%",
  },
  usageCard: {
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    alignItems: "flex-start",
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  usageItem: {
    fontSize: 14,
    marginVertical: 2,
  },
});
