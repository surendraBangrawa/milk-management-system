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
import useTheme from "@/context/theme/useTheme";
import { axiosInstance } from "@/lib/axiosIntance";

interface Device {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  os_info: string;
  app_version: string;
  is_trusted: boolean;
  last_used: string;
  created_at: string;
}

const DeviceManagement: React.FC = () => {
  const { colors } = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/enhanced-auth/devices");
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error("Error fetching devices:", error);
      Alert.alert("Error", "Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  const toggleDeviceTrust = async (deviceId: string, currentTrust: boolean) => {
    try {
      await axiosInstance.put("/enhanced-auth/devices/trust", {
        device_id: deviceId,
        trust: !currentTrust,
      });

      Alert.alert(
        "Success",
        `Device ${currentTrust ? "untrusted" : "trusted"} successfully`
      );

      fetchDevices(); // Refresh the list
    } catch (error) {
      console.error("Error toggling device trust:", error);
      Alert.alert("Error", "Failed to update device trust");
    }
  };

  const removeDevice = async (deviceId: string, deviceName: string) => {
    Alert.alert(
      "Remove Device",
      `Are you sure you want to remove "${deviceName}"? This will also revoke all sessions for this device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`/enhanced-auth/devices/${deviceId}`);
              Alert.alert("Success", "Device removed successfully");
              fetchDevices(); // Refresh the list
            } catch (error) {
              console.error("Error removing device:", error);
              Alert.alert("Error", "Failed to remove device");
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case "mobile":
        return "phone-portrait";
      case "tablet":
        return "tablet-portrait";
      case "desktop":
        return "desktop";
      default:
        return "phone-portrait";
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading devices...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Device Management
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Manage your trusted devices and sessions
        </Text>
      </View>

      {devices.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="phone-portrait-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No devices found
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Your devices will appear here after you log in
          </Text>
        </View>
      ) : (
        <View style={styles.deviceList}>
          {devices.map((device) => (
            <View
              key={device.id}
              style={[styles.deviceCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.deviceHeader}>
                <View style={styles.deviceInfo}>
                  <Ionicons
                    name={getDeviceIcon(device.device_type)}
                    size={24}
                    color={colors.primary}
                  />
                  <View style={styles.deviceDetails}>
                    <Text
                      style={[styles.deviceName, { color: colors.textPrimary }]}
                    >
                      {device.device_name || "Unknown Device"}
                    </Text>
                    <Text
                      style={[
                        styles.deviceType,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {device.device_type} • {device.os_info}
                    </Text>
                    <Text
                      style={[
                        styles.deviceVersion,
                        { color: colors.textSecondary },
                      ]}
                    >
                      App v{device.app_version}
                    </Text>
                  </View>
                </View>
                <View style={styles.deviceStatus}>
                  {device.is_trusted && (
                    <View
                      style={[
                        styles.trustedBadge,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <Ionicons
                        name="shield-checkmark"
                        size={12}
                        color="white"
                      />
                      <Text style={styles.trustedText}>Trusted</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.deviceMeta}>
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  Last used: {formatDate(device.last_used)}
                </Text>
                <Text
                  style={[styles.metaText, { color: colors.textSecondary }]}
                >
                  Added: {formatDate(device.created_at)}
                </Text>
              </View>

              <View style={styles.deviceActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: device.is_trusted
                        ? colors.warning
                        : colors.success,
                    },
                  ]}
                  onPress={() =>
                    toggleDeviceTrust(device.device_id, device.is_trusted)
                  }
                >
                  <Ionicons
                    name={
                      device.is_trusted ? "shield-outline" : "shield-checkmark"
                    }
                    size={16}
                    color="white"
                  />
                  <Text style={styles.actionButtonText}>
                    {device.is_trusted ? "Untrust" : "Trust"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.error },
                  ]}
                  onPress={() =>
                    removeDevice(device.device_id, device.device_name)
                  }
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
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
  loadingText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
  },
  deviceList: {
    padding: 20,
  },
  deviceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: "row",
    flex: 1,
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  deviceType: {
    fontSize: 14,
    marginBottom: 2,
  },
  deviceVersion: {
    fontSize: 12,
  },
  deviceStatus: {
    alignItems: "flex-end",
  },
  trustedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trustedText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  deviceMeta: {
    marginBottom: 16,
  },
  metaText: {
    fontSize: 12,
    marginBottom: 2,
  },
  deviceActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default DeviceManagement;
