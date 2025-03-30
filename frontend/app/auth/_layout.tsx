import { useSession } from "@/context/AuthProvider";
import { Redirect, Slot } from "expo-router";
import { Text } from "react-native";

export default function Root() {
  const { session, isLoading } = useSession();
  if (isLoading) {
    return <Text>Loading...</Text>;
  }
  if (session) {
    return <Redirect href="/(app)/(tabs)/(home)" />;
  }
  return <Slot />;
}
