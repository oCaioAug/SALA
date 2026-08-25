"use client";

import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { cn } from "@/lib/utils";

type AccountSecurityFormProps = {
  hasPassword: boolean;
  hint?: string;
  onSuccess?: (action: "create" | "change") => void;
  onError?: (message: string) => void;
  className?: string;
  compact?: boolean;
};

export function AccountSecurityForm({
  hasPassword: initialHasPassword,
  hint,
  onSuccess,
  onError,
  className,
  compact = false,
}: AccountSecurityFormProps) {
  const t = useTranslations("ProfilePage");
  const { fromPayload } = useApiErrorMessage();
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const inputClass = cn(
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white",
    compact && "py-2.5 text-sm"
  );

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordLoading(true);

    const wasChanging = hasPassword;

    try {
      const body = hasPassword
        ? passwordForm
        : {
            password: passwordForm.password,
            confirmPassword: passwordForm.confirmPassword,
          };

      const response = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        const message = fromPayload(data) || t("security.error");
        setPasswordError(message);
        onError?.(message);
        return;
      }

      setHasPassword(true);
      setPasswordForm({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      onSuccess?.(wasChanging ? "change" : "create");
    } catch {
      const message = t("security.error");
      setPasswordError(message);
      onError?.(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className={className}>
      {!compact && (
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
          {t("security.title")}
        </h3>
      )}
      <p
        className={cn(
          "mb-4 text-sm text-slate-600 dark:text-gray-400",
          compact && "mb-3"
        )}
      >
        {hint ??
          (hasPassword ? t("security.changeHint") : t("security.createHint"))}
      </p>

      <form onSubmit={handlePasswordSubmit} className="space-y-3">
        {hasPassword && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
              {t("security.currentPassword")}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={passwordForm.currentPassword}
              onChange={e =>
                setPasswordForm(prev => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              required
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
            {hasPassword ? t("security.newPassword") : t("security.password")}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={passwordForm.password}
            onChange={e =>
              setPasswordForm(prev => ({
                ...prev,
                password: e.target.value,
              }))
            }
            required
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
            {t("security.confirmPassword")}
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={passwordForm.confirmPassword}
            onChange={e =>
              setPasswordForm(prev => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            required
            className={inputClass}
          />
        </div>

        {passwordError && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {passwordError}
          </p>
        )}

        <Button
          type="submit"
          disabled={passwordLoading}
          className={cn("w-full", compact && "w-auto")}
          size={compact ? "sm" : "md"}
        >
          {passwordLoading ? (
            <>
              <LoadingSpinner size="sm" />
              {t("security.saving")}
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {hasPassword
                ? t("security.changeSubmit")
                : t("security.createSubmit")}
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
