"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "role"
>;

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, disabled, ...props }, ref) => {
    return (
      <span
        className={cn(
          "relative inline-block h-5 w-9 shrink-0",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full transition-colors duration-200",
            "bg-slate-900 dark:bg-slate-700",
            "peer-checked:bg-emerald-400 dark:peer-checked:bg-emerald-500/60",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
          )}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 size-4 rounded-full bg-white",
            "shadow-[0_1px_2px_rgba(15,23,42,0.18)]",
            "transition-transform duration-200 ease-in-out",
            "translate-x-0 peer-checked:translate-x-4"
          )}
        />
      </span>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
