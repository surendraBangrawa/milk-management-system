import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { resetUploadStatus } from "@/redux/slice/ratelist/uploadStatusSlice";
import useTheme from "@/context/theme/useTheme";

const UploadStatusBanner = () => {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const uploadStatus = useSelector((state: RootState) => state.uploadStatus);

  // Auto-dismiss completed status after 5 seconds
  useEffect(() => {
    if (
      uploadStatus.status === "complete" ||
      uploadStatus.status === "failed"
    ) {
      const timer = setTimeout(() => {
        dispatch(resetUploadStatus());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus.status, dispatch]);

  // Don't show banner if not processing or uploading
  if (!uploadStatus.isUploading && !uploadStatus.isProcessing) {
    return null;
  }

  const handleDismiss = () => {
    dispatch(resetUploadStatus());
  };

  const getStatusColor = () => {
    switch (uploadStatus.status) {
      case "uploading":
        return colors.primary;
      case "processing":
        return colors.primary;
      case "failed":
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.status) {
      case "uploading":
        return "📤";
      case "processing":
        return "⚙️";
      case "failed":
        return "❌";
      default:
        return "📤";
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{getStatusIcon()}</Text>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {uploadStatus.status === "uploading"
              ? "Uploading..."
              : uploadStatus.status === "processing"
              ? "Processing Rate List"
              : uploadStatus.status === "complete"
              ? "Upload Complete!"
              : uploadStatus.status === "failed"
              ? "Upload Failed"
              : "Processing Rate List"}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {uploadStatus.message}
          </Text>
        </View>

        {(uploadStatus.status === "processing" ||
          uploadStatus.status === "uploading") && (
          <View style={styles.spinnerContainer}>
            <ActivityIndicator size="small" color={getStatusColor()} />
            <Text style={[styles.spinnerText, { color: colors.textSecondary }]}>
              Please wait...
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {(uploadStatus.status === "complete" ||
          uploadStatus.status === "failed" ||
          uploadStatus.status === "cancelled") && (
          <TouchableOpacity
            style={[styles.dismissButton, { backgroundColor: colors.border }]}
            onPress={handleDismiss}
          >
            <Text
              style={[styles.dismissButtonText, { color: colors.textPrimary }]}
            >
              Dismiss
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
  },
  spinnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  spinnerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dismissButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dismissButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default UploadStatusBanner;
