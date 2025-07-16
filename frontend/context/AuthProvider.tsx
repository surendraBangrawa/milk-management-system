import { useStorageState } from "@/hooks/useStorageState";
import {
  useContext,
  createContext,
  type PropsWithChildren,
  useEffect,
} from "react";
import { setGlobalSignOut } from "@/lib/axiosIntance";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

const AuthContext = createContext<{
  signIn: (token: string) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("accessToken");

  const signOut = () => {
    try {
      // Clear token from storage
      setSession(null);

      // Clear user data from SecureStore (async but we don't wait)
      SecureStore.deleteItemAsync("user")
        .then(() => {})
        .catch((error) => {});

      // Show logout message
      Toast.show({
        type: "info",
        text1: "Session Expired",
        text2: "You have been logged out. Please sign in again.",
      });

      // Navigate to login screen
      try {
        router.replace("/auth/signin");
      } catch (navError) {
        console.error("AuthProvider: Navigation error:", navError);
        // Fallback navigation
        router.push("/auth/signin");
      }
    } catch (error) {
      console.error("AuthProvider: Error during signOut:", error);
    }
  };

  // Set up the global signOut function for axios interceptor
  useEffect(() => {
    setGlobalSignOut(signOut);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn: (token: string) => {
          setSession(token); // Save token to storage
        },
        signOut,
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
