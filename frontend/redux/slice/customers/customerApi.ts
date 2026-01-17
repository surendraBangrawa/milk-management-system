import axiosInstance from "@/lib/axiosIntance";
import logger from "@/lib/logger";

export interface SaveContact {
  name: string;
  mobile: string;
}
export const saveContactApi = async (data: SaveContact) => {
  try {
    logger.info("Adding customer", { name: data.name, mobile: data.mobile });
    return await axiosInstance.post("/customers/add", data);
  } catch (error) {
    logger.error("Failed to add customer", error as Error, { mobile: data.mobile });
    throw error;
  }
};
