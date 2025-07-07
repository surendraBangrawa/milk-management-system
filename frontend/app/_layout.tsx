import { SessionProvider } from "@/context/AuthProvider";
import ThemeProvider from "@/context/theme/ThemeProvider";
import { store } from "@/redux/store";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AppState, Platform } from "react-native";
import { Provider } from "react-redux";
import "../i18n";
import * as Localization from "expo-localization";
import { useFonts } from "expo-font";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadPersistedUploadStatus } from "@/redux/slice/ratelist/uploadStatusSlice";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Global function to check for pending upload notifications
const checkPendingUploadNotifications = async () => {
  try {
    const pendingUpload = await AsyncStorage.getItem(
      "pendingUploadNotification"
    );
    if (pendingUpload) {
      const { status, message, timestamp } = JSON.parse(pendingUpload);
      const now = Date.now();
      const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

      // Only show notification if it's recent (within 5 minutes)
      if (timestamp > fiveMinutesAgo) {
        if (status === "complete") {
          Toast.show({
            type: "success",
            text1: "Upload Complete",
            text2:
              "Your rate list has been processed and uploaded successfully!",
          });
        } else if (status === "failed") {
          Toast.show({
            type: "error",
            text1: "Upload Failed",
            text2:
              "Failed to process your rate list. Please try uploading a clearer image.",
          });
        }
      }

      // Clear the pending notification
      await AsyncStorage.removeItem("pendingUploadNotification");
    }
  } catch (error) {
    console.error("Error checking pending upload notifications:", error);
  }
};

export default function Root() {
  const { t, i18n } = useTranslation();
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari: require("../assets/fonts/NotoSansDevanagari-Regular.ttf"),
  });

  // This useEffect will always run on initial mount and when fontsLoaded changes
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // This useEffect will also always run on initial mount and when i18n changes
  useEffect(() => {
    if (Platform.OS === "android") {
      const subscription = AppState.addEventListener(
        "change",
        async (nextAppState) => {
          if (nextAppState === "active") {
            const newLocale =
              Localization.getLocales()[0]?.languageCode || "en";
            if (newLocale !== i18n.language) {
              i18n.changeLanguage(newLocale);
            }

            // Check for pending upload notifications when app becomes active
            checkPendingUploadNotifications();
          }
        }
      );

      return () => {
        subscription.remove();
      };
    }
  }, [i18n]);

  // Check for pending notifications and load upload status on initial mount
  useEffect(() => {
    if (fontsLoaded) {
      checkPendingUploadNotifications();
      store.dispatch(loadPersistedUploadStatus());
    }
  }, [fontsLoaded]);

  // Only return null *after* all hooks have been called
  if (!fontsLoaded) {
    return null; // Or a loading indicator specific to fonts
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <SessionProvider>
          <Slot />
          <Toast />
        </SessionProvider>
      </ThemeProvider>
    </Provider>
  );
}
