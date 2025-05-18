import axiosInstance from "@/lib/axiosIntance";

export const getSupplierSummaryApi = async () => {
  try {
    return await axiosInstance.get("/transactions/get_supplier_summary");
  } catch (error) {
    throw error;
  }
};

export const getSupplierTransactionApi = async (id: string) => {
  try {
    return await axiosInstance.get("/transactions/get_transactions_supplier", {
      params: { buyer_mobile: id },
    });
  } catch (error) {
    throw error;
  }
};
