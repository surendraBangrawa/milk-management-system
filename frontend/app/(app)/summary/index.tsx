import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Stack } from "expo-router";

import useTheme from "@/context/theme/useTheme";

const SummaryScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Summary",
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: "600",
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "600",
    marginRight: 8,
    maxWidth: 150,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 38,
  },
  transactionCard: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    borderLeftWidth: 4,
  },
  leftSection: {
    flex: 1,
    paddingRight: 8,
  },
  transactionDate: {
    fontSize: 13,
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 2,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 4,
  },
  transactionDetailText: {
    fontSize: 13,
    marginTop: 4,
  },
  readMoreText: {
    fontSize: 13,
    marginTop: 4,
    textDecorationLine: "underline",
  },
  milkDetailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  milkDetailText: {
    fontSize: 12,
    marginBottom: 2,
  },
  rightSection: {
    flex: 0.8,
    alignItems: "flex-end",
    paddingLeft: 8,
  },
  runningBalance: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 0,
    marginBottom: 2,
  },
  totalTillRecord: {
    fontSize: 12,
    marginBottom: 8,
  },
  actionButtons: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  transactionList: {
    paddingBottom: 220,
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
  floatingButtonContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  floatingButton: {
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 6,
  },
  floatingButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default SummaryScreen;
