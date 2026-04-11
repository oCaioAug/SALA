"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import { safeLocalStorage } from "@/lib/utils/clientSafe";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeClass(next: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(next);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = safeLocalStorage.getItem("theme") as Theme | null;
    const initial = saved === "light" || saved === "dark" ? saved : "dark";
    setThemeState(initial);
    applyThemeClass(initial);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    safeLocalStorage.setItem("theme", newTheme);
    applyThemeClass(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      const next = prev === "dark" ? "light" : "dark";
      safeLocalStorage.setItem("theme", next);
      applyThemeClass(next);
      return next;
    });
  };

  const contextValue = {
    theme: mounted ? theme : "dark",
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
