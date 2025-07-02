import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Track subscription status
let subscriptionStatus: any = null;
let lastStatusCheck = 0;
const STATUS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API endpoints that should check subscription limits
const LIMIT_CHECK_ENDPOINTS = [
  "/customers/add",
  "/transactions/add_milk_record",
  "/transactions/add_expense",
];

// Get current subscription status
const getSubscriptionStatus = async () => {
  const now = Date.now();
  if (subscriptionStatus && now - lastStatusCheck < STATUS_CACHE_DURATION) {
    return subscriptionStatus;
  }

  try {
    const response = await axiosInstance.get("/subscriptions/check");
    subscriptionStatus = response.data;
    lastStatusCheck = now;
    return subscriptionStatus;
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return null;
  }
};

// Check if user can perform action based on subscription
const canPerformAction = async (endpoint: string) => {
  const status = await getSubscriptionStatus();
  if (!status) return true; // Allow if can't check status

  // Check if user is on Premium (unlimited)
  if (status.subsription_type?.toLowerCase() === "full") {
    return true;
  }

  // Check specific limits based on endpoint
  if (endpoint === "/customers/add") {
    // For customer limit, we need to check current count
    try {
      const response = await axiosInstance.get(
        "/customers/get_customer_summary"
      );
      const currentCount = response.data?.total_sellers_count || 0;
      const limit = 5; // Free/Trial limit

      if (currentCount >= limit) {
        Toast.show({
          type: "error",
          text1: "Customer Limit Reached",
          text2: `You can add up to ${limit} customers on your current plan. Upgrade to Premium for unlimited customers.`,
        });
        return false;
      }
    } catch (error) {
      console.error("Error checking customer count:", error);
      return true; // Allow if can't check
    }
  }

  if (endpoint.includes("/transactions/add_")) {
    // For daily transaction limit, we need to check today's count
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await axiosInstance.get(
        `/transactions/total_record_date_range?start_date=${today}&end_date=${today}`
      );
      const todayCount = response.data?.total_entries_count || 0;
      const limit = 3; // Free/Trial limit

      if (todayCount >= limit) {
        Toast.show({
          type: "error",
          text1: "Daily Transaction Limit Reached",
          text2: `You can add up to ${limit} transactions per day on your current plan. Upgrade to Premium for unlimited transactions.`,
        });
        return false;
      }
    } catch (error) {
      console.error("Error checking transaction count:", error);
      return true; // Allow if can't check
    }
  }

  return true;
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check subscription limits for specific endpoints
    if (LIMIT_CHECK_ENDPOINTS.includes(config.url || "")) {
      const canProceed = await canPerformAction(config.url || "");
      if (!canProceed) {
        // Cancel the request
        const error = new Error("Subscription limit reached");
        error.name = "SubscriptionLimitError";
        return Promise.reject(error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle subscription limit errors from backend
    if (
      error.response?.status === 403 &&
      error.response?.data?.detail?.includes("limit reached")
    ) {
      Toast.show({
        type: "error",
        text1: "Limit Reached",
        text2: error.response.data.detail,
      });
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
