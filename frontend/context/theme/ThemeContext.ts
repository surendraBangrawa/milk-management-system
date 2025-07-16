import React from "react";
import { ColorSchemeName } from "react-native";
import { ColorPalette, lightColors } from "./theme"; // Import ColorPalette and a default palette

// Define the shape of the object provided by the ThemeContext
interface ThemeContextType {
  themeMode: "light" | "dark";
  systemThemeMode: ColorSchemeName;
  manualThemeMode: "light" | "dark" | "system";
  colors: ColorPalette;
  toggleTheme: () => void; // Function to toggle between light and dark mode
  setTheme: (mode: "light" | "dark" | "system") => void; // Function to set specific theme mode
}

// Create the context with a default value (can be null initially)
const ThemeContext = React.createContext<ThemeContextType | undefined>(
  undefined
);

export default ThemeContext;
export type { ThemeContextType };
