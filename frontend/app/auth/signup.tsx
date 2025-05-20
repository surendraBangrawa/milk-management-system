import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import Checkbox from "expo-checkbox"; // Import Checkbox from expo-checkbox
import { sendOtpApi, signUpApi } from "@/redux/slice/auth/authApi";

// Import your useTheme hook
import useTheme from "@/context/theme/useTheme";

const Signup = () => {
  const router = useRouter();
  // Access the theme colors and mode
  const { colors, themeMode } = useTheme();
  // Determine status bar style based on theme mode
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false); // Loading state

  const handleSignup = async (data) => {
    // React Hook Form's rules handle the required check for agreeToTerms
    // if (!data.agreeToTerms) {
    //   Toast.show({
    //     type: "error",
    //     text1: "You must agree to the terms and conditions",
    //   });
    //   return; // This return is not strictly necessary if using RHF validation
    // }

    try {
      setLoading(true);
      const { name, phone, referral } = data;

      // Call the signUpApi first
      const signUpResponse = await signUpApi({
        name: name,
        mobile: phone,
        referral_code: referral,
      });

      console.log("Sign Up Response:", signUpResponse);

      if (signUpResponse.status === 200 || signUpResponse.status === 201) {
        // Assuming 200 or 201 for success
        // Store user data *after* successful signup API call
        await SecureStore.setItemAsync(
          "user",
          JSON.stringify({ name, phone, referral })
        );

        // Then send OTP
        const sendOtpResponse = await sendOtpApi({ mobile: phone });

        if (sendOtpResponse.status === 200) {
          Toast.show({
            type: "success",
            text1: "Sign up successful! OTP sent.",
          });
          router.push("/auth/otp");
        } else {
          // Handle send OTP API errors
          const sendOtpErrorData = await sendOtpResponse.json();
          const sendOtpErrorMessage =
            sendOtpErrorData?.detail || "Failed to send OTP.";
          Toast.show({ type: "error", text1: sendOtpErrorMessage });
        }
      } else {
        // Handle Sign Up API errors
        const signUpErrorData = await signUpResponse.json();
        const signUpErrorMessage = signUpErrorData?.detail || "Sign up failed.";
        Toast.show({ type: "error", text1: signUpErrorMessage });
      }
    } catch (err: any) {
      console.error("Sign Up Process Error:", err); // Log the actual error
      // Check if it's an Axios error with a response
      const errorMessage =
        err?.response?.data?.detail ||
        err.message ||
        "Something went wrong. Please try again.";
      Toast.show({
        type: "error",
        text1: errorMessage,
      });
    } finally {
      setLoading(false); // Hide loading spinner after the API call is complete
    }
  };

  const handleSignInRedirect = () => {
    router.push("/auth/signin"); // Redirect to Sign In page
  };

  return (
    // Apply theme background color to the main container
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.surface} />

      <Text style={[styles.title, { color: colors.textPrimary }]}>Sign Up</Text>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                // Apply theme colors to input border, background, and text
                {
                  borderColor: errors.name ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Enter name"
              placeholderTextColor={colors.textSecondary} // Themed placeholder color
              value={value}
              onChangeText={onChange}
            />
          )}
          name="name"
          rules={{ required: "Name is required" }}
        />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error,
              opacity: errors.name ? 1 : 0, // Control visibility with opacity
            },
          ]}
        >
          {errors.name?.message as string}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                // Apply theme colors to input border, background, and text
                {
                  borderColor: errors.phone ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textSecondary} // Themed placeholder color
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              maxLength={10} // Added maxLength for phone number
            />
          )}
          name="phone"
          rules={{
            required: "Phone number is required",
            pattern: {
              value: /^[0-9]{10}$/,
              message: "Please enter a valid 10-digit phone number",
            },
          }}
        />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error,
              opacity: errors.phone ? 1 : 0, // Control visibility with opacity
            },
          ]}
        >
          {errors.phone?.message as string}
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                // Apply theme colors to input border, background, and text
                {
                  borderColor: colors.border, // Referral doesn't have specific error styling here
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Enter referral code (Optional)" // Added Optional to placeholder
              placeholderTextColor={colors.textSecondary} // Themed placeholder color
              value={value}
              onChangeText={onChange}
            />
          )}
          name="referral"
          // No rules needed if it's optional
        />
        <Text style={[styles.errorText, { opacity: 0 }]}>
          Placeholder error text
        </Text>
      </View>

      <View style={styles.checkboxContainer}>
        <Controller
          control={control}
          name="agreeToTerms"
          render={({ field: { onChange, value } }) => (
            <>
              <View style={styles.checkboxWrapper}>
                <Checkbox
                  value={value}
                  onValueChange={onChange}
                  style={styles.checkbox}
                  color={value ? colors.primary : colors.textSecondary} // Themed checkbox color
                />
                <Text
                  style={[styles.checkboxLabel, { color: colors.textPrimary }]}
                >
                  I agree to the
                  <Text
                    style={[styles.termsText, { color: colors.primary }]} // Themed terms link color
                    // You might want to add an onPress handler here to open terms
                    onPress={() => {
                      // Logic to navigate to or open terms and conditions
                      console.log("Terms and Conditions pressed");
                      // Example: router.push('/terms'); or Linking.openURL('your-terms-url');
                    }}
                  >
                    Terms and Conditions
                  </Text>
                </Text>
              </View>
              <Text
                style={[
                  styles.errorText,
                  {
                    color: colors.error,
                    marginTop: 0, // Adjusted margin for checkbox error
                    opacity: errors.agreeToTerms ? 1 : 0, // Control visibility with opacity
                  },
                ]}
              >
                {errors?.agreeToTerms?.message as string}
              </Text>
            </>
          )}
          rules={{
            required: "You must agree to the terms and conditions",
            // You can add a custom validation function here if needed, e.g., to check if value is true
            // validate: value => value === true || 'You must agree to the terms and conditions'
          }}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          // Apply theme primary color to button background, or border color when disabled
          { backgroundColor: loading ? colors.border : colors.primary },
        ]}
        onPress={handleSubmit(handleSignup)}
        disabled={loading} // Disable if loading
      >
        {loading ? (
          // Apply theme surface color to the activity indicator
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          // Apply theme surface color to button text (assuming white/light text on primary/border)
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            Sign Up
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignInRedirect}>
        <Text style={[styles.signInText, { color: colors.textPrimary }]}>
          Already have an account?
          <Text style={[styles.signInLink, { color: colors.primary }]}>
            Sign In
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    // backgroundColor handled by theme inline
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    // color handled by theme inline
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15, // Keep marginBottom to provide space below the error text placeholder
  },
  label: {
    fontSize: 16,
    // color handled by theme inline (if used)
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    // borderColor, backgroundColor, color, and placeholderTextColor handled by theme inline
  },
  button: {
    // backgroundColor handled by theme inline (based on state)
    paddingVertical: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
    // color handled by theme inline
  },
  errorText: {
    // color handled by theme inline
    fontSize: 12,
    marginTop: 5, // Keep margin top to space from input
    // opacity is handled inline now
  },
  checkboxContainer: {
    width: "100%", // Make container take full width for better alignment
    // flexDirection: "column", // Keep column layout
    alignItems: "flex-start", // Align items to the start (left)
    marginTop: 15,
    marginBottom: 15, // Add marginBottom to account for checkbox error text placeholder
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
    // color handled by theme inline (via prop)
  },
  checkboxLabel: {
    flex: 1, // Allow label text to wrap
    fontSize: 14,
    // color handled by theme inline
  },
  termsText: {
    // color handled by theme inline
    textDecorationLine: "underline",
  },
  signInText: {
    fontSize: 14,
    // color handled by theme inline
    marginTop: 20,
  },
  signInLink: {
    // color handled by theme inline
    fontWeight: "bold",
  },
});

export default Signup;
