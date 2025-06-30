import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import NetInfo from "@react-native-async-storage/async-storage";
import useTheme from "@/context/theme/useTheme";
import axiosInstance from "@/lib/axiosIntance";

interface SyncStatus {
  device_id: string;
  synced: boolean;
  last_sync: string | null;
  sync_token: string | null;
}

interface OfflineTransaction {
  id: string;
  type: "milk" | "expense";
  data: any;
  timestamp: string;
  device_id: string;
}

const OfflineSyncManager: React.FC = () => {
  const { colors } = useTheme();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [offlineTransactions, setOfflineTransactions] = useState<
    OfflineTransaction[]
  >([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    checkNetworkStatus();
    loadOfflineData();
    loadSyncStatus();
  }, []);

  const checkNetworkStatus = async () => {
    try {
      const netInfo = await NetInfo.fetch();
      setIsOnline(netInfo.isConnected || false);
    } catch (error) {
      console.error("Error checking network status:", error);
      setIsOnline(false);
    }
  };

  const loadOfflineData = async () => {
    try {
      const offlineData = await SecureStore.getItemAsync(
        "offline_transactions"
      );
      if (offlineData) {
        setOfflineTransactions(JSON.parse(offlineData));
      }

      const lastSync = await SecureStore.getItemAsync("last_sync_time");
      setLastSyncTime(lastSync);
    } catch (error) {
      console.error("Error loading offline data:", error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const deviceId = await SecureStore.getItemAsync("device_id");
      if (deviceId) {
        const response = await axiosInstance.get(
          `/offline-sync/status/${deviceId}`
        );
        setSyncStatus(response.data);
      }
    } catch (error) {
      console.error("Error loading sync status:", error);
    }
  };

  const saveOfflineTransaction = async (transaction: OfflineTransaction) => {
    try {
      const updatedTransactions = [...offlineTransactions, transaction];
      await SecureStore.setItemAsync(
        "offline_transactions",
        JSON.stringify(updatedTransactions)
      );
      setOfflineTransactions(updatedTransactions);
    } catch (error) {
      console.error("Error saving offline transaction:", error);
    }
  };

  const syncOfflineData = async () => {
    if (!isOnline) {
      Alert.alert(
        "No Internet",
        "Please check your internet connection and try again."
      );
      return;
    }

    if (offlineTransactions.length === 0) {
      Alert.alert("No Data", "No offline transactions to sync.");
      return;
    }

    try {
      setSyncing(true);
      const deviceId = await SecureStore.getItemAsync("device_id");
      const syncToken = await SecureStore.getItemAsync("sync_token");

      const syncData = {
        device_id: deviceId,
        sync_token: syncToken,
        offline_transactions: offlineTransactions,
        last_sync: lastSyncTime,
      };

      const response = await axiosInstance.post("/offline-sync/sync", syncData);

      // Clear offline transactions after successful sync
      await SecureStore.setItemAsync(
        "offline_transactions",
        JSON.stringify([])
      );
      setOfflineTransactions([]);

      // Update sync status
      const newSyncToken = response.data.sync_token;
      await SecureStore.setItemAsync("sync_token", newSyncToken);
      await SecureStore.setItemAsync(
        "last_sync_time",
        new Date().toISOString()
      );
      setLastSyncTime(new Date().toISOString());

      // Show sync results
      const syncedCount = response.data.synced_transactions.length;
      const conflictCount = response.data.conflicts.length;

      if (conflictCount > 0) {
        Alert.alert(
          "Sync Complete",
          `Synced ${syncedCount} transactions. ${conflictCount} conflicts found.`,
          [
            { text: "OK" },
            {
              text: "View Conflicts",
              onPress: () => showConflicts(response.data.conflicts),
            },
          ]
        );
      } else {
        Alert.alert(
          "Sync Complete",
          `Successfully synced ${syncedCount} transactions.`
        );
      }

      loadSyncStatus();
    } catch (error) {
      console.error("Error syncing offline data:", error);
      Alert.alert(
        "Sync Failed",
        "Failed to sync offline data. Please try again."
      );
    } finally {
      setSyncing(false);
    }
  };

  const showConflicts = (conflicts: any[]) => {
    // This would typically navigate to a conflicts screen
    Alert.alert(
      "Conflicts",
      `Found ${conflicts.length} conflicts that need manual resolution.`
    );
  };

  const clearOfflineData = async () => {
    Alert.alert(
      "Clear Offline Data",
      "Are you sure you want to clear all offline transactions? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await SecureStore.setItemAsync(
                "offline_transactions",
                JSON.stringify([])
              );
              setOfflineTransactions([]);
              Alert.alert("Success", "Offline data cleared successfully.");
            } catch (error) {
              console.error("Error clearing offline data:", error);
              Alert.alert("Error", "Failed to clear offline data.");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Offline Sync
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage offline data synchronization
        </Text>
      </View>

      {/* Network Status */}
      <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={isOnline ? "wifi" : "wifi-outline"}
            size={24}
            color={isOnline ? colors.success : colors.error}
          />
          <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
            Network Status
          </Text>
        </View>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {isOnline ? "Connected to internet" : "No internet connection"}
        </Text>
      </View>

      {/* Sync Status */}
      <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={syncStatus?.synced ? "checkmark-circle" : "sync-outline"}
            size={24}
            color={syncStatus?.synced ? colors.success : colors.warning}
          />
          <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
            Sync Status
          </Text>
        </View>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Last sync: {formatDate(syncStatus?.last_sync)}
        </Text>
        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          Offline transactions: {offlineTransactions.length}
        </Text>
      </View>

      {/* Sync Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.primary },
            (!isOnline || syncing) && { opacity: 0.5 },
          ]}
          onPress={syncOfflineData}
          disabled={!isOnline || syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="sync" size={20} color="white" />
          )}
          <Text style={styles.actionButtonText}>
            {syncing ? "Syncing..." : "Sync Now"}
          </Text>
        </TouchableOpacity>

        {offlineTransactions.length > 0 && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={clearOfflineData}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Clear Offline Data</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Offline Transactions List */}
      {offlineTransactions.length > 0 && (
        <View style={styles.transactionsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Pending Transactions ({offlineTransactions.length})
          </Text>
          {offlineTransactions.map((transaction, index) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionCard,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.transactionHeader}>
                <Ionicons
                  name={transaction.type === "milk" ? "water" : "card-outline"}
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.transactionType,
                    { color: colors.textPrimary },
                  ]}
                >
                  {transaction.type === "milk"
                    ? "Milk Transaction"
                    : "Expense Transaction"}
                </Text>
                <Text
                  style={[
                    styles.transactionTime,
                    { color: colors.textSecondary },
                  ]}
                >
                  {formatDate(transaction.timestamp)}
                </Text>
              </View>
              <Text
                style={[
                  styles.transactionData,
                  { color: colors.textSecondary },
                ]}
              >
                {JSON.stringify(transaction.data, null, 2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Help Section */}
      <View style={[styles.helpCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.helpTitle, { color: colors.textPrimary }]}>
          How Offline Sync Works
        </Text>
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          • Transactions are saved locally when offline{"\n"}• Sync
          automatically when internet is available{"\n"}• Conflicts are resolved
          manually{"\n"}• Data is encrypted and secure
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
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  statusCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 4,
  },
  actionsContainer: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  transactionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  transactionCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  transactionTime: {
    fontSize: 12,
  },
  transactionData: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  helpCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default OfflineSyncManager;
