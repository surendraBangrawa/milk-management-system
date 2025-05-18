import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useColorScheme } from "react-native";
import ThemeContext from "./ThemeContext";
import { themePalettes } from "./theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<"light" | "dark">(
    systemColorScheme === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    setThemeMode(systemColorScheme === "dark" ? "dark" : "light");
  }, [systemColorScheme]);

  const colors = useMemo(() => {
    return themePalettes[themeMode] || themePalettes.light;
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  }, []);

  const contextValue = useMemo(
    () => ({
      themeMode,
      colors,
      toggleTheme,
    }),
    [themeMode, colors, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
