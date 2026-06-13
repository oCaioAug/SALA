import { cn } from "@/lib/utils";

export const adminCardClass = "border-border bg-card shadow-sm";

export const adminCardInteractiveClass = cn(
  adminCardClass,
  "transition-colors hover:border-violet-500/30 hover:bg-muted/40"
);

export const adminSurfaceClass =
  "rounded-xl border border-border bg-card p-4 shadow-sm";

export const adminInputClass = cn(
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
);

export const adminListItemClass = "rounded-lg bg-muted/50 px-3 py-2 text-sm";

export const adminNavActiveClass =
  "bg-violet-600/15 text-violet-700 shadow-sm shadow-violet-500/10 dark:bg-violet-600/20 dark:text-violet-200 dark:shadow-violet-900/20";

export const adminNavInactiveClass =
  "text-muted-foreground hover:bg-muted hover:text-foreground";

export const adminTabActiveClass =
  "bg-violet-600/15 text-violet-700 dark:bg-violet-600/20 dark:text-violet-200";

export const adminTabInactiveClass =
  "text-muted-foreground hover:bg-muted hover:text-foreground";

export const adminModalClass =
  "overflow-hidden rounded-2xl border border-border bg-card shadow-2xl";

export const adminModalHeaderClass =
  "flex items-start justify-between border-b border-border px-6 py-5";
