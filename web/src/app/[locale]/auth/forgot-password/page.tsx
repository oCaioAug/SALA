"use client";

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
import { Link } from "@/navigation";

function ForgotPasswordContent() {
  const t = useTranslations("Auth.forgotPassword");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message ?? t("error"));
        return;
      }

      setSuccessMessage(data.message ?? t("success"));
      setSubmitted(true);
    } catch {
      setFormError(t("connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard title={t("title")} subtitle={t("subtitle")}>
        {submitted && successMessage ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        {formError && (
          <AuthError>
            <strong>{t("errorTitle")}</strong> {formError}
          </AuthError>
        )}

        {!submitted && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthField label={t("email")} required>
              <input
                type="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                autoComplete="email"
                className={authInputClass}
              />
            </AuthField>

            <AuthPrimaryButton loading={isLoading}>
              {isLoading ? t("loading") : t("submit")}
            </AuthPrimaryButton>
          </form>
        )}

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

export default function ForgotPasswordPage() {
  const t = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="text-muted-foreground">{t("loading")}</div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
