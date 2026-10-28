import { createContext, useContext, type ReactNode } from "react";
import { useTheme, type Theme } from "./hooks";

type ThemeContextValue = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useThemeUI() {
  return useContext(ThemeContext);
}
