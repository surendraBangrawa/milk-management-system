import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { format } from "date-fns";
import Toast from "react-native-toast-message";
import { FontAwesome } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import moment from "moment";

import useTheme from "@/context/theme/useTheme";
import DatePickerModal from "@/components/DatePickerModal";
import ReportCustomerTransaction from "@/components/Transaction/ReportCustomerTransaction";
import { useDispatch, useSelector } from "react-redux";
import { fetchSellerTransactionsById } from "@/redux/slice/transactions/transactionsSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { getMilkReportTransactionApi } from "@/redux/slice/transactions/transactionApi";

const ReportScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const transactions = useSelector(
    (state: RootState) => state.transactions.sellerTransactions
  );
  const loading: boolean = useSelector(
    (state: RootState) => state.transactions.sellerTransactionsLoading
  );
  const error: string | null = useSelector(
    (state: RootState) => state.transactions.sellerTransactionsError
  );
  const { colors } = useTheme();

  const params = useLocalSearchParams<{
    seller_mobile: string;
    name: string;
  }>();

  const sellerId: string | undefined = Array.isArray(params.seller_mobile)
    ? params.seller_mobile[0]
    : params.seller_mobile;
  const customerName: string | undefined = Array.isArray(params.name)
    ? params.name[0]
    : params.name;

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartDatePicker, setShowStartDatePicker] =
    useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Force close modals when component unmounts
  useEffect(() => {
    return () => {
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
    };
  }, []);

  useEffect(() => {
    if (sellerId) {
      dispatch(fetchSellerTransactionsById(sellerId));
    }
  }, [dispatch, sellerId]);

  const filteredTransactions = transactions.filter((transaction) => {
    const dateString = transaction.custom_date || transaction.added_at;
    const transactionDate = new Date(dateString);

    const startOfDayStartDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate()
    );
    const endOfDayEndDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
      23,
      59,
      59,
      999
    );

    return (
      transactionDate >= startOfDayStartDate &&
      transactionDate <= endOfDayEndDate
    );
  });

  const renderTransactionItem = ({ item }: { item: any }) => (
    <ReportCustomerTransaction item={item} />
  );

  const formatDateForDisplay = (date: Date | null | undefined): string => {
    return date ? moment(date).format("DD/MM/YYYY") : "Select Date";
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          const base64String = reader.result.split(",")[1];
          resolve(base64String);
        } else {
          reject(new Error("FileReader did not return a string result."));
        }
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  };

  const generatePdfApiCall = async (): Promise<string | null> => {
    try {
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");

      const pdfBlob: Blob = await getMilkReportTransactionApi({
        sellerId: sellerId || "",
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });

      if (!pdfBlob || !(pdfBlob instanceof Blob)) {
        throw new Error("PDF data not received or is not a Blob from API.");
      }

      const pdfBase64 = await blobToBase64(pdfBlob);
      return pdfBase64;
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: `Failed to generate PDF: ${error.message || "Unknown error"}`,
      });
      return null;
    }
  };

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const pdfBase64 = await generatePdfApiCall();
      if (!pdfBase64) {
        return;
      }

      const safeCustomerName = customerName || "UnknownCustomer";
      const filename = `Report_${safeCustomerName}_${format(
        startDate,
        "yyyyMMdd"
      )}_${format(endDate, "yyyyMMdd")}.pdf`;

      // Temporarily store the PDF in cache for non-Android platforms or as a fallback
      // For Android, we will directly write to the SAF URI.
      let tempFileUri: string | undefined;
      if (Platform.OS !== "android") {
        tempFileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(tempFileUri, pdfBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      if (Platform.OS === "android") {
        try {
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (permissions.granted) {
            try {
              if (!permissions.directoryUri) {
                const msg = "Directory URI not provided despite being granted.";
                throw new Error(msg);
              }

              const finalFileUri =
                await FileSystem.StorageAccessFramework.createFileAsync(
                  permissions.directoryUri,
                  filename,
                  "application/pdf"
                );

              await FileSystem.writeAsStringAsync(finalFileUri, pdfBase64, {
                encoding: FileSystem.EncodingType.Base64,
              });

              Toast.show({
                type: "success",
                text1: "Downloaded",
                text2: `Report saved to: ${finalFileUri.split("/").pop()}`,
              });
            } catch (androidSaveError: any) {
              Toast.show({
                type: "error",
                text1: "Download Failed",
                text2: `Could not save to chosen folder: ${
                  androidSaveError.message || "Unknown error"
                }`,
              });
            }
          } else {
            Toast.show({
              type: "info",
              text1: "Permission Denied",
              text2: "Cannot save to public folders without permission.",
            });
          }
        } catch (permissionRequestError: any) {
          Toast.show({
            type: "error",
            text1: "Permission Error",
            text2: `Failed to request storage access: ${
              permissionRequestError.message || "Unknown error"
            }`,
          });
        }
      } else {
        Toast.show({
          type: "success",
          text1: "Downloaded",
          text2: `Report saved to cache directory.`,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Download Failed",
        text2: `An unexpected error occurred: ${
          error.message || "Unknown error"
        }`,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSharePdf = async () => {
    if (isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    try {
      const pdfBase64 = await generatePdfApiCall();
      if (!pdfBase64) {
        return;
      }

      const safeCustomerName = customerName || "UnknownCustomer";
      const filename = `Report_${safeCustomerName}_${format(
        startDate,
        "yyyyMMdd"
      )}_${format(endDate, "yyyyMMdd")}.pdf`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(fileUri, pdfBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Sharing is not available on this device.",
        });
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Share Report",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Share Failed",
        text2: `Could not share PDF: ${error.message || "Unknown error"}`,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const closeStartDatePicker = () => {
    setShowStartDatePicker(false);
  };

  const closeEndDatePicker = () => {
    setShowEndDatePicker(false);
  };

  const openStartDatePicker = () => {
    setShowStartDatePicker(true);
  };

  const openEndDatePicker = () => {
    setShowEndDatePicker(true);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Report",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
        }}
      />

      <View style={styles.mainContainer}>
        <View
          style={[
            styles.dateRangeContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <TouchableOpacity
            style={[styles.datePickerButton, { borderColor: colors.border }]}
            onPress={openStartDatePicker}
          >
            <Text
              style={[styles.datePickerText, { color: colors.textPrimary }]}
            >
              Start Date: {formatDateForDisplay(startDate)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.datePickerButton, { borderColor: colors.border }]}
            onPress={openEndDatePicker}
          >
            <Text
              style={[styles.datePickerText, { color: colors.textPrimary }]}
            >
              End Date: {formatDateForDisplay(endDate)}
            </Text>
          </TouchableOpacity>
        </View>

        <DatePickerModal
          visible={showStartDatePicker}
          onClose={closeStartDatePicker}
          onConfirm={(date: Date) => {
            if (date > endDate) {
              Toast.show({
                type: "error",
                text1: "Invalid Date",
                text2: "Start date cannot be after end date.",
              });
              return;
            }
            setStartDate(date);
            closeStartDatePicker();
          }}
          initialDate={startDate}
        />
        <DatePickerModal
          visible={showEndDatePicker}
          onClose={closeEndDatePicker}
          onConfirm={(date: Date) => {
            if (date < startDate) {
              Toast.show({
                type: "error",
                text1: "Invalid Date",
                text2: "End date cannot be before start date.",
              });
              return;
            }
            setEndDate(date);
            closeEndDatePicker();
          }}
          initialDate={endDate}
        />

        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.loadingIndicator}
            />
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          ) : filteredTransactions.length === 0 ? (
            <Text style={[styles.noDataText, { color: colors.textSecondary }]}>
              No transactions found for this date range.
            </Text>
          ) : (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item, index) =>
                item.id ? item.id.toString() : index.toString()
              }
              contentContainerStyle={styles.transactionList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      <View
        style={[
          styles.pdfActionButtonsContainer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.pdfActionButton, { backgroundColor: colors.primary }]}
          onPress={handleDownloadPdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome name="download" size={20} color="#fff" />
              <Text style={styles.pdfActionButtonText}>Download PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pdfActionButton, { backgroundColor: colors.success }]}
          onPress={handleSharePdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesome name="share-alt" size={20} color="#fff" />
              <Text style={styles.pdfActionButtonText}>Share PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
  },
  dateRangeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    marginBottom: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  datePickerButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: "500",
  },
  transactionList: {
    paddingBottom: 20,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  errorText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
  pdfActionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 60 : 40,
    minHeight: 100,
  },
  pdfActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 25,
    flex: 1,
    marginHorizontal: 5,
    height: 55,
    overflow: "visible",
  },
  pdfActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ReportScreen;
