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

export default function Root() {
  const { t, i18n } = useTranslation();
  const [fontsLoaded] = useFonts({
    NotoSansDevanagari: require("../assets/fonts/NotoSansDevanagari-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Or a loading indicator
  }

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
          }
        }
      );

      return () => {
        subscription.remove();
      };
    }
  }, [i18n]);
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
