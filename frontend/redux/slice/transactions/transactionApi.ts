import axiosInstance from "@/lib/axiosIntance";
const { API_BASE_URL } = Constants.expoConfig?.extra || {};
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

export interface AddSellerTransaction {
  seller_mobile: string;
  amount: number;
  expense_detail: string;
  transaction_type: "GAVE" | "GOT";
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
  transaction_type?: "GAVE" | "GOT";
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
    return await axiosInstance.get("/transactions/get_customer_summary");
  } catch (error) {
    throw error;
  }
};

export const getCustomerTransactionApi = async (data: string) => {
  try {
    return await axiosInstance.get("/transactions/get_transactions_customer", {
      params: { seller_mobile: data },
    });
  } catch (error) {
    throw error;
  }
};

export const addCustomerTransactionApi = async (data: AddSellerTransaction) => {
  try {
    return await axiosInstance.post(`/transactions/add_expense`, data);
  } catch (error) {
    throw error;
  }
};

export const deleteCustomerTransactionApi = async (
  data: DeleteSellerTransaction
) => {
  try {
    return await axiosInstance.delete(`/transactions/delete_transaction`, {
      params: data,
    });
  } catch (error) {
    throw error;
  }
};

export const editCustomerTransactionApi = async (
  data: EditSellerTransaction
) => {
  try {
    return await axiosInstance.put(
      `/transactions/edit_transaction?record_id=${data.id}&record_type=${data.type}&seller_mobile=${data.seller_mobile}`,
      data
    );
  } catch (error) {
    throw error;
  }
};

export const addCustomerMilkTransactionApi = async (
  data: AddSellerMilkTransaction
) => {
  try {
    return await axiosInstance.post(`/transactions/add_milk_record`, data);
  } catch (error) {
    throw error;
  }
};

export const getMilkReportTransactionApi = async ({
  sellerId,
  startDate,
  endDate,
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
    throw error;
  }
};
