import axiosInstance from "@/lib/axiosIntance";

export const getBuyerSummaryApi = async () => {
  try {
    return await axiosInstance.get("/get_buyer_summary");
  } catch (error) {
    throw error;
  }
};
