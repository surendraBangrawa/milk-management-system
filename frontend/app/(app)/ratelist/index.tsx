import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  deleteRatelist,
  getRatelist,
} from "@/redux/slice/ratelist/rateListApi";
import useTheme from "@/context/theme/useTheme";
import UploadStatusBanner from "@/components/UploadStatusBanner";
import ThemedAlert from "@/components/ThemedAlert";
import Toast from "react-native-toast-message";
import { checkRatelistUploadLimit } from "@/lib/subscriptionUtils";
import { useTranslation } from "react-i18next";

const RateListViewer = () => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const uploadStatus = useSelector((state: RootState) => state.uploadStatus);

  const [existingRateList, setExistingRateList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false); // State for delete loading
  const isFetchingRef = useRef(false);

  // Alert states
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [successAlertVisible, setSuccessAlertVisible] = useState(false);
  const [errorAlertVisible, setErrorAlertVisible] = useState(false);
  const [noRateListAlertVisible, setNoRateListAlertVisible] = useState(false);

  useEffect(() => {
    if (isFocused && !isFetchingRef.current) {
      fetchExistingRateList();
    }
  }, [isFocused]);

  // Refresh rate list when upload completes
  useEffect(() => {
    if (isFocused && uploadStatus.status === "complete") {
      // Small delay to ensure backend has processed the data
      const timer = setTimeout(() => {
        fetchExistingRateList();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus.status, isFocused]);

  const fetchExistingRateList = async () => {
    if (isFetchingRef.current) return; // Prevent duplicate calls

    isFetchingRef.current = true;
    setLoading(true);
    try {
      const data = await getRatelist();
      // Check if data and data.data.rates is a non-empty array
      if (
        data &&
        data.data &&
        Array.isArray(data.data.rates) &&
        data.data.rates.length > 0
      ) {
        // Store the array (or just its length matters for logic here)
        setExistingRateList(data.data.rates);
      } else {
        setExistingRateList([]); // Treat as no list found or empty list
      }
    } catch (error) {
      setExistingRateList([]); // Assume no list on error
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleDeleteRateList = async () => {
    setDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    setDeleteAlertVisible(false);
    setDeleting(true); // Start delete loading
    try {
      await deleteRatelist();
      setSuccessAlertVisible(true);
      setExistingRateList([]); // Clear the local state
      fetchExistingRateList(); // Re-fetch to confirm state
    } catch (error) {
      console.error("Error deleting rate list:", error);
      setErrorAlertVisible(true);
    } finally {
      setDeleting(false); // Reset delete loading
    }
  };

  const navigateToUploadRateList = async () => {
    // Only navigate if not loading or deleting
    if (!loading && !deleting) {
      // Check if user can upload ratelist
      const canUpload = await checkRatelistUploadLimit();
      if (!canUpload) {
        Toast.show({
          type: "error",
          text1: "Rate List Upload Limit Reached",
          text2:
            "You can upload up to 3 rate lists on your current plan. Upgrade to Premium for unlimited rate list uploads.",
        });
        return;
      }
      router.push("/(app)/ratelist/uploadratelist");
    }
  };

  const navigateToEditRateList = () => {
    // Only navigate if list exists and not loading/deleting
    if (existingRateList.length > 0 && !loading && !deleting) {
      router.push("/(app)/ratelist/editratelist");
    } else if (!loading && !deleting) {
      setNoRateListAlertVisible(true);
    }
  };

  const navigateToViewTable = () => {
    // Only navigate if list exists and not loading/deleting
    if (existingRateList.length > 0 && !loading && !deleting) {
      router.push("/(app)/ratelist/ratelisttable");
    } else if (!loading && !deleting) {
      setNoRateListAlertVisible(true);
    }
  };

  // Conditional styles based on theme
  const themedStyles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background, // Use theme background color
      paddingTop: 0, // Adjust padding
    },
    container: {
      flex: 1,
      padding: 20, // Consistent padding
      // Add bottom padding when banner is visible
      paddingBottom:
        uploadStatus.isUploading || uploadStatus.isProcessing ? 100 : 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      // Added padding/margin if needed, but flex center should handle it
      marginTop: 50, // Give some space from header
    },
    loadingText: {
      marginTop: 15, // More space
      fontSize: 18, // Slightly larger
      color: colors.textSecondary, // Use a secondary text color
      fontWeight: "500", // Medium weight
    },
    button: {
      paddingVertical: 15, // Consistent vertical padding
      paddingHorizontal: 20,
      borderRadius: 8, // Standard rounded corners
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 15, // Space between buttons
      minHeight: 50, // Ensure minimum height
      // Subtle shadow for depth
      elevation: 3, // Android shadow
      shadowColor: colors.shadow, // Use theme shadow color
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    buttonText: {
      fontSize: 17, // Clear text size
      fontWeight: "600", // Semi-bold
    },
    // Specific styles for different button types
    primaryButton: {
      backgroundColor: colors.primary, // Primary action color
    },
    primaryButtonText: {
      color: colors.surface, // Text color contrasting with primary background
    },
    secondaryButton: {
      backgroundColor: colors.surface, // White/light background
      borderWidth: 1,
      borderColor: colors.border, // Subtle border from theme
    },
    secondaryButtonText: {
      color: colors.textPrimary, // Dark text color for secondary buttons
    },
    deleteButton: {
      backgroundColor: colors.error, // Error color for delete
      marginTop: 25, // More space above delete
    },
    deleteButtonText: {
      color: colors.surface, // White text for delete button
    },
    // Disabled state style
    buttonDisabled: {
      opacity: 0.6, // Dim the button when disabled
    },
    // --- Empty State Styles ---
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 30, // Padding for text
      marginTop: 40, // Space from the Upload button
    },
    emptyStateText: {
      fontSize: 18,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24, // Improved readability
    },
  });

  const renderContent = () => {
    if (loading) {
      return (
        <View style={themedStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={themedStyles.loadingText}>
            {t("ratelist.fetching_rate_list_status")}
          </Text>
        </View>
      );
    }

    // Content when loading is false
    return (
      <ScrollView
        style={themedStyles.container}
        contentContainerStyle={{ paddingBottom: 30 }} // Add padding at the bottom
      >
        <Pressable
          style={({ pressed }) => [
            themedStyles.button,
            themedStyles.primaryButton,
            (deleting ||
              loading ||
              uploadStatus.isUploading ||
              uploadStatus.isProcessing) &&
              themedStyles.buttonDisabled,
            {
              backgroundColor: pressed
                ? colors.primaryDark || darkenColor(colors.primary, 20)
                : colors.primary, // Darker on press
            },
          ]}
          onPress={navigateToUploadRateList}
          disabled={
            deleting ||
            loading ||
            uploadStatus.isUploading ||
            uploadStatus.isProcessing
          } // Disable during processing
          android_ripple={{
            color: colors.primaryDark || darkenColor(colors.primary, 30),
          }}
        >
          <Text
            style={[themedStyles.buttonText, themedStyles.primaryButtonText]}
          >
            {uploadStatus.isUploading || uploadStatus.isProcessing
              ? t("ratelist.processing")
              : t("ratelist.upload_new_rate_list")}
          </Text>
        </Pressable>

        {existingRateList.length > 0 &&
          !uploadStatus.isUploading &&
          !uploadStatus.isProcessing && (
            <>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: colors.textPrimary,
                  marginBottom: 10,
                  marginTop: 10,
                }}
              >
                {t("ratelist.rate_list_actions")}
              </Text>

              <Pressable
                style={({ pressed }) => [
                  themedStyles.button,
                  themedStyles.secondaryButton, // Secondary style
                  (deleting || loading) && themedStyles.buttonDisabled,
                  { opacity: pressed ? 0.8 : 1 }, // Simple opacity feedback for secondary
                ]}
                onPress={navigateToViewTable}
                disabled={deleting || loading}
              >
                <Text
                  style={[
                    themedStyles.buttonText,
                    themedStyles.secondaryButtonText,
                  ]}
                >
                  View Rate List (Table)
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  themedStyles.button,
                  themedStyles.secondaryButton,
                  (deleting || loading) && themedStyles.buttonDisabled,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={navigateToEditRateList}
                disabled={deleting || loading}
              >
                <Text
                  style={[
                    themedStyles.buttonText,
                    themedStyles.secondaryButtonText,
                  ]}
                >
                  Edit Rate List
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  themedStyles.button,
                  themedStyles.deleteButton,
                  (deleting || loading) && themedStyles.buttonDisabled,
                  {
                    backgroundColor: pressed
                      ? darkenColor(colors.error, 20)
                      : colors.error,
                  },
                ]}
                onPress={handleDeleteRateList}
                disabled={deleting || loading} // Disable while deleting or initial loading
                android_ripple={{
                  color: darkenColor(colors.error, 30),
                }}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text
                    style={[
                      themedStyles.buttonText,
                      themedStyles.deleteButtonText,
                    ]}
                  >
                    Delete Rate List
                  </Text>
                )}
              </Pressable>
            </>
          )}

        {(existingRateList.length === 0 ||
          uploadStatus.isUploading ||
          uploadStatus.isProcessing) && (
          // Empty State View
          <View style={themedStyles.emptyStateContainer}>
            <Text style={themedStyles.emptyStateText}>
              {uploadStatus.isUploading || uploadStatus.isProcessing
                ? "Processing new rate list... Please wait."
                : "No existing rate list found. Please upload a new rate list to get started."}
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // Helper function to darken color (fallback if primaryDark/errorDark not in theme)
  // Basic implementation - assumes hex colors
  const darkenColor = (hex: string, percent: number) => {
    if (!hex) return;
    let r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);

    r = Math.max(0, r - percent);
    g = Math.max(0, g - percent);
    b = Math.max(0, b - percent);

    const toHex = (c: number) => c.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  return (
    <View style={themedStyles.mainContainer}>
      <Stack.Screen
        options={{
          // Header title can be adjusted if needed, "Rate Management" might be clearer
          title: "Rate List Management",
          headerStyle: {
            backgroundColor: colors.surface, // Use theme surface for header background
          },
          headerTintColor: colors.textPrimary, // Use theme text color for title and back arrow
          headerTitleStyle: {
            fontWeight: "600", // Semi-bold header title
          },
        }}
      />
      <UploadStatusBanner />
      {renderContent()}

      {/* Themed Alerts */}
      <ThemedAlert
        visible={deleteAlertVisible}
        title="Confirm Deletion"
        message="Are you sure you want to delete the existing rate list? This action cannot be undone."
        type="warning"
        confirmText="Delete"
        cancelText="Cancel"
        showCancel={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertVisible(false)}
        onDismiss={() => setDeleteAlertVisible(false)}
      />

      <ThemedAlert
        visible={successAlertVisible}
        title="Success"
        message="Rate list deleted successfully."
        type="success"
        confirmText="OK"
        onConfirm={() => setSuccessAlertVisible(false)}
        onDismiss={() => setSuccessAlertVisible(false)}
      />

      <ThemedAlert
        visible={errorAlertVisible}
        title="Error"
        message="Failed to delete rate list."
        type="error"
        confirmText="OK"
        onConfirm={() => setErrorAlertVisible(false)}
        onDismiss={() => setErrorAlertVisible(false)}
      />

      <ThemedAlert
        visible={noRateListAlertVisible}
        title="No Rate List"
        message="No existing rate list found. Please upload a new rate list first."
        type="info"
        confirmText="OK"
        onConfirm={() => setNoRateListAlertVisible(false)}
        onDismiss={() => setNoRateListAlertVisible(false)}
      />
    </View>
  );
};

export default RateListViewer;
