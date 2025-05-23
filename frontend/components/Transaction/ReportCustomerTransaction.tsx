import React from "react";
import { View, Text, StyleSheet } from "react-native";
import moment from "moment";
import useTheme from "@/context/theme/useTheme";

const ReportCustomerTransaction = ({ item }) => {
  const { colors } = useTheme();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const mDate = moment(dateString);
    return mDate.isValid() ? mDate.format("DD/MM/yyyy") : "-";
  };

  const isDebit = item.amount < 0;
  const isCredit = item.amount > 0;
  const displayAmount = Math.abs(item.amount || 0).toFixed(2);
  {
  }
  const formattedBalance =
    typeof item.total_till_record && item.amount < 0
      ? `-₹${Math.abs(item.amount).toFixed(2)}`
      : `₹${item.amount.toFixed(2)}`;

  let shortDescription = item.type === "expense" ? "Expense" : "Milk Sale";

  return (
    <View
      style={[
        styles.rowContainer,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.dateColumn}>
        <Text style={[styles.cellText, { color: colors.textPrimary }]}>
          {formatDate(item.added_at)}
        </Text>
      </View>

      <View style={styles.descriptionColumn}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.cellText, { color: colors.textSecondary }]}
        >
          {shortDescription}
        </Text>
      </View>

      <View style={styles.amountColumn}>
        <Text
          style={[styles.cellText, styles.debitText, { color: colors.error }]}
        >
          {isDebit && `₹${displayAmount}`}
        </Text>
      </View>

      <View style={styles.amountColumn}>
        <Text
          style={[
            styles.cellText,
            styles.creditText,
            { color: colors.success },
          ]}
        >
          {isCredit && `₹${displayAmount}`}
        </Text>
      </View>

      <View style={styles.amountColumn}>
        <Text style={[styles.cellText, { color: colors.textPrimary }]}>
          {formattedBalance}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateColumn: {
    flex: 2,
    alignItems: "flex-start",
    paddingRight: 2,
  },
  descriptionColumn: {
    flex: 2,
    alignItems: "flex-start",
    paddingHorizontal: 2,
  },
  amountColumn: {
    flex: 2,
    alignItems: "flex-end",
    paddingLeft: 2,
  },
  cellText: {
    fontSize: 11,
  },
  debitText: {
    fontWeight: "bold",
  },
  creditText: {
    fontWeight: "bold",
  },
});

export default ReportCustomerTransaction;
