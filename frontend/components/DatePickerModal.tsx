import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import useTheme from "@/context/theme/useTheme";

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate,
}) => {
  const { colors } = useTheme();
  const [date, setDate] = useState<Date>(initialDate || new Date());

  // Reset date when modal becomes visible or initialDate changes
  useEffect(() => {
    if (visible && initialDate) {
      setDate(initialDate);
    }
  }, [visible, initialDate]);

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);

    if (Platform.OS === "android") {
      if (event.type === "set") {
        onConfirm(currentDate);
        onClose();
      } else if (event.type === "dismissed") {
        onClose();
      }
    }
  };

  const handleConfirm = () => {
    console.log("Confirm pressed, calling onConfirm with date:", date);
    onConfirm(date);
    onClose();
  };

  const handleCancel = () => {
    console.log("Cancel pressed, calling onClose");
    // Reset to initial date when canceling
    if (initialDate) {
      setDate(initialDate);
    }
    onClose();
  };

  // Don't render anything if not visible
  if (!visible) {
    return null;
  }

  // For iOS, show a simple picker without modal
  if (Platform.OS === "ios") {
    return (
      <View style={styles.iosContainer}>
        <View
          style={[
            styles.iosPickerContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.iosHeader}>
            <TouchableOpacity onPress={handleCancel} style={styles.iosButton}>
              <Text style={[styles.iosButtonText, { color: colors.error }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.iosTitle, { color: colors.textPrimary }]}>
              Select Date
            </Text>
            <TouchableOpacity onPress={handleConfirm} style={styles.iosButton}>
              <Text style={[styles.iosButtonText, { color: colors.primary }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={onChange}
            style={styles.iosPicker}
          />
        </View>
      </View>
    );
  }

  // For Android, use the native picker directly
  return (
    <DateTimePicker
      value={date}
      mode="date"
      display="default"
      onChange={onChange}
    />
  );
};

const styles = StyleSheet.create({
  iosContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  iosPickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  iosButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  iosButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  iosTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  iosPicker: {
    height: 200,
  },
});

export default DatePickerModal;
