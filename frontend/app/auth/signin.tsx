import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { sendOtpApi } from "@/api";

const Signin = () => {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false); // Loading state

  const handleLogin = async (data) => {
    const { phone } = data;
    if (!phone) {
      Toast.show({
        type: "error",
        text1: "Please enter both name and phone number",
      });
      return;
    }
    setLoading(true); // Show loading spinner

    try {
      await SecureStore.setItemAsync("user", JSON.stringify({ phone }));
      const sendOtp = await sendOtpApi({ mobile: phone });
      if (sendOtp.status === 200) {
        router.push("/auth/otp");
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Something went wrong. Please try again.",
      });
      console.error(err);
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.phone && { borderColor: "red" }]}
              placeholder="Enter phone number"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
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
            { visibility: errors.phone ? "visible" : "hidden" },
          ]}
        >
          {errors.phone?.message}
        </Text>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit(handleLogin)}
        disabled={loading} // Disable if loading
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Sign Up Link */}
      <TouchableOpacity onPress={() => router.push("/auth/signup")}>
        <Text style={styles.signInText}>
          Don't have an account? <Text style={styles.signInLink}>Sign Up</Text>
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
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 40,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#6200ea",
    paddingVertical: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
    visibility: "hidden", // Initially hidden
  },
  signInText: {
    fontSize: 14,
    color: "#333",
    marginTop: 20,
  },
  signInLink: {
    color: "#6200ea",
    fontWeight: "bold",
  },
});

export default Signin;
