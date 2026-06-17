import { cn } from "@/lib/utils";

export const authInputClass = cn(
  "flex h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground",
  "placeholder:text-muted-foreground transition-all duration-200",
  "focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/25",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const authInputErrorClass =
  "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/25";

export const authSectionClass =
  "text-xs font-semibold uppercase tracking-[0.14em] text-violet-600 dark:text-violet-400";

export const authSurfaceClass =
  "rounded-2xl border border-border bg-card/90 shadow-lg backdrop-blur-xl";

export const authMutedTextClass = "text-muted-foreground";
