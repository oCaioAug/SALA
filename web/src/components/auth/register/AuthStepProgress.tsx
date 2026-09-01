"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { REGISTER_STEPS, type RegisterStep } from "./types";

type AuthStepProgressProps = {
  currentStep: number;
  steps?: readonly number[];
  labels?: Record<number, string>;
};

export function AuthStepProgress({
  currentStep,
  steps = REGISTER_STEPS,
  labels: labelsProp,
}: AuthStepProgressProps) {
  const t = useTranslations("Auth.register.steps");

  const defaultLabels: Record<number, string> = {
    1: t("step1"),
    2: t("step2"),
    3: t("step3"),
    4: t("step4"),
  };

  const labels = labelsProp ?? defaultLabels;
  const progressPercent =
    steps.length > 1 ? ((currentStep - 1) / (steps.length - 1)) * 100 : 100;

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-2">
        {steps.map(step => {
          const isActive = currentStep >= step;
          const isCurrent = currentStep === step;

          return (
            <div
              key={step}
              className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-all",
                  isActive
                    ? "border-primary/60 bg-primary/20 text-primary dark:text-primary"
                    : "border-border bg-muted text-muted-foreground",
                  isCurrent && "ring-2 ring-ring/30"
                )}
              >
                {step}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {labels[step]}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative mt-4 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export type { RegisterStep };
