import axiosInstance from "@/lib/axiosIntance";

export interface SaveContact {
  name: string;
  mobile: string;
}
export const saveContactApi = async (data: SaveContact) => {
  try {
    return await axiosInstance.post("/customer/add", data);
  } catch (error) {
    throw error;
  }
};
