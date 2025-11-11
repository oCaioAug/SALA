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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Começar sempre com dark para evitar flash
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Só executar no cliente após montagem
    setMounted(true);
    
    // Carregar tema do localStorage de forma segura
    const savedTheme = safeLocalStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "dark";

    // Aplicar tema ao documentElement de forma segura
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      // Remover todas as classes de tema primeiro
      root.classList.remove("dark", "light");
      // Adicionar a classe correta
      root.classList.add(initialTheme);
    }

    // Atualizar estado apenas se diferente
    if (initialTheme !== theme) {
      setThemeState(initialTheme);
    }
  }, [theme]);

  const applyTheme = (newTheme: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove("dark", "light");
      root.classList.add(newTheme);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    safeLocalStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Renderizar com tema padrão até estar montado para evitar flash
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
