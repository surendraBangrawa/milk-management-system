import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
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
import Checkbox from "expo-checkbox"; // Import Checkbox from expo-checkbox
import { sendOtpApi, signUpApi } from "@/redux/slice/auth/authApi";
import logger from "@/lib/logger";

import useTheme from "@/context/theme/useTheme";
import { useTranslation } from "react-i18next";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import {
  scaleWidth,
  scaleHeight,
  getResponsiveFontSize,
} from "@/utils/responsiveUtils";
import { getKeyboardOffset } from "@/utils/platformUtils";

const Signup = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation(); // Initialize useTranslation

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      phone: "",
      referral: "",
      agreeToTerms: false,
    },
  });
  const [loading, setLoading] = useState(false); // Loading state
  const [isFocused, setIsFocused] = useState(false); // Focus state for phone input
  const [showSuccess, setShowSuccess] = useState(false); // Success state
  const [isLandscape, setIsLandscape] = useState(false); // Landscape mode
  const [isHighContrast, setIsHighContrast] = useState(false); // High contrast mode

  // Animation refs
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

  // Memoized focus handlers to prevent unnecessary re-renders
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleSignup = async (data: {
    name: string;
    phone: string;
    referral?: string;
    agreeToTerms: boolean;
  }) => {
    try {
      // Haptic feedback on button press
      if (Platform.OS === "ios") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

      setLoading(true);
      const { name, phone, referral } = data;

      const signUpResponse = await signUpApi({
        name: name,
        mobile: phone,
        referral_code: referral,
      });

      if (signUpResponse.status === 200 || signUpResponse.status === 201) {
        await SecureStore.setItemAsync(
          "user",
          JSON.stringify({ name, phone, referral })
        );
        const sendOtpResponse = await sendOtpApi({ mobile_number: phone });
        if (sendOtpResponse.status === 200) {
          // Success haptic feedback
          if (Platform.OS === "ios") {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
          } else {
            Vibration.vibrate([0, 100, 50, 100]);
          }

          // Success animation
          setShowSuccess(true);
          Animated.timing(buttonScaleAnim, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            Animated.timing(buttonScaleAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          });

          Toast.show({
            type: "success",
            text1: t("signup.success_otp_sent"), // Translated
          });

          // Navigate after a short delay to show success state
          setTimeout(() => {
            router.push("/auth/otp");
          }, 1000);
        }
      }
    } catch (err: any) {
      logger.error("Signup failed", err, {
        phone: data.phone,
        name: data.name,
      });
      // Error haptic feedback
      if (Platform.OS === "ios") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Vibration.vibrate([0, 200, 100, 200]);
      }

      // Input shake animation for errors
      Animated.sequence([
        Animated.timing(inputShakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputShakeAnim, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputShakeAnim, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(inputShakeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      let errorMessage =
        err?.response?.data?.detail ||
        err.message ||
        t("common.something_went_wrong"); // Translated generic error

      // If the error message matches the backend's 'user already exists', use the translation key
      if (
        errorMessage === t("auth.user_already_exists") ||
        errorMessage.toLowerCase().includes("already exists")
      ) {
        errorMessage = t("auth.user_already_exists");
      }

      Toast.show({
        type: "error",
        text1: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignInRedirect = () => {
    router.push("/auth/signin");
  };

  const handleOpenTerms = () => {
    // Replace with your actual Terms and Conditions URL
    const termsUrl = "https://www.example.com/terms";
    Linking.openURL(termsUrl).catch((err) =>
      logger.error("Failed to open URL", err as Error)
    );
  };

  return (
    <SafeAreaWrapper edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={getKeyboardOffset(0)}
        enabled={true}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          bounces={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
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
              {t("signup.title")} {/* Translated title */}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t("signup.subtitle")} {/* Translated subtitle */}
            </Text>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: errors.name
                              ? colors.error
                              : colors.border,
                            backgroundColor: colors.surface,
                            color: colors.textPrimary,
                          },
                        ]}
                        placeholder={t("signup.name_placeholder")} // Translated placeholder
                        placeholderTextColor={colors.textSecondary}
                        value={value}
                        onChangeText={onChange}
                        autoComplete="name"
                        textContentType="name"
                        accessibilityLabel={t("signup.name_placeholder")}
                        accessibilityRole="text"
                        editable={!loading}
                        autoFocus={true}
                      />
                    )}
                    name="name"
                    rules={{ required: t("signup.name_required") }} // Translated validation message
                  />
                </View>
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.error,
                      opacity: errors.name ? 1 : 0,
                    },
                  ]}
                >
                  {errors.name?.message as string}
                </Text>
              </View>

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
                        placeholder={t("signup.phone_placeholder")} // Translated placeholder
                        placeholderTextColor={colors.textSecondary}
                        value={value}
                        onChangeText={onChange}
                        onBlur={() => {
                          onBlur();
                          handleBlur();
                        }}
                        onFocus={handleFocus}
                        keyboardType="phone-pad"
                        maxLength={10}
                        returnKeyType="done"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        accessibilityLabel={t("signup.phone_placeholder")}
                        accessibilityHint={t("signup.phone_hint")}
                        accessibilityRole="text"
                        accessibilityState={{ disabled: loading }}
                        editable={!loading}
                      />
                    )}
                    name="phone"
                    rules={{
                      required: t("signup.phone_required"), // Translated validation message
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: t("signup.phone_invalid"), // Translated validation message
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
                  {errors.phone?.message as string}
                </Text>
              </Animated.View>

              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="gift-outline"
                    size={20}
                    color={colors.textSecondary}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={[
                          styles.input,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                            color: colors.textPrimary,
                          },
                        ]}
                        placeholder={t("signup.referral_placeholder")} // Translated placeholder
                        placeholderTextColor={colors.textSecondary}
                        value={value}
                        onChangeText={onChange}
                        autoComplete="off"
                        accessibilityLabel={t("signup.referral_placeholder")}
                        accessibilityRole="text"
                        editable={!loading}
                      />
                    )}
                    name="referral"
                  />
                </View>
                <Text style={[styles.errorText, { opacity: 0 }]}>
                  {t("signup.referral_optional_error_placeholder")}
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
                          color={value ? colors.primary : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.checkboxLabel,
                            { color: colors.textPrimary },
                          ]}
                        >
                          {t("signup.agree_to_the")}{" "}
                          <Text
                            style={[
                              styles.termsText,
                              { color: colors.primary },
                            ]}
                            onPress={handleOpenTerms}
                          >
                            {t("signup.terms_and_conditions")}
                          </Text>
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.errorText,
                          {
                            color: colors.error,
                            marginTop: 0,
                            opacity: errors.agreeToTerms ? 1 : 0,
                          },
                        ]}
                      >
                        {errors?.agreeToTerms?.message as string}
                      </Text>
                    </>
                  )}
                  rules={{
                    required: t("signup.terms_required"), // Translated validation message
                  }}
                />
              </View>

              <Animated.View
                style={{
                  transform: [{ scale: buttonScaleAnim }],
                  width: "100%",
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: showSuccess
                        ? "#10B981" // Success color (emerald-500)
                        : loading
                        ? colors.border
                        : colors.primary,
                      opacity: loading ? 0.8 : 1,
                    },
                    isHighContrast && styles.highContrastButton,
                  ]}
                  onPress={handleSubmit(handleSignup)}
                  disabled={loading}
                  accessibilityLabel={t("signup.button_text")}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading }}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.surface} />
                      <Text
                        style={[styles.loadingText, { color: colors.surface }]}
                      >
                        {t("signup.creating_account")}
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
                        {t("signup.success_message")}
                      </Text>
                    </View>
                  ) : (
                    <Text
                      style={[styles.buttonText, { color: colors.surface }]}
                    >
                      {t("signup.button_text")} {/* Translated button text */}
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.spacer} />

            <TouchableOpacity onPress={handleSignInRedirect}>
              <Text style={[styles.signInText, { color: colors.textPrimary }]}>
                {t("signup.already_have_account_prompt")}{" "}
                {/* Translated prompt */}
                <Text style={[styles.signInLink, { color: colors.primary }]}>
                  {t("signup.signin_link")} {/* Translated link */}
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
    paddingVertical: scaleHeight(32), // Balanced vertical padding
    minHeight: scaleHeight(500), // Reasonable minimum height
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
    marginBottom: scaleHeight(24), // Balanced space before form
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
    marginBottom: scaleHeight(12), // Compact spacing between inputs
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
    width: "100%",
  },
  button: {
    paddingVertical: scaleHeight(15),
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: scaleHeight(16), // Balanced space above button
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
    marginTop: scaleHeight(8), // More space above error text
    textAlign: "center",
    minHeight: scaleHeight(20), // Reserve more space for error text
    lineHeight: scaleHeight(16), // Consistent line height
  },
  checkboxContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: scaleHeight(12), // Compact space above checkbox
    marginBottom: scaleHeight(12), // Compact space below checkbox
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: scaleWidth(10),
  },
  checkboxLabel: {
    flex: 1,
    fontSize: getResponsiveFontSize(14),
    lineHeight: scaleHeight(20), // Better line height
  },
  termsText: {
    textDecorationLine: "underline",
  },
  signInText: {
    fontSize: getResponsiveFontSize(14),
    marginTop: scaleHeight(20),
    textAlign: "center",
    lineHeight: scaleHeight(20), // Consistent line height
  },
  signInLink: {
    fontWeight: "bold",
  },
  spacer: {
    height: scaleHeight(20), // Balanced space between button and signin link
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

export default Signup;
