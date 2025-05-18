import { SessionProvider } from "@/context/AuthProvider";
import ThemeProvider from "@/context/theme/ThemeProvider";
import { store } from "@/redux/store";
import { Slot } from "expo-router";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";

export default function Root() {
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
