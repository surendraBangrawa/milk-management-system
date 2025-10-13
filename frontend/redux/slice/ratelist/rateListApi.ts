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

export interface UploadHistoryItem {
  id: number;
  filename: string | null;
  file_size: number | null;
  status: string;
  error_message: string | null;
  entries_processed: number | null;
  processing_time_seconds: number | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface UploadHistoryResponse {
  upload_history: UploadHistoryItem[];
  total_uploads: number;
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

export const getUploadHistory = async (): Promise<UploadHistoryResponse> => {
  try {
    const response = await axiosInstance.get("/ratelist/upload_history");
    return response.data;
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
