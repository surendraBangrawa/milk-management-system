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

// Define your dark mode colors
const darkColors: ColorPalette = {
  primary: "#bb86fc", // Lighter purple for dark mode primary
  primaryLight: "#6200ea", // Deep purple (maybe used for accents in dark mode)
  primaryDark: "#3700b3", // Darker purple
  textPrimary: "#e0e0e0", // Light gray for main text
  textSecondary: "#a0a0a0", // Lighter gray for secondary text
  background: "#121212", // Very dark background
  surface: "#1e1e1e", // Darker surfaces
  error: "#cf6679", // Lighter error red for dark mode
  success: "#81c784", // Lighter success green for dark mode
  border: "#333333", // Darker border
  shadow: "rgba(255, 255, 255, 0.1)", // White shadow for dark mode (low opacity)
};

// Map mode names to color palettes
const themePalettes: Record<ColorSchemeName | "light" | "dark", ColorPalette> =
  {
    light: lightColors,
    dark: darkColors,
    null: lightColors, // Default to light if system preference is null
  };

export { lightColors, darkColors, themePalettes };
export type { ColorPalette };
