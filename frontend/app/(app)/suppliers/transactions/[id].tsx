import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  Text,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import Toast from "react-native-toast-message";
import { getSupplierTransactionApi } from "@/redux/slice/supplier/supplierApi";
import useTheme from "@/context/theme/useTheme";
import { useTranslation } from "react-i18next";

const getInitials = (name: string | undefined | null): string => {
  if (!name) return "";
  const nameParts = name.split(" ").filter((part) => part.length > 0);
  const firstInitial = nameParts[0]?.charAt(0).toUpperCase() || "";
  const lastInitial =
    nameParts.length > 1
      ? nameParts[nameParts.length - 1]?.charAt(0).toUpperCase() || ""
      : "";
  return firstInitial + lastInitial;
};

const RandomAvatar = ({ name }: { name: string | undefined | null }) => {
  const { colors } = useTheme();
  const backgroundColor = colors.primaryLight;
  const initials = getInitials(name);
  return (
    <View style={[styles.avatar, { backgroundColor }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
};

const TransactionScreen = () => {
  const params = useLocalSearchParams();
  const { id, name } = params as { id: string; name: string };
  const [transactions, setTransactions] = useState<any[]>([]);
  const { colors } = useTheme();
  const { t } = useTranslation();

  const fetchCustomerData = async () => {
    try {
      const res = await getSupplierTransactionApi(id);
      if (res.status === 200) {
        const sortedData = res?.data?.sort((a: any, b: any) => {
          const dateA = new Date(a.added_at); // Sort by 'added_at' for display purposes
          const dateB = new Date(b.added_at);
          return dateB.getTime() - dateA.getTime();
        });
        setTransactions(sortedData);
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: t("supplier_transactions.error"),
        text2: t("supplier_transactions.failed_to_load"),
      });
    } finally {
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const formatDate = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleReadMore = (detail: string) => {
    Alert.alert(t("supplier_transactions.transaction_detail"), detail);
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const truncatedDetail =
      item.expense_detail?.length > 50
        ? item.expense_detail.slice(0, 50) + "..."
        : item.expense_detail;

    return (
      <View
        style={[
          styles.transactionCard,
          {
            borderLeftColor: item.amount < 0 ? colors.error : colors.success,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.leftSection}>
          <Text
            style={[styles.transactionDate, { color: colors.textSecondary }]}
          >
            {formatDate(item.added_at)}
          </Text>
          <Text
            style={[styles.transactionAmount, { color: colors.textPrimary }]}
          >
            Amount: ₹{Math.abs(item.amount)}
          </Text>
          <Text style={[styles.transactionType, { color: colors.textPrimary }]}>
            {item.type === "expense" ? "Expense" : "Milk"}
          </Text>
          {item.expense_detail && (
            <View>
              <Text
                style={[
                  styles.transactionExpenseDetail,
                  { color: colors.textSecondary },
                ]}
              >
                Detail: {truncatedDetail}
              </Text>
              {item.expense_detail?.length > 50 && (
                <Pressable onPress={() => handleReadMore(item.expense_detail)}>
                  <Text
                    style={[styles.readMoreText, { color: colors.primary }]}
                  >
                    Read More
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View style={styles.rightSection}>
          <Text style={[styles.runningBalance, { color: colors.textPrimary }]}>
            Running Balance: ₹{item.running_balance}
          </Text>
          <Text
            style={[styles.totalTillRecord, { color: colors.textSecondary }]}
          >
            Total Till Record: ₹{item.total_till_record}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerRight: () => (
            <View style={styles.headerLeft}>
              {name ? (
                <RandomAvatar name={name} />
              ) : (
                <RandomAvatar name="N/A" />
              )}
              <Text style={[styles.headerName, { color: colors.textPrimary }]}>
                {name}
              </Text>
            </View>
          ),
        }}
      />
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.transactionList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 38,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  transactionCard: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    borderLeftWidth: 5,
  },
  leftSection: {
    flex: 1,
  },
  transactionDate: {
    fontSize: 14,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 5,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "500",
  },
  transactionExpenseDetail: {
    fontSize: 14,
  },
  readMoreText: {
    fontSize: 14,
    marginTop: 5,
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  runningBalance: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 5,
  },
  totalTillRecord: {
    fontSize: 14,
  },
  actionButtons: {
    marginTop: 10,
    flexDirection: "row",
  },
  actionButton: {
    backgroundColor: "transparent",
    padding: 8,
    marginHorizontal: 5,
    borderRadius: 50,
  },
  transactionList: {
    marginTop: 20,
  },
  button: {
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default TransactionScreen;
