import { useStorageState } from "@/hooks/useStorageState";
import { useContext, createContext, type PropsWithChildren } from "react";

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

  return (
    <AuthContext.Provider
      value={{
        signIn: (token: string) => {
          setSession(token); // Save token to storage
        },
        signOut: () => {
          setSession(null); // Remove token from storage
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
