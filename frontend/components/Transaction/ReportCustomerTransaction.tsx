import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import useTheme from "@/context/theme/useTheme";
import { Transaction } from "@/redux/slice/transactions/transactionsSlice";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

const { width } = Dimensions.get("window");

interface ReportCustomerTransactionProps {
  transactions: Transaction[];
  customerName: string;
  sellerId: string;
}

const ReportCustomerTransaction: React.FC<ReportCustomerTransactionProps> = ({
  transactions,
  customerName,
  sellerId,
}) => {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">(
    "30d"
  );

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const periodStart = subDays(
      now,
      selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90
    );

    const filteredTransactions = transactions.filter((t) => {
      if (!t.added_at) return false;
      const transactionDate = new Date(t.added_at);
      return transactionDate >= periodStart && transactionDate <= now;
    });

    const milkTransactions = filteredTransactions.filter(
      (t) => t.type === "milk"
    );
    const expenseTransactions = filteredTransactions.filter(
      (t) => t.type === "expense"
    );

    const totalMilkQuantity = milkTransactions.reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );
    const totalMilkAmount = milkTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const totalExpenseAmount = expenseTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const netBalance = totalMilkAmount + totalExpenseAmount;

    const avgFat =
      milkTransactions.length > 0
        ? milkTransactions.reduce((sum, t) => sum + (t.fat || 0), 0) /
          milkTransactions.length
        : 0;

    const avgSnf =
      milkTransactions.length > 0
        ? milkTransactions.reduce((sum, t) => sum + (t.snf || 0), 0) /
          milkTransactions.length
        : 0;

    return {
      totalMilkQuantity: totalMilkQuantity.toFixed(2),
      totalMilkAmount: totalMilkAmount.toFixed(2),
      totalExpenseAmount: Math.abs(totalExpenseAmount).toFixed(2),
      netBalance: netBalance.toFixed(2),
      avgFat: avgFat.toFixed(1),
      avgSnf: avgSnf.toFixed(1),
      transactionCount: filteredTransactions.length,
      milkTransactionCount: milkTransactions.length,
      expenseTransactionCount: expenseTransactions.length,
    };
  }, [transactions, selectedPeriod]);

  // Generate simple bar chart data
  const chartData = useMemo(() => {
    const now = new Date();
    const days =
      selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
    const data: Array<{ date: string; quantity: number; maxQuantity: number }> =
      [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayTransactions = transactions.filter((t) => {
        if (!t.added_at) return false;
        const transactionDate = new Date(t.added_at);
        return transactionDate >= dayStart && transactionDate <= dayEnd;
      });

      const milkQuantity = dayTransactions
        .filter((t) => t.type === "milk")
        .reduce((sum, t) => sum + (t.quantity || 0), 0);

      data.push({
        date: format(date, "MMM dd"),
        quantity: milkQuantity,
        maxQuantity: Math.max(...data.map((d) => d.quantity), milkQuantity, 1),
      });
    }

    return data;
  }, [transactions, selectedPeriod]);

  const renderMetricCard = (
    title: string,
    value: string,
    subtitle: string,
    icon: string,
    color: string
  ) => (
    <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
      <View style={styles.metricHeader}>
        <FontAwesome name={icon as any} size={20} color={color} />
        <Text style={[styles.metricTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.metricSubtitle, { color: colors.textSecondary }]}>
        {subtitle}
      </Text>
    </View>
  );

  const renderSimpleBarChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
        Milk Quantity Trend (
        {selectedPeriod === "7d"
          ? "7 Days"
          : selectedPeriod === "30d"
          ? "30 Days"
          : "90 Days"}
        )
      </Text>
      <View style={styles.chartContent}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(
                      (item.quantity / item.maxQuantity) * 100,
                      4
                    ),
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
              {item.date}
            </Text>
            <Text style={[styles.barValue, { color: colors.textPrimary }]}>
              {item.quantity.toFixed(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <FontAwesome name="bar-chart" size={24} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {customerName} - Transaction Report
        </Text>
      </View>

      {/* Period Selector */}
      <View
        style={[styles.periodSelector, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.periodTitle, { color: colors.textPrimary }]}>
          Select Period:
        </Text>
        <View style={styles.periodButtons}>
          {[
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "90d", label: "90 Days" },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    selectedPeriod === period.key
                      ? colors.primary
                      : colors.background,
                },
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color:
                      selectedPeriod === period.key
                        ? colors.surface
                        : colors.textPrimary,
                  },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          "Total Milk",
          `${analytics.totalMilkQuantity} kg`,
          "Quantity delivered",
          "tint",
          colors.primary
        )}
        {renderMetricCard(
          "Milk Value",
          `₹${analytics.totalMilkAmount}`,
          "Total milk earnings",
          "money",
          colors.success
        )}
        {renderMetricCard(
          "Expenses",
          `₹${analytics.totalExpenseAmount}`,
          "Money given",
          "minus-circle",
          colors.error
        )}
        {renderMetricCard(
          "Net Balance",
          `₹${analytics.netBalance}`,
          "Current balance",
          "balance-scale",
          parseFloat(analytics.netBalance) >= 0 ? colors.success : colors.error
        )}
      </View>

      {/* Quality Metrics */}
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          "Avg Fat %",
          `${analytics.avgFat}%`,
          "Average fat content",
          "flask",
          colors.primary
        )}
        {renderMetricCard(
          "Avg SNF %",
          `${analytics.avgSnf}%`,
          "Average SNF content",
          "flask",
          colors.primary
        )}
        {renderMetricCard(
          "Transactions",
          analytics.transactionCount.toString(),
          "Total transactions",
          "list",
          colors.primary
        )}
        {renderMetricCard(
          "Milk Records",
          analytics.milkTransactionCount.toString(),
          "Milk transactions",
          "tint",
          colors.primary
        )}
      </View>

      {/* Chart */}
      {renderSimpleBarChart()}

      {/* Summary */}
      <View
        style={[styles.summaryContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
          Summary
        </Text>
        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
          Over the last{" "}
          {selectedPeriod === "7d"
            ? "7 days"
            : selectedPeriod === "30d"
            ? "30 days"
            : "90 days"}
          ,{customerName} has delivered {analytics.totalMilkQuantity} kg of milk
          with an average fat content of {analytics.avgFat}% and SNF content of{" "}
          {analytics.avgSnf}%. The total milk value is ₹
          {analytics.totalMilkAmount} with expenses of ₹
          {analytics.totalExpenseAmount}, resulting in a net balance of ₹
          {analytics.netBalance}.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 12,
  },
  periodSelector: {
    padding: 20,
    marginBottom: 16,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
  },
  chartContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  chartContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  barContainer: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    height: 100,
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  bar: {
    width: 8,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  barValue: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  summaryContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ReportCustomerTransaction;
