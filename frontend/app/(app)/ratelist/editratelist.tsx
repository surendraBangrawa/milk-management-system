import React, { useState, useEffect, useMemo } from "react";
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
import { useRouter } from "expo-router";
import {
  getRatelist,
  updateRatelist,
} from "@/redux/slice/ratelist/rateListApi";

// Import React Hook Form types and components
import {
  useForm,
  Controller,
  useFieldArray,
  FieldErrors,
} from "react-hook-form";
// Import your defined types

// Interface for a single rate list item object
// Assuming fat, snf, and rate are numbers from the API.
// Add 'id' if your items have unique identifiers from the backend.
// Use optional properties (?) for fields that might be missing.
export interface RateItem {
  fat: number;
  snf: number;
  rate: number;
  id?: string | number; // Optional unique identifier
  [key: string]: any; // Allow for other properties not explicitly listed
}

// Interface for the form data structure used by React Hook Form
export interface RateFormData {
  rateItems: RateItem[]; // The array managed by useFieldArray
}

// Interface for items in the visibleFields array (used by FlatList)
// This pairs the RHF field object with its original index in the full array
export interface VisibleFieldItem {
  field: RateItem; // The item data from the RHF fields array
  originalIndex: number; // The original index in the full array
}

const EditRateListScreen: React.FC = () => {
  // Annotate component with React.FC
  const router = useRouter();

  // Add type annotations to useState
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // fetchError is a string or null
  const [searchQuery, setSearchQuery] = useState<string>(""); // searchQuery is a string

  // --- React Hook Form Setup ---
  // Add RateFormData as the generic type for useForm
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<RateFormData>({
    defaultValues: {
      rateItems: [], // Initial empty array matching RateFormData structure
    },
    // mode: 'onBlur', // Optional: Validate on blur
  });

  // Add RateFormData as the generic type for useFieldArray
  const { fields, replace, append, remove } = useFieldArray<RateFormData>({
    control,
    name: "rateItems", // This must match the key in RateFormData ('rateItems')
    // keyName: 'id', // Use 'id' if your RateItem has an 'id' for better performance
  });
  // --- End React Hook Form Setup ---

  useEffect(() => {
    fetchRateListForEdit();
  }, []);

  const fetchRateListForEdit = async (): Promise<void> => {
    // Annotate return type
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getRatelist(); // Assumed to return Promise<{ data: { rates: RateItem[] } }>
      console.log("Fetched Data for Edit:", data);
      if (data && data.data && Array.isArray(data.data.rates)) {
        // The data directly matches the RateItem[] structure expected by replace
        replace(data.data.rates); // Populate the field array with fetched RateItem[]
      } else {
        console.warn(
          "API returned non-array data or unexpected structure for Edit:",
          data
        );
        replace([]); // Replace with empty array RateItem[]
        setFetchError(
          "Failed to load rate list for editing due to data format."
        );
      }
    } catch (err: any) {
      // Catch error with 'any' or a more specific Error type
      console.error("Error fetching rate list for edit:", err);
      setFetchError(
        `Failed to load rate list for editing. ${err.message || ""}`
      ); // Use error message
    } finally {
      setLoading(false);
    }
  };

  // useMemo will re-calculate visibleFields only when 'fields' or 'searchQuery' changes
  const visibleFields: VisibleFieldItem[] = useMemo(() => {
    // Annotate return type
    if (!searchQuery) {
      // If search is empty, return all fields along with their original index
      return fields.map((field: RateItem, originalIndex: number) => ({
        field,
        originalIndex,
      }));
    }

    const lowerCaseQuery = searchQuery.toLowerCase();

    return fields
      .map((field: RateItem, originalIndex: number) => ({
        field,
        originalIndex,
      })) // Create objects with field and original index
      .filter(({ field }: { field: RateItem }) => {
        // Annotate filter parameter
        // Filter based on string representation of relevant fields
        const fatString =
          field.fat !== undefined && field.fat !== null
            ? field.fat.toString()
            : "";
        const snfString =
          field.snf !== undefined && field.snf !== null
            ? field.snf.toString()
            : "";
        const rateString =
          field.rate !== undefined && field.rate !== null
            ? field.rate.toString()
            : "";

        return (
          fatString.includes(lowerCaseQuery) ||
          snfString.includes(lowerCaseQuery) ||
          rateString.includes(lowerCaseQuery)
        );
      });
  }, [fields, searchQuery]); // Dependencies

  // This function is called by handleSubmit AFTER RHF validation passes
  // It receives the entire form data object with type RateFormData
  const onSubmit = async (formData: RateFormData): Promise<void> => {
    // Annotate parameter and return type
    setSaving(true);
    setError(null);

    // formData.rateItems contains the array of ALL items (visible or not) with their edited values
    const dataToSave: RateItem[] = formData.rateItems.map((item) => {
      // Annotate mapped array type
      const parsedItem: RateItem = { ...item }; // Annotate item type

      // Perform final parsing and validation before sending
      // RHF validation already ran, but this adds a safety net for types
      const fat = parseFloat(item.fat as any); // Cast to any for parseFloat if RHF stored it as string
      const snf = parseFloat(item.snf as any);
      const rate = parseFloat(item.rate as any);

      // Replace with parsed numbers if valid, otherwise handle error or keep original (error case)
      parsedItem.fat = !isNaN(fat) && fat >= 0 ? fat : item.fat; // Keep original value on error
      parsedItem.snf = !isNaN(snf) && snf >= 0 ? snf : item.snf;
      parsedItem.rate = !isNaN(rate) && rate >= 0 ? rate : item.rate;

      return parsedItem;
    });

    // Optional: Add a final check if any parsing/validation failed here based on how you handled errors above
    const hasInvalidData = dataToSave.some(
      (item) =>
        typeof item.fat !== "number" ||
        item.fat < 0 ||
        typeof item.snf !== "number" ||
        item.snf < 0 ||
        typeof item.rate !== "number" ||
        item.rate < 0
    );

    if (hasInvalidData) {
      Alert.alert(
        "Validation Error",
        "Some data is invalid (e.g., not a positive number) after parsing. Please correct before saving."
      );
      setSaving(false);
      return;
    }

    try {
      await updateRatelist(dataToSave); // Assumed to accept RateItem[]

      Alert.alert("Success", "Rate list updated successfully!");
      // router.back();
      // reset(formData);
    } catch (err: any) {
      console.error("Error saving rate list:", err);
      setError(`Failed to save rate list: ${err.message || ""}`);
      Alert.alert("Error", `Failed to save rate list: ${err.message || ""}`);
    } finally {
      setSaving(false);
    }
  };

  // Define how each row in the FlatList is rendered
  // Annotate renderItem parameters
  const renderItem = ({ item }: { item: VisibleFieldItem }) => {
    const { field, originalIndex } = item; // item is VisibleFieldItem

    // Access errors for this specific field using the originalIndex
    const fieldErrors = (errors.rateItems as FieldErrors<RateItem>[])?.[
      originalIndex
    ];

    return (
      // Wrap row content in a View to hold cells and delete button
      <View
        style={[
          styles.tableRowContainer,
          originalIndex % 2 === 0 ? styles.evenRow : styles.oddRow,
        ]}
      >
        <View style={styles.tableRowCells}>
          <Controller
            control={control}
            name={`rateItems[${originalIndex}].fat`} // Use the ORIGINAL index for the name
            rules={{
              required: "Req",
              validate: (value) => {
                const num = parseFloat(value as string); // Cast value from TextInput to string for parsing
                if (value === "") return true; // Allow empty input temporarily
                if (isNaN(num)) return "Num";
                if (num < 0) return "Pos";
                return true;
              },
            }}
            // Annotate render callback parameters
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.tableCellInput,
                  styles.fatCell,
                  // Check errors using the original index
                  fieldErrors?.fat && styles.inputError,
                ]}
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                // value might be number or string depending on initial data and typing
                // Ensure it's a string for TextInput value prop
                value={
                  value !== undefined && value !== null ? String(value) : ""
                }
                placeholder="Fat"
              />
            )}
          />
          {/* Display validation error for Fat - positioned absolutely */}
          {/* Access error message using the original index */}
          {fieldErrors?.fat && (
            <Text style={styles.cellErrorText}>{fieldErrors.fat.message}</Text>
          )}
          {/* --- SNF Input controlled by RHF --- */}
          <Controller
            control={control}
            name={`rateItems[${originalIndex}].snf`} // Use the ORIGINAL index
            rules={{
              required: "Req",
              validate: (value) => {
                const num = parseFloat(value as string);
                if (value === "") return true;
                if (isNaN(num)) return "Num";
                if (num < 0) return "Pos";
                return true;
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.tableCellInput,
                  styles.snfCell,
                  fieldErrors?.snf && styles.inputError,
                ]}
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={
                  value !== undefined && value !== null ? String(value) : ""
                }
                placeholder="SNF"
              />
            )}
          />
          {/* Display validation error for SNF */}
          {fieldErrors?.snf && (
            <Text style={styles.cellErrorText}>{fieldErrors.snf.message}</Text>
          )}
          {/* --- Rate Input controlled by RHF --- */}
          <Controller
            control={control}
            name={`rateItems[${originalIndex}].rate`} // Use the ORIGINAL index
            rules={{
              required: "Req",
              validate: (value) => {
                const num = parseFloat(value as string);
                if (value === "") return true;
                if (isNaN(num)) return "Num";
                if (num < 0) return "Pos";
                return true;
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[
                  styles.tableCellInput,
                  styles.rateCell,
                  fieldErrors?.rate && styles.inputError,
                ]}
                keyboardType="decimal-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={
                  value !== undefined && value !== null ? String(value) : ""
                }
                placeholder="Rate"
              />
            )}
          />
          {/* Display validation error for Rate */}
          {fieldErrors?.rate && (
            <Text style={styles.cellErrorText}>{fieldErrors.rate.message}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Delete Row",
              "Are you sure you want to delete this row?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => remove(originalIndex),
                }, // Call remove with original index
              ]
            );
          }}
          style={styles.deleteRowButton}
        >
          <Text style={styles.deleteRowButtonText}>X</Text>
        </TouchableOpacity>
      </View> // End tableRowContainer
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading Rate List for editing...</Text>
      </View>
    );
  }

  if (fetchError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{fetchError}</Text>
        <TouchableOpacity
          onPress={fetchRateListForEdit}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if the *full* fields array is empty after loading and no search is active
  if (fields.length === 0 && !loading && !searchQuery) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>
          No rate list data available to edit.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.retryButton}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
        {/* Option to add the first row if list is empty */}
        <TouchableOpacity
          onPress={() => append({ fat: 0, snf: 0, rate: 0 })} // Append with default numbers
          style={[
            styles.retryButton,
            { marginTop: 10, backgroundColor: "#007BFF" },
          ]}
        >
          <Text style={styles.retryButtonText}>Add First Row</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <Text style={styles.title}>Edit Milk Rate List</Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search by Fat, SNF, or Rate..."
        value={searchQuery}
        onChangeText={setSearchQuery} // Update search state
        clearButtonMode="while-editing"
      />

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.fatHeader]}>Fat</Text>
        <Text style={[styles.tableHeaderCell, styles.snfHeader]}>SNF</Text>
        <Text style={[styles.tableHeaderCell, styles.rateHeader]}>Rate</Text>
        {/* Add a small header cell for the delete button column */}
        <View style={styles.deleteHeaderCell}>
          <Text style={styles.tableHeaderCellText}>Del</Text>
        </View>
      </View>

      {/* FlatList for the list of editable rows */}
      {/* Show FlatList if there are visible fields, otherwise show no results message */}
      {
        visibleFields.length > 0 ? (
          <FlatList
            data={visibleFields} // Use the memoized visibleFields array
            renderItem={renderItem}
            // Key Extractor should use a stable key, preferably item.field.id if available,
            // otherwise use the original index which is stable even when filtered.
            keyExtractor={(item: VisibleFieldItem) =>
              item.field.id?.toString() || item.originalIndex.toString()
            } // Annotate item type
            style={styles.flatList}
            contentContainerStyle={styles.flatListContent}
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={25}
            removeClippedSubviews={true}
          />
        ) : // Show message if search results are empty AND the overall list is not empty
        fields.length > 0 && searchQuery ? (
          <View style={styles.centered}>
            <Text style={styles.infoText}>
              No results found for "{searchQuery}".
            </Text>
          </View>
        ) : null // Don't show this message if the list was initially empty (handled above)
      }

      {fields.length > 0 && !loading && !fetchError && (
        <TouchableOpacity
          onPress={() => append({ fat: 0, snf: 0, rate: 0 })}
          style={styles.appendButton}
        >
          <Text style={styles.appendButtonText}>Add New Row</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.saveButton,
          (saving || fields.length === 0 || !isDirty || fetchError) &&
            styles.disabledButton,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={saving || fields.length === 0 || !isDirty || fetchError}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

// Styles remain mostly the same, ensure consistent typing if you move them to a separate file
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 20,
    paddingTop: 40,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    minWidth: 100,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  searchInput: {
    height: 50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
    backgroundColor: "#e9e9e9",
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 3,
    flexBasis: "30%",
  },
  tableHeaderCellText: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#333",
    textAlign: "center",
  },
  fatHeader: { flexBasis: "28%" },
  snfHeader: { flexBasis: "28%" },
  rateHeader: { flexBasis: "30%" },
  deleteHeaderCell: {
    flexBasis: "14%",
    alignItems: "center",
    justifyContent: "center",
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },

  tableRowContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 5,
    alignItems: "center",
    position: "relative",
  },
  tableRowCells: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  evenRow: {
    backgroundColor: "#fff",
  },
  oddRow: {
    backgroundColor: "#f9f9f9",
  },

  tableCellInput: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    paddingHorizontal: 3,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    backgroundColor: "#fff",
    marginHorizontal: 2,
    minHeight: 38,
    flexBasis: "30%",
  },
  fatCell: { flexBasis: "28%" },
  snfCell: { flexBasis: "28%" },
  rateCell: { flexBasis: "30%" },

  inputError: {
    borderColor: "red",
    borderWidth: 2,
  },
  cellErrorText: {
    position: "absolute",
    bottom: -14,
    width: "33.3%",
    textAlign: "center",
    fontSize: 9,
    color: "red",
    zIndex: 1,
  },

  appendButton: {
    backgroundColor: "#17a2b8",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  appendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteRowButton: {
    backgroundColor: "#dc3545",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    marginLeft: 8,
  },
  deleteRowButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  saveButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: Platform.OS === "ios" ? 0 : 10,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  saveErrorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },
});

export default EditRateListScreen;
