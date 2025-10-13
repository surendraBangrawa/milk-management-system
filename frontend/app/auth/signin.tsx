import { useState, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import { getKeyboardOffset } from "@/utils/platformUtils";

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
  const [isLandscape, setIsLandscape] = useState(false); // Landscape mode
  const [isHighContrast, setIsHighContrast] = useState(false); // High contrast mode

  // Animation refs - simplified
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const inputShakeAnim = useRef(new Animated.Value(0)).current;

  // Enhanced useEffect with animations and responsive features
  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Landscape detection
    const updateLayout = () => {
      const { width, height } = Dimensions.get("window");
      setIsLandscape(width > height);
    };

    const subscription = Dimensions.addEventListener("change", updateLayout);
    updateLayout(); // Initial check

    // High contrast detection (simplified)
    setIsHighContrast(Platform.OS === "ios" && Platform.isPad);

    return () => {
      subscription?.remove();
    };
  }, [fadeAnim, scaleAnim, slideAnim]);

  const handleLogin = async (data: { phone: string }) => {
    // Added type for data
    const { phone } = data;

    // Haptic feedback on button press
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(50);
    }

    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true); // Show loading spinner

    try {
      // Store the phone number after successful validation, before sending OTP
      await SecureStore.setItemAsync("user", JSON.stringify({ phone }));

      // Assuming sendOtpApi returns a Response object or similar
      const sendOtpResponse = await sendOtpApi({ mobile_number: phone });

      if (sendOtpResponse.status === 200) {
        setShowSuccess(true);

        // Success haptic feedback
        if (Platform.OS === "ios") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          Vibration.vibrate([100, 50, 100]);
        }

        // Success animation
        Animated.sequence([
          Animated.timing(buttonScaleAnim, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        Toast.show({ type: "success", text1: t("signin.otp_success") }); // Translated success toast
        // Small delay for success animation
        setTimeout(() => {
          router.push("/auth/otp");
        }, 1000);
      } else {
        // Handle API errors with specific messages if available
        const errorData = sendOtpResponse.data; // Get data directly from axios response
        const errorMessage =
          errorData?.message || t("signin.otp_failed_fallback"); // Translated fallback
        Toast.show({ type: "error", text1: errorMessage });
      }
    } catch (err: any) {
      console.error("Sign In Error:", err); // Log the actual error

      // Error haptic feedback
      if (Platform.OS === "ios") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate([200, 100, 200]);
      }

      // Simple, fast error animation
      Animated.sequence([
        Animated.timing(inputShakeAnim, {
          toValue: 5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(inputShakeAnim, {
          toValue: -5,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(inputShakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

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
          <Animated.View
            style={[
              styles.container,
              {
                backgroundColor: colors.background,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
              isLandscape && styles.landscapeContainer,
              isHighContrast && styles.highContrastContainer,
            ]}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t("signin.title")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("signin.subtitle")}
            </Text>

            <View style={styles.formContainer}>
              <Animated.View
                style={[
                  styles.inputContainer,
                  {
                    transform: [{ translateX: inputShakeAnim }],
                  },
                ]}
              >
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
                        onFocus={() => {
                          setIsFocused(true);
                        }}
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="done"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        accessibilityLabel={t("signin.phone_placeholder")}
                        accessibilityHint={t("signin.send_otp_hint")}
                        accessibilityRole="text"
                        accessibilityState={{ disabled: loading }}
                        editable={!loading}
                        autoFocus={true}
                        importantForAccessibility="yes"
                        accessibilityLiveRegion="polite"
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
              </Animated.View>

              <Animated.View
                style={{
                  transform: [{ scale: buttonScaleAnim }],
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: showSuccess
                        ? "#10B981" // Better success color (emerald-500)
                        : colors.primary, // Keep primary color during loading
                      opacity: loading ? 0.8 : 1, // Less opacity change
                    },
                    isHighContrast && styles.highContrastButton,
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
                  accessibilityState={{
                    disabled: loading || showSuccess,
                    busy: loading,
                  }}
                  accessibilityLiveRegion="polite"
                  importantForAccessibility="yes"
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
                    <Text
                      style={[styles.buttonText, { color: colors.surface }]}
                    >
                      {t("signin.send_otp")}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
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
          </Animated.View>
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
    fontWeight: "700", // Extra bold
    marginBottom: scaleHeight(8),
    textAlign: "center",
    letterSpacing: -0.5, // Tighter letter spacing for large text
  },
  subtitle: {
    fontSize: getResponsiveFontSize(16),
    marginBottom: scaleHeight(32),
    textAlign: "center",
    opacity: 0.7, // Slightly more subtle
    lineHeight: scaleHeight(22), // Better line height
  },
  formContainer: {
    width: "100%",
    marginBottom: scaleHeight(0), // No extra margin needed
  },
  inputContainer: {
    width: "100%",
    marginBottom: scaleHeight(12), // Reduced space between input and button
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
    paddingHorizontal: scaleWidth(45),
    fontSize: getResponsiveFontSize(16),
    textAlign: "center",
    width: "100%",
  },
  button: {
    paddingVertical: scaleHeight(15),
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleHeight(0),
    height: scaleHeight(50),
    minHeight: scaleHeight(50),
  },
  buttonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: "600", // Slightly bolder
    letterSpacing: 0.5, // Better letter spacing
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
  // Landscape mode styles
  landscapeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: scaleWidth(40),
  },
  // High contrast mode styles
  highContrastContainer: {
    borderWidth: 2,
    borderColor: "#000",
  },
  highContrastButton: {
    borderWidth: 2,
    borderColor: "#000",
  },
});

export default Signin;
