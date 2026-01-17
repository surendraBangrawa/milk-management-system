import axiosInstance from "@/lib/axiosIntance";
import logger from "@/lib/logger";

export const getSupplierSummaryApi = async () => {
  try {
    logger.debug("Getting supplier summary");
    return await axiosInstance.get("/transactions/get_supplier_summary");
  } catch (error) {
    logger.error("Failed to get supplier summary", error as Error);
    throw error;
  }
};

export const getSupplierTransactionApi = async (id: string) => {
  try {
    logger.debug("Getting supplier transactions", { buyer_mobile: id });
    return await axiosInstance.get("/transactions/get_transactions_supplier", {
      params: { buyer_mobile: id },
    });
  } catch (error) {
    logger.error("Failed to get supplier transactions", error as Error, { buyer_mobile: id });
    throw error;
  }
};
