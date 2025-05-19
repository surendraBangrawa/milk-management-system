import React, { useState, useCallback } from "react";
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
  // TextInput, // Uncomment if you add other input fields
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { Stack, useRouter } from "expo-router";
import useTheme from "@/context/theme/useTheme"; // Assuming this hook provides the current theme's colors
import Constants from "expo-constants";
import Toast from "react-native-toast-message";
// import { APIError } from "@/types"; // Uncomment if you have a type for API errors
// import Toast from 'react-native-toast-message'; // Uncomment if using a toast library

const { API_BASE_URL } = Constants.expoConfig?.extra || {};

// --- Constants for API Endpoints and Messages ---
const UPLOAD_RATE_LIST_ENDPOINT = "/ratelist/upload_image";
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
  const { colors } = useTheme();
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [permissionStatus, requestPermission] =
    ImagePicker.useMediaLibraryPermissions();

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
          const errorBody = await response.json(); // Assuming API returns structured JSON errors
          errorDetail =
            errorBody.message || errorBody.error || JSON.stringify(errorBody);
        } catch (e) {
          // If not JSON, get plain text
          errorDetail = await response.text();
        }
        throw new Error(
          `Upload failed with status ${response.status}: ${errorDetail}`
        );
      }

      Toast.show({
        type: "success",
        text1: "Success",
        text2: UPLOAD_SUCCESS_MESSAGE,
      });
      setSelectedImageUri(null);

      router.back();
    } catch (error: any) {
      console.error("Upload Error:", error);
      Alert.alert(
        "Upload Failed",
        `${UPLOAD_FAILED_MESSAGE}\n${error.message || error}` // Display error message from the caught error
      );
      // Toast.show({ type: 'error', text1: 'Upload Failed', text2: `${error.message || error}` });
    } finally {
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
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />
      {/* Add header title within the screen if not using Stack.Screen title */}
      {/* <Text style={[styles.title, { color: colors.textPrimary }]}>Upload Rate List</Text> */}
      {!selectedImageUri && (
        <TouchableOpacity
          style={[
            styles.selectPhotoButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={pickImage}
          disabled={uploading} // Disable while uploading
        >
          <Text
            style={[styles.selectPhotoButtonText, { color: colors.onPrimary }]}
          >
            Select Rate List Photo
          </Text>
        </TouchableOpacity>
      )}
      {/* Display selected image */}
      {selectedImageUri && (
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
                backgroundColor: uploading ? colors.border : colors.error, // Change color when disabled
                opacity: uploading ? 0.5 : 1, // Reduce opacity when disabled
              },
            ]}
            disabled={uploading} // Disable the remove button while uploading
          >
            <Text
              style={[styles.removeImageButtonText, { color: colors.surface }]}
            >
              Remove Photo
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* --- Add Input Fields for other Rate List Data Here --- */}
      {/* <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            placeholder="Rate List Name"
            placeholderTextColor={colors.textSecondary}
            value={rateListData.name}
            onChangeText={(text) => setRateListData({ ...rateListData, name: text })}
       />
       <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
            placeholder="Description"
            placeholderTextColor={colors.textSecondary}
            value={rateListData.description}
            onChangeText={(text) => setRateListData({ ...rateListData, description: text })}
            multiline
       /> */}
      <TouchableOpacity
        style={[
          styles.uploadButton,
          {
            backgroundColor:
              uploading ||
              !selectedImageUri /* Add other validation checks here */
                ? colors.border // Use border color for disabled state, or define a specific disabled color in your theme
                : colors.success, // Use success color for the primary action button
          },
        ]}
        onPress={handleUpload}
        disabled={
          uploading ||
          !selectedImageUri /* Add validation for other fields here */
        }
      >
        {uploading ? (
          <ActivityIndicator color={colors.surface} /> // Use a contrasting color for the indicator
        ) : (
          <Text style={[styles.uploadButtonText, { color: colors.surface }]}>
            Upload Rate List
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    // backgroundColor handled by theme
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    // color handled by theme
  },
  selectPhotoButton: {
    // backgroundColor handled by theme
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  selectPhotoButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    // color handled by theme
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    // backgroundColor and borderColor handled by theme
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
    // color handled by theme
  },
  removeImageButton: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    // backgroundColor handled by theme (based on state)
    // opacity handled by theme (based on state)
  },
  removeImageButtonText: {
    fontSize: 14,
    // color handled by theme
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    // borderColor, color, backgroundColor handled by theme
  },
  uploadButton: {
    // backgroundColor handled by theme (based on state)
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    // color handled by theme
  },
});

export default UploadRateListScreen;
