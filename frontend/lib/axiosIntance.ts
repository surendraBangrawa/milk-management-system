import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import logger from "./logger";

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Track subscription status
let subscriptionStatus: any = null;
let lastStatusCheck = 0;
const STATUS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global logout function that can be called from anywhere
let globalSignOut: (() => void | Promise<void>) | null = null;

export const setGlobalSignOut = (signOut: () => void | Promise<void>) => {
  globalSignOut = signOut;
};

// API endpoints that should check subscription limits
const LIMIT_CHECK_ENDPOINTS = [
  "/customers/add",
  "/transactions/add_milk_record",
  "/transactions/add_expense",
  "/ratelist/store",
  "/ratelist/upload_image",
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
    logger.error("Error fetching subscription status", error as Error);
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
        "/transactions/get_customer_summary"
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
      logger.error("Error checking customer count", error as Error);
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
      logger.error("Error checking transaction count", error as Error);
      return true; // Allow if can't check
    }
  }

  if (endpoint.includes("/ratelist/")) {
    // For ratelist upload limit, we need to check if user already has a ratelist
    try {
      const response = await axiosInstance.get("/ratelist/get_list");
      const hasExistingRatelist =
        response.data?.rates && response.data.rates.length > 0;

      if (hasExistingRatelist) {
        Toast.show({
          type: "error",
          text1: "Rate List Upload Limit Reached",
          text2:
            "You can upload up to 3 rate lists on your current plan. Upgrade to Premium for unlimited rate list uploads.",
        });
        return false;
      }
    } catch (error) {
      logger.error("Error checking ratelist upload limit", error as Error);
      return true; // Allow if can't check
    }
  }

  return true;
};

// Function to handle logout
const handleLogout = async () => {
  try {
    // Call the global signOut function if available
    if (globalSignOut) {
      const result = globalSignOut();
      if (result instanceof Promise) {
        await result;
      }
    }
  } catch (error) {
    logger.error("Error during logout", error as Error);
  }
};

axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // mark start time for duration
    (config as any).metadata = { startTime: Date.now() };

    const { method, url, params, data } = config;
    const redactedHeaders: Record<string, unknown> | undefined = config.headers
      ? { ...(config.headers as Record<string, unknown>) }
      : undefined;
    if (redactedHeaders && "Authorization" in redactedHeaders) {
      (redactedHeaders as Record<string, unknown>).Authorization = "***";
    }

    // Log to central logger (Grafana)
    logger.debug(`API Request: ${method?.toUpperCase()} ${url}`, {
      params,
      data,
      headers: redactedHeaders,
    });

    // Add language header
    try {
      const userLanguage = await AsyncStorage.getItem("user-language");
      if (userLanguage) {
        config.headers["Accept-Language"] = userLanguage;
      }
    } catch (error) {
      logger.error("Error getting user language", error as Error);
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
  (response) => {
    // Dev logging for every response
    const { config, status, statusText } = response;
    const start = (config as any)?.metadata?.startTime ?? Date.now();
    const durationMs = Date.now() - start;
    // Log to central logger (Grafana)
    logger.debug(
      `API Response: ${config.method?.toUpperCase()} ${config.url}`,
      {
        status,
        statusText,
        duration: `${durationMs}ms`,
      }
    );

    return response;
  },
  async (error) => {
    // Log error to central logger (Grafana)
    logger.error(
      `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      error,
      {
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
      }
    );

    // Check if the error has a structured detail with error codes
    const errorDetail = error.response?.data?.detail;

    // If error detail is an object with error_code and requires_logout
    if (
      errorDetail &&
      typeof errorDetail === "object" &&
      errorDetail.error_code
    ) {
      // Only logout if the backend explicitly says it requires logout
      if (errorDetail.requires_logout === true) {
        // Show the error message to user for logout-requiring errors
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorDetail.message || "Something went wrong",
        });
        await handleLogout();
        return Promise.reject(error);
      } else {
        // Don't show toast for non-logout errors - let components handle their own messages
        return Promise.reject(error);
      }
    }

    // Fallback for legacy error format (string details)
    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail;

      if (typeof detail === "string") {
        // Only logout for specific authentication failures
        if (
          detail.includes("Token has expired") ||
          detail.includes("Invalid token") ||
          detail.includes("User not found or inactive")
        ) {
          // Show error message for logout-requiring errors
          Toast.show({
            type: "error",
            text1: "Authentication Error",
            text2: detail || "Please try again",
          });
          await handleLogout();
          return Promise.reject(error);
        } else {
          // Don't show toast for non-logout errors - let components handle their own messages
          return Promise.reject(error);
        }
      } else if (typeof detail === "object" && detail !== null) {
        // Handle case where detail is an object but doesn't have error_code

        if (detail.requires_logout === true) {
          // Show error message for logout-requiring errors
          Toast.show({
            type: "error",
            text1: "Authentication Error",
            text2: detail.message || "Please try again",
          });
          await handleLogout();
          return Promise.reject(error);
        } else {
          // Don't show toast for non-logout errors - let components handle their own messages
          return Promise.reject(error);
        }
      }
    }

    // Handle 403 errors (Forbidden)
    if (error.response?.status === 403) {
      const detail = error.response?.data?.detail;
      if (typeof detail === "string" && detail.includes("limit reached")) {
        Toast.show({
          type: "error",
          text1: "Limit Reached",
          text2: detail,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Access Denied",
          text2:
            typeof detail === "string"
              ? detail
              : "You don't have permission to perform this action",
        });
      }
      return Promise.reject(error);
    }

    // Handle 404 errors (Not Found)
    if (error.response?.status === 404) {
      // Don't show generic toast for 404 errors - let components handle their own messages
      return Promise.reject(error);
    }

    // Handle 500 errors (Internal Server Error)
    if (error.response?.status === 500) {
      const errorDetail = error.response?.data?.detail;

      // Check if it's a structured error with authentication info
      if (
        errorDetail &&
        typeof errorDetail === "object" &&
        errorDetail.error_code
      ) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorDetail.message || "Something went wrong",
        });

        if (errorDetail.requires_logout === true) {
          await handleLogout();
          return Promise.reject(error);
        }
      } else {
        // Generic 500 error
        Toast.show({
          type: "error",
          text1: "Server Error",
          text2: "Something went wrong on our end. Please try again later",
        });
      }
      return Promise.reject(error);
    }

    // Handle network errors
    if (!error.response) {
      // Enhanced logging for network errors
      const fullUrl = error.config?.baseURL 
        ? `${error.config.baseURL}${error.config.url || ""}` 
        : error.config?.url || "unknown";
      
      logger.error(
        `Network Error: ${error.config?.method?.toUpperCase()} ${fullUrl}`,
        error,
        {
          errorType: "NETWORK_ERROR",
          message: error.message,
          code: error.code,
          baseURL: API_BASE_URL,
          fullUrl: fullUrl,
          suggestion: "Check if API_BASE_URL is correct and server is accessible",
        }
      );
      
      console.error("🌐 Network Error Details:", {
        API_BASE_URL: API_BASE_URL,
        fullUrl: fullUrl,
        errorMessage: error.message,
        errorCode: error.code,
        config: {
          method: error.config?.method,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
        },
      });
      
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: `Cannot reach server. API: ${API_BASE_URL || "NOT SET"}`,
      });
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
