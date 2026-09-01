import { cn } from "@/lib/utils";

export const adminCardClass = "border-border bg-card shadow-sm";

export const adminCardInteractiveClass = cn(
  adminCardClass,
  "transition-colors hover:border-border hover:bg-muted/40"
);

export const adminSurfaceClass =
  "rounded-lg border border-border bg-card p-4 shadow-sm";

export const adminInputClass = cn(
  "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
);

export const adminListItemClass = "rounded-md bg-muted/50 px-3 py-2 text-sm";

export const adminNavActiveClass =
  "bg-muted font-medium text-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary";

export const adminNavInactiveClass =
  "text-muted-foreground hover:bg-muted hover:text-foreground";

export const adminTabActiveClass = "bg-muted font-medium text-foreground";

export const adminTabInactiveClass =
  "text-muted-foreground hover:bg-muted hover:text-foreground";

export const adminModalClass =
  "overflow-hidden rounded-lg border border-border bg-card shadow-sm";

export const adminModalHeaderClass =
  "flex items-start justify-between border-b border-border px-6 py-4";
