import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import useTheme from "@/context/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";

interface ThemedAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  showCancel?: boolean;
}

const ThemedAlert: React.FC<ThemedAlertProps> = ({
  visible,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  onDismiss,
  showCancel = false,
}) => {
  const { colors } = useTheme();

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle",
          iconColor: colors.success,
          backgroundColor: colors.success + "20",
        };
      case "error":
        return {
          icon: "close-circle",
          iconColor: colors.error,
          backgroundColor: colors.error + "20",
        };
      case "warning":
        return {
          icon: "warning",
          iconColor: colors.warning,
          backgroundColor: colors.warning + "20",
        };
      default:
        return {
          icon: "information-circle",
          iconColor: colors.info,
          backgroundColor: colors.info + "20",
        };
    }
  };

  const typeStyles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  const handleDismiss = () => {
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={handleDismiss}
      >
        <Pressable
          style={[
            styles.alertContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: typeStyles.backgroundColor },
            ]}
          >
            <Ionicons
              name={typeStyles.icon as any}
              size={32}
              color={typeStyles.iconColor}
            />
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { borderColor: colors.border },
                ]}
                onPress={handleCancel}
              >
                <Text
                  style={[styles.buttonText, { color: colors.textPrimary }]}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor:
                    type === "error" ? colors.error : colors.primary,
                  flex: showCancel ? 1 : undefined,
                },
              ]}
              onPress={handleConfirm}
            >
              <Text
                style={[
                  styles.buttonText,
                  styles.confirmButtonText,
                  { color: colors.surface },
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  content: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  confirmButton: {
    minWidth: 100,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    // Color will be set dynamically in the component
  },
});

export default ThemedAlert;
