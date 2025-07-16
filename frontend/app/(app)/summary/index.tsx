import { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import useTheme from "@/context/theme/useTheme";
import { getTotalRecordDateRangeApi } from "@/redux/slice/transactions/transactionApi";
import DateTimePickerModal from "@/components/DatePickerModal";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";

const SummaryScreen = () => {
  const { colors, themeMode } = useTheme();
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [shift, setShift] = useState<string | null>(null);

  const fetchSummary = async (
    start: string,
    end: string,
    shift?: string | null
  ) => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await getTotalRecordDateRangeApi({
        start_date: start,
        end_date: end,
        ...(shift && shift !== "ALL" ? { shift } : {}),
      });
      setSummary(res.data);
    } catch (err: any) {
      setError(err?.message || t("summary.error_loading"));
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = () => {
    if (startDate && endDate) {
      fetchSummary(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
        shift
      );
    }
  };

  const themedStyles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    formContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    formTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 16,
    },
    row: {
      flexDirection: "row",
      marginBottom: 16,
      gap: 12,
    },
    column: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textPrimary,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.inputBackground,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.inputBackground,
    },
    picker: {
      color: colors.textPrimary,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 8,
    },
    buttonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "600",
    },
    disabledButton: {
      backgroundColor: colors.border,
    },
    disabledButtonText: {
      color: colors.textSecondary,
    },
    summaryContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 16,
      textAlign: "center",
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    summaryLabel: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    summaryValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    errorContainer: {
      backgroundColor: colors.error + "20",
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
    },
    errorText: {
      color: colors.error,
      fontSize: 16,
      textAlign: "center",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });

  return (
    <SafeAreaWrapper edges={["bottom", "left", "right"]}>
      <ScrollView
        contentContainerStyle={themedStyles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen
          options={{
            title: t("summary.title"),
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontWeight: "600",
            },
          }}
        />
        {/* Date Range Card */}
        <View
          style={[
            themedStyles.formContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.shadow,
            },
          ]}
        >
          <Text style={[themedStyles.formTitle, { color: colors.textPrimary }]}>
            {t("summary.select_date_range")}
          </Text>
          <View style={themedStyles.row}>
            <TouchableOpacity
              style={[themedStyles.button, { flex: 1, marginRight: 5 }]}
              onPress={() => setShowStartPicker(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="calendar-range"
                size={20}
                color={colors.primary}
              />
              <Text style={themedStyles.buttonText}>
                {startDate
                  ? startDate.toLocaleDateString()
                  : t("summary.select_start_date")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[themedStyles.button, { flex: 1, marginLeft: 5 }]}
              onPress={() => setShowEndPicker(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="calendar-range"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[
                  themedStyles.buttonText,
                  { flexShrink: 1, minWidth: 0 },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {endDate
                  ? endDate.toLocaleDateString()
                  : t("summary.select_end_date")}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Shift Filter */}
          <View style={themedStyles.pickerContainer}>
            <Picker
              selectedValue={shift || "ALL"}
              onValueChange={(value) => setShift(value)}
              style={themedStyles.picker}
              dropdownIconColor={colors.textSecondary}
            >
              <Picker.Item
                label={t("summary.all_shifts") || "All Shifts"}
                value="ALL"
              />
              <Picker.Item
                label={t("summary.morning") || "Morning"}
                value="M"
              />
              <Picker.Item
                label={t("summary.evening") || "Evening"}
                value="E"
              />
            </Picker>
          </View>
          <TouchableOpacity
            style={[
              themedStyles.button,
              { backgroundColor: colors.primary },
              (loading || !startDate || !endDate) &&
                themedStyles.disabledButton,
            ]}
            onPress={handleFetch}
            disabled={loading || !startDate || !endDate}
            activeOpacity={0.8}
          >
            <Text style={themedStyles.buttonText}>
              {t("summary.fetch_summary")}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Date Pickers */}
        <DateTimePickerModal
          visible={showStartPicker}
          initialDate={startDate || new Date()}
          onConfirm={(date) => {
            setShowStartPicker(false);
            setStartDate(date);
          }}
          onClose={() => setShowStartPicker(false)}
        />
        <DateTimePickerModal
          visible={showEndPicker}
          initialDate={endDate || new Date()}
          onConfirm={(date) => {
            setShowEndPicker(false);
            setEndDate(date);
          }}
          onClose={() => setShowEndPicker(false)}
        />
        {/* Summary Stats */}
        {loading ? (
          <View style={themedStyles.loadingContainer}>
            <MaterialCommunityIcons
              name="progress-clock"
              size={32}
              color={colors.primary}
            />
            <Text
              style={[themedStyles.buttonText, { color: colors.textSecondary }]}
            >
              {t("summary.loading")}
            </Text>
          </View>
        ) : error ? (
          <View style={themedStyles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={32}
              color={colors.error}
            />
            <Text style={[themedStyles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          </View>
        ) : summary ? (
          <View style={themedStyles.summaryContainer}>
            <Text style={themedStyles.summaryTitle}>
              {t("summary.summary_stats")}
            </Text>
            <View style={themedStyles.summaryRow}>
              <Text style={themedStyles.summaryLabel}>
                {t("summary.total_milk_quantity")}
              </Text>
              <Text style={themedStyles.summaryValue}>
                {summary.total_milk_quantity}
              </Text>
            </View>
            <View style={themedStyles.summaryRow}>
              <Text style={themedStyles.summaryLabel}>
                {t("summary.total_milk_amount")}
              </Text>
              <Text style={themedStyles.summaryValue}>
                ₹{summary.total_milk_amount}
              </Text>
            </View>
            <View style={themedStyles.summaryRow}>
              <Text style={themedStyles.summaryLabel}>
                {t("summary.total_expense_amount")}
              </Text>
              <Text style={themedStyles.summaryValue}>
                ₹{summary.total_expense_amount}
              </Text>
            </View>
            <View style={themedStyles.summaryRow}>
              <Text style={themedStyles.summaryLabel}>
                {t("summary.total_entries")}
              </Text>
              <Text style={themedStyles.summaryValue}>
                {summary.total_entries_count}
              </Text>
            </View>
          </View>
        ) : (
          <View style={themedStyles.centered}>
            <Text
              style={[themedStyles.buttonText, { color: colors.textSecondary }]}
            >
              {t("summary.no_data")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  inputCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
    gap: 8,
  },
  inputButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 4,
    minWidth: 120,
  },
  inputButtonText: {
    marginLeft: 7,
    fontWeight: "500",
    fontSize: 15,
  },
  inputToText: {
    fontWeight: "500",
    marginRight: 8,
    fontSize: 15,
  },
  fetchButton: {
    width: "100%",
    borderRadius: 6,
    paddingVertical: 13,
    marginTop: 6,
    elevation: 2,
    alignItems: "center",
  },
  fetchButtonText: {
    fontWeight: "600",
    fontSize: 17,
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 12,
  },
  statCard: {
    width: "47%",
    marginBottom: 16,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 2,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  infoText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 20,
  },
  pickerContainer: {
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
});

export default SummaryScreen;
