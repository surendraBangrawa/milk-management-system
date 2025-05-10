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
  type: string;
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

export const getSellerSummaryApi = async () => {
  try {
    return await axiosInstance.get("/get_seller_summary");
  } catch (error) {
    throw error;
  }
};

export const getSellerTransactionApi = async (data: string) => {
  try {
    return await axiosInstance.get("/get_transactions", {
      params: { seller_mobile: data },
    });
  } catch (error) {
    throw error;
  }
};

export const addSellerTransactionApi = async (data: AddSellerTransaction) => {
  try {
    return await axiosInstance.post(`/add_expense`, data);
  } catch (error) {
    throw error;
  }
};

export const deleteSellerTransactionApi = async (
  data: DeleteSellerTransaction
) => {
  try {
    return await axiosInstance.delete(`/delete_transaction`, { params: data });
  } catch (error) {
    throw error;
  }
};

export const editSellerTransactionApi = async (data: EditSellerTransaction) => {
  try {
    return await axiosInstance.put(
      `/edit_transaction?record_id=${data.id}&record_type=${data.type}&seller_mobile=${data.seller_mobile}`,
      data
    );
  } catch (error) {
    throw error;
  }
};

export const addSellerMilkTransactionApi = async (
  data: AddSellerMilkTransaction
) => {
  try {
    return await axiosInstance.post(`/add_milk_record`, data);
  } catch (error) {
    throw error;
  }
};
