"use client";

import { cn } from "@/lib/utils";

import LanguageSwitcher from "@/components/LanguageSwitcher";

import { type PreferencesVariant } from "./preference-styles";
import { ThemeToggle } from "./ThemeToggle";

type AppPreferencesControlsProps = {
  variant?: PreferencesVariant;
  className?: string;
  showLabels?: boolean;
};

export function AppPreferencesControls({
  variant = "marketing",
  className,
  showLabels = false,
}: AppPreferencesControlsProps) {
  return (
    <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
      <LanguageSwitcher variant={variant} showLabel={showLabels} />
      <ThemeToggle variant={variant} />
    </div>
  );
}
