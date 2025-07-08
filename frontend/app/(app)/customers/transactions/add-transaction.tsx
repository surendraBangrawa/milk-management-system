import { useState, useEffect } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { format } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

import useTheme from "@/context/theme/useTheme";
import {
  addCustomerTransactionApi,
  editCustomerTransactionApi,
} from "@/redux/slice/transactions/transactionApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { fetchSellerSummaries } from "@/redux/slice/transactions/transactionsSlice";

const AddTransactionScreen = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { colors } = useTheme();
  const { t } = useTranslation();

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
          text1: effectiveId
            ? t("add_transaction.updated")
            : t("add_transaction.added"), // Dynamic toast title
          text2: effectiveId
            ? t("add_transaction.successfully_updated", {
                type: effectiveType || t("add_transaction.transaction"),
              })
            : t("add_transaction.successfully_added", {
                type: effectiveType || t("add_transaction.transaction"),
              }), // Dynamic toast text
        });
        dispatch(fetchSellerSummaries());
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
            ? t("add_transaction.failed_to_update")
            : t("add_transaction.failed_to_add"));
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: t("add_transaction.error"),
        text2: error?.message || t("add_transaction.something_went_wrong"),
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
    <>
      <Stack.Screen
        options={{
          title: effectiveType === "GAVE" ? "You Gave" : "You Got",
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
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.container}>
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
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.amount ? colors.error : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter amount (INR)"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  onBlur={onBlur}
                  editable={!isLoading}
                  returnKeyType="next"
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
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.multilineInput,
                    {
                      borderColor: errors.description
                        ? colors.error
                        : colors.border,
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter description"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={4}
                  editable={!isLoading}
                  returnKeyType="done"
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
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.dateText,
                        {
                          color: value
                            ? colors.textPrimary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      Date:{" "}
                      {value ? format(value, "yyyy-MM-dd") : "Select Date"}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={value || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        onChange(selectedDate || value);
                        handleDateChange(event, selectedDate);
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
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={Object.keys(errors).length > 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.surface }]}>
                  {effectiveId ? "Update Transaction" : "Add Transaction"}
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
    padding: 16,
    paddingBottom: 100, // Extra padding to ensure button is visible
  },
  container: {
    flex: 1,
    padding: 16,
    paddingBottom: 40, // Extra bottom padding
  },
  header: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  datePicker: {
    borderWidth: 1,
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  dateText: {
    fontSize: 16,
  },
  button: {
    padding: 15,
    marginVertical: 16,
    marginBottom: 20, // Extra margin to prevent overlap
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    marginTop: -6,
    marginBottom: 8,
  },
  pickerContainer: {
    marginVertical: 10,
  },
  picker: {
    height: 55,
    backgroundColor: "#fff",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    marginRight: 10,
  },
  overlayLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
});

export default AddTransactionScreen;
