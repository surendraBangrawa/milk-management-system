import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import Toast from "react-native-toast-message";
import { saveContactApi } from "@/api";
const ProfileIcon = require("../../../../assets/images/avatar.jpg");

const AddCustomerFormScreen = () => {
  const router = useRouter();
  const { mobile, name } = useLocalSearchParams();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: name || "",
      mobile: mobile || "",
    },
  });
  const [loading, setLoading] = useState(false); // Loading state

  const handleAddCustomer = async (data) => {
    const { name, mobile } = data;
    if (!name || !mobile) {
      Toast.show({
        type: "error",
        text1: "Please enter both name and mobile number",
      });
      return;
    }
    setLoading(true); // Show loading spinner

    try {
      await saveContactApi({ name, mobile });
      Toast.show({
        type: "success",
        text1: "Customer Added!",
        text2: `Successfully added ${name}.`,
      });
      router.push("/(app)/(tabs)/(home)");
    } catch (err) {
      console.log(err);
      Toast.show({
        type: "error",
        text1: "Failed to Add Customer",
        text2:
          err?.response?.data?.detail ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Add Customer",
        }}
      />

      {/* Static Profile Icon */}
      <Image source={ProfileIcon} style={styles.avatar} />

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
          rules={{
            required: "Name is required",
          }}
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
              style={[styles.input, errors.mobile && { borderColor: "red" }]}
              placeholder="Enter mobile number"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              maxLength={10}
              keyboardAppearance="dark"
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
            { visibility: errors.mobile ? "visible" : "hidden" },
          ]}
        >
          {errors.mobile?.message}
        </Text>
      </View>

      {/* Add Customer Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit(handleAddCustomer)}
        disabled={loading} // Disable if loading
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Customer</Text>
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
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
    visibility: "hidden", // Initially hidden
  },

  // Avatar styles
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
});

export default AddCustomerFormScreen;
