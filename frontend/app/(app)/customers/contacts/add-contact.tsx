import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform, // Import Platform for potential platform-specific styles
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { saveContactApi } from "@/redux/slice/customers/customerApi";

import useTheme from "@/context/theme/useTheme"; // Import useTheme
import { ColorPalette } from "@/context/theme/theme"; // Import ColorPalette type

// Assuming ProfileIcon is a static local image, it doesn't need theming
const ProfileIcon = require("../../../../assets/images/avatar.jpg");

const AddCustomerFormScreen = () => {
  const router = useRouter();
  const { colors } = useTheme(); // Use the useTheme hook

  const { mobile, name } = useLocalSearchParams() as {
    // Explicitly type params
    mobile?: string | string[];
    name?: string | string[];
  };

  // Safely extract values from params
  const effectiveMobile = Array.isArray(mobile) ? mobile[0] : mobile;
  const effectiveName = Array.isArray(name) ? name[0] : name;

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError, // Get setError
    clearErrors, // Get clearErrors
  } = useForm({
    defaultValues: {
      name: effectiveName ?? "", // Use effectiveName
      mobile: effectiveMobile ?? "", // Use effectiveMobile
    },
  });
  const [loading, setLoading] = useState(false); // Loading state

  const handleAddCustomer = async (data: { name: string; mobile: string }) => {
    // Explicitly type data
    const { name, mobile } = data;

    // Basic validation before API call (react-hook-form rules handle most)
    if (!name || !mobile) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter both name and mobile number.",
      });
      // Optionally set form errors manually if needed
      if (!name)
        setError("name", { type: "manual", message: "Name is required" });
      if (!mobile)
        setError("mobile", {
          type: "manual",
          message: "Mobile number is required",
        });
      return;
    }

    // Additional validation for mobile format before API call
    const mobilePattern = /^[0-9]{10}$/;
    if (!mobilePattern.test(mobile)) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter a valid 10-digit mobile number.",
      });
      setError("mobile", {
        type: "manual",
        message: "Please enter a valid 10-digit mobile number",
      });
      return;
    }
    clearErrors(["name", "mobile"]); // Clear errors if valid

    setLoading(true); // Show loading spinner

    try {
      // Assuming saveContactApi handles both add and update based on payload structure or ID
      await saveContactApi({ name, mobile }); // Adjust payload if API expects more fields or an ID for update

      Toast.show({
        type: "success",
        text1: "Customer Saved!", // Changed text to be more general (Add/Update)
        text2: `Successfully saved ${name}.`,
      });
      // Navigate back after successful save
      // Consider navigating back to the customer list or the specific customer's transaction screen
      // For now, navigating to home as in original code, but consider router.replace or router.back()
      router.replace("/(app)/(tabs)/(home)"); // Using replace to prevent stacking
    } catch (err: any) {
      console.error("Error saving customer:", err.response || err); // Log detailed error
      Toast.show({
        type: "error",
        text1: "Failed to Save Customer", // Changed text
        text2:
          err?.response?.data?.detail ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {" "}
      {/* Use background color */}
      <Stack.Screen
        options={{
          title: effectiveMobile ? "Edit Customer" : "Add Customer", // Dynamic title
          headerStyle: {
            backgroundColor: colors.surface, // Example header background
          },
          headerTintColor: colors.textPrimary, // Example header text color
        }}
      />
      <Image source={ProfileIcon} style={styles.avatar} />
      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={(
            { field: { onChange, value, onBlur } } // Added onBlur
          ) => (
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: errors.name ? colors.error : colors.border, // Highlight error
                  backgroundColor: colors.surface, // Use surface color
                  color: colors.textPrimary, // Use textPrimary color
                },
              ]}
              placeholder="Enter name"
              placeholderTextColor={colors.textSecondary} // Use textSecondary color
              value={value}
              onChangeText={onChange}
              onBlur={onBlur} // Pass onBlur for validation
              editable={!loading} // Disable input while loading
            />
          )}
          name="name"
          rules={{
            required: "Name is required",
          }}
        />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error, // Use error color
              opacity: errors.name ? 1 : 0, // Use opacity for visibility
              height: errors.name ? "auto" : 0, // Collapse height when hidden
            },
          ]}
        >
          {errors.name?.message}
        </Text>
      </View>
      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={(
            { field: { onChange, value, onBlur } } // Added onBlur
          ) => (
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: errors.mobile ? colors.error : colors.border, // Highlight error
                  backgroundColor: colors.surface, // Use surface color
                  color: colors.textPrimary, // Use textPrimary color
                },
              ]}
              placeholder="Enter mobile number"
              placeholderTextColor={colors.textSecondary} // Use textSecondary color
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              maxLength={10}
              onBlur={onBlur} // Pass onBlur for validation
              editable={!loading} // Disable input while loading
            />
          )}
          name="mobile"
          rules={{
            required: "Mobile number is required",
            pattern: {
              value: /^[0-9]{10}$/,
              message: "Please enter a valid 10-digit mobile number",
            },
          }}
        />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error, // Use error color
              opacity: errors.mobile ? 1 : 0, // Use opacity for visibility
              height: errors.mobile ? "auto" : 0, // Collapse height when hidden
            },
          ]}
        >
          {errors.mobile?.message}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              Object.keys(errors).length > 0 || loading
                ? colors.textSecondary
                : colors.primary,
          },
        ]} // Grey out if errors or loading
        onPress={handleSubmit(handleAddCustomer)}
        disabled={loading || Object.keys(errors).length > 0} // Disable if loading or errors
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {effectiveMobile ? "Update Customer" : "Add Customer"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16, // Adjusted padding
    // Background color from theme applied inline
  },
  title: {
    // This style is not used in the current component structure
    fontSize: 32,
    fontWeight: "bold",
    // Color from theme applied inline if used
    marginBottom: 40,
    textAlign: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16, // Adjusted margin
  },
  input: {
    height: 48, // Adjusted height
    borderWidth: 1,
    // Colors from theme applied inline
    borderRadius: 8, // Adjusted border radius
    paddingHorizontal: 12, // Adjusted padding
    fontSize: 16,
    // Shadow (optional, add if desired, consistent with other screens)
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 1 },
    //     shadowOpacity: 0.05,
    //     shadowRadius: 2,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  button: {
    // Background color from theme applied inline
    paddingVertical: 14, // Adjusted padding
    borderRadius: 8, // Adjusted border radius
    width: "100%",
    alignItems: "center",
    marginTop: 24, // Adjusted margin
    // Shadow (optional, add if desired, consistent with other screens)
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    // Color from theme applied inline
  },
  errorText: {
    fontSize: 12,
    // Color from theme applied inline
    marginTop: 4, // Adjusted margin
    // Visibility handled by opacity and height inline
  },
  // Avatar styles
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24, // Adjusted margin
    marginTop: 10,
    // You might want to add a subtle border or shadow here if desired
    // borderWidth: 2,
    // borderColor: colors.primaryLight, // Example themed border
  },
});

export default AddCustomerFormScreen;
