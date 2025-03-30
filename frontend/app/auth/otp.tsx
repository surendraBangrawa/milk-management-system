import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { loginApi, sendOtpApi } from "@/api";
import { useSession } from "@/context/AuthProvider";

const OTP = () => {
  const { signIn } = useSession();
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          clearInterval(countdown);
          setCanResend(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, []);

  const handleVerifyOTP = async (data) => {
    const { otp } = data;
    try {
      const user = await AsyncStorage.getItem("user");
      const { phone } = user ? JSON.parse(user) : {};
      const response = await loginApi({ mobile: phone, otp });
      if (response.status === 200) {
        const accessToken = response?.data?.access_token;
        signIn(accessToken);
        router.push("/(app)/(tabs)/(home)");
      } else {
        Toast.show({ type: "error", text1: "Invalid OTP" });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Error verifying OTP" });
    }
  };

  const handleResendOTP = async () => {
    if (canResend) {
      setTimer(180);
      setCanResend(false);
      const user = await AsyncStorage.getItem("user");
      const { phone } = user ? JSON.parse(user) : {};
      const resendOtp = await sendOtpApi({ mobile: phone });
      if (resendOtp.status === 200) {
        Toast.show({ type: "success", text1: "OTP sent successfully!" });
      }
    } else {
      Toast.show({
        type: "info",
        text1: `Please wait ${timer} seconds to resend OTP.`,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter OTP</Text>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.otp && { borderColor: "red" }]}
              placeholder="Enter 6-digit OTP"
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
          }}
        />
        <Text
          style={[
            styles.errorText,
            { visibility: errors.otp ? "visible" : "hidden" },
          ]}
        >
          {errors?.otp?.message}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit(handleVerifyOTP)}
      >
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resendButton} onPress={handleResendOTP}>
        <Text style={styles.resendButtonText}>
          {canResend
            ? "Resend OTP"
            : `Resend OTP in ${Math.floor(timer / 60)}:${String(
                timer % 60
              ).padStart(2, "0")}`}
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
  resendButton: {
    marginTop: 20,
  },
  resendButtonText: {
    fontSize: 16,
    color: "#6200ea",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
    visibility: "hidden",
  },
});

export default OTP;
