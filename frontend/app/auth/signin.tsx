import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { sendOtpApi } from "@/redux/slice/auth/authApi";

// Import your useTheme hook
import useTheme from "@/context/theme/useTheme";
// Import useTranslation hook
import { useTranslation } from "react-i18next";

const Signin = () => {
  const router = useRouter();
  const { colors, themeMode } = useTheme();
  const { t } = useTranslation(); // Initialize useTranslation
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ phone: string }>();
  const [loading, setLoading] = useState(false); // Loading state

  const handleLogin = async (data: { phone: string }) => {
    // Added type for data
    const { phone } = data;
    setLoading(true); // Show loading spinner

    try {
      // Store the phone number after successful validation, before sending OTP
      await SecureStore.setItemAsync("user", JSON.stringify({ phone }));

      // Assuming sendOtpApi returns a Response object or similar
      const sendOtpResponse = await sendOtpApi({ mobile_number: phone });

      if (sendOtpResponse.status === 200) {
        Toast.show({ type: "success", text1: t("signin.otp_success") }); // Translated success toast
        router.push("/auth/otp");
      } else {
        // Handle API errors with specific messages if available
        const errorData = sendOtpResponse.data; // Get data directly from axios response
        const errorMessage =
          errorData?.message || t("signin.otp_failed_fallback"); // Translated fallback
        Toast.show({ type: "error", text1: errorMessage });
      }
    } catch (err: any) {
      console.error("Sign In Error:", err); // Log the actual error

      // Extract error message from axios error response
      let errorMessage = t("common.try_again"); // Default fallback

      if (err.response?.data?.detail) {
        // Handle structured error response
        if (
          typeof err.response.data.detail === "object" &&
          err.response.data.detail.message
        ) {
          errorMessage = err.response.data.detail.message;
        } else if (typeof err.response.data.detail === "string") {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      Toast.show({
        type: "error",
        text1: t("common.error"), // Translated generic error
        text2: errorMessage, // Show the actual error message
      });
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <StatusBar
              barStyle={statusBarStyle}
              backgroundColor={colors.surface}
            />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t("signin.title")} {/* Translated title */}
            </Text>

            <View style={styles.inputContainer}>
              <Controller
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.phone
                          ? colors.error
                          : colors.border,
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder={t("signin.phone_placeholder")} // Translated placeholder
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                )}
                name="phone"
                rules={{
                  required: t("signin.phone_required"), // Translated validation message
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: t("signin.phone_invalid"), // Translated validation message
                  },
                }}
              />
              <Text
                style={[
                  styles.errorText,
                  {
                    color: colors.error,
                    opacity: errors.phone ? 1 : 0,
                  },
                ]}
              >
                {errors.phone?.message as string}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: loading ? colors.border : colors.primary },
              ]}
              onPress={handleSubmit(handleLogin)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.surface }]}>
                  {t("signin.login_button")} {/* Translated button text */}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={[styles.signInText, { color: colors.textPrimary }]}>
                {t("signin.no_account_prompt")} {/* Translated prompt */}
                <Text style={[styles.signInLink, { color: colors.primary }]}>
                  {t("signin.signup_link")} {/* Translated link */}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
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
  label: {
    fontSize: 16,
    marginBottom: 5,
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
  errorText: {
    fontSize: 12,
    marginTop: 5,
  },
  signInText: {
    fontSize: 14,
    marginTop: 20,
  },
  signInLink: {
    fontWeight: "bold",
  },
});

export default Signin;
