import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../context/theme/useTheme";
import { Colors } from "../../../constants/Colors";
import { useAuth } from "../../../context/AuthProvider";
import { subscriptionApi } from "../../../redux/slice/subscription/subscriptionApi";

interface Plan {
  plan_id: string;
  name: string;
  price: number;
  validity_days: number;
  features: string[];
  limits: {
    max_customers: number;
    max_suppliers: number;
    max_daily_transactions: number;
  };
  is_current_plan: boolean;
  can_upgrade: boolean;
}

interface UsageInfo {
  current_plan: string;
  usage: {
    customers: {
      used: number;
      limit: number;
      percentage: number;
      unlimited: boolean;
    };
    suppliers: {
      used: number;
      limit: number;
      percentage: number;
      unlimited: boolean;
    };
    daily_transactions: {
      used: number;
      limit: number;
      percentage: number;
      unlimited: boolean;
    };
  };
  trial_info: {
    trial_start_date: string | null;
    trial_end_date: string | null;
    is_trial_active: boolean;
  };
}

interface ReferralInfo {
  referral_code: string;
  referred_by: string | null;
  rewards_earned: number;
  rewards_used: number;
  available_rewards: any[];
  total_available: number;
}

export default function SubscriptionScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [plansResponse, usageResponse, referralResponse] =
        await Promise.all([
          subscriptionApi.getPlans(),
          subscriptionApi.getUsage(),
          subscriptionApi.getReferralInfo(),
        ]);

      if (plansResponse.success) {
        setPlans(plansResponse.plans);
      }

      if (usageResponse.success) {
        setUsageInfo(usageResponse);
      }

      if (referralResponse.success) {
        setReferralInfo(referralResponse);
      }
    } catch (error) {
      console.error("Error loading subscription data:", error);
      Alert.alert("Error", "Failed to load subscription information");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    try {
      setProcessingPayment(true);

      // Create Razorpay order
      const orderResponse = await subscriptionApi.createOrder();
      if (!orderResponse.success) {
        throw new Error(
          orderResponse.message || "Failed to create payment order"
        );
      }

      // Open Razorpay payment
      const options = {
        key: "rzp_test_YOUR_KEY_ID", // Replace with your Razorpay key
        amount: orderResponse.amount,
        currency: orderResponse.currency,
        name: "Milk Management System",
        description: "Premium Subscription",
        order_id: orderResponse.order_id,
        prefill: {
          contact: user?.mobile || "",
          name: user?.name || "",
        },
        theme: { color: Colors[theme].tint },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await subscriptionApi.verifyPayment({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            if (verifyResponse.success) {
              Alert.alert(
                "Success!",
                "Payment verified and premium subscription activated successfully!",
                [{ text: "OK", onPress: () => loadSubscriptionData() }]
              );
            } else {
              throw new Error(
                verifyResponse.message || "Payment verification failed"
              );
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            Alert.alert(
              "Error",
              "Payment verification failed. Please contact support."
            );
          }
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          },
        },
      };

      // Initialize Razorpay
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Error", "Failed to process payment. Please try again.");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) {
      Alert.alert("Error", "Please enter a referral code");
      return;
    }

    try {
      const response = await subscriptionApi.applyReferral({
        referral_code: referralCode,
      });
      if (response.success) {
        Alert.alert("Success!", response.message);
        setReferralCode("");
        setShowReferralInput(false);
        loadSubscriptionData();
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to apply referral code"
        );
      }
    } catch (error) {
      console.error("Referral error:", error);
      Alert.alert("Error", "Failed to apply referral code");
    }
  };

  const handleUseReward = async (rewardId: number) => {
    try {
      const response = await subscriptionApi.useReward({ reward_id: rewardId });
      if (response.success) {
        Alert.alert("Success!", response.message);
        loadSubscriptionData();
      } else {
        Alert.alert("Error", response.message || "Failed to use reward");
      }
    } catch (error) {
      console.error("Reward usage error:", error);
      Alert.alert("Error", "Failed to use reward");
    }
  };

  const copyReferralCode = () => {
    if (referralInfo?.referral_code) {
      // Copy to clipboard
      Alert.alert("Copied!", "Referral code copied to clipboard");
    }
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? "Unlimited" : limit.toString();
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case "free":
        return Colors[theme].text;
      case "trial":
        return "#FF9500";
      case "premium":
        return "#007AFF";
      default:
        return Colors[theme].text;
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: Colors[theme].background },
        ]}
      >
        <ActivityIndicator size="large" color={Colors[theme].tint} />
        <Text style={[styles.loadingText, { color: Colors[theme].text }]}>
          Loading subscription information...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>
          Subscription Plans
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Current Plan Status */}
      {usageInfo && (
        <View
          style={[
            styles.currentPlanCard,
            { backgroundColor: Colors[theme].cardBackground },
          ]}
        >
          <Text
            style={[styles.currentPlanTitle, { color: Colors[theme].text }]}
          >
            Current Plan:{" "}
            {usageInfo.current_plan.charAt(0).toUpperCase() +
              usageInfo.current_plan.slice(1)}
          </Text>

          {usageInfo.trial_info.is_trial_active && (
            <View style={styles.trialInfo}>
              <Ionicons name="time-outline" size={16} color="#FF9500" />
              <Text style={[styles.trialText, { color: "#FF9500" }]}>
                Trial ends:{" "}
                {new Date(
                  usageInfo.trial_info.trial_end_date!
                ).toLocaleDateString()}
              </Text>
            </View>
          )}

          {/* Usage Progress */}
          <View style={styles.usageSection}>
            <Text style={[styles.usageTitle, { color: Colors[theme].text }]}>
              Usage
            </Text>

            <View style={styles.usageItem}>
              <Text style={[styles.usageLabel, { color: Colors[theme].text }]}>
                Customers
              </Text>
              <View style={styles.usageBar}>
                <View
                  style={[
                    styles.usageProgress,
                    {
                      width: `${Math.min(
                        usageInfo.usage.customers.percentage,
                        100
                      )}%`,
                      backgroundColor:
                        usageInfo.usage.customers.percentage > 80
                          ? "#FF3B30"
                          : Colors[theme].tint,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.usageText, { color: Colors[theme].text }]}>
                {usageInfo.usage.customers.used} /{" "}
                {formatLimit(usageInfo.usage.customers.limit)}
              </Text>
            </View>

            <View style={styles.usageItem}>
              <Text style={[styles.usageLabel, { color: Colors[theme].text }]}>
                Suppliers
              </Text>
              <View style={styles.usageBar}>
                <View
                  style={[
                    styles.usageProgress,
                    {
                      width: `${Math.min(
                        usageInfo.usage.suppliers.percentage,
                        100
                      )}%`,
                      backgroundColor:
                        usageInfo.usage.suppliers.percentage > 80
                          ? "#FF3B30"
                          : Colors[theme].tint,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.usageText, { color: Colors[theme].text }]}>
                {usageInfo.usage.suppliers.used} /{" "}
                {formatLimit(usageInfo.usage.suppliers.limit)}
              </Text>
            </View>

            <View style={styles.usageItem}>
              <Text style={[styles.usageLabel, { color: Colors[theme].text }]}>
                Daily Transactions
              </Text>
              <View style={styles.usageBar}>
                <View
                  style={[
                    styles.usageProgress,
                    {
                      width: `${Math.min(
                        usageInfo.usage.daily_transactions.percentage,
                        100
                      )}%`,
                      backgroundColor:
                        usageInfo.usage.daily_transactions.percentage > 80
                          ? "#FF3B30"
                          : Colors[theme].tint,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.usageText, { color: Colors[theme].text }]}>
                {usageInfo.usage.daily_transactions.used} /{" "}
                {formatLimit(usageInfo.usage.daily_transactions.limit)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Plans */}
      <View style={styles.plansSection}>
        <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
          Available Plans
        </Text>

        {plans.map((plan) => (
          <View
            key={plan.plan_id}
            style={[
              styles.planCard,
              {
                backgroundColor: Colors[theme].cardBackground,
                borderColor: plan.is_current_plan
                  ? Colors[theme].tint
                  : "transparent",
                borderWidth: plan.is_current_plan ? 2 : 0,
              },
            ]}
          >
            <View style={styles.planHeader}>
              <View>
                <Text
                  style={[
                    styles.planName,
                    { color: getPlanColor(plan.plan_id) },
                  ]}
                >
                  {plan.name}
                </Text>
                <Text style={[styles.planPrice, { color: Colors[theme].text }]}>
                  ₹{plan.price}
                  {plan.validity_days > 0 && (
                    <Text style={styles.planValidity}>
                      /
                      {plan.validity_days === 365
                        ? "year"
                        : `${plan.validity_days} days`}
                    </Text>
                  )}
                </Text>
              </View>

              {plan.is_current_plan && (
                <View
                  style={[
                    styles.currentBadge,
                    { backgroundColor: Colors[theme].tint },
                  ]}
                >
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>

            <View style={styles.planFeatures}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text
                    style={[styles.featureText, { color: Colors[theme].text }]}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {plan.can_upgrade && (
              <TouchableOpacity
                style={[
                  styles.upgradeButton,
                  { backgroundColor: Colors[theme].tint },
                ]}
                onPress={handleUpgradeToPremium}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.upgradeButtonText}>
                    Upgrade to Premium
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Referral Section */}
      {referralInfo && (
        <View
          style={[
            styles.referralSection,
            { backgroundColor: Colors[theme].cardBackground },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
            Referral Rewards
          </Text>

          <View style={styles.referralCard}>
            <Text style={[styles.referralTitle, { color: Colors[theme].text }]}>
              Your Referral Code
            </Text>
            <TouchableOpacity
              style={styles.referralCodeContainer}
              onPress={copyReferralCode}
            >
              <Text
                style={[styles.referralCode, { color: Colors[theme].tint }]}
              >
                {referralInfo.referral_code}
              </Text>
              <Ionicons
                name="copy-outline"
                size={20}
                color={Colors[theme].tint}
              />
            </TouchableOpacity>

            <Text style={[styles.referralInfo, { color: Colors[theme].text }]}>
              Share this code with friends and both of you will get rewards!
            </Text>
          </View>

          {!referralInfo.referred_by && (
            <View style={styles.applyReferralSection}>
              <TouchableOpacity
                style={[
                  styles.applyReferralButton,
                  { borderColor: Colors[theme].tint },
                ]}
                onPress={() => setShowReferralInput(!showReferralInput)}
              >
                <Ionicons
                  name="gift-outline"
                  size={20}
                  color={Colors[theme].tint}
                />
                <Text
                  style={[
                    styles.applyReferralText,
                    { color: Colors[theme].tint },
                  ]}
                >
                  Apply Referral Code
                </Text>
              </TouchableOpacity>

              {showReferralInput && (
                <View style={styles.referralInputContainer}>
                  <TextInput
                    style={[
                      styles.referralInput,
                      {
                        backgroundColor: Colors[theme].background,
                        color: Colors[theme].text,
                        borderColor: Colors[theme].border,
                      },
                    ]}
                    placeholder="Enter referral code"
                    placeholderTextColor={Colors[theme].textSecondary}
                    value={referralCode}
                    onChangeText={setReferralCode}
                  />
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      { backgroundColor: Colors[theme].tint },
                    ]}
                    onPress={handleApplyReferral}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {referralInfo.available_rewards.length > 0 && (
            <View style={styles.rewardsSection}>
              <Text
                style={[styles.rewardsTitle, { color: Colors[theme].text }]}
              >
                Available Rewards ({referralInfo.total_available})
              </Text>

              {referralInfo.available_rewards.map((reward) => (
                <View key={reward.id} style={styles.rewardItem}>
                  <View>
                    <Text
                      style={[
                        styles.rewardDescription,
                        { color: Colors[theme].text },
                      ]}
                    >
                      {reward.description}
                    </Text>
                    <Text
                      style={[
                        styles.rewardDate,
                        { color: Colors[theme].textSecondary },
                      ]}
                    >
                      Earned: {new Date(reward.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.useRewardButton,
                      { backgroundColor: Colors[theme].tint },
                    ]}
                    onPress={() => handleUseReward(reward.id)}
                  >
                    <Text style={styles.useRewardButtonText}>Use</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={styles.referralStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors[theme].tint }]}>
                {referralInfo.rewards_earned}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: Colors[theme].textSecondary },
                ]}
              >
                Rewards Earned
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors[theme].tint }]}>
                {referralInfo.rewards_used}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: Colors[theme].textSecondary },
                ]}
              >
                Rewards Used
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 34,
  },
  loadingText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
  },
  currentPlanCard: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentPlanTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
  },
  trialInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  trialText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  usageSection: {
    marginTop: 15,
  },
  usageTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  usageItem: {
    marginBottom: 12,
  },
  usageLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  usageBar: {
    height: 6,
    backgroundColor: "#E5E5E5",
    borderRadius: 3,
    marginBottom: 5,
  },
  usageProgress: {
    height: "100%",
    borderRadius: 3,
  },
  usageText: {
    fontSize: 12,
    textAlign: "right",
  },
  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },
  planCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  planName: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 5,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
  },
  planValidity: {
    fontSize: 16,
    fontWeight: "400",
  },
  currentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  currentBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
  },
  upgradeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  referralSection: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  referralCard: {
    marginBottom: 20,
  },
  referralTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  referralCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    marginBottom: 10,
  },
  referralCode: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  referralInfo: {
    fontSize: 14,
    lineHeight: 20,
  },
  applyReferralSection: {
    marginBottom: 20,
  },
  applyReferralButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 8,
  },
  applyReferralText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  referralInputContainer: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  referralInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 10,
    fontSize: 16,
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  rewardsSection: {
    marginBottom: 20,
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 15,
  },
  rewardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  rewardDescription: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  rewardDate: {
    fontSize: 12,
  },
  useRewardButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  useRewardButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  referralStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
  },
});
