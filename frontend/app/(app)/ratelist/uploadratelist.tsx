import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import useTheme from "@/context/theme/useTheme";
import Constants from "expo-constants";
import Toast from "react-native-toast-message";

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

const UPLOAD_RATE_LIST_ENDPOINT = "/ratelist/upload_image";
const UPLOAD_STATUS_ENDPOINT = "/ratelist/upload_status";
const PERMISSION_DENIED_MESSAGE =
  "Sorry, we need camera roll permissions to make this work! Please enable them in your device settings.";
const NO_PHOTO_SELECTED_MESSAGE =
  "Please select a photo of the rate list to upload.";
const UPLOAD_SUCCESS_MESSAGE = "Rate list photo uploaded successfully!";
const UPLOAD_FAILED_MESSAGE = "An error occurred during upload.";

// --- Helper to get file type from URI ---
const getFileType = (uri: string): string => {
  const fileExtension = uri.split(".").pop()?.toLowerCase();
  switch (fileExtension) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "heic":
      return "image/heic";
    default:
      return "image/jpeg"; // Default to jpeg
  }
};

const UploadRateListScreen = () => {
  const router = useRouter();
  // Access the theme colors
  const { colors } = useTheme();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [permissionStatus, requestPermission] =
    ImagePicker.useMediaLibraryPermissions();

  // Polling refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollCountRef = useRef(0);
  const maxPollCount = 60; // Maximum 5 minutes (60 * 5 seconds)

  // Track if component is mounted and app state
  const isMountedRef = useRef(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Check for pending upload notifications on mount
  useEffect(() => {
    checkPendingUploadNotifications();
  }, []);

  // Function to check for pending upload notifications
  const checkPendingUploadNotifications = async () => {
    try {
      const pendingUpload = await AsyncStorage.getItem(
        "pendingUploadNotification"
      );
      if (pendingUpload) {
        const { status, message, timestamp } = JSON.parse(pendingUpload);
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

        // Only show notification if it's recent (within 5 minutes)
        if (timestamp > fiveMinutesAgo) {
          if (status === "complete") {
            Toast.show({
              type: "success",
              text1: "Upload Complete",
              text2:
                "Your rate list has been processed and uploaded successfully!",
            });
          } else if (status === "failed") {
            Toast.show({
              type: "error",
              text1: "Upload Failed",
              text2:
                "Failed to process your rate list. Please try uploading a clearer image.",
            });
          }
        }

        // Clear the pending notification
        await AsyncStorage.removeItem("pendingUploadNotification");
      }
    } catch (error) {
      console.error("Error checking pending upload notifications:", error);
    }
  };

  // Function to save upload notification for later
  const saveUploadNotification = async (
    status: "complete" | "failed",
    message: string
  ) => {
    try {
      const notification = {
        status,
        message,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        "pendingUploadNotification",
        JSON.stringify(notification)
      );
    } catch (error) {
      console.error("Error saving upload notification:", error);
    }
  };

  // Cleanup polling on unmount and handle app state changes
  useEffect(() => {
    // Track component mount state
    isMountedRef.current = true;

    // Handle app state changes (foreground/background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App came to foreground, check for pending notifications
        checkPendingUploadNotifications();

        // Resume polling if needed
        if (processing && isMountedRef.current) {
          console.log("App resumed, continuing polling");
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background, pause polling
        console.log("App going to background, pausing polling");
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      // Cleanup on unmount
      isMountedRef.current = false;
      subscription?.remove();

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [processing]);

  // Function to check upload status
  const checkUploadStatus = async (): Promise<{
    status: string;
    message: string;
  }> => {
    // Check if component is still mounted
    if (!isMountedRef.current) {
      throw new Error("Component unmounted");
    }

    let token = null;
    try {
      token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        throw new Error("Authentication token not found");
      }
    } catch (error) {
      throw new Error("Could not retrieve authentication token");
    }

    const statusUrl = `${API_BASE_URL}${UPLOAD_STATUS_ENDPOINT}`;
    const response = await fetch(statusUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Status check failed with status ${response.status}`);
    }

    const data = await response.json();
    return { status: data.status, message: "" };
  };

  // Function to start polling
  const startPolling = () => {
    if (!isMountedRef.current) return;

    setProcessing(true);
    setProcessingMessage("Processing your upload...");
    pollCountRef.current = 0;

    const pollStatus = async () => {
      // Check if component is still mounted before proceeding
      if (!isMountedRef.current) {
        return;
      }

      try {
        pollCountRef.current++;

        if (pollCountRef.current > maxPollCount) {
          // Stop polling after max attempts
          if (isMountedRef.current) {
            setProcessing(false);
            setProcessingMessage("");
            Alert.alert(
              "Processing Timeout",
              "The upload is taking longer than expected. Please check back later or try uploading again."
            );
          }
          return;
        }

        const { status } = await checkUploadStatus();

        // Check if component is still mounted before updating state
        if (!isMountedRef.current) return;

        if (status === "complete") {
          // Success
          setProcessing(false);
          setProcessingMessage("");

          // Save notification for later (in case user navigated away)
          await saveUploadNotification(
            "complete",
            "Rate list processed and uploaded successfully!"
          );

          // Only show toast and navigate if component is still mounted
          if (isMountedRef.current) {
            Toast.show({
              type: "success",
              text1: "Success",
              text2: "Rate list processed and uploaded successfully!",
            });
            setSelectedImageUri(null);
            router.back();
          }
        } else if (status === "failed") {
          // Failed
          if (isMountedRef.current) {
            setProcessing(false);
            setProcessingMessage("");

            // Save notification for later
            await saveUploadNotification(
              "failed",
              "Failed to process the uploaded image. Please try uploading a clearer image."
            );

            Alert.alert(
              "Processing Failed",
              "Failed to process the uploaded image. Please try uploading a clearer image."
            );
          }
        } else if (status === "processing") {
          // Still processing, continue polling
          if (isMountedRef.current) {
            setProcessingMessage(
              `Processing your upload... (${pollCountRef.current * 5}s)`
            );
          }
        }
      } catch (error: any) {
        console.error("Status check error:", error);
        // Continue polling on error, but log it
        // Only if component is still mounted
        if (!isMountedRef.current) return;
      }
    };

    // Poll every 5 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 5000);

    // Initial check
    pollStatus();
  };

  // Function to stop polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (isMountedRef.current) {
      setProcessing(false);
      setProcessingMessage("");
    }
  };

  const requestMediaLibraryPermission = useCallback(async () => {
    if (permissionStatus?.status === "granted") {
      return true;
    }
    if (permissionStatus?.canAskAgain) {
      const response = await requestPermission();
      if (response.granted) {
        return true;
      } else {
        Alert.alert("Permission Denied", PERMISSION_DENIED_MESSAGE);
        return false;
      }
    } else {
      // Permission permanently denied
      Alert.alert("Permission Required", PERMISSION_DENIED_MESSAGE);
      // Optionally guide user to settings - requires linking
      Linking.openSettings();
      return false;
    }
  }, [
    permissionStatus?.status,
    permissionStatus?.canAskAgain,
    requestPermission,
  ]);

  // Function to pick an image from the device's library
  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false, // Assuming only one image is allowed
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];

        setSelectedImageUri(selectedAsset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  // Function to handle the upload process using Fetch API
  const handleUpload = async () => {
    if (!selectedImageUri) {
      Alert.alert("No Photo Selected", NO_PHOTO_SELECTED_MESSAGE);
      return;
    }

    setUploading(true);

    const formData = new FormData();

    // Append the photo file
    const fileUri = selectedImageUri;
    const fileName = fileUri.split("/").pop() || `upload_${Date.now()}.jpg`;
    const fileType = getFileType(fileUri);

    const uri =
      Platform.OS === "ios" ? fileUri.replace("file://", "") : fileUri;

    formData.append("file", {
      uri: uri,
      name: fileName,
      type: fileType,
    } as any);

    const uploadUrl = `${API_BASE_URL}${UPLOAD_RATE_LIST_ENDPOINT}`;
    let token = null;
    try {
      token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please log in again."
        );
        setUploading(false);
        return;
      }
    } catch (error) {
      console.error("Error retrieving token:", error);
      Alert.alert(
        "Authentication Error",
        "Could not retrieve authentication token."
      );
      setUploading(false);
      return;
    }

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorDetail = "Unknown server error.";
        try {
          const errorBody = await response.json();
          errorDetail =
            errorBody.message || errorBody.error || JSON.stringify(errorBody);
        } catch (e) {
          errorDetail = await response.text();
        }
        throw new Error(
          `Upload failed with status ${response.status}: ${errorDetail}`
        );
      }

      // Upload successful, start polling for processing status
      setUploading(false);
      startPolling();
    } catch (error: any) {
      console.error("Upload Error:", error);
      Alert.alert(
        "Upload Failed",
        `${UPLOAD_FAILED_MESSAGE}\n${error.message || error}`
      );
      setUploading(false);
    }
  };

  // Function to remove selected image
  const clearSelectedImage = () => {
    setSelectedImageUri(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Upload Ratelist",
          headerStyle: {
            backgroundColor: colors.surface, // Use surface color for header background
          },
          headerTintColor: colors.textPrimary, // Use primary text color for title and icons
          headerTitleStyle: {
            color: colors.textPrimary, // Ensure title color is also themed
          },
        }}
      />

      {/* Processing Status Display */}
      {processing && (
        <View
          style={[
            styles.processingContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.processingText, { color: colors.textPrimary }]}>
            {processingMessage}
          </Text>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.error }]}
            onPress={stopPolling}
          >
            <Text style={[styles.cancelButtonText, { color: colors.surface }]}>
              Cancel Processing
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!selectedImageUri && !processing && (
        <TouchableOpacity
          style={[
            styles.selectPhotoButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={pickImage}
          disabled={uploading || processing}
        >
          <Text
            style={[styles.selectPhotoButtonText, { color: colors.surface }]}
          >
            Select Rate List Photo
          </Text>
        </TouchableOpacity>
      )}

      {selectedImageUri && !processing && (
        <View
          style={[
            styles.imagePreviewContainer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.imagePreview}
          />
          <Text style={[styles.imageUriText, { color: colors.textSecondary }]}>
            Selected: {selectedImageUri.split("/").pop()}
          </Text>
          <TouchableOpacity
            onPress={clearSelectedImage}
            style={[
              styles.removeImageButton,
              {
                backgroundColor: uploading ? colors.border : colors.error,
                opacity: uploading ? 0.5 : 1,
              },
            ]}
            disabled={uploading}
          >
            <Text
              style={[styles.removeImageButtonText, { color: colors.surface }]}
            >
              Remove Photo
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!processing && (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            {
              backgroundColor:
                uploading || !selectedImageUri ? colors.border : colors.success,
            },
          ]}
          onPress={handleUpload}
          disabled={uploading || !selectedImageUri}
        >
          {uploading ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.uploadButtonText, { color: colors.surface }]}>
              Upload Rate List
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor handled by theme inline
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    // color handled by theme inline
  },
  selectPhotoButton: {
    // backgroundColor handled by theme inline
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  selectPhotoButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    // color handled by theme inline
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor and borderColor handled by theme inline
  },
  imagePreview: {
    width: 200,
    height: 150,
    resizeMode: "contain",
    borderRadius: 8,
    // borderWidth and borderColor handled by container
  },
  imageUriText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    // color handled by theme inline
  },
  removeImageButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    // backgroundColor handled by theme inline (based on state)
    // opacity handled by theme inline (based on state)
  },
  removeImageButtonText: {
    fontSize: 14,
    // color handled by theme inline
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    // borderColor, color, backgroundColor handled by theme inline
  },
  uploadButton: {
    // backgroundColor handled by theme inline (based on state)
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    // color handled by theme inline
  },
  processingContainer: {
    alignItems: "center",
    padding: 20,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  processingText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
    marginBottom: 15,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default UploadRateListScreen;
