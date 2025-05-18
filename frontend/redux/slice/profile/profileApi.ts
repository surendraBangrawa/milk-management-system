import axiosInstance from "@/lib/axiosIntance";

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
    return await axiosInstance.get("/profile/get");
  } catch (error) {
    throw error;
  }
};

export const deleteProfileApi = async () => {
  try {
    return await axiosInstance.delete(`/profile/delete`);
  } catch (error) {
    throw error;
  }
};

export const editProfileApi = async (data: EditProfile) => {
  try {
    return await axiosInstance.put(`/profile/edit`, data);
  } catch (error) {
    throw error;
  }
};
