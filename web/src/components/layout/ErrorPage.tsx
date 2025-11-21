"use client";

import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { Button } from "@/components/ui/Button";

interface ErrorPageProps {
  error: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  error,
  onRetry,
  retryLabel,
}) => {
  const t = useTranslations("Dashboard");
  const defaultRetryLabel = retryLabel || t("actions.retry");
  
  return (
    <div className="page-container flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          {t("feedback.errorTitle")}
        </h3>
        <p className="text-slate-600 dark:text-gray-400 text-sm mb-6">
          {error}
        </p>
        {onRetry && <Button onClick={onRetry}>{defaultRetryLabel}</Button>}
      </div>
    </div>
  );
};
