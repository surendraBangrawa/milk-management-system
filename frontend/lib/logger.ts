/**
 * Central Logging Utility for Frontend
 *
 * This logger:
 * - Logs to console (development)
 * - Stores logs locally (AsyncStorage) for offline scenarios
 * - Sends logs to backend API for centralized logging
 * - Batches logs to reduce API calls
 *
 * Usage:
 *   import logger from './lib/logger';
 *   logger.info('User logged in');
 *   logger.error('API call failed', error);
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import axios from "axios";
import { Platform } from "react-native";

const API_BASE_URL = Constants.expoConfig?.extra?.API_BASE_URL || "";
const APP_ENV = Constants.expoConfig?.extra?.APP_ENV || "dev";

// Configuration
const LOG_STORAGE_KEY = "@milk_management_logs";
const MAX_LOCAL_LOGS = 1000; // Maximum logs to keep locally
const BATCH_SIZE = 10; // Send logs in batches
const BATCH_INTERVAL = 30000; // Send batch every 30 seconds
const MAX_RETRY_ATTEMPTS = 3;

// Log levels
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

// Log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  platform: string;
  appVersion?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

// Pending logs queue
let pendingLogs: LogEntry[] = [];
let batchTimer: NodeJS.Timeout | null = null;
let isSending = false;
let sessionId: string = generateSessionId();

// Generate unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get user ID from storage (if available)
async function getUserId(): Promise<string | undefined> {
  try {
    const mobile = await AsyncStorage.getItem("user_mobile");
    return mobile || undefined;
  } catch {
    return undefined;
  }
}

// Get app version
function getAppVersion(): string {
  return Constants.expoConfig?.version || "1.0.0";
}

// Create log entry
function createLogEntry(
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>,
  error?: Error
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "frontend",
    platform: Platform.OS,
    appVersion: getAppVersion(),
    sessionId,
    metadata,
    error: error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : undefined,
  };
}

// Save log to local storage
async function saveLogLocally(entry: LogEntry): Promise<void> {
  try {
    const existingLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    let logs: LogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];

    // Add new log
    logs.push(entry);

    // Keep only last MAX_LOCAL_LOGS
    if (logs.length > MAX_LOCAL_LOGS) {
      logs = logs.slice(-MAX_LOCAL_LOGS);
    }

    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    // Silently fail - don't break app if storage fails
    console.error("Failed to save log locally:", error);
  }
}

// Send logs to backend API
async function sendLogsToBackend(logs: LogEntry[]): Promise<boolean> {
  if (!API_BASE_URL || logs.length === 0) {
    return false;
  }

  try {
    // Add user ID to logs
    const userId = await getUserId();
    const logsWithUserId = logs.map((log) => ({
      ...log,
      userId,
    }));

    const response = await axios.post(
      `${API_BASE_URL}/logs/frontend`,
      { logs: logsWithUserId },
      {
        timeout: 5000, // 5 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.status === 200;
  } catch (error) {
    // Silently fail - don't break app if API call fails
    console.error("Failed to send logs to backend:", error);
    return false;
  }
}

// Process pending logs
async function processPendingLogs(): Promise<void> {
  if (isSending || pendingLogs.length === 0) {
    return;
  }

  isSending = true;

  try {
    // Get logs to send (up to BATCH_SIZE)
    const logsToSend = pendingLogs.splice(0, BATCH_SIZE);

    if (logsToSend.length > 0) {
      const success = await sendLogsToBackend(logsToSend);

      if (!success) {
        // Re-add to pending if send failed
        pendingLogs.unshift(...logsToSend);
      }
    }
  } catch (error) {
    console.error("Error processing pending logs:", error);
  } finally {
    isSending = false;

    // Schedule next batch if there are more logs
    if (pendingLogs.length > 0) {
      scheduleBatchSend();
    }
  }
}

// Schedule batch send
function scheduleBatchSend(): void {
  if (batchTimer) {
    return; // Already scheduled
  }

  batchTimer = setTimeout(() => {
    batchTimer = null;
    processPendingLogs();
  }, BATCH_INTERVAL);
}

// Add log to queue
function queueLog(entry: LogEntry): void {
  // Always log to console in development (dev uses both console and Grafana)
  if (APP_ENV === "dev" || __DEV__) {
    const consoleMethod =
      entry.level === LogLevel.ERROR || entry.level === LogLevel.CRITICAL
        ? console.error
        : entry.level === LogLevel.WARNING
        ? console.warn
        : entry.level === LogLevel.DEBUG
        ? console.debug
        : console.log;

    consoleMethod(
      `[${entry.level}] [${entry.service}] ${entry.message}`,
      entry.metadata || entry.error || ""
    );
  }

  // Save locally (for offline support)
  saveLogLocally(entry);

  // Always add to pending queue for backend (Grafana) - both dev and prod
  pendingLogs.push(entry);

  // Schedule batch send
  scheduleBatchSend();

  // Send immediately if batch is full
  if (pendingLogs.length >= BATCH_SIZE) {
    processPendingLogs();
  }
}

// Logger class
class Logger {
  debug(message: string, metadata?: Record<string, any>): void {
    queueLog(createLogEntry(LogLevel.DEBUG, message, metadata));
  }

  info(message: string, metadata?: Record<string, any>): void {
    queueLog(createLogEntry(LogLevel.INFO, message, metadata));
  }

  warning(message: string, metadata?: Record<string, any>): void {
    queueLog(createLogEntry(LogLevel.WARNING, message, metadata));
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    queueLog(createLogEntry(LogLevel.ERROR, message, metadata, error));
  }

  critical(
    message: string,
    error?: Error,
    metadata?: Record<string, any>
  ): void {
    queueLog(createLogEntry(LogLevel.CRITICAL, message, metadata, error));
  }

  // Force send all pending logs (useful before app closes)
  async flush(): Promise<void> {
    if (pendingLogs.length > 0) {
      await processPendingLogs();
    }
  }

  // Get local logs (for debugging)
  async getLocalLogs(): Promise<LogEntry[]> {
    try {
      const logs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  // Clear local logs
  async clearLocalLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(LOG_STORAGE_KEY);
      pendingLogs = [];
    } catch (error) {
      console.error("Failed to clear local logs:", error);
    }
  }

  // Send all local logs to backend (for recovery)
  async syncLocalLogs(): Promise<void> {
    try {
      const localLogs = await this.getLocalLogs();
      if (localLogs.length > 0) {
        await sendLogsToBackend(localLogs);
        await this.clearLocalLogs();
      }
    } catch (error) {
      console.error("Failed to sync local logs:", error);
    }
  }
}

// Export singleton instance
const logger = new Logger();

// Auto-flush on app background/close (if possible)
if (Platform.OS !== "web") {
  // Note: In React Native, you might want to use AppState to detect app backgrounding
  // and call logger.flush() in your App.tsx or root component
}

export default logger;
export { LogLevel, type LogEntry };
