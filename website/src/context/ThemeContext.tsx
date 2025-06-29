"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the shape of your color palette
export interface ColorPalette {
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
  hover: string; // Add hover color for general use
  primaryHover: string; // Specific hover for primary elements
}

// Define your light mode colors
export const lightColors: ColorPalette = {
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
  hover: "#e0e0e0", // Light hover for light background
  primaryHover: "#673ab7", // Slightly darker primary on hover
};

// Define your dark mode colors
export const darkColors: ColorPalette = {
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
  hover: "#2a2a2a", // Darker hover for dark background
  primaryHover: "#a070e3", // Slightly lighter primary on hover
};

// Define the type for the Theme Context value
interface ThemeContextType {
  theme: "light" | "dark";
  colors: ColorPalette;
  toggleTheme: () => void;
}

// Create a context with a default value of `undefined`
// The `useTheme` hook will ensure it's not undefined when consumed
export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

// Custom hook to consume the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// ThemeProvider component to wrap your application
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Check local storage for saved theme
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (
      // Check system preference if no theme is saved
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    // Apply theme class to HTML element and save to local storage
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const colors: ColorPalette = theme === "light" ? lightColors : darkColors;

  const contextValue: ThemeContextType = {
    theme,
    colors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
