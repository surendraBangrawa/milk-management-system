import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useTheme from "@/context/theme/useTheme";
import ThemedStatusBar from "./ThemedStatusBar";

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  edges?: ("top" | "bottom" | "left" | "right")[];
  paddingTop?: boolean;
  paddingBottom?: boolean;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  backgroundColor,
  edges = ["top", "left", "right", "bottom"],
}) => {
  const { colors } = useTheme();
  const bgColor = backgroundColor || colors.background;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <ThemedStatusBar backgroundColor={bgColor} />
      <SafeAreaView style={styles.safeArea} edges={edges}>
        <View style={[styles.contentContainer]}>{children}</View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
