import axiosInstance from "./axiosIntance";

// Global subscription status cache
let subscriptionStatus: any = null;
let lastStatusCheck = 0;
const STATUS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getSubscriptionStatus = async (forceRefresh = false) => {
  const now = Date.now();

  if (
    !forceRefresh &&
    subscriptionStatus &&
    now - lastStatusCheck < STATUS_CACHE_DURATION
  ) {
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

export const refreshSubscriptionStatus = () => {
  return getSubscriptionStatus(true);
};

export const clearSubscriptionCache = () => {
  subscriptionStatus = null;
  lastStatusCheck = 0;
};

export const isPremiumUser = async () => {
  const status = await getSubscriptionStatus();
  return status?.subsription_type?.toLowerCase() === "full";
};

export const getPlanLimits = async () => {
  const status = await getSubscriptionStatus();
  if (!status) return null;

  // Default limits for Free/Trial
  const defaultLimits = {
    customers: 5,
    suppliers: 5,
    dailyTransactions: 3,
    ratelistUploads: 3, // Can upload ratelist up to 3 times
  };

  // If Premium, return unlimited
  if (status.subsription_type?.toLowerCase() === "full") {
    return {
      customers: null,
      suppliers: null,
      dailyTransactions: null,
      ratelistUploads: null,
    };
  }

  return defaultLimits;
};

export const checkCustomerLimit = async () => {
  try {
    const response = await axiosInstance.get(
      "/transactions/get_customer_summary"
    );
    const currentCount = response.data?.total_sellers_count || 0;
    const limits = await getPlanLimits();

    if (limits?.customers === null) return true; // Unlimited
    return currentCount < (limits?.customers || 5);
  } catch (error) {
    console.error("Error checking customer limit:", error);
    return true; // Allow if can't check
  }
};

export const checkTransactionLimit = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const response = await axiosInstance.get(
      `/transactions/total_record_date_range?start_date=${today}&end_date=${today}`
    );
    const todayCount = response.data?.total_entries_count || 0;
    const limits = await getPlanLimits();

    if (limits?.dailyTransactions === null) return true; // Unlimited
    return todayCount < (limits?.dailyTransactions || 3);
  } catch (error) {
    console.error("Error checking transaction limit:", error);
    return true; // Allow if can't check
  }
};

export const checkRatelistUploadLimit = async () => {
  try {
    const response = await axiosInstance.get("/ratelist/get_list");
    const hasExistingRatelist =
      response.data?.rates && response.data.rates.length > 0;
    const limits = await getPlanLimits();

    if (limits?.ratelistUploads === null) return true; // Unlimited
    return !hasExistingRatelist; // Can upload if no existing ratelist
  } catch (error) {
    console.error("Error checking ratelist upload limit:", error);
    return true; // Allow if can't check
  }
};
