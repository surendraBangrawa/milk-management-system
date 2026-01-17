import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  saveRatelist,
  RateListRequest,
  RateData,
} from "@/redux/slice/ratelist/rateListApi";
import useTheme from "@/context/theme/useTheme";
import Toast from "react-native-toast-message";
import logger from "@/lib/logger";

interface TableItem {
  fat: number;
  snf: number;
  key: string;
}

interface RateTableRowProps {
  item: TableItem;
  value: string;
  onChangeText: (value: string) => void;
  columnWidths: {
    fat: number;
    snf: number;
    rate: number;
  };
  colors: any;
}

// --- Memoized Component for a Single Table Row ---
const RateTableRow = React.memo<RateTableRowProps>(
  ({ item, value, onChangeText, columnWidths, colors }) => {
    return (
      <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
        <View style={[styles.cell, { width: columnWidths.fat }]}>
          <Text style={[styles.cellText, { color: colors.textPrimary }]}>
            {item.fat.toFixed(1)}
          </Text>
        </View>
        <View style={[styles.cell, { width: columnWidths.snf }]}>
          <Text style={[styles.cellText, { color: colors.textPrimary }]}>
            {item.snf.toFixed(1)}
          </Text>
        </View>
        <View
          style={[styles.cell, styles.rateCell, { width: columnWidths.rate }]}
        >
          <TextInput
            style={[
              styles.rateInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              },
            ]}
            keyboardType="numeric"
            value={value}
            onChangeText={onChangeText}
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            textAlign="center"
            returnKeyType="done"
          />
        </View>
      </View>
    );
  }
);

const InputTable = () => {
  const params = useLocalSearchParams();
  const sf = params.sf as string;
  const ef = params.ef as string;
  const ss = params.ss as string;
  const es = params.es as string;
  const router = useRouter();
  const { colors } = useTheme();

  const [tableData, setTableData] = useState<TableItem[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generatingTable, setGeneratingTable] = useState(true);

  // Ref to hold the latest rates state for the interval timer
  const latestRatesRef = useRef(rates);

  // Function to generate a unique storage key based on ranges
  const getStorageKey = () => `rate_list_draft_${sf}_${ef}_${ss}_${es}`;

  // Function to save the current rates state to AsyncStorage
  const saveDraft = async () => {
    if (!(sf && ef && ss && es)) {
      logger.warning("Cannot save draft: Ranges not available");
      return;
    }
    const key = getStorageKey();
    try {
      await AsyncStorage.setItem(key, JSON.stringify(latestRatesRef.current));
    } catch (error) {
      logger.error(`Failed to save draft for key ${key}`, error as Error);
    }
  };

  // Effect to generate table data and load draft when parameters are available
  useEffect(() => {
    let isMounted = true;

    const loadAndGenerate = async () => {
      if (!(sf && ef && ss && es)) {
        setGeneratingTable(false);
        return;
      }

      const startFat = parseFloat(sf);
      const endFat = parseFloat(ef);
      const startSnf = parseFloat(ss);
      const endSnf = parseFloat(es);

      if (
        isNaN(startFat) ||
        isNaN(endFat) ||
        isNaN(startSnf) ||
        isNaN(endSnf)
      ) {
        Alert.alert("Error", "Invalid range parameters received.");
        setGeneratingTable(false);
        return;
      }

      const generatedTableData: TableItem[] = [];
      const initialRates: Record<string, string> = {};

      const fatValues: number[] = [];
      const epsilon = 0.0001;
      for (
        let f = startFat;
        f <= endFat + epsilon;
        f = parseFloat((f + 0.1).toFixed(1))
      ) {
        fatValues.push(f);
      }

      const snfValues: number[] = [];
      for (
        let s = startSnf;
        s <= endSnf + epsilon;
        s = parseFloat((s + 0.1).toFixed(1))
      ) {
        snfValues.push(s);
      }

      if (fatValues.length === 0 || snfValues.length === 0) {
        Alert.alert(
          "Error",
          "Could not generate any Fat or SNF values with the provided ranges."
        );
        setGeneratingTable(false);
        return;
      }

      // Generate the flattened list of all combinations and initial rate structure
      fatValues.forEach((fat) => {
        snfValues.forEach((snf) => {
          const key = `${fat.toFixed(1)}_${snf.toFixed(1)}`;
          generatedTableData.push({
            fat: fat,
            snf: snf,
            key: key,
          });
          initialRates[key] = "";
        });
      });

      // Attempt to load draft from AsyncStorage
      const key = getStorageKey();
      let loadedRates: Record<string, string> | null = null;
      try {
        const draft = await AsyncStorage.getItem(key);
        if (draft !== null) {
          loadedRates = JSON.parse(draft);
        }
      } catch (error) {
        logger.error(`Failed to load draft for key ${key}`, error as Error);
      }

      // Merge loaded rates with the initial structure
      const mergedRates = { ...initialRates };
      if (loadedRates) {
        generatedTableData.forEach((item) => {
          const key = item.key;
          if (loadedRates!.hasOwnProperty(key)) {
            const loadedValue = loadedRates![key];
            if (
              typeof loadedValue === "string" ||
              typeof loadedValue === "number"
            ) {
              mergedRates[key] = String(loadedValue).replace(/[^0-9.]/g, "");
            } else {
              logger.warning(
                `Skipping invalid loaded value for key ${key}`,
                { loadedValue }
              );
            }
          }
        });
      }

      if (isMounted) {
        setTableData(generatedTableData);
        setRates(mergedRates);
        setGeneratingTable(false);
      }
    };

    loadAndGenerate();

    return () => {
      isMounted = false;
    };
  }, [sf, ef, ss, es]);

  // Effect to keep the ref updated with the latest rates state
  useEffect(() => {
    latestRatesRef.current = rates;
  }, [rates]);

  // Effect to set up the periodic auto-save interval
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (!generatingTable && tableData.length > 0) {
      intervalId = setInterval(saveDraft, 15000);
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [generatingTable, tableData.length]);

  const handleRateInputChange = (key: string, value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return;
    }

    setRates((prevRates) => ({
      ...prevRates,
      [key]: numericValue,
    }));
  };

  // Function to save the rate list to the backend and clear draft
  const saveRateList = async () => {
    setLoading(true);
    const rateListToSend: RateData[] = [];
    let validationError = false;

    // Calculate min/max values for the backend
    const fatValues = tableData.map((item) => item.fat);
    const snfValues = tableData.map((item) => item.snf);
    const minFat = Math.min(...fatValues);
    const maxFat = Math.max(...fatValues);
    const minSnf = Math.min(...snfValues);
    const maxSnf = Math.max(...snfValues);

    // Iterate through the flattened table data to build the list to send
    for (const row of tableData) {
      const key = row.key;
      const rateString = rates[key];
      const numericRate = parseFloat(rateString);

      if (rateString === "" || isNaN(numericRate) || numericRate < 0) {
        validationError = true;
        logger.warning(`Invalid or empty rate for row ${key}`, { rateString });
      }

      if (!isNaN(numericRate) && numericRate >= 0) {
        rateListToSend.push({
          fat: parseFloat(row.fat.toFixed(1)),
          snf: parseFloat(row.snf.toFixed(1)),
          rate: parseFloat(numericRate.toFixed(2)),
        });
      }
    }

    if (validationError) {
      setLoading(false);
      Alert.alert(
        "Validation Error",
        "Please ensure all rate fields are filled with valid positive numbers."
      );
      return;
    }

    if (rateListToSend.length === 0) {
      setLoading(false);
      Alert.alert("Validation Error", "No valid rates were entered.");
      return;
    }

    try {
      const rateListRequest: RateListRequest = {
        min_fat: minFat,
        max_fat: maxFat,
        min_snf: minSnf,
        max_snf: maxSnf,
        rates: rateListToSend,
      };

      const result = await saveRatelist(rateListRequest);

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Rate list saved successfully!",
      });

      // Clear the draft from local storage on successful save
      if (sf && ef && ss && es) {
        const key = getStorageKey();
        try {
          await AsyncStorage.removeItem(key);
        } catch (removeError) {
          logger.error(`Failed to clear draft for key ${key}`, removeError as Error);
        }
      }

      // Navigate back to the main RateListViewer screen
      router.replace("/(app)/ratelist");
    } catch (error: any) {
      logger.error("Error saving rate list", error as Error);
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Failed to save rate list";
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Define column widths using useMemo for performance and consistency
  const columnWidths = useMemo(
    () => ({
      fat: 80,
      snf: 80,
      rate: 100,
    }),
    []
  );

  if (generatingTable) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Generating Table Data...
        </Text>
      </View>
    );
  }

  if (tableData.length === 0) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Error Generating Table
        </Text>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Could not generate any table data with the provided ranges. Please go
          back and check the values entered.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.surface }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Define Rates Table
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Enter the rate (₹) for each Fat and SNF combination.
        </Text>

        <View
          style={[
            styles.tableRow,
            styles.headerRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.headerCell, { width: columnWidths.fat }]}>
            <Text style={[styles.headerText, { color: colors.textPrimary }]}>
              Fat (%)
            </Text>
          </View>
          <View style={[styles.headerCell, { width: columnWidths.snf }]}>
            <Text style={[styles.headerText, { color: colors.textPrimary }]}>
              SNF (%)
            </Text>
          </View>
          <View style={[styles.headerCell, { width: columnWidths.rate }]}>
            <Text style={[styles.headerText, { color: colors.textPrimary }]}>
              Rate (₹)
            </Text>
          </View>
        </View>

        <FlatList
          data={tableData}
          renderItem={({ item }) => (
            <RateTableRow
              item={item}
              value={rates[item.key]}
              onChangeText={(value) => handleRateInputChange(item.key, value)}
              columnWidths={columnWidths}
              colors={colors}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={15}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={saveRateList}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.surface }]}>
              Save Rate List
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  backButtonText: {
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  infoText: {
    fontSize: 15,
    marginBottom: 10,
    textAlign: "center",
    paddingHorizontal: 5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  headerRow: {
    borderTopWidth: 1,
  },
  headerCell: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
  },
  cellText: {
    fontSize: 15,
    textAlign: "center",
  },
  rateCell: {
    justifyContent: "center",
    paddingVertical: 5,
  },
  rateInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 5,
    fontSize: 15,
    textAlign: "center",
    minWidth: 50,
    height: 35,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default InputTable;
