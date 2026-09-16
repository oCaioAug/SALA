"use client";

import { cn } from "@/lib/utils";

import LanguageSwitcher from "@/components/LanguageSwitcher";

import {
  type DropdownPlacement,
  type PreferencesVariant,
} from "./preference-styles";
import { ThemeToggle } from "./ThemeToggle";

type AppPreferencesControlsProps = {
  variant?: PreferencesVariant;
  className?: string;
  showLabels?: boolean;
  languageDropdownPlacement?: DropdownPlacement;
};

export function AppPreferencesControls({
  variant = "marketing",
  className,
  showLabels = false,
  languageDropdownPlacement = "auto",
}: AppPreferencesControlsProps) {
  return (
    <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
      <LanguageSwitcher
        variant={variant}
        showLabel={showLabels}
        dropdownPlacement={languageDropdownPlacement}
      />
      <ThemeToggle variant={variant} />
    </div>
  );
}
