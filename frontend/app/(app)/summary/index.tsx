import { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Stack } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import useTheme from "@/context/theme/useTheme";
import { getTotalRecordDateRangeApi } from "@/redux/slice/transactions/transactionApi";
import DateTimePickerModal from "@/components/DatePickerModal";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SummaryScreen = () => {
  const { colors } = useTheme();
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

  return (
    <SafeAreaWrapper backgroundColor={colors.background}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
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
                styles.inputCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
                {t("summary.select_date_range")}
              </Text>
              <View style={styles.inputRow}>
                <TouchableOpacity
                  style={[styles.inputButton, { flex: 1, marginRight: 5 }]}
                  onPress={() => setShowStartPicker(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="calendar-range"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.inputButtonText}>
                    {startDate
                      ? startDate.toLocaleDateString()
                      : t("summary.select_start_date")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputButton, { flex: 1, marginLeft: 5 }]}
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
                      styles.inputButtonText,
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={shift || "ALL"}
                  onValueChange={(value) => setShift(value)}
                  style={{ color: colors.textPrimary }}
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
                  styles.fetchButton,
                  { backgroundColor: colors.primary },
                  (loading || !startDate || !endDate) && { opacity: 0.6 },
                ]}
                onPress={handleFetch}
                disabled={loading || !startDate || !endDate}
                activeOpacity={0.8}
              >
                <Text style={styles.fetchButtonText}>
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
              <View style={styles.centered}>
                <MaterialCommunityIcons
                  name="progress-clock"
                  size={32}
                  color={colors.primary}
                />
                <Text
                  style={[styles.loadingText, { color: colors.textSecondary }]}
                >
                  {t("summary.loading")}
                </Text>
              </View>
            ) : error ? (
              <View style={styles.centered}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={32}
                  color={colors.error}
                />
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {error}
                </Text>
              </View>
            ) : summary ? (
              <View style={styles.statsGrid}>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="cow"
                    size={32}
                    color={colors.primary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("summary.total_milk_quantity")}
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {summary.total_milk_quantity}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="currency-inr"
                    size={32}
                    color={colors.success}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("summary.total_milk_amount")}
                  </Text>
                  <Text style={[styles.statValue, { color: colors.success }]}>
                    ₹{summary.total_milk_amount}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="currency-inr"
                    size={32}
                    color={colors.error}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("summary.total_expense_amount")}
                  </Text>
                  <Text style={[styles.statValue, { color: colors.error }]}>
                    ₹{summary.total_expense_amount}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="format-list-numbered"
                    size={32}
                    color={colors.textPrimary}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[styles.statLabel, { color: colors.textSecondary }]}
                  >
                    {t("summary.total_entries")}
                  </Text>
                  <Text
                    style={[styles.statValue, { color: colors.textPrimary }]}
                  >
                    {summary.total_entries_count}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.centered}>
                <Text
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {t("summary.no_data")}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
    elevation: 2,
    shadowColor: "#000",
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
    backgroundColor: "#f5f5f5",
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
    color: "#333",
    fontSize: 15,
  },
  inputToText: {
    color: "#888",
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
    color: "#fff",
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
    shadowColor: "#000",
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
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
    overflow: "hidden",
  },
});

export default SummaryScreen;
