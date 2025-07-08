import { Text } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useSession } from "@/context/AuthProvider";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AppLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!session) {
    return <Redirect href="/auth/signin" />;
  }

  return (
    <SafeAreaView
      style={{ flex: 1 }}
      edges={["top", "bottom", "left", "right"]}
    >
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}
