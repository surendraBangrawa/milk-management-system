import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar, // Import ActivityIndicator if you add loading state to buttons
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { useSession } from "@/context/AuthProvider";
import { loginApi, sendOtpApi } from "@/redux/slice/auth/authApi";

import useTheme from "@/context/theme/useTheme";

const OTP = () => {
  const { signIn } = useSession();
  const { colors, themeMode } = useTheme();
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";

  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // State for verify button loading
  const [isResending, setIsResending] = useState(false); // State for resend button loading

  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    // Only start the timer if canResend is false (i.e., after initial send or a successful resend)
    if (!canResend) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            setCanResend(true);
            return 0; // Ensure timer doesn't go negative
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [canResend]); // Depend on canResend to restart timer

  const handleVerifyOTP = async (data) => {
    if (isVerifying) return; // Prevent double submission

    setIsVerifying(true);
    const { otp } = data;
    try {
      const user = await SecureStore.getItemAsync("user");
      const { phone } = user ? JSON.parse(user) : {};
      if (!phone) {
        Toast.show({ type: "error", text1: "Phone number not found." });
        setIsVerifying(false);
        return;
      }
      const response = await loginApi({ mobile: phone, otp });
      if (response.status === 200) {
        const accessToken = response?.data?.access_token;
        if (accessToken) {
          signIn(accessToken);
          router.push("/(app)/(tabs)/(home)"); // Navigate on success
        } else {
          Toast.show({
            type: "error",
            text1: "Login failed: No access token.",
          });
        }
      } else {
        // Handle API errors with specific messages if available
        const errorData = await response.json(); // Assuming JSON error response
        const errorMessage = errorData?.message || "Invalid OTP";
        Toast.show({ type: "error", text1: errorMessage });
      }
    } catch (error: any) {
      console.error("Verify OTP Error:", error); // Log the actual error
      Toast.show({
        type: "error",
        text1: "Error verifying OTP",
        text2: error.message || "Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isResending) return; // Prevent resending if not allowed or already resending

    setIsResending(true);
    try {
      const user = await SecureStore.getItemAsync("user");
      const { phone } = user ? JSON.parse(user) : {};
      if (!phone) {
        Toast.show({ type: "error", text1: "Phone number not found." });
        setIsResending(false);
        return;
      }
      const resendOtp = await sendOtpApi({ mobile: phone });
      if (resendOtp.status === 200) {
        Toast.show({ type: "success", text1: "OTP sent successfully!" });
        setTimer(180); // Reset timer
        setCanResend(false); // Disable resend until timer runs out
      } else {
        const errorData = await resendOtp.json(); // Assuming JSON error response
        const errorMessage = errorData?.message || "Failed to send OTP";
        Toast.show({ type: "error", text1: errorMessage });
      }
    } catch (error: any) {
      console.error("Resend OTP Error:", error); // Log the actual error
      Toast.show({
        type: "error",
        text1: "Error sending OTP",
        text2: error.message || "Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    // Apply theme background color to the main container
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.surface} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        Enter OTP
      </Text>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                // Apply theme colors to input border, background, and text
                {
                  borderColor: errors.otp ? colors.error : colors.border, // Error color for border if there's an error
                  backgroundColor: colors.surface,
                  color: colors.textPrimary, // Text color from theme
                },
              ]}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={colors.textSecondary} // Themed placeholder color
              value={value}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}
          name="otp"
          rules={{
            required: "OTP is required",
            minLength: { value: 6, message: "OTP must be 6 digits" },
            maxLength: { value: 6, message: "OTP must be 6 digits" }, // Added max length rule for clarity
          }}
        />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error,
              opacity: errors.otp ? 1 : 0, // Use opacity to show/hide
            },
          ]}
        >
          {errors?.otp?.message as string}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          // Apply theme primary color to button background, or border color when disabled
          { backgroundColor: isVerifying ? colors.border : colors.primary },
        ]}
        onPress={handleSubmit(handleVerifyOTP)}
        disabled={isVerifying} // Disable button while verifying
      >
        {isVerifying ? (
          // Apply theme surface color to the activity indicator
          <ActivityIndicator color={colors.surface} />
        ) : (
          // Apply theme surface color to button text (assuming white/light text on primary/border)
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            Verify OTP
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendOTP}
        disabled={!canResend || isResending} // Disable based on canResend and isResending state
      >
        {isResending ? (
          // Apply theme primary color to resend indicator
          <ActivityIndicator color={colors.primary} />
        ) : (
          // Apply theme primary color to resend button text
          <Text
            style={[
              styles.resendButtonText,
              { color: canResend ? colors.primary : colors.textSecondary }, // Dim text when not allowed to resend
            ]}
          >
            {canResend
              ? "Resend OTP"
              : `Resend OTP in ${Math.floor(timer / 60)}:${String(
                  timer % 60
                ).padStart(2, "0")}`}
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
  resendButton: {
    marginTop: 20,
  },
  resendButtonText: {
    fontSize: 16,
    // color handled by theme inline (based on state)
  },
  errorText: {
    // color handled by theme inline
    fontSize: 12,
    marginTop: 5,
    // visibility is handled by conditional rendering now
  },
});

export default OTP;
