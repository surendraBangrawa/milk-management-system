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
  // Add any other colors you use
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
};

// Define your dark mode colors (Revised)
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
