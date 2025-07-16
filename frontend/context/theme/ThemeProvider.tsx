import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useColorScheme } from "react-native";
import ThemeContext from "./ThemeContext";
import { themePalettes } from "./theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(
    "system"
  );
  const [manualTheme, setManualTheme] = useState<"light" | "dark">("light");

  // Determine the effective theme mode
  const effectiveThemeMode = useMemo(() => {
    if (themeMode === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return manualTheme;
  }, [themeMode, systemColorScheme, manualTheme]);

  // Update manual theme when system theme changes (if in system mode)
  useEffect(() => {
    if (themeMode === "system") {
      setManualTheme(systemColorScheme === "dark" ? "dark" : "light");
    }
  }, [systemColorScheme, themeMode]);

  const colors = useMemo(() => {
    return themePalettes[effectiveThemeMode] || themePalettes.light;
  }, [effectiveThemeMode]);

  const toggleTheme = useCallback(() => {
    if (themeMode === "system") {
      // If currently in system mode, switch to manual mode with opposite theme
      setThemeMode("light");
      setManualTheme(systemColorScheme === "dark" ? "light" : "dark");
    } else {
      // If in manual mode, toggle between light and dark
      setManualTheme((prev) => (prev === "light" ? "dark" : "light"));
    }
  }, [themeMode, systemColorScheme]);

  const setTheme = useCallback(
    (mode: "light" | "dark" | "system") => {
      if (mode === "system") {
        setThemeMode("system");
        setManualTheme(systemColorScheme === "dark" ? "dark" : "light");
      } else {
        setThemeMode(mode);
        setManualTheme(mode);
      }
    },
    [systemColorScheme]
  );

  const contextValue = useMemo(
    () => ({
      themeMode: effectiveThemeMode,
      systemThemeMode: systemColorScheme,
      manualThemeMode: themeMode,
      colors,
      toggleTheme,
      setTheme,
    }),
    [
      effectiveThemeMode,
      systemColorScheme,
      themeMode,
      colors,
      toggleTheme,
      setTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
