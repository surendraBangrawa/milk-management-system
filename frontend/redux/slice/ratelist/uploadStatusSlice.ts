import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UploadStatus {
  isUploading: boolean;
  isProcessing: boolean;
  taskId: string | null;
  status:
    | "idle"
    | "uploading"
    | "processing"
    | "complete"
    | "failed"
    | "cancelled";
  progress: number;
  message: string;
  timestamp: number | null;
  error: string | null;
}

const initialState: UploadStatus = {
  isUploading: false,
  isProcessing: false,
  taskId: null,
  status: "idle",
  progress: 0,
  message: "",
  timestamp: null,
  error: null,
};

const uploadStatusSlice = createSlice({
  name: "uploadStatus",
  initialState,
  reducers: {
    startUpload: (state) => {
      console.log("Redux: startUpload action dispatched");
      state.isUploading = true;
      state.status = "uploading";
      state.progress = 0;
      state.message = "Uploading image...";
      state.timestamp = Date.now();
      state.error = null;
    },
    uploadComplete: (state, action: PayloadAction<{ taskId: string }>) => {
      console.log(
        "Redux: uploadComplete action dispatched with taskId:",
        action.payload.taskId
      );
      state.isUploading = false;
      state.isProcessing = true;
      state.taskId = action.payload.taskId;
      state.status = "processing";
      state.progress = 20;
      state.message = "Processing rate list...";
      state.timestamp = Date.now();
      state.error = null;
    },
    updateProgress: (
      state,
      action: PayloadAction<{ progress: number; message: string }>
    ) => {
      state.progress = action.payload.progress;
      state.message = action.payload.message;
    },
    processingComplete: (state) => {
      state.isProcessing = false;
      state.status = "complete";
      state.progress = 100;
      state.message = "Processing complete!";
      state.timestamp = Date.now();
      state.error = null;
    },
    processingFailed: (state, action: PayloadAction<{ error: string }>) => {
      state.isProcessing = false;
      state.status = "failed";
      state.progress = 0;
      state.message = "Processing failed";
      state.error = action.payload.error;
      state.timestamp = Date.now();
    },
    cancelProcessing: (state) => {
      state.isProcessing = false;
      state.status = "cancelled";
      state.progress = 0;
      state.message = "Processing cancelled";
      state.taskId = null;
      state.timestamp = Date.now();
      state.error = null;
    },
    resetUploadStatus: (state) => {
      return initialState;
    },
    loadPersistedStatus: (state, action: PayloadAction<UploadStatus>) => {
      return { ...action.payload };
    },
  },
});

export const {
  startUpload,
  uploadComplete,
  updateProgress,
  processingComplete,
  processingFailed,
  cancelProcessing,
  resetUploadStatus,
  loadPersistedStatus,
} = uploadStatusSlice.actions;

// Thunk for persisting status to AsyncStorage
export const persistUploadStatus =
  (status: UploadStatus) => async (dispatch: any) => {
    try {
      await AsyncStorage.setItem("uploadStatus", JSON.stringify(status));
    } catch (error) {
      console.error("Error persisting upload status:", error);
    }
  };

// Thunk for loading persisted status from AsyncStorage
export const loadPersistedUploadStatus = () => async (dispatch: any) => {
  try {
    const persistedStatus = await AsyncStorage.getItem("uploadStatus");
    if (persistedStatus) {
      const status = JSON.parse(persistedStatus);
      // Only restore if the status is recent (within last 10 minutes)
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      if (status.timestamp && status.timestamp > tenMinutesAgo) {
        dispatch(loadPersistedStatus(status));
      } else {
        // Clear old status
        await AsyncStorage.removeItem("uploadStatus");
        dispatch(resetUploadStatus());
      }
    }
  } catch (error) {
    console.error("Error loading persisted upload status:", error);
  }
};

export default uploadStatusSlice.reducer;
