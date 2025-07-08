import React, { useEffect } from "react";
import { View, StyleSheet, StatusBar, Platform, ViewStyle } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import useTheme from "@/context/theme/useTheme";

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  backgroundColor,
}) => {
  const { colors, themeMode } = useTheme();
  const statusBarStyle =
    themeMode === "dark" ? "light-content" : "dark-content";
  const bgColor = backgroundColor || colors.background;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Set status bar to be translucent on Android
    if (Platform.OS === "android") {
      StatusBar.setTranslucent(true);
      StatusBar.setBackgroundColor("transparent");
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor="transparent"
        translucent={Platform.OS === "android"}
      />
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "left", "right", "bottom"]}
      >
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
