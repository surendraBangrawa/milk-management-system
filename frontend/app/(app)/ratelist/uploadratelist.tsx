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
// No longer need to import axiosInstance or uploadRatelist if using fetch directly
// import { uploadRatelistWithPhoto } from '@/redux/slice/ratelist/rateListApi';

// Assuming you have a base URL for your backend API
// It's better to get this from a config file or environment variable
const API_BASE_URL = "http://192.168.1.2:8000"; // !! Replace with your actual backend URL !!

const UploadRateListScreen = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  // You would typically have state for other rate list data here, e.g.:
  // const [fatRange, setFatRange] = useState('');
  // const [snfRange, setSnfRange] = useState('');
  // const [ratePerKg, setRatePerKg] = useState('');

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only allow image selection
      // Include base64 to potentially get file type information if needed,
      // although URI is preferred for FormData upload
      // base64: true,
    });

    if (!result.canceled) {
      // result.assets is an array, take the first one
      const selectedAsset = result.assets[0];
      setSelectedImage(selectedAsset.uri);

      // You might get the type directly from the asset object
      // console.log("Selected Asset Type:", selectedAsset.type); // Check if this exists and is accurate
      // console.log("Selected Asset MIME Type:", selectedAsset.mimeType); // Check if this exists and is accurate
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
    const fileName = fileUri.split("/").pop(); // Get file name from URI

    // --- Dynamically determine file type ---
    // Attempt to get type from URI extension
    const fileExtension = fileName.split(".").pop().toLowerCase();
    let fileType = "image/jpeg"; // Default type

    if (fileExtension === "png") {
      fileType = "image/png";
    } else if (fileExtension === "jpg" || fileExtension === "jpeg") {
      fileType = "image/jpeg";
    } else if (fileExtension === "heic") {
      // HEIC is common on iOS, but backend might not support it directly.
      // You might need server-side conversion or ask user to pick a different format.
      // For now, declare it as heic if needed, or default.
      fileType = "image/heic"; // Or 'image/heif'
      console.warn(
        "Uploading HEIC file. Ensure backend supports HEIC or handles conversion."
      );
    }
    // Add more cases for other image types if necessary
    // If ImagePicker provided mimeType, you could use that:
    // const fileType = selectedAsset.mimeType || 'image/jpeg'; // Fallback to jpeg if mimeType is not available

    console.log(
      `Preparing file: Name=${fileName}, Type=${fileType}, URI=${fileUri}`
    );
    // --- End Dynamic type ---

    // *** CORRECTED PART (Same as before) ***
    formData.append("file", {
      // Use 'file' as the key to match the backend parameter name
      uri: fileUri,
      name: fileName,
      type: fileType,
    });
    // *** END CORRECTED PART ***

    // Append other rate list data (example)
    // formData.append('fatRange', fatRange);
    // formData.append('snfRange', snfRange);
    // formData.append('ratePerKg', ratePerKg);
    // You would add all relevant rate list data fields here

    // Log the internal structure (for debugging, won't show file content)
    console.log(
      "Simulating upload with FormData (internal structure):",
      formData
    );

    // --- Using Fetch API ---
    const uploadUrl = `${API_BASE_URL}/ratelist/upload_image`; // Construct the full URL
    const token = await SecureStore.getItemAsync("accessToken");
    try {
      console.log("Sending upload request using fetch...");
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,

        // Note: When sending FormData with fetch, you typically DO NOT
        // manually set the 'Content-Type' header. Fetch sets it automatically
        // with the correct 'multipart/form-data' value including the boundary.
        headers: {
          Authorization: `Bearer ${token}`, // Add your auth token here if needed
        },
      });

      // Check if the response was successful (status code 2xx)
      if (!response.ok) {
        // Attempt to read the error response body
        const errorBody = await response.text(); // or response.json() if backend sends JSON errors
        console.error(
          `Fetch upload failed: HTTP status ${response.status}`,
          errorBody
        );
        throw new Error(
          `Upload failed with status ${response.status}: ${errorBody}`
        );
      }

      const responseData = await response.json(); // Assuming your backend returns JSON
      console.log("Fetch upload successful:", responseData);
      Alert.alert("Success", "Rate list and photo uploaded successfully!");
      setSelectedImage(null); // Clear selected image after upload
      // Reset other form fields here
    } catch (error) {
      console.error("Upload failed:", error);
      // Display a more informative error if available
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
      <Text style={styles.title}>Upload New Rate List</Text>

      {/* Button to select photo */}
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

      {/* You would add input fields for Fat Range, SNF Range, Rate, etc. here */}
      {/* Example:
      <TextInput
        style={styles.input}
        placeholder="Fat Range (%)"
        value={fatRange}
        onChangeText={setFatRange}
        keyboardType="numeric"
      />
      */}

      {/* Upload Button */}
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
