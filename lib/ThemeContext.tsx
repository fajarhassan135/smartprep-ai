"use client";
import { createContext, useContext } from "react";

type ThemeContextType = {
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  toggleDark: () => {},
});

/**
 * The theme is a `dark` class on <html>, set by the blocking script in
 * app/layout.tsx before the first paint. Colours come from CSS variables keyed
 * off that class, so nothing here needs React state — which is what used to
 * cause the flash of light theme on every navigation.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  function toggleDark() {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode or blocked storage: the theme just won't persist.
    }
  }

  return (
    <ThemeContext.Provider value={{ toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
