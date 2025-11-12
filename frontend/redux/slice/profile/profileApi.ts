import axiosInstance from "@/lib/axiosIntance";
import logger from "@/lib/logger";

export interface DeleteSellerTransaction {
  record_id: string;
  record_type: string;
  seller_mobile: string;
}

export interface EditProfile {
  seller_mobile: string;
  new_name: string;
}

export const getProfileApi = async () => {
  try {
    logger.debug("Getting profile");
    return await axiosInstance.get("/profile/get");
  } catch (error) {
    logger.error("Failed to get profile", error as Error);
    throw error;
  }
};

export const deleteProfileApi = async () => {
  try {
    logger.warning("Deleting profile");
    return await axiosInstance.delete(`/profile/delete`);
  } catch (error) {
    logger.error("Failed to delete profile", error as Error);
    throw error;
  }
};

export const editProfileApi = async (data: EditProfile) => {
  try {
    logger.info("Editing profile", { seller_mobile: data.seller_mobile });
    return await axiosInstance.put(`/profile/edit`, data);
  } catch (error) {
    logger.error("Failed to edit profile", error as Error, { seller_mobile: data.seller_mobile });
    throw error;
  }
};
