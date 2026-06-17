"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";

import { useTheme } from "@/lib/providers/ThemeProvider";

import {
  preferencesTriggerClass,
  type PreferencesVariant,
} from "./preference-styles";

type ThemeToggleProps = {
  variant?: PreferencesVariant;
};

export function ThemeToggle({ variant = "tenant" }: ThemeToggleProps) {
  const t = useTranslations("Preferences");
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={preferencesTriggerClass(variant)}
      aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
