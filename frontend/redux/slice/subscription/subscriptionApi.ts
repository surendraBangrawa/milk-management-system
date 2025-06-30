import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { axiosInstance } from "../../../lib/axiosIntance";

export interface Plan {
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

export interface UsageInfo {
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

export interface ReferralInfo {
  referral_code: string;
  referred_by: string | null;
  rewards_earned: number;
  rewards_used: number;
  available_rewards: any[];
  total_available: number;
}

export interface ReferralRequest {
  referral_code: string;
}

export interface PaymentVerificationRequest {
  order_id: string;
  payment_id: string;
  signature: string;
}

export interface RewardUsageRequest {
  reward_id: number;
}

export const subscriptionApi = createApi({
  reducerPath: "subscriptionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Subscription", "Usage", "Referral"],
  endpoints: (builder) => ({
    // Get available plans
    getPlans: builder.query<
      { success: boolean; plans: Plan[]; current_plan: string },
      void
    >({
      query: () => "/subscription/plans",
      providesTags: ["Subscription"],
    }),

    // Get current plan info
    getPlanInfo: builder.query<
      {
        success: boolean;
        current_plan: string;
        plan_info: any;
        usage: any;
        trial_info: any;
        referral_info: any;
      },
      void
    >({
      query: () => "/subscription/plan-info",
      providesTags: ["Subscription"],
    }),

    // Get usage information
    getUsage: builder.query<UsageInfo, void>({
      query: () => "/subscription/usage",
      providesTags: ["Usage"],
    }),

    // Get referral information
    getReferralInfo: builder.query<ReferralInfo, void>({
      query: () => "/subscription/referral-info",
      providesTags: ["Referral"],
    }),

    // Create payment order
    createOrder: builder.mutation<
      {
        success: boolean;
        order_id: string;
        amount: number;
        currency: string;
        receipt: string;
      },
      void
    >({
      query: () => ({
        url: "/subscription/create-order",
        method: "POST",
      }),
      invalidatesTags: ["Subscription"],
    }),

    // Verify payment
    verifyPayment: builder.mutation<
      { success: boolean; message: string; subscription: any },
      PaymentVerificationRequest
    >({
      query: (paymentData) => ({
        url: "/subscription/verify-payment",
        method: "POST",
        body: paymentData,
      }),
      invalidatesTags: ["Subscription", "Usage"],
    }),

    // Apply referral code
    applyReferral: builder.mutation<
      {
        success: boolean;
        message: string;
        referrer_name: string;
        rewards_earned: string;
      },
      ReferralRequest
    >({
      query: (referralData) => ({
        url: "/subscription/apply-referral",
        method: "POST",
        body: referralData,
      }),
      invalidatesTags: ["Referral", "Subscription"],
    }),

    // Use reward
    useReward: builder.mutation<
      { success: boolean; message: string; benefit: string },
      RewardUsageRequest
    >({
      query: (rewardData) => ({
        url: "/subscription/use-reward",
        method: "POST",
        body: rewardData,
      }),
      invalidatesTags: ["Referral", "Subscription"],
    }),

    // Get subscription history
    getHistory: builder.query<
      { subscriptions: any[]; total_subscriptions: number },
      void
    >({
      query: () => "/subscription/history",
      providesTags: ["Subscription"],
    }),

    // Check action limit
    checkLimit: builder.query<
      { allowed: boolean; message: string; action: string },
      string
    >({
      query: (action) => `/subscription/check-limit/${action}`,
      providesTags: ["Usage"],
    }),

    // Setup new user (for signup)
    setupNewUser: builder.mutation<
      {
        success: boolean;
        plan: string;
        trial_end_date: string;
        referral_code: string;
      },
      { user_mobile: string; referred_by?: string }
    >({
      query: (userData) => ({
        url: "/subscription/setup-new-user",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Subscription", "Usage", "Referral"],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetPlansQuery,
  useGetPlanInfoQuery,
  useGetUsageQuery,
  useGetReferralInfoQuery,
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useApplyReferralMutation,
  useUseRewardMutation,
  useGetHistoryQuery,
  useCheckLimitQuery,
  useSetupNewUserMutation,
} = subscriptionApi;

// Export the API for use in store
export default subscriptionApi;
