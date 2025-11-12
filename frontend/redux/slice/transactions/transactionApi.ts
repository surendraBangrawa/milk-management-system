import axiosInstance from "@/lib/axiosIntance";
import logger from "@/lib/logger";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

export interface AddSellerTransaction {
  seller_mobile: string;
  amount: number;
  expense_detail: string;
  transaction_type: string | undefined;
  custom_date: string;
}
export interface DeleteSellerTransaction {
  record_id: string | number;
  record_type: string;
  seller_mobile: string;
}

export interface EditSellerTransaction {
  seller_mobile: string | undefined;
  amount?: number;
  expense_detail?: string;
  transaction_type?: string | undefined;
  custom_date: string;
  id: string;
  type?: string;
  quantity?: number;
  fat?: number;
  snf?: number;
  milk_detail?: string;
  shift?: string;
  rate?: number;
}
export interface AddSellerMilkTransaction {
  quantity: number;
  fat: number;
  snf: number;
  milk_detail: string;
  custom_date: string;
  shift: string;
  rate: number;
  seller_mobile: string | undefined;
}

export const getCustomerSummaryApi = async () => {
  try {
    logger.debug("Getting customer summary");
    return await axiosInstance.get("/transactions/get_customer_summary");
  } catch (error) {
    logger.error("Failed to get customer summary", error as Error);
    throw error;
  }
};

export const getCustomerTransactionApi = async (data: string) => {
  try {
    logger.debug("Getting customer transactions", { seller_mobile: data });
    return await axiosInstance.get("/transactions/get_transactions_customer", {
      params: { seller_mobile: data },
    });
  } catch (error) {
    logger.error("Failed to get customer transactions", error as Error, { seller_mobile: data });
    throw error;
  }
};

export const addCustomerTransactionApi = async (data: AddSellerTransaction) => {
  try {
    logger.info("Adding customer transaction", { seller_mobile: data.seller_mobile, amount: data.amount });
    return await axiosInstance.post(`/transactions/add_expense`, data);
  } catch (error) {
    logger.error("Failed to add customer transaction", error as Error, { seller_mobile: data.seller_mobile });
    throw error;
  }
};

export const deleteCustomerTransactionApi = async (
  data: DeleteSellerTransaction
) => {
  try {
    logger.info("Deleting customer transaction", { record_id: data.record_id, record_type: data.record_type });
    return await axiosInstance.delete(`/transactions/delete_transaction`, {
      params: data,
    });
  } catch (error) {
    logger.error("Failed to delete customer transaction", error as Error, { record_id: data.record_id });
    throw error;
  }
};

export const editCustomerTransactionApi = async (
  data: EditSellerTransaction
) => {
  try {
    logger.info("Editing customer transaction", { record_id: data.id, record_type: data.type });
    return await axiosInstance.put(
      `/transactions/edit_transaction?record_id=${data.id}&record_type=${data.type}&seller_mobile=${data.seller_mobile}`,
      data
    );
  } catch (error) {
    logger.error("Failed to edit customer transaction", error as Error, { record_id: data.id });
    throw error;
  }
};

export const addCustomerMilkTransactionApi = async (
  data: AddSellerMilkTransaction
) => {
  try {
    logger.info("Adding milk transaction", { seller_mobile: data.seller_mobile, quantity: data.quantity });
    return await axiosInstance.post(`/transactions/add_milk_record`, data);
  } catch (error) {
    logger.error("Failed to add milk transaction", error as Error, { seller_mobile: data.seller_mobile });
    throw error;
  }
};

export const getMilkReportTransactionApi = async ({
  sellerId,
  startDate,
  endDate,
}: {
  sellerId: string;
  startDate: string;
  endDate: string;
}) => {
  try {
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) {
      throw new Error("Authentication token not found.");
    }
    const url = new URL(`${API_BASE_URL}/transactions/generate_milk_report`);
    url.searchParams.append("seller_mobile", sellerId);
    url.searchParams.append("start_date", startDate);
    url.searchParams.append("end_date", endDate);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorDetail = "Unknown error";
      try {
        const errorBody = await response.text();
        try {
          const jsonError = JSON.parse(errorBody);
          errorDetail = jsonError.detail || JSON.stringify(jsonError);
        } catch (e) {
          errorDetail = errorBody;
        }
      } catch (e) {}
      throw new Error(`API Error ${response.status}: ${errorDetail}`);
    }

    return await response.blob();
  } catch (error) {
    logger.error("Failed to generate milk report", error as Error, { sellerId, startDate, endDate });
    throw error;
  }
};

export const getTotalRecordDateRangeApi = async ({
  start_date,
  end_date,
}: {
  start_date: string;
  end_date: string;
}) => {
  try {
    logger.debug("Getting total records for date range", { start_date, end_date });
    return await axiosInstance.get("/transactions/total_record_date_range", {
      params: { start_date, end_date },
    });
  } catch (error) {
    logger.error("Failed to get total records", error as Error, { start_date, end_date });
    throw error;
  }
};
