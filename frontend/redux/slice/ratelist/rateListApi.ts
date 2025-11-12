import axiosInstance from "@/lib/axiosIntance";
import logger from "@/lib/logger";

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
    logger.debug("Getting rate", { fat: data.fat, snf: data.snf });
    return await axiosInstance.get("/ratelist/get_rate", { params: data });
  } catch (error) {
    logger.error("Failed to get rate", error as Error, { fat: data.fat, snf: data.snf });
    throw error;
  }
};

export const getRatelist = async () => {
  try {
    logger.debug("Getting ratelist");
    return await axiosInstance.get("/ratelist/get_list");
  } catch (error) {
    logger.error("Failed to get ratelist", error as Error);
    throw error;
  }
};

export const saveRatelist = async (data: RateListRequest) => {
  try {
    logger.info("Saving ratelist", { ratesCount: data.rates.length });
    return await axiosInstance.post("/ratelist/store", data);
  } catch (error) {
    logger.error("Failed to save ratelist", error as Error);
    throw error;
  }
};

export const deleteRatelist = async () => {
  try {
    logger.info("Deleting ratelist");
    return await axiosInstance.delete("/ratelist/delete");
  } catch (error) {
    logger.error("Failed to delete ratelist", error as Error);
    throw error;
  }
};

export const uploadRatelist = async (data: FormData) => {
  try {
    logger.info("Uploading ratelist image");
    return await axiosInstance.post("/ratelist/upload_image", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    logger.error("Failed to upload ratelist image", error as Error);
    throw error;
  }
};

export const getUploadStatus = async () => {
  try {
    return await axiosInstance.get("/ratelist/upload_status");
  } catch (error) {
    logger.error("Failed to get upload status", error as Error);
    throw error;
  }
};

export const getUploadHistory = async (): Promise<UploadHistoryResponse> => {
  try {
    logger.debug("Getting upload history");
    const response = await axiosInstance.get("/ratelist/upload_history");
    return response.data;
  } catch (error) {
    logger.error("Failed to get upload history", error as Error);
    throw error;
  }
};

export const getTaskStatus = async (taskId: string) => {
  try {
    return await axiosInstance.get(`/ratelist/task_status/${taskId}`);
  } catch (error) {
    logger.error("Failed to get task status", error as Error, { taskId });
    throw error;
  }
};
