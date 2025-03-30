import React, { useState, useEffect } from "react";
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
import {
  addSellerMilkTransactionApi,
  editSellerTransactionApi,
} from "@/redux/slice/transactions/transactionApi";
import { getRate, Rate } from "@/redux/slice/ratelist/rateListApi";

const fetchRate = async (data: Rate) => {
  try {
    const res = await getRate(data);
    if (res.status === 200) {
      return res.data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

const AddMilk = () => {
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
  } = useLocalSearchParams();
  const router = useRouter();
  const [rate, setRate] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const currentHour = new Date().getHours();
  const defaultShift = currentHour >= 3 && currentHour < 15 ? "M" : "E";

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: {
      quantity: quantity ?? "",
      fat: fat ?? "",
      snf: snf ?? "",
      note: desc ?? "",
      shift: defaultShift,
      date: date ? new Date(date) : new Date(),
      rate: qRate ?? "",
    },
  });

  useEffect(() => {
    if (id) {
      setTransactionDate(new Date(date));
    }
  }, [desc, date, id, quantity, snf, rate]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || transactionDate;
    setShowDatePicker(Platform.OS === "ios");
    setTransactionDate(currentDate);
    setValue("date", currentDate);
  };

  const handleFetchRate = async () => {
    const fat = parseFloat(watch("fat"));
    const snf = parseFloat(watch("snf"));
    const fetchedRate = await fetchRate({ fat, snf });
    if (fetchedRate) {
      setRate(fetchedRate.toString());
      setValue("rate", fetchedRate.toString());
    }
  };

  const handleSubmitForm = async (data) => {
    const milkData = {
      quantity: parseFloat(data.quantity),
      fat: parseFloat(data.fat),
      snf: parseFloat(data.snf),
      milk_detail: data.note,
      custom_date: format(data.date, "yyyy-MM-dd"),
      shift: data.shift,
      rate: parseFloat(data.rate),
      seller_mobile: seller_mobile,
    };
    console.log(data);
    try {
      const res = id
        ? await editSellerTransactionApi({ ...milkData, id, type })
        : await addSellerMilkTransactionApi(milkData);
      if (res?.status === 200) {
        Toast.show({
          type: "success",
          text1: "Transaction Added",
          text2: `Successfully added transaction!`,
        });
        router.push(
          `/(app)/customers/transactions/${seller_mobile}?name=${name}`
        );
      } else {
        throw new Error("Failed to add transaction.");
      }
    } catch (error: any) {
      console.log(error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "Something went wrong.",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Milk",
        }}
      />
      <Controller
        control={control}
        name="quantity"
        rules={{
          required: "Quantity is required",
          pattern: {
            value: /^[0-9]+(\.[0-9]{1,2})?$/,
            message: "Enter a valid quantity",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter quantity (kg)"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
          />
        )}
      />
      {errors.quantity && (
        <Text style={styles.errorText}>{errors.quantity.message}</Text>
      )}
      <Controller
        control={control}
        name="fat"
        rules={{
          required: "Fat percentage is required",
          pattern: {
            value: /^[0-9]+(\.[0-9]{1,2})?$/,
            message: "Enter a valid fat percentage",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter fat percentage"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
          />
        )}
      />
      {errors.fat && <Text style={styles.errorText}>{errors.fat.message}</Text>}
      <Controller
        control={control}
        name="snf"
        rules={{
          required: "SNF percentage is required",
          pattern: {
            value: /^[0-9]+(\.[0-9]{1,2})?$/,
            message: "Enter a valid SNF percentage",
          },
        }}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            placeholder="Enter SNF percentage"
            value={value}
            onChangeText={onChange}
            keyboardType="numeric"
          />
        )}
      />
      {errors.snf && <Text style={styles.errorText}>{errors.snf.message}</Text>}
      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChange}
            placeholder="Enter any notes (optional)"
            multiline
          />
        )}
      />
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
                  onChange(selectedDate || value);
                  handleDateChange(event, selectedDate);
                }}
              />
            )}
          </>
        )}
      />
      {errors?.date && (
        <Text style={styles.errorText}>{errors?.date?.message}</Text>
      )}
      <Controller
        control={control}
        name="shift"
        rules={{ required: "Shift is required" }}
        render={({ field: { onChange, value } }) => (
          <Picker selectedValue={value} onValueChange={onChange}>
            <Picker.Item label="Morning" value="M" />
            <Picker.Item label="Evening" value="E" />
          </Picker>
        )}
      />
      {errors.shift && (
        <Text style={styles.errorText}>{errors.shift.message}</Text>
      )}

      <View style={styles.rowContainer}>
        <Controller
          control={control}
          name="rate"
          rules={{
            required: "Rate is required",
          }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              value={value || rate}
              onChangeText={onChange}
              keyboardType="numeric"
              placeholder="Enter rate"
            />
          )}
        />
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#6200ea" }]}
          onPress={handleFetchRate}
        >
          <Text style={styles.buttonText}>Fetch</Text>
        </TouchableOpacity>
      </View>
      {errors.rate && (
        <Text style={styles.errorText}>{errors.rate.message}</Text>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#6200ea" }]}
        onPress={handleSubmit(handleSubmitForm)}
        disabled={Object.keys(errors).length > 0}
      >
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
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
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  fetchButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginLeft: 10,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  fetchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "red",
  },
});

export default AddMilk;
