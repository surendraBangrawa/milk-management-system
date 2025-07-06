import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message";
import { useSession } from "@/context/AuthProvider";
import { loginApi, sendOtpApi } from "@/redux/slice/auth/authApi";

import useTheme from "@/context/theme/useTheme";
import { useTranslation } from "react-i18next"; // Import useTranslation

const OTP = () => {
  const { signIn } = useSession();
  const { colors, themeMode } = useTheme();
  const { t } = useTranslation(); // Initialize useTranslation
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";

  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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

  const handleVerifyOTP = async (data: { otp: string }) => {
    // Added type for data
    if (isVerifying) return;

    setIsVerifying(true);
    const { otp } = data;
    try {
      const userString = await SecureStore.getItemAsync("user");
      const user = userString ? JSON.parse(userString) : null;
      const phone = user?.phone;

      if (!phone) {
        Toast.show({ type: "error", text1: t("otp.phone_not_found") }); // Translated
        setIsVerifying(false);
        return;
      }
      const response = await loginApi({ mobile: phone, otp });
      if (response.status === 200) {
        const accessToken = response?.data?.access_token;
        if (accessToken) {
          signIn(accessToken);
          router.push("/(app)/(tabs)/(home)");
        } else {
          Toast.show({
            type: "error",
            text1: t("otp.login_failed_no_token"), // Translated
          });
        }
      } else {
        const errorData = await response.json();
        const errorMessage =
          errorData?.message || t("otp.invalid_otp_fallback"); // Translated fallback
        Toast.show({ type: "error", text1: errorMessage });
      }
    } catch (error: any) {
      console.error("Verify OTP Error:", error);
      Toast.show({
        type: "error",
        text1: t("common.error_verifying_otp"), // Translated generic error
        text2: error.message || t("common.try_again"), // Translated generic error detail
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend || isResending) return;

    setIsResending(true);
    try {
      const userString = await SecureStore.getItemAsync("user");
      const user = userString ? JSON.parse(userString) : null;
      const phone = user?.phone;

      if (!phone) {
        Toast.show({ type: "error", text1: t("otp.phone_not_found") }); // Translated
        setIsResending(false);
        return;
      }
      const resendOtpResponse = await sendOtpApi({ mobile_number: phone });
      if (resendOtpResponse.status === 200) {
        Toast.show({ type: "success", text1: t("otp.otp_sent_success") }); // Translated success
        setTimer(180); // Reset timer
        setCanResend(false); // Disable resend until timer runs out
      } else {
        const errorData = await resendOtpResponse.json();
        const errorMessage =
          errorData?.message || t("otp.failed_to_send_otp_fallback"); // Translated fallback
        Toast.show({ type: "error", text1: errorMessage });
      }
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      Toast.show({
        type: "error",
        text1: t("common.error_sending_otp"), // Translated generic error
        text2: error.message || t("common.try_again"), // Translated generic error detail
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.surface} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {t("otp.enter_otp_title")} {/* Translated title */}
      </Text>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: errors.otp ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                  color: colors.textPrimary,
                },
              ]}
              placeholder={t("otp.otp_placeholder")} // Translated placeholder
              placeholderTextColor={colors.textSecondary}
              value={value}
              onChangeText={onChange}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}
          name="otp"
          rules={{
            required: t("otp.otp_required"), // Translated validation message
            minLength: { value: 6, message: t("otp.otp_length_invalid") }, // Translated validation message
            maxLength: { value: 6, message: t("otp.otp_length_invalid") }, // Translated validation message
          }}
        />
        <Text
          style={[
            styles.errorText,
            {
              color: colors.error,
              opacity: errors.otp ? 1 : 0,
            },
          ]}
        >
          {errors?.otp?.message as string}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isVerifying ? colors.border : colors.primary },
        ]}
        onPress={handleSubmit(handleVerifyOTP)}
        disabled={isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {t("otp.verify_button")} {/* Translated button text */}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleResendOTP}
        disabled={!canResend || isResending}
      >
        {isResending ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text
            style={[
              styles.resendButtonText,
              { color: canResend ? colors.primary : colors.textSecondary },
            ]}
          >
            {canResend
              ? t("otp.resend_button") // Translated resend text
              : t("otp.resend_timer", {
                  // Translated timer text with interpolation
                  minutes: Math.floor(timer / 60),
                  seconds: String(timer % 60).padStart(2, "0"),
                })}
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
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
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
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  resendButton: {
    marginTop: 20,
  },
  resendButtonText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
});

export default OTP;
