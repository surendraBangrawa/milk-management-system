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
import { sendOtpApi } from "@/redux/slice/auth/authApi";

// Import your useTheme hook
import useTheme from "@/context/theme/useTheme";

const Signin = () => {
  const router = useRouter();
  const { colors, themeMode } = useTheme();
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false); // Loading state

  const handleLogin = async (data) => {
    const { phone } = data;
    // react-hook-form rules handle the required check
    // if (!phone) {
    //   Toast.show({
    //     type: "error",
    //     text1: "Please enter your phone number",
    //   });
    //   return;
    // }
    setLoading(true); // Show loading spinner

    try {
      // Store the phone number after successful validation, before sending OTP
      await SecureStore.setItemAsync("user", JSON.stringify({ phone }));

      const sendOtp = await sendOtpApi({ mobile: phone });

      if (sendOtp.status === 200) {
        Toast.show({ type: "success", text1: "OTP sent successfully!" }); // Added success toast
        router.push("/auth/otp");
      } else {
        // Handle API errors with specific messages if available
        const errorData = await sendOtp.json(); // Assuming JSON error response
        const errorMessage =
          errorData?.message || "Failed to send OTP. Please try again.";
        Toast.show({ type: "error", text1: errorMessage });
      }
    } catch (err: any) {
      console.error("Sign In Error:", err); // Log the actual error
      Toast.show({
        type: "error",
        text1: "Something went wrong.",
        text2: err.message || "Please try again.", // Display error message
      });
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    // Apply theme background color to the main container
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.surface} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>Sign In</Text>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                // Apply theme colors to input border, background, and text
                {
                  borderColor: errors.phone ? colors.error : colors.border, // Error color for border if there's an error
                  backgroundColor: colors.surface,
                  color: colors.textPrimary, // Text color from theme
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

      <TouchableOpacity
        style={[
          styles.button,
          // Apply theme primary color to button background, or border color when disabled
          { backgroundColor: loading ? colors.border : colors.primary },
        ]}
        onPress={handleSubmit(handleLogin)}
        disabled={loading} // Disable if loading
      >
        {loading ? (
          // Apply theme surface color to the activity indicator
          <ActivityIndicator size="small" color={colors.surface} />
        ) : (
          // Apply theme surface color to button text (assuming white/light text on primary/border)
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            Login
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/auth/signup")}>
        <Text style={[styles.signInText, { color: colors.textPrimary }]}>
          Don't have an account?
          <Text style={[styles.signInLink, { color: colors.primary }]}>
            Sign Up
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
    marginBottom: 15,
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
    marginTop: 5,
    // visibility is handled by opacity now
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

export default Signin;
