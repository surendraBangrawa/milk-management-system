import axiosInstance from "@/lib/axiosIntance";
export interface AddSellerTransaction {
  seller_mobile: string;
  amount: number;
  expense_detail: string;
  transaction_type: "GAVE" | "GOT";
  custom_date: string;
}
export interface DeleteSellerTransaction {
  record_id: string;
  record_type: string;
  seller_mobile: string;
}

export interface EditSellerTransaction {
  seller_mobile: string;
  amount: number;
  expense_detail: string;
  transaction_type: "GAVE" | "GOT";
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
  seller_mobile: string;
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
