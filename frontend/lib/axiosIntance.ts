import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

console.log("API_BASE_URL:", API_BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

console.log("Axios instance baseURL:", axiosInstance.defaults.baseURL);

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
      console.error("Error checking ratelist upload limit:", error);
      return true; // Allow if can't check
    }
  }

  return true;
};

// Function to handle logout
const handleLogout = async () => {
  try {
    console.log("Starting logout process...");

    // Call the global signOut function if available
    if (globalSignOut) {
      console.log("Calling global signOut function");
      const result = globalSignOut();
      if (result instanceof Promise) {
        await result;
      }
    } else {
      console.log("Global signOut function not available");
    }

    console.log("Logout process completed");
  } catch (error) {
    console.error("Error during logout:", error);
  }
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
  (response) => {
    console.log("Axios success response:", {
      status: response.status,
      url: response.config?.url,
    });
    return response;
  },
  async (error) => {
    console.log("Axios error:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      message: error.message,
    });

    // Check if the error has a structured detail with error codes
    const errorDetail = error.response?.data?.detail;
    console.log("Error detail type:", typeof errorDetail);
    console.log("Error detail:", errorDetail);

    // If error detail is an object with error_code and requires_logout
    if (
      errorDetail &&
      typeof errorDetail === "object" &&
      errorDetail.error_code
    ) {
      console.log("Structured error received:", errorDetail);

      // Only logout if the backend explicitly says it requires logout
      if (errorDetail.requires_logout === true) {
        console.log(
          `Authentication error requiring logout: ${errorDetail.error_code}`
        );
        // Show the error message to user for logout-requiring errors
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorDetail.message || "Something went wrong",
        });
        await handleLogout();
        return Promise.reject(error);
      } else {
        console.log(
          `Authentication error NOT requiring logout: ${errorDetail.error_code} - NOT showing toast`
        );
        // Don't show toast for non-logout errors - let components handle their own messages
        return Promise.reject(error);
      }
    }

    // Fallback for legacy error format (string details)
    if (error.response?.status === 401) {
      const detail = error.response?.data?.detail;
      console.log("401 error with detail:", detail);
      console.log("Detail type:", typeof detail);

      if (typeof detail === "string") {
        // Only logout for specific authentication failures
        if (
          detail.includes("Token has expired") ||
          detail.includes("Invalid token") ||
          detail.includes("User not found or inactive")
        ) {
          console.log("Legacy authentication error requiring logout");
          // Show error message for logout-requiring errors
          Toast.show({
            type: "error",
            text1: "Authentication Error",
            text2: detail || "Please try again",
          });
          await handleLogout();
          return Promise.reject(error);
        } else {
          console.log("Legacy authentication error NOT requiring logout");
          // Don't show toast for non-logout errors - let components handle their own messages
          return Promise.reject(error);
        }
      } else if (typeof detail === "object" && detail !== null) {
        // Handle case where detail is an object but doesn't have error_code
        console.log("401 error with object detail but no error_code:", detail);

        if (detail.requires_logout === true) {
          console.log("Object detail requires logout");
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
      console.log("404 error - letting component handle the message");
      return Promise.reject(error);
    }

    // Handle 500 errors (Internal Server Error)
    if (error.response?.status === 500) {
      const errorDetail = error.response?.data?.detail;
      console.log("500 error detail:", errorDetail);

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
          console.log("500 error with authentication failure, logging out");
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
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Please check your internet connection and try again",
      });
      return Promise.reject(error);
    }

    // Handle any other errors
    const status = error.response?.status;
    const message =
      error.response?.data?.detail || error.message || "Something went wrong";

    // Don't show generic toast for other errors - let components handle their own messages
    console.log(
      `Error ${status || ""}: ${message} - letting component handle the message`
    );

    return Promise.reject(error);
  }
);

// Test function to manually trigger logout (for debugging)
export const testLogout = () => {
  console.log("Testing logout functionality...");
  handleLogout();
};

// Test function to check if global signOut is set
export const checkGlobalSignOut = () => {
  console.log("Global signOut function available:", !!globalSignOut);
  console.log("Global signOut function type:", typeof globalSignOut);
  return !!globalSignOut;
};

// Test function to simulate the backend error
export const testBackendError = async () => {
  console.log("Testing backend error simulation...");

  // Simulate the exact error structure from the backend
  const mockError = {
    response: {
      status: 401,
      data: {
        detail: {
          message: "User not found or inactive",
          error_code: "USER_NOT_FOUND_OR_INACTIVE",
          requires_logout: true,
        },
      },
    },
  };

  console.log("Mock error:", mockError);
  console.log("Testing error handling...");

  // Test the error handling logic directly
  const errorDetail = mockError.response?.data?.detail;
  console.log("Error detail:", errorDetail);

  if (
    errorDetail &&
    typeof errorDetail === "object" &&
    errorDetail.error_code
  ) {
    console.log("Structured error detected");
    if (errorDetail.requires_logout === true) {
      console.log("Logout required, calling handleLogout");
      await handleLogout();
    }
  }

  console.log("Test completed");
};

export default axiosInstance;
