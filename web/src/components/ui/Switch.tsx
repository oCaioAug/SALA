"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchChangeEvent = {
  target: { checked: boolean };
};

type SwitchProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange" | "role" | "type"
> & {
  checked?: boolean;
  onChange?: (event: SwitchChangeEvent) => void;
};

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { className, checked = false, disabled, onChange, onClick, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={event => {
          onClick?.(event);
          if (event.defaultPrevented || disabled) return;
          onChange?.({ target: { checked: !checked } });
        }}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border p-0",
          "cursor-pointer transition-[background-color,border-color] duration-300",
          "motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked
            ? "border-emerald-600 bg-emerald-500 dark:border-emerald-500 dark:bg-emerald-500"
            : "border-border bg-slate-200 dark:bg-slate-700",
          className
        )}
        {...props}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full",
            "bg-gradient-to-b from-white to-slate-100",
            "shadow-[0_1px_2px_rgba(15,23,42,0.2)]",
            "transition-transform duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            "motion-reduce:transition-none",
            "translate-x-0",
            checked && "translate-x-5"
          )}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
