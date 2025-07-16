import { useState, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { saveContactApi } from "@/redux/slice/customers/customerApi";

import useTheme from "@/context/theme/useTheme";

// Assuming ProfileIcon is a static local image, it doesn't need theming
const ProfileIcon = require("../../../../assets/images/avatar.jpg");

const AddCustomerFormScreen = () => {
  const router = useRouter();
  const { colors, themeMode } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const { mobile, name } = useLocalSearchParams() as {
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
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      name: effectiveName ?? "",
      mobile: effectiveMobile ?? "",
    },
  });
  const [loading, setLoading] = useState(false);

  const handleAddCustomer = async (data: { name: string; mobile: string }) => {
    const { name, mobile } = data;

    if (!name || !mobile) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter both name and mobile number.",
      });
      if (!name)
        setError("name", { type: "manual", message: "Name is required" });
      if (!mobile)
        setError("mobile", {
          type: "manual",
          message: "Mobile number is required",
        });
      return;
    }

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
    clearErrors(["name", "mobile"]);

    setLoading(true);

    try {
      await saveContactApi({ name, mobile });

      Toast.show({
        type: "success",
        text1: "Customer Saved!",
        text2: `Successfully saved ${name}.`,
      });
      router.replace("/(app)/(tabs)/(home)");
    } catch (err: any) {
      console.error("Error saving customer:", err.response || err);
      Toast.show({
        type: "error",
        text1: "Failed to Save Customer",
        text2:
          err?.response?.data?.detail ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToButton = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: effectiveMobile ? "Edit Customer" : "Add Customer",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View
            style={[styles.container, { backgroundColor: colors.background }]}
          >
            <Image source={ProfileIcon} style={styles.avatar} />
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.name ? colors.error : colors.border,
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Enter name"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      // Focus next field or scroll to button
                      scrollToButton();
                    }}
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
                    color: colors.error,
                    opacity: errors.name ? 1 : 0,
                    height: errors.name ? "auto" : 0,
                  },
                ]}
              >
                {errors.name?.message}
              </Text>
            </View>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.mobile
                          ? colors.error
                          : colors.border,
                        backgroundColor: colors.surface,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onBlur={onBlur}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={scrollToButton}
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
                    color: colors.error,
                    opacity: errors.mobile ? 1 : 0,
                    height: errors.mobile ? "auto" : 0,
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
              ]}
              onPress={handleSubmit(handleAddCustomer)}
              disabled={loading || Object.keys(errors).length > 0}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </>
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
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
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
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 24,
    marginTop: 10,
  },
});

export default AddCustomerFormScreen;
