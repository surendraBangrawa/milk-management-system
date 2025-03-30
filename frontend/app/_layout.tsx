import { SessionProvider } from "@/context/AuthProvider";
import { Slot } from "expo-router";
import Toast from "react-native-toast-message";

export default function Root() {
  return (
    <SessionProvider>
      <Slot />
      <Toast />
    </SessionProvider>
  );
}
