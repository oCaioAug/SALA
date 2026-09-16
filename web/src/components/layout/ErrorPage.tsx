"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ErrorPageProps {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** `embedded`: área principal. `fullscreen`: ocupa a viewport. */
  variant?: "fullscreen" | "embedded";
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  error,
  onRetry,
  retryLabel,
  variant = "embedded",
}) => {
  const t = useTranslations("Dashboard");
  const defaultRetryLabel = retryLabel || t("actions.retry");

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        variant === "fullscreen" && "page-container min-h-screen",
        variant === "embedded" && "min-h-[min(24rem,70vh)] flex-1 py-12"
      )}
    >
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 h-8 w-8 text-red-500" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {t("feedback.errorTitle")}
        </h3>
        <p className="mb-6 text-sm text-muted-foreground">{error}</p>
        {onRetry && <Button onClick={onRetry}>{defaultRetryLabel}</Button>}
      </div>
    </div>
  );
};
