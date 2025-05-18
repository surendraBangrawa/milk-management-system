import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { Stack } from "expo-router";
import useTheme from "@/context/theme/useTheme";

const API_BASE_URL = "http://192.168.1.2:8000";

const UploadRateListScreen = () => {
  const { colors } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Request permission to access the device's media library
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return false;
    }
    return true;
  };

  // Function to pick an image from the device's library
  const pickImage = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setSelectedImage(selectedAsset.uri);
    }
  };

  // Function to handle the upload process using Fetch API
  const handleUpload = async () => {
    if (!selectedImage) {
      Alert.alert(
        "No Photo Selected",
        "Please select a photo of the rate list to upload."
      );
      return;
    }

    // You would also validate other rate list data here

    setUploading(true);

    // Create FormData object
    const formData = new FormData();

    // Append the photo file in the correct format for React Native FormData
    const fileUri = selectedImage;
    const fileName = fileUri.split("/").pop() || `upload_${Date.now()}.jpg`;

    // --- Dynamically determine file type ---
    // Attempt to get type from URI extension
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "jpg"; // Get extension, provide fallback
    let fileType = "image/jpeg"; // Default type

    if (fileExtension === "png") {
      fileType = "image/png";
    } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
      fileType = "image/jpeg";
    } else if (fileExtension === "heic") {
      fileType = "image/heic"; // Or 'image/heif'
    }

    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: fileType,
    } as any);

    const uploadUrl = `${API_BASE_URL}/ratelist/upload_image`; // Construct the full URL
    const token = await SecureStore.getItemAsync("accessToken");
    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`, // Add your auth token here if needed
        },
      });

      if (!response.ok) {
        const errorBody = await response.text(); // or response.json() if backend sends JSON errors
        throw new Error(
          `Upload failed with status ${response.status}: ${errorBody}`
        );
      }
      Alert.alert("Success", "Rate list and photo uploaded successfully!");
      setSelectedImage(null);
    } catch (error: any) {
      Alert.alert(
        "Upload Failed",
        `An error occurred during upload: ${error.message || error}`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Upload Ratelist",
          headerStyle: {
            backgroundColor: colors.surface, // Example header background
          },
          headerTintColor: colors.textPrimary, // Example header text color
        }}
      />
      <TouchableOpacity style={styles.selectPhotoButton} onPress={pickImage}>
        <Text style={styles.selectPhotoButtonText}>Select Rate List Photo</Text>
      </TouchableOpacity>

      {/* Display selected image */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
          <Text style={styles.imageUriText}>
            Selected: {selectedImage.split("/").pop()}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={handleUpload}
        disabled={
          uploading || !selectedImage /* Add validation for other fields here */
        }
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Rate List</Text>
        )}
      </TouchableOpacity>

      {/* Add a back button or handle navigation */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  selectPhotoButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  selectPhotoButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  imagePreviewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  imagePreview: {
    width: 200,
    height: 150,
    resizeMode: "contain",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  imageUriText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    fontStyle: "italic",
  },
  input: {
    // Example style for other input fields
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  uploadButton: {
    backgroundColor: "#28a745", // Green color
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20, // Space above upload button
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default UploadRateListScreen;
