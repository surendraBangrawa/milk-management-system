import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/store";
import { uploadRatelist } from "@/redux/slice/ratelist/rateListApi";
import {
  startUpload,
  uploadComplete,
  resetUploadStatus,
} from "@/redux/slice/ratelist/uploadStatusSlice";
import { uploadStatusService } from "@/services/uploadStatusService";
import useTheme from "@/context/theme/useTheme";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const UploadRateListScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const uploadStatus = useSelector((state: RootState) => state.uploadStatus);

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Reset upload status when component unmounts
    return () => {
      if (
        uploadStatus.status === "complete" ||
        uploadStatus.status === "failed" ||
        uploadStatus.status === "cancelled"
      ) {
        dispatch(resetUploadStatus());
      }
    };
  }, [dispatch, uploadStatus.status]);

  // Reset local upload state when Redux state changes
  useEffect(() => {
    if (!uploadStatus.isUploading && !uploadStatus.isProcessing) {
      setIsUploading(false);
    }
  }, [uploadStatus.isUploading, uploadStatus.isProcessing]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick image. Please try again.",
      });
    }
  };

  const uploadImage = async () => {
    if (!selectedImageUri) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select an image first.",
      });
      return;
    }

    // Prevent multiple clicks
    if (uploadStatus.isUploading || uploadStatus.isProcessing || isUploading) {
      return;
    }

    setIsUploading(true);
    dispatch(startUpload());

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedImageUri,
        type: "image/jpeg",
        name: "rate_list_image.jpg",
      } as any);

      const response = await uploadRatelist(formData);
      const taskId = response.data.task_id;

      // Update Redux state with task ID and start processing
      dispatch(uploadComplete({ taskId }));

      // Start background polling
      uploadStatusService.startPolling(taskId);

      Toast.show({
        type: "success",
        text1: "Upload Successful",
        text2: "Image uploaded successfully. Processing in background...",
      });

      // Navigate back to rate list screen
      router.back();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to upload image";
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: errorMessage,
      });
      dispatch(resetUploadStatus());
    }
  };

  const resetSelection = () => {
    setSelectedImageUri(null);
    setIsUploading(false);
    dispatch(resetUploadStatus());
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Upload Ratelist",
          headerStyle: {
            backgroundColor: colors.surface, // Use theme surface for header background
          },
          headerTintColor: colors.textPrimary, // Use theme text color for title and back arrow
          headerTitleStyle: {
            fontWeight: "600", // Semi-bold header title
          },
        }}
      />

      {!selectedImageUri && (
        <TouchableOpacity
          style={[
            styles.selectPhotoButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={pickImage}
          disabled={
            uploadStatus.isUploading || uploadStatus.isProcessing || isUploading
          }
        >
          <Text
            style={[styles.selectPhotoButtonText, { color: colors.surface }]}
          >
            Select Rate List Photo
          </Text>
        </TouchableOpacity>
      )}

      {selectedImageUri && (
        <ScrollView style={styles.imageContainer}>
          <Text
            style={[styles.instructionText, { color: colors.textSecondary }]}
          >
            Selected Image:
          </Text>
          <Image
            source={{ uri: selectedImageUri }}
            style={styles.selectedImage}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.uploadButton,
                {
                  backgroundColor:
                    uploadStatus.isUploading ||
                    uploadStatus.isProcessing ||
                    isUploading
                      ? colors.border
                      : colors.primary,
                },
              ]}
              onPress={uploadImage}
              disabled={
                uploadStatus.isUploading ||
                uploadStatus.isProcessing ||
                isUploading
              }
              activeOpacity={
                uploadStatus.isUploading ||
                uploadStatus.isProcessing ||
                isUploading
                  ? 1
                  : 0.7
              }
            >
              {uploadStatus.isUploading || isUploading ? (
                <ActivityIndicator color={colors.surface} size="small" />
              ) : (
                <Text
                  style={[styles.uploadButtonText, { color: colors.surface }]}
                >
                  Upload & Process
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: colors.border }]}
              onPress={resetSelection}
              disabled={
                uploadStatus.isUploading ||
                uploadStatus.isProcessing ||
                isUploading
              }
            >
              <Text
                style={[styles.resetButtonText, { color: colors.textPrimary }]}
              >
                Select Different Image
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.instructionsContainer}>
            <Text
              style={[styles.instructionsTitle, { color: colors.textPrimary }]}
            >
              Instructions:
            </Text>
            <Text
              style={[styles.instructionsText, { color: colors.textSecondary }]}
            >
              • Ensure the rate list image is clear and well-lit
            </Text>
            <Text
              style={[styles.instructionsText, { color: colors.textSecondary }]}
            >
              • The image should contain a table with Fat, SNF, and Rate columns
            </Text>
            <Text
              style={[styles.instructionsText, { color: colors.textSecondary }]}
            >
              • Processing may take a few moments depending on image quality
            </Text>
            <Text
              style={[styles.instructionsText, { color: colors.textSecondary }]}
            >
              • You can check processing status from the main rate list screen
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  selectPhotoButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  selectPhotoButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  imageContainer: {
    flex: 1,
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "bold",
  },
  selectedImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  uploadButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 20,
  },
});

export default UploadRateListScreen;
