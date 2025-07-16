import React from "react";
import { StatusBar, Platform } from "react-native";
import useTheme from "@/context/theme/useTheme";

interface ThemedStatusBarProps {
  backgroundColor?: string;
  translucent?: boolean;
}

const ThemedStatusBar: React.FC<ThemedStatusBarProps> = ({
  backgroundColor,
  translucent = Platform.OS === "android",
}) => {
  const { colors, themeMode } = useTheme();

  // Determine status bar style based on theme
  const barStyle = themeMode === "dark" ? "light-content" : "dark-content";

  // Use provided backgroundColor or fall back to theme colors
  const statusBarColor = backgroundColor || colors.surface;

  return (
    <StatusBar
      barStyle={barStyle}
      backgroundColor={statusBarColor}
      translucent={translucent}
    />
  );
};

export default ThemedStatusBar;
