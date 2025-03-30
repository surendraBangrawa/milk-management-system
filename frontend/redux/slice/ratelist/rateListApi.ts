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
