import axiosInstance from "@/lib/axiosIntance";
export interface Rate {
  fat: number;
  snf: number;
}
export const getRate = async (data: Rate) => {
  try {
    return await axiosInstance.get("/fetch_rate", { params: data });
  } catch (error) {
    throw error;
  }
};
export const getRatelist = async () => {
  try {
    return await axiosInstance.get("/fetch_rate_list");
  } catch (error) {
    throw error;
  }
};
export const saveRatelist = async (data) => {
  try {
    return await axiosInstance.post("/store_rate_list", data);
  } catch (error) {
    throw error;
  }
};
export const deleteRatelist = async () => {
  try {
    return await axiosInstance.delete("/delete_rate_list");
  } catch (error) {
    throw error;
  }
};
