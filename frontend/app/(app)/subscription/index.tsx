import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  Pressable,
  Linking,
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

export default function Subscription() {
  const { colors } = useTheme();
  const [plans, setPlans] = useState<any[]>([]);
  const [current, setCurrent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [usage, setUsage] = useState<any>(null);

  const fetchPlansAndStatus = async () => {
    setLoading(true);
    try {
      const [plansRes, statusRes] = await Promise.all([
        axios.get("/subscriptions/fetch_plans"),
        axios.get("/subscriptions/check"),
      ]);
      setPlans(plansRes.data.plans || []);
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

  const fetchUsage = async () => {
    try {
      const [customerRes, transactionRes] = await Promise.all([
        axios.get("/customers/get_customer_summary"),
        axios.get(
          `/transactions/total_record_date_range?start_date=${
            new Date().toISOString().split("T")[0]
          }&end_date=${new Date().toISOString().split("T")[0]}`
        ),
      ]);

      setUsage({
        customers: customerRes.data?.total_sellers_count || 0,
        dailyTransactions: transactionRes.data?.total_entries_count || 0,
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
    }
  };

  useEffect(() => {
    fetchPlansAndStatus();
    fetchUsage();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlansAndStatus();
    fetchUsage();
  };

  const handleUpgrade = async () => {
    setPaying(true);
    try {
      const res = await axios.post("/subscriptions/create_payment_link");
      if (res.data && res.data.payment_link) {
        const supported = await Linking.canOpenURL(res.data.payment_link);
        if (supported) {
          await Linking.openURL(res.data.payment_link);
          Toast.show({
            type: "info",
            text1: "Complete Payment",
            text2: "After payment, return and refresh to activate Premium.",
          });
          setTimeout(() => {
            refreshSubscriptionStatus();
            fetchPlansAndStatus();
          }, 30000);
        } else {
          Toast.show({
            type: "error",
            text1: "Payment Error",
            text2: "Could not open payment link. Please try again.",
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Could not get payment link.",
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

  return (
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
              <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
                Current Plan:
              </Text>
              <Text style={[styles.statusValue, { color: colors.primary }]}>
                {current.subsription_type || current.message}
              </Text>
              {current.end_date && (
                <Text style={{ color: colors.textSecondary }}>
                  Valid till: {current.end_date}
                </Text>
              )}
            </View>
          )}
          {usage && (
            <View
              style={[styles.usageCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.usageTitle, { color: colors.textPrimary }]}>
                Current Usage:
              </Text>
              <Text style={[styles.usageItem, { color: colors.textSecondary }]}>
                Customers: {usage.customers}/5
              </Text>
              <Text style={[styles.usageItem, { color: colors.textSecondary }]}>
                Today's Transactions: {usage.dailyTransactions}/3
              </Text>
            </View>
          )}
          {plans.map((plan) => (
            <View
              key={plan.id}
              style={[styles.planCard, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                {plan.plan_name}
              </Text>
              <Text style={[styles.planPrice, { color: colors.primary }]}>
                ₹{plan.price}/ {plan.validity} days
              </Text>
              <Text
                style={[styles.featuresTitle, { color: colors.textPrimary }]}
              >
                Limits:
              </Text>
              <Text
                style={[styles.featureItem, { color: colors.textSecondary }]}
              >
                Customers: {plan.customer_limit ?? "Unlimited"}
              </Text>
              <Text
                style={[styles.featureItem, { color: colors.textSecondary }]}
              >
                Suppliers: {plan.supplier_limit ?? "Unlimited"}
              </Text>
              <Text
                style={[styles.featureItem, { color: colors.textSecondary }]}
              >
                Daily Transactions: {plan.transaction_limit ?? "Unlimited"}
              </Text>
              <Text
                style={[styles.featureItem, { color: colors.textSecondary }]}
              >
                Description: {plan.description}
              </Text>
              {plan.plan_name === "Premium" &&
                (!current ||
                  current.subsription_type?.toLowerCase() !== "full") && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.subscribeButton,
                      {
                        backgroundColor: pressed
                          ? colors.primaryDark
                          : colors.primary,
                      },
                    ]}
                    onPress={handleUpgrade}
                    disabled={paying}
                    android_ripple={{ color: colors.primaryDark }}
                  >
                    <Text
                      style={[
                        styles.subscribeButtonText,
                        { color: colors.surface },
                      ]}
                    >
                      Upgrade to Premium
                    </Text>
                  </Pressable>
                )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
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
