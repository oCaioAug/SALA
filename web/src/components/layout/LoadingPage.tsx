"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";

interface LoadingPageProps {
  message?: string;
  /** `embedded`: área principal (mantém sidebar/header). `fullscreen`: tela inteira. */
  variant?: "fullscreen" | "embedded";
}

export const LoadingPage: React.FC<LoadingPageProps> = ({
  message,
  variant = "embedded",
}) => {
  const t = useTranslations("LoadingPage");
  const text = message ?? t("loading");

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        variant === "fullscreen" && "page-container min-h-screen",
        variant === "embedded" &&
          "w-full min-h-[min(28rem,72vh)] flex-1 flex-col py-12 sm:flex-row sm:py-16"
      )}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" />
      <div className="text-center text-lg text-slate-900 dark:text-white sm:text-xl">
        {text}
      </div>
    </div>
  );
};
