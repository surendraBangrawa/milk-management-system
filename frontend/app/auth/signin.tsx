import { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { sendOtpApi } from "@/redux/slice/auth/authApi";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import {
  scaleWidth,
  scaleHeight,
  getResponsiveFontSize,
} from "@/utils/responsiveUtils";
import { getShadowStyle, getKeyboardOffset } from "@/utils/platformUtils";

// Import your useTheme hook
import useTheme from "@/context/theme/useTheme";
// Import useTranslation hook
import { useTranslation } from "react-i18next";

const Signin = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation(); // Initialize useTranslation
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ phone: string }>();
  const [loading, setLoading] = useState(false); // Loading state
  const [isFocused, setIsFocused] = useState(false); // Focus state for input
  const [showSuccess, setShowSuccess] = useState(false); // Success state

  // Auto-focus on input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      // Auto-focus will be handled by the TextInput ref
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
        setShowSuccess(true);
        Toast.show({ type: "success", text1: t("signin.otp_success") }); // Translated success toast
        // Small delay for success animation
        setTimeout(() => {
          router.push("/auth/otp");
        }, 800);
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
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={getKeyboardOffset(0)}
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
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t("signin.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("signin.subtitle")}
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                  {t("signin.phone_label")}
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={isFocused ? colors.primary : colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    render={({ field: { onChange, value, onBlur } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: errors.phone
                              ? colors.error
                              : isFocused
                              ? colors.primary
                              : colors.border,
                            backgroundColor: colors.surface,
                            color: colors.textPrimary,
                            borderWidth: isFocused ? 2 : 1,
                          },
                        ]}
                        placeholder={t("signin.phone_placeholder")}
                        placeholderTextColor={colors.textSecondary}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => {
                          onBlur();
                          setIsFocused(false);
                        }}
                        onFocus={() => setIsFocused(true)}
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="done"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        accessibilityLabel={t("signin.phone_label")}
                        accessibilityHint={t("signin.phone_placeholder")}
                        editable={!loading}
                        autoFocus={true}
                      />
                    )}
                    name="phone"
                    rules={{
                      required: t("signin.phone_required"),
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: t("signin.phone_invalid"),
                      },
                    }}
                  />
                </View>
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                      opacity: errors.phone ? 1 : 0,
                    },
                  ]}
                >
                  {errors.phone?.message || " "}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: showSuccess ? "#4CAF50" : colors.primary, // Keep primary color during loading
                    opacity: loading ? 0.8 : 1, // Less opacity change
                    transform: [
                      { scale: loading ? 0.99 : showSuccess ? 1.02 : 1 }, // Subtle scale change
                    ],
                  },
                ]}
                onPress={handleSubmit(handleLogin)}
                disabled={loading || showSuccess}
                accessibilityRole="button"
                accessibilityLabel={
                  loading
                    ? t("common.loading")
                    : showSuccess
                    ? t("common.success")
                    : t("signin.send_otp")
                }
                accessibilityHint={t("signin.send_otp_hint")}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.surface} />
                    <Text
                      style={[styles.loadingText, { color: colors.surface }]}
                    >
                      {t("common.sending")}
                    </Text>
                  </View>
                ) : showSuccess ? (
                  <View style={styles.successContainer}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.surface}
                    />
                    <Text
                      style={[styles.successText, { color: colors.surface }]}
                    >
                      {t("common.success")}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.buttonText, { color: colors.surface }]}>
                    {t("signin.send_otp")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />

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
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: scaleHeight(32),
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleWidth(24),
    paddingVertical: scaleHeight(32),
    minHeight: scaleHeight(500), // Increased minimum height for stability
  },
  title: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: "bold",
    marginBottom: scaleHeight(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    marginBottom: scaleHeight(32),
    textAlign: "center",
    opacity: 0.8,
  },
  formContainer: {
    width: "100%",
    marginBottom: scaleHeight(0), // No extra margin needed
  },
  inputContainer: {
    width: "100%",
    marginBottom: scaleHeight(12), // Reduced space between input and button
  },
  label: {
    fontSize: getResponsiveFontSize(16),
    marginBottom: scaleHeight(8),
    textAlign: "left",
  },
  inputWrapper: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    width: "100%", // Ensure full width
  },
  inputIcon: {
    position: "absolute",
    left: scaleWidth(15),
    zIndex: 1,
  },
  input: {
    height: scaleHeight(50),
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: scaleWidth(45), // More padding for icon
    fontSize: getResponsiveFontSize(16),
    textAlign: "center", // Center the phone number input
    width: "100%", // Ensure full width
    ...getShadowStyle("#000", 0, 0.1, 2, { width: 0, height: 1 }),
  },
  button: {
    paddingVertical: scaleHeight(15),
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleHeight(0), // No extra margin since inputContainer already has marginBottom
    height: scaleHeight(50), // Fixed height instead of minHeight
    minHeight: scaleHeight(50), // Ensure minimum height
    ...getShadowStyle("#000", 2, 0.15, 4, { width: 0, height: 2 }),
  },
  buttonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scaleWidth(4), // Add some padding
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "600", // Slightly bolder
    marginLeft: scaleWidth(10), // More space between icon and text
    letterSpacing: 0.5, // Better letter spacing
  },
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: scaleWidth(4), // Add some padding
  },
  successText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: "600", // Slightly bolder
    marginLeft: scaleWidth(10), // More space between icon and text
    letterSpacing: 0.5, // Better letter spacing
  },
  errorText: {
    fontSize: getResponsiveFontSize(12),
    marginTop: scaleHeight(6),
    textAlign: "center",
    minHeight: scaleHeight(18), // Reserve space for error text
    lineHeight: scaleHeight(16), // Consistent line height
  },
  spacer: {
    height: scaleHeight(24), // More space between button and signup link
  },
  signInText: {
    fontSize: getResponsiveFontSize(14),
    textAlign: "center",
    lineHeight: scaleHeight(20), // Consistent line height
  },
  signInLink: {
    fontWeight: "bold",
  },
});

export default Signin;
