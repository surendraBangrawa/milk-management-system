import { store } from "@/redux/store";
import {
  updateProgress,
  processingComplete,
  processingFailed,
  persistUploadStatus,
} from "@/redux/slice/ratelist/uploadStatusSlice";
import { getTaskStatus } from "@/redux/slice/ratelist/rateListApi";
import Toast from "react-native-toast-message";

class UploadStatusService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private isPolling = false;

  startPolling(taskId: string) {
    if (this.isPolling) {
      this.stopPolling();
    }

    this.isPolling = true;
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await getTaskStatus(taskId);
        const taskState = response.data.state;
        const taskInfo = response.data;

        const currentState = store.getState().uploadStatus;

        switch (taskState) {
          case "PENDING":
            store.dispatch(
              updateProgress({
                progress: 5,
                message: "Task is pending...",
              })
            );
            break;

          case "STARTED":
            store.dispatch(
              updateProgress({
                progress: 15,
                message: taskInfo.status || "Processing image...",
              })
            );
            break;

          case "PROGRESS":
            // Use the actual progress from the backend if available, otherwise estimate
            let progress = 30; // Default starting progress
            if (taskInfo.progress !== undefined) {
              progress = Math.max(30, Math.min(95, taskInfo.progress));
            } else {
              // Estimate progress based on time elapsed
              const currentTime = Date.now();
              const startTime = currentState.timestamp || currentTime;
              const elapsed = currentTime - startTime;
              const estimatedProgress = Math.min(
                95,
                30 + (elapsed / 15000) * 65
              ); // Assume 15 seconds for processing
              progress = Math.round(estimatedProgress);
            }

            store.dispatch(
              updateProgress({
                progress,
                message: taskInfo.status || "Processing rate list...",
              })
            );
            break;

          case "SUCCESS":
            this.stopPolling();
            store.dispatch(processingComplete());

            // Show success toast
            Toast.show({
              type: "success",
              text1: "Upload Complete!",
              text2: "Your rate list has been processed successfully.",
            });

            // Persist the final status
            const finalStatus = {
              ...store.getState().uploadStatus,
              status: "complete" as const,
              progress: 100,
              message: "Processing complete!",
            };
            store.dispatch(persistUploadStatus(finalStatus));
            break;

          case "FAILURE":
            this.stopPolling();
            const errorMessage = taskInfo.error || "Processing failed";
            store.dispatch(processingFailed({ error: errorMessage }));

            // Show error toast
            Toast.show({
              type: "error",
              text1: "Upload Failed",
              text2: errorMessage,
            });

            // Persist the failed status
            const failedStatus = {
              ...store.getState().uploadStatus,
              status: "failed" as const,
              error: errorMessage,
            };
            store.dispatch(persistUploadStatus(failedStatus));
            break;

          default:
            console.log("Unknown task state:", taskState);
        }
      } catch (error) {
        console.error("Error polling task status:", error);
        // Don't stop polling on network errors, just log them
      }
    }, 500); // Poll every 0.5 seconds
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }

  isCurrentlyPolling() {
    return this.isPolling;
  }
}

export const uploadStatusService = new UploadStatusService();
