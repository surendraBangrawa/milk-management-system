import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Linking,
  Platform,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import Checkbox from "expo-checkbox"; // Import Checkbox from expo-checkbox
import { sendOtpApi, signUpApi } from "@/redux/slice/auth/authApi";

import useTheme from "@/context/theme/useTheme";
// Import useTranslation hook
import { useTranslation } from "react-i18next";

const Signup = () => {
  const router = useRouter();
  const { colors, themeMode } = useTheme();
  const { t } = useTranslation(); // Initialize useTranslation
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";

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

  const handleSignup = async (data: {
    name: string;
    phone: string;
    referral?: string;
    agreeToTerms: boolean;
  }) => {
    try {
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
          Toast.show({
            type: "success",
            text1: t("signup.success_otp_sent"), // Translated
          });
          router.push("/auth/otp");
        }
      }
    } catch (err: any) {
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
      console.error("Failed to open URL:", err)
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={colors.surface} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t("signup.title")} {/* Translated title */}
          </Text>

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.name ? colors.error : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t("signup.name_placeholder")} // Translated placeholder
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                />
              )}
              name="name"
              rules={{ required: t("signup.name_required") }} // Translated validation message
            />
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

          <View style={styles.inputContainer}>
            <Controller
              control={control}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.phone ? colors.error : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t("signup.phone_placeholder")} // Translated placeholder
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="phone-pad"
                  maxLength={10}
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

          <View style={styles.inputContainer}>
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
                />
              )}
              name="referral"
            />
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
                      {t("signup.agree_to_the")}
                      <Text
                        style={[styles.termsText, { color: colors.primary }]}
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

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: loading ? colors.border : colors.primary },
            ]}
            onPress={handleSubmit(handleSignup)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                {t("signup.button_text")} {/* Translated button text */}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSignInRedirect}>
            <Text style={[styles.signInText, { color: colors.textPrimary }]}>
              {t("signup.already_have_account_prompt")}{" "}
              {/* Translated prompt */}
              <Text style={[styles.signInLink, { color: colors.primary }]}>
                {t("signup.signin_link")} {/* Translated link */}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    minHeight: 600,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
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
    minHeight: 15,
  },
  checkboxContainer: {
    width: "100%",
    alignItems: "flex-start",
    marginTop: 15,
    marginBottom: 15,
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
  },
  termsText: {
    textDecorationLine: "underline",
  },
  signInText: {
    fontSize: 14,
    marginTop: 20,
    textAlign: "center",
  },
  signInLink: {
    fontWeight: "bold",
  },
});

export default Signup;
