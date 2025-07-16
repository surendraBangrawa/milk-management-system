import { ColorSchemeName } from "react-native";

// Define the shape of your color palette
interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
  surface: string; // For cards, inputs, etc.
  error: string;
  success: string;
  border: string;
  shadow: string; // Shadow color (opacity will be applied via RGBA or style)
  // Additional colors for better theme support
  card: string;
  inputBackground: string;
  placeholder: string;
  link: string;
  warning: string;
  info: string;
  divider: string;
  overlay: string;
  // Status colors
  statusBar: string;
  tabBar: string;
  tabBarInactive: string;
  tabBarActive: string;
}

// Define your light mode colors
const lightColors: ColorPalette = {
  primary: "#7e57c2", // Medium purple
  primaryLight: "#b39ddb", // Lighter purple
  primaryDark: "#4d2c91", // Darker purple
  textPrimary: "#212121", // Very dark gray
  textSecondary: "#757575", // Medium gray
  background: "#f5f5f5", // Light gray background
  surface: "#ffffff", // White surfaces
  error: "#c62828", // Muted error red
  success: "#66bb6a", // Muted success green
  border: "#e0e0e0", // Light gray border
  shadow: "rgba(0, 0, 0, 0.1)", // Softer shadow color (iOS)
  // Additional colors
  card: "#ffffff",
  inputBackground: "#f8f9fa",
  placeholder: "#9e9e9e",
  link: "#1976d2",
  warning: "#ff9800",
  info: "#2196f3",
  divider: "#e0e0e0",
  overlay: "rgba(0, 0, 0, 0.5)",
  // Status colors
  statusBar: "#ffffff",
  tabBar: "#ffffff",
  tabBarInactive: "#757575",
  tabBarActive: "#7e57c2",
};

// Define your dark mode colors (Enhanced)
const darkColors: ColorPalette = {
  primary: "#bb86fc", // A common Material Design dark mode primary purple
  primaryLight: "#6200ea", // A deeper purple, potentially for accents or interactive states
  primaryDark: "#3700b3", // A very dark purple, for backgrounds or less prominent elements
  textPrimary: "#e0e0e0", // Light gray for main text - good contrast on dark backgrounds
  textSecondary: "#a0a0a0", // Medium gray for secondary text - still readable but less prominent
  background: "#121212", // Standard very dark background
  surface: "#1e1e1e", // Slightly lighter dark for surfaces like cards and inputs
  error: "#cf6679", // A dark mode friendly error red
  success: "#81c784", // A dark mode friendly success green
  border: "#333333", // Darker border color for subtle separation
  shadow: "rgba(255, 255, 255, 0.1)", // White shadow with low opacity for dark mode
  // Additional colors
  card: "#1e1e1e",
  inputBackground: "#2d2d2d",
  placeholder: "#666666",
  link: "#90caf9",
  warning: "#ffb74d",
  info: "#64b5f6",
  divider: "#333333",
  overlay: "rgba(0, 0, 0, 0.7)",
  // Status colors
  statusBar: "#121212",
  tabBar: "#1e1e1e",
  tabBarInactive: "#a0a0a0",
  tabBarActive: "#bb86fc",
};

// Map mode names to color palettes
const themePalettes: Record<ColorSchemeName | "light" | "dark", ColorPalette> =
  {
    light: lightColors,
    dark: darkColors,
    "no-preference": lightColors, // Default to light mode for no preference
    default: lightColors, // Fallback to light mode
  };

export { lightColors, darkColors, themePalettes };
export type { ColorPalette };
