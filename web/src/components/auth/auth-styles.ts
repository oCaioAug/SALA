import { cn } from "@/lib/utils";

export const authInputClass = cn(
  "flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground",
  "placeholder:text-muted-foreground transition-colors",
  "focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const authInputErrorClass =
  "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/25";

export const authSectionClass =
  "text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

export const authSurfaceClass =
  "rounded-lg border border-border bg-card shadow-sm";

export const authMutedTextClass = "text-muted-foreground";
