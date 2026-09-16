import { cn } from "@/lib/utils";

export type PreferencesVariant = "tenant" | "marketing";

export type DropdownPlacement = "auto" | "top" | "bottom";

export function preferencesTriggerClass(variant: PreferencesVariant) {
  return cn(
    "inline-flex items-center gap-2 rounded-xl transition-all duration-300 disabled:opacity-50",
    variant === "tenant"
      ? "p-2.5 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-600/50 dark:hover:text-white"
      : "border border-transparent p-2 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
  );
}

export function preferencesDropdownClass(
  variant: PreferencesVariant,
  placement: "top" | "bottom" = "bottom"
) {
  return cn(
    "absolute right-0 z-50 w-48 overflow-hidden rounded-xl border shadow-sm transition-colors duration-300",
    placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
    variant === "tenant"
      ? "border-slate-200 bg-white dark:border-slate-600/50 dark:bg-slate-800"
      : "border-border bg-popover text-popover-foreground"
  );
}

export function preferencesMenuItemClass(
  variant: PreferencesVariant,
  active: boolean
) {
  return cn(
    "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors duration-200",
    variant === "tenant"
      ? active
        ? "bg-blue-50 font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-white"
      : active
        ? "bg-primary/10 font-medium text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );
}
