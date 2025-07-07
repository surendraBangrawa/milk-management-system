import axiosInstance from "@/lib/axiosIntance";

export interface Rate {
  fat: number;
  snf: number;
}

export interface RateData {
  fat: number;
  snf: number;
  rate: number;
}

export interface RateListRequest {
  min_fat: number;
  max_fat: number;
  min_snf: number;
  max_snf: number;
  rates: RateData[];
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

export const saveRatelist = async (data: RateListRequest) => {
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

export const uploadRatelist = async (data: FormData) => {
  try {
    return await axiosInstance.post("/ratelist/upload_image", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getUploadStatus = async () => {
  try {
    return await axiosInstance.get("/ratelist/upload_status");
  } catch (error) {
    throw error;
  }
};

export const getTaskStatus = async (taskId: string) => {
  try {
    return await axiosInstance.get(`/ratelist/task_status/${taskId}`);
  } catch (error) {
    throw error;
  }
};
