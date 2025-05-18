import axiosInstance from "@/lib/axiosIntance";

export const getBuyerSummaryApi = async () => {
  try {
    return await axiosInstance.get("/transactions/get_buyer_summary");
  } catch (error) {
    throw error;
  }
};

export const getBuyerTransactionApi = async (id: string) => {
  try {
    return await axiosInstance.get("/transactions/get_transactions_buyer", {
      params: { seller_mobile: id },
    });
  } catch (error) {
    throw error;
  }
};
