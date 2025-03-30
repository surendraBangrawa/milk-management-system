import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addSellerTransactionApi } from "@/api";
import Toast from "react-native-toast-message";

const AddTransactionScreen = () => {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const { amount, description, date } = data;
      const res = await addSellerTransactionApi({
        amount: amount,
        custom_date: date,
        expense_detail: description,
        seller_mobile: id,
        transaction_type: type?.toUpperCase(),
      });
      console.log(res);
      if (res?.status === 200) {
        Toast.show({
          type: "success",
          text1: "Transaction Added",
          text2: `Successfully added ${type} transaction!`,
        });
        router.back(); // Go back to the previous screen
      } else {
        throw new Error("Failed to add transaction.");
      }
    } catch (error: any) {
      console.log(error.response.data);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Something went wrong.",
      });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || transactionDate;
    setShowDatePicker(Platform.OS === "ios" ? true : false);
    setTransactionDate(currentDate);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: type === "GAVE" ? "You Gave" : "You Got",
        }}
      />
      <Controller
        control={control}
        name="amount"
        defaultValue=""
        rules={{
          required: "Amount is required",
          pattern: { value: /^[0-9]+$/, message: "Enter a valid amount" },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter amount (INR)"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
          />
        )}
      />
      {errors?.amount && (
        <Text style={styles.errorText}>{errors?.amount?.message}</Text>
      )}

      {/* Description (Note) Input */}
      <Controller
        control={control}
        name="description"
        defaultValue=""
        rules={{ required: "Description is required" }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter description"
            value={value}
            onChangeText={onChange}
          />
        )}
      />
      {errors?.description && (
        <Text style={styles.errorText}>{errors?.description?.message}</Text>
      )}

      {/* Date Input */}
      <Controller
        control={control}
        name="date"
        defaultValue={transactionDate}
        rules={{ required: "Date is required" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>
                Date: {format(value, "yyyy-MM-dd")}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={value}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  onChange(selectedDate || value); // Update React Hook Form state
                  handleDateChange(event, selectedDate); // Set date locally
                }}
              />
            )}
          </>
        )}
      />
      {errors?.date && (
        <Text style={styles.errorText}>{errors?.date?.message}</Text>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#6200ea" }]}
        onPress={handleSubmit(onSubmit)}
        disabled={Object.keys(errors).length > 0}
      >
        <Text style={styles.buttonText}>Add Transaction</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9", // Light background
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#fff", // white background for inputs
  },
  datePicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2, // Add shadow to buttons
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
  },
});

export default AddTransactionScreen;
