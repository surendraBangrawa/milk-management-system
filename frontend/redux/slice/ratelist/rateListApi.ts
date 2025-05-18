import axiosInstance from "@/lib/axiosIntance";
export interface Rate {
  fat: number;
  snf: number;
}
export const getRate = async (data: Rate) => {
  try {
    return await axiosInstance.get("/ratelist/get_rate", { params: data });
  } catch (error) {
    throw error;
  }
};
export const getRatelist = async () => {
  try {
    return await axiosInstance.get("/ratelist/get_list");
  } catch (error) {
    throw error;
  }
};
export const saveRatelist = async (data) => {
  try {
    return await axiosInstance.post("/ratelist/store", data);
  } catch (error) {
    throw error;
  }
};
export const deleteRatelist = async () => {
  try {
    return await axiosInstance.delete("/ratelist/delete");
  } catch (error) {
    throw error;
  }
};

export const uploadRatelist = async (data: any) => {
  try {
    return await axiosInstance.post("/ratelist/upload_image", data);
  } catch (error) {
    throw error;
  }
};
