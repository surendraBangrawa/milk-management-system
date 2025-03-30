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
import { sendOtpApi, signUpApi } from "@/api";
import Toast from "react-native-toast-message";
import Checkbox from "expo-checkbox"; // Import Checkbox from expo-checkbox

const Signup = () => {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false); // Loading state

  const handleSignup = async (data) => {
    if (!data.agreeToTerms) {
      Toast.show({
        type: "error",
        text1: "You must agree to the terms and conditions",
      });
      return;
    }

    try {
      setLoading(true);
      const { name, phone, referral } = data;
      await SecureStore.setItemAsync(
        "user",
        JSON.stringify({ name, phone, referral })
      );
      const response = await signUpApi({
        name: name,
        mobile: phone,
        referral_code: referral,
      });
      console.log(response);
      if (response.status === 200) {
        const sendOtp = await sendOtpApi({ mobile: phone });
        if (sendOtp.status === 200) {
          router.push("/auth/otp");
        }
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.response?.data?.detail,
      });
      console.log(err);
    } finally {
      setLoading(false); // Hide loading spinner after the API call is complete
    }
  };

  const handleSignInRedirect = () => {
    router.push("/auth/signin"); // Redirect to Sign In page
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.name && { borderColor: "red" }]}
              placeholder="Enter name"
              value={value}
              onChangeText={onChange}
            />
          )}
          name="name"
          rules={{ required: "Name is required" }}
        />
        <Text
          style={[
            styles.errorText,
            { visibility: errors.name ? "visible" : "hidden" },
          ]}
        >
          {errors.name?.message}
        </Text>
      </View>

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

      <View style={styles.inputContainer}>
        <Controller
          control={control}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Enter referral code"
              value={value}
              onChangeText={onChange}
            />
          )}
          name="referral"
        />
      </View>

      {/* Terms and Conditions Checkbox */}
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
                />
                <Text style={styles.checkboxLabel}>
                  I agree to the{" "}
                  <Text style={styles.termsText}>Terms and Conditions</Text>
                </Text>
              </View>
              <Text
                style={[
                  styles.errorText,
                  { visibility: errors.agreeToTerms ? "visible" : "hidden" },
                ]}
              >
                {errors?.agreeToTerms &&
                  "You must agree to the terms and conditions"}
              </Text>
            </>
          )}
          rules={{ required: "You must agree to the terms and conditions" }}
        />
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit(handleSignup)}
        disabled={loading} // Disable if loading
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      {/* Sign In Link */}
      <TouchableOpacity onPress={handleSignInRedirect}>
        <Text style={styles.signInText}>
          Already have an account?{" "}
          <Text style={styles.signInLink}>Sign In</Text>
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
    visibility: "hidden",
  },
  checkboxContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 15,
  },
  checkboxWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#333",
  },
  termsText: {
    color: "#6200ea",
    textDecorationLine: "underline",
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

export default Signup;
