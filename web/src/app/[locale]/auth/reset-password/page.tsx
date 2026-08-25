"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { Suspense, useState } from "react";

import { authInputClass } from "@/components/auth/auth-styles";
import {
  AuthCard,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthPrimaryButton,
} from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { Link } from "@/navigation";

function ResetPasswordContent() {
  const t = useTranslations("Auth.resetPassword");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fromPayload } = useApiErrorMessage();
  const token = searchParams.get("token") ?? "";

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setFormError(t("missingToken"));
      return;
    }

    setIsLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...formData }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(fromPayload(data) || t("error"));
        return;
      }

      router.push("/auth/login?reset=1");
    } catch {
      setFormError(t("connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard title={t("title")} subtitle={t("subtitle")}>
        {!token && (
          <AuthError>
            <strong>{t("errorTitle")}</strong> {t("missingToken")}
          </AuthError>
        )}

        {formError && (
          <AuthError>
            <strong>{t("errorTitle")}</strong> {formError}
          </AuthError>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label={t("password")} required>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={e =>
                setFormData(prev => ({ ...prev, password: e.target.value }))
              }
              placeholder={t("passwordPlaceholder")}
              required
              autoComplete="new-password"
              disabled={!token}
              className={authInputClass}
            />
          </AuthField>

          <AuthField label={t("confirmPassword")} required>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              placeholder={t("confirmPasswordPlaceholder")}
              required
              autoComplete="new-password"
              disabled={!token}
              className={authInputClass}
            />
          </AuthField>

          <AuthPrimaryButton loading={isLoading} disabled={!token}>
            {isLoading ? t("loading") : t("submit")}
          </AuthPrimaryButton>
        </form>

        <AuthFooterLink>
          <Link
            href="/auth/login"
            className="font-medium text-primary transition-colors hover:text-primary"
          >
            {t("backToLogin")}
          </Link>
        </AuthFooterLink>
      </AuthCard>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="text-muted-foreground">{t("loading")}</div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
