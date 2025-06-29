import React, { useState, useEffect } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";

import useTheme from "@/context/theme/useTheme";
import {
  addCustomerTransactionApi,
  editCustomerTransactionApi,
} from "@/redux/slice/transactions/transactionApi";

const AddTransactionScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const params = useLocalSearchParams();
  const { type, id, desc, seller_mobile, amount, date, name } = params as {
    type?: string | string[];
    id?: string | string[];
    desc?: string | string[];
    seller_mobile?: string | string[];
    amount?: string | string[];
    date?: string | string[];
    name?: string | string[];
  };

  const effectiveType = Array.isArray(type) ? type[0] : type;
  const effectiveId = Array.isArray(id) ? id[0] : id;
  const effectiveDesc = Array.isArray(desc) ? desc[0] : desc;
  const effectiveSellerMobile = Array.isArray(seller_mobile)
    ? seller_mobile[0]
    : seller_mobile;
  const effectiveAmount = Array.isArray(amount) ? amount[0] : amount;
  const effectiveDateParam = Array.isArray(date) ? date[0] : date;
  const effectiveName = Array.isArray(name) ? name[0] : name;

  // Set initial date value for the form
  const initialDateValue = effectiveDateParam
    ? new Date(effectiveDateParam)
    : new Date();

  // Local state for date picker visibility (react-hook-form manages the date value)
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Local loading state for API calls (will be replaced by Redux state later)
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue, // Get setValue to update form date
    clearErrors, // Get clearErrors
    setError,
    watch,
  } = useForm({
    defaultValues: {
      amount: effectiveAmount ?? "", // Use effectiveAmount
      description: effectiveDesc ?? "", // Use effectiveDesc
      date: initialDateValue, // Use initialDateValue
    } as {
      amount: string;
      description: string;
      date: Date;
    },
  });

  // Update form fields when the params change (for editing)
  useEffect(() => {
    if (effectiveId && effectiveDateParam) {
      setValue("date", new Date(effectiveDateParam));
    }
  }, [
    effectiveId,
    effectiveAmount,
    effectiveDesc,
    effectiveDateParam,
    setValue,
  ]); // Depend on relevant params and setValue

  const onSubmit = async (data: {
    amount: string;
    description: string;
    date: Date;
  }) => {
    // Basic validation before proceeding (already done by form, but double-check before API call)
    const amountNum = parseFloat(data.amount);
    if (isNaN(amountNum)) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter a valid amount.",
      });
      setError("amount", { type: "manual", message: "Invalid amount" });
      return;
    }
    clearErrors("amount"); // Clear amount error if valid

    if (!effectiveSellerMobile || !effectiveType || !effectiveName) {
      console.error("Missing required params for API call or navigation:", {
        seller_mobile: effectiveSellerMobile,
        type: effectiveType,
        name: effectiveName,
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Missing customer or transaction type details.",
      });
      return;
    }

    setIsLoading(true); // Start loading
    try {
      const { amount, description, date } = data;
      const apiPayload = {
        amount: parseFloat(amount), // Ensure amount is a number
        custom_date: format(date, "yyyy-MM-dd"),
        expense_detail: description,
        seller_mobile: effectiveSellerMobile,
        transaction_type: effectiveType?.toUpperCase(),
      };

      const res = effectiveId
        ? await editCustomerTransactionApi({
            ...apiPayload,
            id: effectiveId,
          })
        : await addCustomerTransactionApi(apiPayload);

      if (res?.status === 200) {
        Toast.show({
          type: "success",
          text1: effectiveId ? "Transaction Updated" : "Transaction Added", // Dynamic toast title
          text2: `Successfully ${effectiveId ? "updated" : "added"} ${
            effectiveType || "transaction"
          }!`, // Dynamic toast text
        });
        // FIX: Use router.replace instead of router.push
        router.replace(
          `/(app)/customers/transactions/${effectiveSellerMobile}?name=${encodeURIComponent(
            effectiveName
          )}` // Use effectiveSellerMobile and effectiveName
        );
      } else {
        // Handle non-200 responses
        const errorMsg =
          res?.data?.detail ||
          (effectiveId
            ? "Failed to update transaction."
            : "Failed to add transaction.");
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Something went wrong.",
      });
      console.error("Submit form error:", error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || watch("date"); // Use watch to get current form date value
    setShowDatePicker(Platform.OS === "ios" ? true : false);
    setValue("date", currentDate); // Update form date value
    clearErrors("date"); // Clear date error
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: effectiveType === "GAVE" ? "You Gave" : "You Got", // Dynamic title
          headerStyle: {
            backgroundColor: colors.surface, // Example header background
          },
          headerTintColor: colors.textPrimary, // Example header text color
        }}
      />
      {isLoading && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      <Controller
        control={control}
        name="amount"
        rules={{
          required: "Amount is required",
          pattern: {
            value: /^[0-9]+(\.[0-9]{1,2})?$/,
            message: "Enter a valid amount (e.g., 100 or 100.50)",
          },
        }}
        render={(
          { field: { onChange, value, onBlur } } // Added onBlur
        ) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: errors.amount ? colors.error : colors.border, // Highlight error
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Enter amount (INR)"
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
            onBlur={onBlur} // Pass onBlur for validation
            editable={!isLoading} // Disable input while loading
          />
        )}
      />
      {errors?.amount && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors?.amount?.message}
        </Text>
      )}

      <Controller
        control={control}
        name="description"
        render={(
          { field: { onChange, value, onBlur } } // Added onBlur
        ) => (
          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              {
                // Added multilineInput style
                borderColor: errors.description ? colors.error : colors.border,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Enter description"
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur} // Pass onBlur for validation
            multiline // Enable multiline
            numberOfLines={4} // Suggest number of lines
            editable={!isLoading} // Disable input while loading
          />
        )}
      />
      {errors?.description && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors?.description?.message}
        </Text>
      )}

      <Controller
        control={control}
        name="date"
        rules={{ required: "Date is required" }}
        render={({ field: { onChange, value } }) => (
          <>
            <TouchableOpacity
              style={[
                styles.datePicker,
                {
                  borderColor: errors.date ? colors.error : colors.border,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              disabled={isLoading} // Disable date picker while loading
            >
              <Text
                style={[
                  styles.dateText,
                  { color: value ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                Date: {value ? format(value, "yyyy-MM-dd") : "Select Date"}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  onChange(selectedDate || value); // Update form value
                  handleDateChange(event, selectedDate); // Handle local state and error clearing
                }}
              />
            )}
          </>
        )}
      />
      {errors?.date && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors?.date?.message}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              Object.keys(errors).length > 0 || isLoading
                ? colors.textSecondary
                : colors.primary,
          },
        ]} // Grey out if errors or loading
        onPress={handleSubmit(onSubmit)}
        disabled={Object.keys(errors).length > 0 || isLoading} // Disable button if errors or loading
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.surface} /> // White indicator
        ) : (
          <Text style={[styles.buttonText, { color: colors.surface }]}>
            {effectiveId ? "Update Transaction" : "Add Transaction"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color now from theme
    padding: 16, // Adjusted padding
  },
  header: {
    // This style is not used in the current component structure
    fontSize: 24,
    fontWeight: "600",
    // Color from theme applied inline if used
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    // Colors from theme applied inline
    padding: 12, // Adjusted padding
    marginVertical: 8, // Adjusted margin
    borderRadius: 8, // Adjusted border radius
    fontSize: 16,
    // Shadow (optional, add if desired, consistent with other screens)
    // ...Platform.select({
    //   ios: {
    //     shadowColor: '#000',
    //     shadowOffset: { width: 0, height: 1 },
    //     shadowOpacity: 0.05,
    //     shadowRadius: 2,
    //   },
    //   android: {
    //     elevation: 2,
    //   },
    // }),
  },
  multilineInput: {
    // Style for multiline description input
    minHeight: 100, // Minimum height
    textAlignVertical: "top", // Align text to the top on Android
  },
  datePicker: {
    borderWidth: 1,
    // Colors from theme applied inline
    padding: 12, // Adjusted padding
    marginVertical: 8, // Adjusted margin
    borderRadius: 8, // Adjusted border radius
    justifyContent: "center",
    alignItems: "flex-start", // Align text to the left
  },
  dateText: {
    fontSize: 16,
    // Color from theme applied inline
  },
  button: {
    padding: 15,
    marginVertical: 16, // Adjusted margin
    borderRadius: 8, // Adjusted border radius
    justifyContent: "center",
    alignItems: "center",
    elevation: 2, // Consider removing or styling shadows consistently via Platform
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    // Color from theme applied inline
  },
  errorText: {
    fontSize: 12,
    // Color from theme applied inline
    marginTop: -6, // Adjust margin to be closer to the input
    marginBottom: 8, // Add bottom margin
  },
  pickerContainer: {
    // This style is not used in this component (no picker here)
    marginVertical: 10,
  },
  picker: {
    // This style is not used in this component (no picker here)
    height: 55,
    backgroundColor: "#fff",
  },
  rowContainer: {
    // This style is not used in this component
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    // This style is not used in this component
    flex: 1,
    marginRight: 10,
  },
  overlayLoading: {
    // Style for a full-screen overlay loading indicator
    ...StyleSheet.absoluteFillObject, // Cover the entire screen
    backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent white background
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1, // Ensure it's above other content
  },
});

export default AddTransactionScreen;
