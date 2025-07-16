import { useState } from "react";
import {
  TextInput,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
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

const fetchRate = async (data: Rate) => {
  try {
    const res = await getRate(data);
    if (res.status === 200 && res.data && res.data.rate !== undefined) {
      return res.data.rate;
    } else {
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
  const { colors, themeMode } = useTheme();
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
    formState: { errors },
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
      Toast.show({
        type: "error",
        text1: "Invalid Input",
        text2: "Please enter valid numbers for Fat and SNF to fetch rate.",
      });
      if (isNaN(fatValue))
        setError("fat", { type: "manual", message: "Invalid Fat %" });
      if (isNaN(snfValue))
        setError("snf", { type: "manual", message: "Invalid SNF %" });
      return;
    }
    clearErrors(["fat", "snf"]);

    const fetchedRateValue = await fetchRate({ fat: fatValue, snf: snfValue });

    if (fetchedRateValue !== null && fetchedRateValue !== undefined) {
      const rateString = fetchedRateValue.toString();
      setRate(rateString);
      setValue("rate", rateString);
      Toast.show({
        type: "success",
        text1: "Rate Fetched",
        text2: `Rate found: ₹${rateString}`,
      });
      clearErrors("rate");
    } else {
      Toast.show({
        type: "info",
        text1: "Rate Not Found",
        text2: "Could not fetch rate for the provided Fat and SNF values.",
      });
      setRate("");
      setValue("rate", "");
      setError("rate", { type: "manual", message: "Rate not found" });
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
    const quantityNum = parseFloat(data.quantity);
    const fatNum = parseFloat(data.fat);
    const snfNum = parseFloat(data.snf);
    const rateNum = parseFloat(data.rate);

    if (
      isNaN(quantityNum) ||
      isNaN(fatNum) ||
      isNaN(snfNum) ||
      isNaN(rateNum)
    ) {
      Toast.show({
        type: "error",
        text1: "Invalid Input",
        text2: "Please enter valid numbers for Quantity, Fat, SNF, and Rate.",
      });
      if (isNaN(quantityNum))
        setError("quantity", { type: "manual", message: "Invalid Quantity" });
      if (isNaN(fatNum))
        setError("fat", { type: "manual", message: "Invalid Fat %" });
      if (isNaN(snfNum))
        setError("snf", { type: "manual", message: "Invalid SNF %" });
      if (isNaN(rateNum))
        setError("rate", { type: "manual", message: "Invalid Rate" });
      return;
    }
    clearErrors(["quantity", "fat", "snf", "rate"]);

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
          Toast.show({
            type: "error",
            text1: "Navigation Error",
            text2: "Could not navigate back: Missing customer details.",
          });
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
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Something went wrong.",
      });
      console.error("Submit form error:", error);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.keyboardAwareScrollViewContainer} // Flex: 1 here
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
      enableOnAndroid={true}
      keyboardShouldPersistTaps="handled" // Keep the keyboard open after tapping
    >
      <Stack.Screen
        options={{
          title: effectiveId ? "Edit Milk Transaction" : "Add Milk Transaction",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />
      <Controller
        control={control}
        name="quantity"
        rules={{
          required: "Quantity is required",
          pattern: {
            value: /^[0-9]+(\.[0-9]{1,2})?$/,
            message: "Enter a valid quantity (e.g., 5 or 5.25)",
          },
        }}
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: errors.quantity ? colors.error : colors.border,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Enter quantity (kg)"
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="numeric"
          />
        )}
      />
      {errors.quantity && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors.quantity.message}
        </Text>
      )}
      <Controller
        control={control}
        name="fat"
        rules={{
          required: "Fat % is required",
          pattern: {
            value: /^[0-9]+(\.[0-9]{1,2})?$/,
            message: "Enter a valid fat % (e.g., 4.5)",
          },
        }}
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: errors.fat ? colors.error : colors.border,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Enter fat %"
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="numeric"
          />
        )}
      />
      {errors.fat && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors.fat.message}
        </Text>
      )}
      <Controller
        control={control}
        name="snf"
        rules={{
          required: "SNF % is required",
          pattern: {
            value: /^[0-9]+(\.[0-9]{1,2})?$/,
            message: "Enter a valid SNF % (e.g., 8.2)",
          },
        }}
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            style={[
              styles.input,
              {
                borderColor: errors.snf ? colors.error : colors.border,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Enter SNF %"
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="numeric"
          />
        )}
      />
      {errors.snf && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors.snf.message}
        </Text>
      )}
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
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter any notes (optional)"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        )}
      />
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
      <Controller
        control={control}
        name="shift"
        rules={{ required: "Shift is required" }}
        render={({ field: { onChange, value } }) => (
          <View
            style={[
              styles.pickerContainer,
              {
                borderColor: errors.shift ? colors.error : colors.border,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderRadius: 10,
              },
            ]}
          >
            <Picker
              selectedValue={value}
              onValueChange={onChange}
              style={[styles.picker, { color: colors.textPrimary }]}
              dropdownIconColor={colors.textSecondary}
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

      <View style={styles.rowContainer}>
        <Controller
          control={control}
          name="rate"
          rules={{
            required: "Rate is required",
            pattern: {
              value: /^[0-9]+(\.[0-9]{1,2})?$/,
              message: "Enter a valid rate",
            },
          }}
          render={({ field: { onChange, value, onBlur } }) => (
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: errors.rate ? colors.error : colors.border,
                    backgroundColor: colors.surface,
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
                placeholder="Enter rate"
                placeholderTextColor={colors.textSecondary}
              />
              {errors.rate && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.rate.message}
                </Text>
              )}
            </View>
          )}
        />
        <TouchableOpacity
          style={[styles.fetchButton, { backgroundColor: colors.primary }]}
          onPress={handleFetchRate}
        >
          <Text style={[styles.fetchButtonText, { color: colors.surface }]}>
            Fetch
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor:
              Object.keys(errors).length > 0
                ? colors.textSecondary
                : colors.primary,
          },
        ]}
        onPress={handleSubmit(handleSubmitForm)}
        disabled={Object.keys(errors).length > 0}
      >
        <Text style={[styles.buttonText, { color: colors.surface }]}>
          Submit
        </Text>
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  keyboardAwareScrollViewContainer: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
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
  fetchButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginLeft: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  fetchButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    padding: 15,
    marginTop: 16, // Keep space from above
    marginBottom: 0,
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
    marginVertical: 8,
    borderWidth: 1,
    borderRadius: 10,
    height: 55,
    justifyContent: "center",
    overflow: "hidden",
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

export default AddMilk;
