import React from "react";
import { ScrollView, StyleSheet, Platform, View } from "react-native";
import { Stack } from "expo-router";
import useTheme from "@/context/theme/useTheme";

interface StaticInfoScreenProps {
  title: string;
  children: React.ReactNode;
}

const StaticInfoScreen: React.FC<StaticInfoScreenProps> = ({
  title,
  children,
}) => {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          title: title,
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontWeight: Platform.select({ ios: "600", android: "bold" }),
          },
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <View>{children}</View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
});

export default StaticInfoScreen;
