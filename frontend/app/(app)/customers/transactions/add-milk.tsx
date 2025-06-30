import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";
import { format } from "date-fns";
import { getRate, Rate } from "@/redux/slice/ratelist/rateListApi";
import useTheme from "@/context/theme/useTheme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  addCustomerMilkTransactionApi,
  editCustomerTransactionApi,
} from "@/redux/slice/transactions/transactionApi";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { fetchSellerSummaries } from "@/redux/slice/transactions/transactionsSlice";
import { FontAwesome } from "@expo/vector-icons";

const fetchRate = async (data: Rate) => {
  try {
    const res = await getRate(data);
    if (res.status === 200 && res.data && res.data.rate !== undefined) {
      return res.data.rate;
    } else {
      console.warn("Failed to fetch rate or rate is missing in response:", res);
      return null;
    }
  } catch (error) {
    console.error("Error fetching rate:", error);
    return null;
  }
};

const AddMilk = () => {
  const dispatch = useDispatch<AppDispatch>();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const {
    seller_mobile,
    name,
    quantity,
    fat,
    snf,
    desc,
    date,
    id,
    type,
    rate: qRate,
  } = params as {
    seller_mobile?: string | string[];
    name?: string | string[];
    quantity?: string | string[];
    fat?: string | string[];
    snf?: string | string[];
    desc?: string | string[];
    date?: string | string[];
    id?: string | string[];
    type?: string | string[];
    rate?: string | string[];
  };

  const router = useRouter();
  const [rate, setRate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const currentHour = new Date().getHours();
  const defaultShift = currentHour >= 3 && currentHour < 15 ? "M" : "E";

  const effectiveDateParam = Array.isArray(date) ? date[0] : date;
  const effectiveQuantity = Array.isArray(quantity) ? quantity[0] : quantity;
  const effectiveFat = Array.isArray(fat) ? fat[0] : fat;
  const effectiveSnf = Array.isArray(snf) ? snf[0] : snf;
  const effectiveDesc = Array.isArray(desc) ? desc[0] : desc;
  const effectiveId = Array.isArray(id) ? id[0] : id;
  const effectiveType = Array.isArray(type) ? type[0] : type;
  const effectiveQRate = Array.isArray(qRate) ? qRate[0] : qRate;
  const effectiveSellerMobile = Array.isArray(seller_mobile)
    ? seller_mobile[0]
    : seller_mobile;
  const effectiveName = Array.isArray(name) ? name[0] : name;

  const initialDateValue = effectiveDateParam
    ? new Date(effectiveDateParam)
    : new Date();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setValue,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      quantity: effectiveQuantity ?? "",
      fat: effectiveFat ?? "",
      snf: effectiveSnf ?? "",
      note: effectiveDesc ?? "",
      shift: defaultShift,
      date: initialDateValue,
      rate: effectiveQRate ?? "",
    } as {
      quantity: string;
      fat: string;
      snf: string;
      note: string;
      shift: string;
      date: Date;
      rate: string;
    },
    mode: "onChange",
  });

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || watch("date");
    setShowDatePicker(Platform.OS === "ios");
    setValue("date", currentDate);
    clearErrors("date");
  };

  const handleFetchRate = async () => {
    const fatValue = parseFloat(watch("fat"));
    const snfValue = parseFloat(watch("snf"));

    if (isNaN(fatValue) || isNaN(snfValue)) {
      Alert.alert(
        "Invalid Input",
        "Please enter valid numbers for Fat and SNF to fetch rate.",
        [{ text: "OK" }]
      );
      if (isNaN(fatValue))
        setError("fat", { type: "manual", message: "Invalid Fat %" });
      if (isNaN(snfValue))
        setError("snf", { type: "manual", message: "Invalid SNF %" });
      return;
    }
    clearErrors(["fat", "snf"]);

    setIsFetchingRate(true);
    try {
      const fetchedRateValue = await fetchRate({
        fat: fatValue,
        snf: snfValue,
      });

      if (fetchedRateValue !== null && fetchedRateValue !== undefined) {
        const rateString = fetchedRateValue.toString();
        setRate(rateString);
        setValue("rate", rateString);
        Toast.show({
          type: "success",
          text1: "Rate Fetched Successfully",
          text2: `Rate: ₹${rateString}`,
        });
        clearErrors("rate");
      } else {
        Alert.alert(
          "Rate Not Found",
          "Could not fetch rate for the provided Fat and SNF values. Please check your rate list or enter manually.",
          [{ text: "OK" }]
        );
        setRate("");
        setValue("rate", "");
        setError("rate", { type: "manual", message: "Rate not found" });
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch rate. Please check your connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsFetchingRate(false);
    }
  };

  const handleSubmitForm = async (data: {
    quantity: string;
    fat: string;
    snf: string;
    note: string;
    date: Date;
    shift: string;
    rate: string;
  }) => {
    if (isSubmitting) return;

    const quantityNum = parseFloat(data.quantity);
    const fatNum = parseFloat(data.fat);
    const snfNum = parseFloat(data.snf);
    const rateNum = parseFloat(data.rate);

    const validationErrors = [];

    if (isNaN(quantityNum) || quantityNum <= 0) {
      validationErrors.push("Quantity must be a positive number");
      setError("quantity", {
        type: "manual",
        message: "Quantity must be a positive number",
      });
    }

    if (isNaN(fatNum) || fatNum < 0 || fatNum > 100) {
      validationErrors.push("Fat % must be between 0 and 100");
      setError("fat", {
        type: "manual",
        message: "Fat % must be between 0 and 100",
      });
    }

    if (isNaN(snfNum) || snfNum < 0 || snfNum > 100) {
      validationErrors.push("SNF % must be between 0 and 100");
      setError("snf", {
        type: "manual",
        message: "SNF % must be between 0 and 100",
      });
    }

    if (isNaN(rateNum) || rateNum < 0) {
      validationErrors.push("Rate must be a positive number");
      setError("rate", {
        type: "manual",
        message: "Rate must be a positive number",
      });
    }

    if (validationErrors.length > 0) {
      Alert.alert("Validation Error", validationErrors.join("\n"), [
        { text: "OK" },
      ]);
      return;
    }

    clearErrors(["quantity", "fat", "snf", "rate"]);

    if (!effectiveSellerMobile) {
      Alert.alert("Error", "Seller mobile number is required", [
        { text: "OK" },
      ]);
      return;
    }

    setIsSubmitting(true);

    const milkData = {
      quantity: quantityNum,
      fat: fatNum,
      snf: snfNum,
      milk_detail: data.note,
      custom_date: format(data.date, "yyyy-MM-dd"),
      shift: data.shift,
      rate: rateNum,
      seller_mobile: effectiveSellerMobile,
    };

    try {
      const res = effectiveId
        ? await editCustomerTransactionApi({
            ...milkData,
            id: effectiveId,
            type: effectiveType,
          })
        : await addCustomerMilkTransactionApi(milkData);

      if (res?.status === 200) {
        Toast.show({
          type: "success",
          text1: effectiveId ? "Transaction Updated" : "Transaction Added",
          text2: `Successfully ${
            effectiveId ? "updated" : "added"
          } transaction!`,
        });
        if (effectiveSellerMobile && effectiveName) {
          dispatch(fetchSellerSummaries());
          router.replace(
            `/(app)/customers/transactions/${effectiveSellerMobile}?name=${encodeURIComponent(
              effectiveName
            )}`
          );
        } else {
          console.error(
            "Missing seller mobile or name for navigation:",
            effectiveSellerMobile,
            effectiveName
          );
          Alert.alert(
            "Navigation Error",
            "Could not navigate back: Missing customer details.",
            [{ text: "OK" }]
          );
        }
      } else {
        const errorMsg =
          res?.data?.detail ||
          (effectiveId
            ? "Failed to update transaction."
            : "Failed to add transaction.");
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
      console.error("Submit form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: effectiveId ? "Edit Milk Transaction" : "Add Milk Transaction",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View
          style={[styles.headerSection, { backgroundColor: colors.surface }]}
        >
          <View style={styles.headerContent}>
            <FontAwesome name="milk" size={32} color={colors.primary} />
            <View style={styles.headerText}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {effectiveId ? "Edit" : "Add"} Milk Transaction
              </Text>
              {effectiveName && (
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  for {effectiveName}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Milk Details Section */}
        <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="flask" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Milk Details
            </Text>
          </View>

          {/* Quantity Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Quantity (kg) *
            </Text>
            <Controller
              control={control}
              name="quantity"
              rules={{
                required: "Quantity is required",
                pattern: {
                  value: /^[0-9]+(\.[0-9]{1,2})?$/,
                  message: "Enter a valid quantity (e.g., 5 or 5.25)",
                },
                validate: (value) => {
                  const num = parseFloat(value);
                  if (isNaN(num) || num <= 0) {
                    return "Quantity must be a positive number";
                  }
                  return true;
                },
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: errors.quantity
                        ? colors.error
                        : colors.border,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Enter quantity in kg"
                  placeholderTextColor={colors.textSecondary}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  accessibilityLabel="Quantity input field"
                  accessibilityHint="Enter the milk quantity in kilograms"
                />
              )}
            />
            {errors.quantity && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.quantity.message}
              </Text>
            )}
          </View>

          {/* Fat and SNF Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Fat % *
              </Text>
              <Controller
                control={control}
                name="fat"
                rules={{
                  required: "Fat % is required",
                  pattern: {
                    value: /^[0-9]+(\.[0-9]{1,2})?$/,
                    message: "Enter a valid fat % (e.g., 4.5)",
                  },
                  validate: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0 || num > 100) {
                      return "Fat % must be between 0 and 100";
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.fat ? colors.error : colors.border,
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="Fat %"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    accessibilityLabel="Fat percentage input field"
                    accessibilityHint="Enter the fat percentage"
                  />
                )}
              />
              {errors.fat && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.fat.message}
                </Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                SNF % *
              </Text>
              <Controller
                control={control}
                name="snf"
                rules={{
                  required: "SNF % is required",
                  pattern: {
                    value: /^[0-9]+(\.[0-9]{1,2})?$/,
                    message: "Enter a valid SNF % (e.g., 8.2)",
                  },
                  validate: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0 || num > 100) {
                      return "SNF % must be between 0 and 100";
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: errors.snf ? colors.error : colors.border,
                        backgroundColor: colors.background,
                        color: colors.textPrimary,
                      },
                    ]}
                    placeholder="SNF %"
                    placeholderTextColor={colors.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="numeric"
                    accessibilityLabel="SNF percentage input field"
                    accessibilityHint="Enter the SNF percentage"
                  />
                )}
              />
              {errors.snf && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.snf.message}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Transaction Details Section */}
        <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Transaction Details
            </Text>
          </View>

          {/* Date and Shift Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Date *
              </Text>
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
                          borderColor: errors.date
                            ? colors.error
                            : colors.border,
                          backgroundColor: colors.background,
                        },
                      ]}
                      onPress={() => setShowDatePicker(true)}
                      accessibilityLabel="Date picker button"
                      accessibilityHint="Tap to select a date"
                    >
                      <FontAwesome
                        name="calendar"
                        size={16}
                        color={colors.textSecondary}
                      />
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
                        {value ? format(value, "dd/MM/yyyy") : "Select Date"}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={value || new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
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
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                Shift *
              </Text>
              <Controller
                control={control}
                name="shift"
                rules={{ required: "Shift is required" }}
                render={({ field: { onChange, value } }) => (
                  <View
                    style={[
                      styles.pickerContainer,
                      {
                        borderColor: errors.shift
                          ? colors.error
                          : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  >
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={[styles.picker, { color: colors.textPrimary }]}
                      dropdownIconColor={colors.textSecondary}
                      accessibilityLabel="Shift picker"
                    >
                      <Picker.Item label="Morning" value="M" />
                      <Picker.Item label="Evening" value="E" />
                    </Picker>
                  </View>
                )}
              />
              {errors.shift && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.shift.message}
                </Text>
              )}
            </View>
          </View>

          {/* Rate Input with Fetch Button */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Rate (₹) *
            </Text>
            <View style={styles.rateRow}>
              <Controller
                control={control}
                name="rate"
                rules={{
                  required: "Rate is required",
                  pattern: {
                    value: /^[0-9]+(\.[0-9]{1,2})?$/,
                    message: "Enter a valid rate",
                  },
                  validate: (value) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num < 0) {
                      return "Rate must be a positive number";
                    }
                    return true;
                  },
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: errors.rate
                            ? colors.error
                            : colors.border,
                          backgroundColor: colors.background,
                          color: colors.textPrimary,
                        },
                      ]}
                      value={value || rate}
                      onChangeText={(text) => {
                        onChange(text);
                        setRate(text);
                      }}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      placeholder="Enter rate per kg"
                      placeholderTextColor={colors.textSecondary}
                      accessibilityLabel="Rate input field"
                      accessibilityHint="Enter the rate per kilogram"
                    />
                  </View>
                )}
              />
              <TouchableOpacity
                style={[
                  styles.fetchButton,
                  {
                    backgroundColor: isFetchingRate
                      ? colors.textSecondary
                      : colors.primary,
                  },
                ]}
                onPress={handleFetchRate}
                disabled={isFetchingRate}
                accessibilityLabel="Fetch rate button"
                accessibilityHint="Automatically fetch rate based on fat and SNF values"
              >
                {isFetchingRate ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <>
                    <FontAwesome
                      name="search"
                      size={14}
                      color={colors.surface}
                    />
                    <Text
                      style={[
                        styles.fetchButtonText,
                        { color: colors.surface },
                      ]}
                    >
                      Fetch
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {errors.rate && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.rate.message}
              </Text>
            )}
          </View>
        </View>

        {/* Notes Section */}
        <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <FontAwesome name="sticky-note" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Additional Notes
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  style={[
                    styles.input,
                    styles.multilineInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter any additional notes (optional)"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  accessibilityLabel="Notes input field"
                  accessibilityHint="Enter any additional notes about this transaction"
                />
              )}
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              {
                backgroundColor:
                  !isValid || isSubmitting
                    ? colors.textSecondary
                    : colors.primary,
              },
            ]}
            onPress={handleSubmit(handleSubmitForm)}
            disabled={!isValid || isSubmitting}
            accessibilityLabel="Submit transaction button"
            accessibilityHint="Submit the milk transaction"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <FontAwesome
                  name={effectiveId ? "save" : "plus"}
                  size={18}
                  color={colors.surface}
                />
                <Text
                  style={[styles.submitButtonText, { color: colors.surface }]}
                >
                  {isSubmitting
                    ? "Processing..."
                    : effectiveId
                    ? "Update Transaction"
                    : "Add Transaction"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "400",
  },
  formSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  datePicker: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    marginRight: 12,
  },
  fetchButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fetchButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  submitContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 10,
    height: 55,
    justifyContent: "center",
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  picker: {
    ...Platform.select({
      android: {
        height: 55,
      },
      ios: {
        height: 100,
      },
    }),
    width: "100%",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    flex: 0.48,
  },
});

export default AddMilk;
