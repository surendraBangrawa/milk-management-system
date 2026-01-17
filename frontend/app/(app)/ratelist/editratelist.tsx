import React, { useState, useEffect, useMemo, memo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { getRatelist, saveRatelist } from "@/redux/slice/ratelist/rateListApi";
import useTheme from "@/context/theme/useTheme";
import Toast from "react-native-toast-message";
import logger from "@/lib/logger";

import {
  useForm,
  Controller,
  useFieldArray,
  FieldErrors,
  useFormState,
} from "react-hook-form";

// Define your types for better type safety and clarity
export interface RateItem {
  fat: number;
  snf: number;
  rate: number;
  id?: string | number;
  [key: string]: any;
}

export interface RateFormData {
  rateItems: RateItem[];
}

export interface VisibleFieldItem {
  field: RateItem & { key: string }; // Add RHF 'key' to the field type
  originalIndex: number; // The original index in the full array (crucial for RHF name paths)
}

const EditRateListScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false); // Focus state for search input

  // Memoized focus handlers to prevent unnecessary re-renders
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Debounce state for search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

  // --- React Hook Form Setup ---
  const { control, handleSubmit } = useForm<RateFormData>({
    defaultValues: {
      rateItems: [],
    },
    // Changed to onBlur for slightly earlier feedback without onChange overhead.
    // Also, when the form is submitted, it will trigger validation on all fields.
    mode: "onBlur",
    reValidateMode: "onBlur", // Re-validate on blur
  });

  // Get errors and dirtyFields using useFormState
  // This is global for the form, individual row errors are accessed via useFormState within memo()
  const { errors } = useFormState({ control });

  const { fields, replace, append, remove } = useFieldArray<RateFormData>({
    control,
    name: "rateItems",
    keyName: "key",
  });
  // --- End React Hook Form Setup ---

  useEffect(() => {
    fetchRateListForEdit();
  }, []);

  // Effect to debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchRateListForEdit = async (): Promise<void> => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getRatelist();

      if (
        data &&
        data.data &&
        Array.isArray(data.data.rates) &&
        data.data.rates.every(
          (item: any) =>
            typeof item === "object" &&
            item !== null &&
            "fat" in item &&
            "snf" in item &&
            "rate" in item
        )
      ) {
        // Ensure fetched data has correct types for RHF default values if needed,
        // but RHF handles type coercion for inputs well.
        replace(data.data.rates); // Populate the field array with fetched RateItem[]
      } else {
        logger.warning(
          "API returned non-array data or unexpected structure for Edit",
          { data }
        );
        replace([]);
        const errorMessage = "Received unexpected data format from the server.";
        setFetchError(errorMessage);
        Toast.show({ type: "error", text1: "Data Error", text2: errorMessage });
      }
    } catch (err: any) {
      logger.error("Error fetching rate list for edit", err as Error);
      const errorMessage = `Failed to load rate list for editing. ${
        err.message || "Please check your network."
      }`;
      setFetchError(errorMessage);
      Toast.show({ type: "error", text1: "Fetch Failed", text2: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const visibleFields: VisibleFieldItem[] = useMemo(() => {
    // Use debounced search query here
    const currentSearchQuery = debouncedSearchQuery.toLowerCase();
    const filtered = currentSearchQuery
      ? fields.filter((field) => {
          // Ensure values are treated as strings for searching, handle null/undefined safely
          const fatString = String(field.fat ?? "");
          const snfString = String(field.snf ?? "");
          const rateString = String(field.rate ?? "");

          return (
            fatString.includes(currentSearchQuery) ||
            snfString.includes(currentSearchQuery) ||
            rateString.includes(currentSearchQuery)
          );
        })
      : fields; // If no search query, use the full fields array

    // Map the filtered fields back to the VisibleFieldItem structure
    // The originalIndex is the index in the *current* 'fields' array, which is what RHF uses
    return filtered.map((field, index) => ({
      field,
      originalIndex: fields.findIndex((f) => f.key === field.key), // Find the original index in the full fields array
    }));
  }, [fields, debouncedSearchQuery]); // Dependency changed to debouncedSearchQuery

  // Memoize the onSubmit function
  const onSubmit = useCallback(
    async (formData: RateFormData): Promise<void> => {
      setSaving(true);

      // Perform final parsing and validation before sending
      const dataToSave: RateItem[] = formData.rateItems.map((item) => {
        const parsedItem: RateItem = { ...item };

        // Parse values from string (as they come from TextInput via RHF) to number
        // Use Number() for stricter parsing, parseFloat can be more lenient
        parsedItem.fat = Number(item.fat);
        parsedItem.snf = Number(item.snf);
        parsedItem.rate = Number(item.rate);

        return parsedItem;
      });

      // Check if any numbers are invalid after parsing from string (e.g., if user types non-numeric chars)
      // This is a safety net in case RHF validation was bypassed or for final data structure check
      const hasInvalidDataAfterParsing = dataToSave.some(
        (item) =>
          isNaN(item.fat) ||
          item.fat < 0 || // Also check for negative values
          isNaN(item.snf) ||
          item.snf < 0 ||
          isNaN(item.rate) ||
          item.rate < 0
      );

      if (hasInvalidDataAfterParsing) {
        Toast.show({
          type: "error",
          text1: "Validation Error",
          text2:
            "Some data is invalid (e.g., not a positive number) after parsing. Please correct before saving.",
        });
        setSaving(false);
        return;
      }

      try {
        // Assuming saveRatelist expects an array of RateItem
        await saveRatelist({ rates: dataToSave });
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Rate list saved successfully!", // Specific success message for saving
        });
        // Delay navigation slightly to allow Toast to be seen
        // Removed setTimeout for potentially faster navigation after Toast shows
        router.back();
      } catch (err: any) {
        logger.error("Error saving rate list", err as Error);
        const errorMessage = `Failed to save rate list: ${
          err.message || "Please try again."
        }`;
        Toast.show({
          type: "error",
          text1: "Save Failed",
          text2: errorMessage,
        });
      } finally {
        setSaving(false);
      }
    },
    [router] // Dependencies for useCallback
  );

  // Define a separate component for each row to use React.memo
  // It now receives only the 'item' and necessary functions/states that don't change frequently
  const RenderRateItem = memo(
    ({
      item,
      control,
      colors,
      saving,
      remove,
      fieldsLength,
    }: {
      item: VisibleFieldItem;
      control: any; // Type from useForm
      colors: any; // Type from useTheme
      saving: boolean;
      remove: (index?: number | number[]) => void; // Type from useFieldArray
      fieldsLength: number; // Pass fields.length to memoized component
    }) => {
      const { field, originalIndex } = item;

      // Access errors for this specific field *inside* the memoized component
      // This makes the component only re-render when *its* error state changes
      const { errors: fieldErrorsParent } = useFormState({
        control,
        name: `rateItems[${originalIndex}]`,
      });
      // Cast the errors for better type safety
      const fieldErrors = (errors.rateItems as FieldErrors<RateItem>[])?.[
        originalIndex
      ];
      // Memoize the delete handler within RenderRateItem to ensure stability
      const handleDelete = useCallback(() => {
        Alert.alert("Delete Row", "Are you sure you want to delete this row?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              // Use originalIndex to remove the correct item from the RHF array
              remove(originalIndex);
              Toast.show({
                type: "info",
                text1: "Row Deleted",
                text2: "Row removed from the list.",
              });
            },
          },
        ]);
      }, [originalIndex, remove]); // Dependencies for useCallback

      return (
        <View
          style={[
            styles.tableRowContainer,
            originalIndex % 2 === 0
              ? { backgroundColor: colors.surface }
              : { backgroundColor: colors.background },
            { borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.tableRowCells}>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name={`rateItems[${originalIndex}].fat`} // Use the ORIGINAL index for the name
                rules={{
                  required: "Fat is required", // More descriptive message
                  validate: (value) => {
                    // Allow empty string if not required, otherwise check number validity
                    if (String(value).trim() === "") return true; // Handled by 'required' if needed
                    const num = Number(value); // Use Number()
                    if (isNaN(num)) return "Must be a number";
                    if (num < 0) return "Must be positive";
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.tableCellInput,
                      styles.fatCell,
                      {
                        borderColor: fieldErrors?.fat
                          ? colors.error
                          : colors.border, // Apply error border color
                        color: colors.textPrimary,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value ?? "")} // Ensure value is a string, handle null/undefined
                    placeholder="Fat"
                    placeholderTextColor={colors.textSecondary}
                    editable={!saving} // Disable input while saving
                    accessibilityLabel={`Fat value for row ${
                      originalIndex + 1
                    }`}
                  />
                )}
              />
              {fieldErrors?.fat && (
                <Text style={[styles.cellErrorText, { color: colors.error }]}>
                  {fieldErrors.fat.message}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name={`rateItems[${originalIndex}].snf`}
                rules={{
                  required: "SNF is required",
                  validate: (value) => {
                    if (String(value).trim() === "") return true;
                    const num = Number(value); // Use Number()
                    if (isNaN(num)) return "Must be a number";
                    if (num < 0) return "Must be positive";
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.tableCellInput,
                      styles.snfCell,
                      {
                        borderColor: fieldErrors?.snf
                          ? colors.error
                          : colors.border, // Apply error border color
                        color: colors.textPrimary,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value ?? "")}
                    placeholder="SNF"
                    placeholderTextColor={colors.textSecondary}
                    editable={!saving}
                    accessibilityLabel={`SNF value for row ${
                      originalIndex + 1
                    }`}
                  />
                )}
              />
              {fieldErrors?.snf && (
                <Text style={[styles.cellErrorText, { color: colors.error }]}>
                  {fieldErrors.snf.message}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name={`rateItems[${originalIndex}].rate`}
                rules={{
                  required: "Rate is required",
                  validate: (value) => {
                    if (String(value).trim() === "") return true;
                    const num = Number(value); // Use Number()
                    if (isNaN(num)) return "Must be a number";
                    if (num < 0) return "Must be positive";
                    return true;
                  },
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.tableCellInput,
                      styles.rateCell,
                      {
                        borderColor: fieldErrors?.rate
                          ? colors.error
                          : colors.border, // Apply error border color
                        color: colors.textPrimary,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={String(value ?? "")}
                    placeholder="Rate"
                    placeholderTextColor={colors.textSecondary}
                    editable={!saving}
                    accessibilityLabel={`Rate value for row ${
                      originalIndex + 1
                    }`}
                  />
                )}
              />
              {fieldErrors?.rate && (
                <Text style={[styles.cellErrorText, { color: colors.error }]}>
                  {fieldErrors.rate.message}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.deleteButtonContainer}>
            <TouchableOpacity
              onPress={handleDelete}
              style={[
                styles.deleteRowButton,
                { backgroundColor: colors.error }, // Use theme error color
                (saving || fieldsLength === 1) && { opacity: 0.5 }, // Disable if saving or only one row left
              ]}
              disabled={saving || fieldsLength === 1} // Disable while saving or if it's the last row
              accessibilityLabel="Delete row"
              accessibilityHint={`Delete row ${
                originalIndex + 1
              } from rate list`}
            >
              <Text
                style={[styles.deleteRowButtonText, { color: colors.surface }]}
              >
                X
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  );

  // Add display name
  RenderRateItem.displayName = "RenderRateItem";

  // Pass necessary props to the memoized component
  const renderItem = useCallback(
    ({ item }: { item: VisibleFieldItem }) => (
      <RenderRateItem
        item={item}
        control={control} // Pass control
        colors={colors} // Pass colors
        saving={saving} // Pass saving state
        remove={remove} // Pass remove function
        fieldsLength={fields.length} // Pass fields.length
      />
    ),
    [control, colors, saving, remove, fields.length] // Dependencies for useCallback
  );

  // Consider adding getItemLayout if rows have fixed height for extreme performance on very long lists
  const getItemLayout = useCallback(
    (data: ArrayLike<VisibleFieldItem> | null | undefined, index: number) => {
      // Re-evaluate this height carefully based on your final layout.
      // It should be the exact height of one row, including padding and margin.
      // Approx: input minHeight (38) + input vertical padding (8*2) + inputContainer paddingBottom (15) + tableRowContainer paddingVertical (5*2) = 38 + 16 + 15 + 10 = 79
      const rowHeight = 79; // Estimate this based on your row height, including padding/margins + error text
      return {
        length: rowHeight,
        offset: rowHeight * index,
        index,
      };
    },
    []
  );

  // --- Conditional Rendering for Loading, Error, Empty States ---
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading Rate List for editing...
        </Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {fetchError}
        </Text>
        <TouchableOpacity
          onPress={fetchRateListForEdit}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          accessibilityLabel="Retry fetching rate list"
        >
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (fields.length === 0 && !loading && !searchQuery) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          No rate list data available to edit.
        </Text>
        <TouchableOpacity
          onPress={() => append({ fat: 0, snf: 0, rate: 0 })}
          style={[
            styles.retryButton,
            { marginTop: 10, backgroundColor: colors.primary },
          ]}
          accessibilityLabel="Add first row to rate list"
        >
          <Text style={[styles.retryButtonText, { color: colors.surface }]}>
            Add First Row
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.retryButton,
            { marginTop: 10, backgroundColor: colors.border },
          ]} // Use border for 'go back'
          accessibilityLabel="Go back to previous screen"
        >
          <Text style={[styles.retryButtonText, { color: colors.textPrimary }]}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.mainContainer, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <Stack.Screen
        options={{
          title: "Edit Ratelist",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />
      <TextInput
        style={[
          styles.searchInput,
          {
            borderColor: isFocused ? colors.primary : colors.border,
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderWidth: isFocused ? 2 : 1,
          },
        ]}
        placeholder="Search by Fat, SNF, or Rate..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery} // Updates immediate searchQuery, which then debounces
        onFocus={handleFocus}
        onBlur={handleBlur}
        clearButtonMode="while-editing"
        editable={!saving} // Disable search while saving
        accessibilityLabel="Search rate list"
        accessibilityHint="Filter rows by Fat, SNF, or Rate values"
        accessibilityRole="search"
        accessibilityState={{ disabled: saving }}
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
      />

      <View
        style={[
          styles.tableHeader,
          { borderBottomColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Text
          style={[
            styles.tableHeaderCell,
            styles.fatHeader,
            { color: colors.textPrimary },
          ]}
        >
          Fat
        </Text>
        <Text
          style={[
            styles.tableHeaderCell,
            styles.snfHeader,
            { color: colors.textPrimary },
          ]}
        >
          SNF
        </Text>
        <Text
          style={[
            styles.tableHeaderCell,
            styles.rateHeader,
            { color: colors.textPrimary },
          ]}
        >
          Rate
        </Text>
        <View style={styles.deleteHeaderCell}>
          <Text
            style={[styles.tableHeaderCellText, { color: colors.textPrimary }]}
          >
            Del
          </Text>
        </View>
      </View>

      {visibleFields.length > 0 ? (
        <FlatList
          data={visibleFields}
          renderItem={renderItem} // Use the memoized renderItem
          keyExtractor={
            (item) => item.field.key // Use RHF's internal key for best performance
          }
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={25}
          removeClippedSubviews={true} // Performance optimization
          keyboardShouldPersistTaps="handled" // Allow taps outside inputs to dismiss keyboard
          // Pass the debouncedSearchQuery as extraData so FlatList knows to re-render
          // when search results change, in case the memoization misses something.
          extraData={debouncedSearchQuery}
          getItemLayout={getItemLayout} // Add getItemLayout for performance
        />
      ) : (
        // Show message if search results are empty AND the overall list is not empty
        fields.length > 0 &&
        searchQuery && (
          <View style={styles.centered}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              No results found for "{searchQuery}".
            </Text>
          </View>
        )
      )}

      {fields.length > 0 && !loading && !fetchError && (
        <TouchableOpacity
          onPress={() => append({ fat: 0, snf: 0, rate: 0 })}
          style={[styles.appendButton, { backgroundColor: colors.primary }]}
          disabled={saving} // Disable add button while saving
          accessibilityLabel="Add new row"
        >
          <Text style={[styles.appendButtonText, { color: colors.surface }]}>
            Add New Row
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          {
            backgroundColor: colors.success,
          },
        ]}
        onPress={handleSubmit(onSubmit)}
        accessibilityLabel="Save changes to rate list"
      >
        {saving ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={[styles.saveButtonText, { color: colors.surface }]}>
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    padding: 20,
    // Handled by Stack.Screen header
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    // color handled by theme
  },
  errorText: {
    fontSize: 16,
    // color handled by theme
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 16,
    // color handled by theme
    textAlign: "center",
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    // backgroundColor handled by theme
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  retryButtonText: {
    // color handled by theme
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    // color handled by theme
  },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    // borderBottomColor handled by theme
    paddingVertical: 10,
    // backgroundColor handled by theme
    marginBottom: 5,
    borderRadius: 8, // Rounded corners for header
    overflow: "hidden", // Ensures border radius clips content
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 15,
    // color handled by theme
    textAlign: "center",
    paddingHorizontal: 3,
  },
  tableHeaderCellText: {
    fontWeight: "bold",
    fontSize: 15,
    // color handled by theme
    textAlign: "center",
  },
  fatHeader: { flexBasis: "28%" },
  snfHeader: { flexBasis: "28%" },
  rateHeader: { flexBasis: "30%" },
  deleteHeaderCell: {
    flexBasis: "15%",
    alignItems: "center",
    justifyContent: "center",
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20, // Space for the last row above save button
  },
  tableRowContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingVertical: 5, // Keep this vertical padding
    alignItems: "flex-start", // Align items to the top to accommodate error text below inputs
    position: "relative",
  },
  tableRowCells: {
    flexDirection: "row",
    flex: 1, // Take available space to push delete button
    alignItems: "flex-start", // Align items to the top to accommodate error text below inputs
  },

  inputContainer: {
    flexBasis: "30%", // Set flex basis for the container
    marginHorizontal: 2, // Match margin of tableCellInput
    position: "relative", // Needed for absolute positioning of error text
    paddingVertical: 15, // Add padding at the bottom to make space for error text
    flexGrow: 1,
    flexShrink: 1,
  },
  tableCellInput: {
    flex: 1, // Make input take up available space within its container
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 3,
    borderWidth: 1,
    borderRadius: 4,
    minHeight: 40,
  },
  fatCell: { flexBasis: "28%" },
  snfCell: { flexBasis: "28%" },
  rateCell: { flexBasis: "30%" },

  cellErrorText: {
    position: "absolute",
    bottom: 0, // Position at the very bottom of the inputContainer
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    zIndex: 1,
  },

  appendButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  appendButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButtonContainer: {
    flexBasis: "14%", // Allocate space for the delete button
    alignItems: "center", // Center the button horizontally
    paddingHorizontal: 5,
    paddingVertical: 15,
  },
  deleteRowButton: {
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 35,
    height: 40,
    // opacity handled inline
  },
  deleteRowButtonText: {
    // color handled by theme
    fontSize: 14,
    fontWeight: "bold",
  },

  saveButton: {
    // backgroundColor handled by theme
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: Platform.OS === "ios" ? 0 : 10, // Adjust for KeyboardAvoidingView on iOS
  },
  saveButtonText: {
    // color handled by theme
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default EditRateListScreen;
