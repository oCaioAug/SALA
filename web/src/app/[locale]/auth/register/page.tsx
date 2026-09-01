"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { Suspense, useState } from "react";
import { ZodIssue } from "zod";

import {
  authInputClass,
  authInputErrorClass,
} from "@/components/auth/auth-styles";
import {
  AuthCard,
  AuthDivider,
  AuthError,
  AuthField,
  AuthFooterLink,
  AuthGoogleButton,
  AuthPrimaryButton,
} from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { getSafeCallbackPath } from "@/lib/auth/callback-path";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { cn } from "@/lib/utils";
import { accountRegisterSchema } from "@/lib/validations/auth";
import { Link } from "@/navigation";

function mapZodErrors(issues: ZodIssue[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path?.[0];
    if (typeof field === "string" && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}

const RegisterContent: React.FC = () => {
  const t = useTranslations("Auth.register");
  const tLogin = useTranslations("Auth.login");
  const { fromPayload } = useApiErrorMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackPath =
    getSafeCallbackPath(searchParams.get("callbackUrl")) ?? "/organizations";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthOnly, setOauthOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputClass = (field?: string) =>
    cn(authInputClass, field && fieldErrors[field] && authInputErrorClass);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
    setFormError(null);
    setOauthOnly(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setOauthOnly(false);
    setFieldErrors({});

    const parsed = accountRegisterSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(mapZodErrors(parsed.error.issues));
      setFormError(t("messages.fixErrors"));
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.issues?.length) {
          setFieldErrors(mapZodErrors(data.issues));
        }
        if (data.errorCode === ApiErrorCode.OAUTH_ONLY_ACCOUNT) {
          setOauthOnly(true);
        }
        setFormError(fromPayload(data) || t("errors.generic"));
        return;
      }

      const signInResult = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
        callbackUrl: callbackPath,
      });

      if (signInResult?.error) {
        router.push("/auth/login?registered=1");
        return;
      }

      router.push(callbackPath);
    } catch {
      setFormError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    await signIn("google", { callbackUrl: callbackPath, redirect: true });
  };

  return (
    <AuthShell>
      <AuthCard title={t("title")} subtitle={t("subtitle")}>
        {formError && <AuthError>{formError}</AuthError>}

        <AuthGoogleButton
          label={oauthOnly ? tLogin("loginWithGoogle") : t("googleSignUp")}
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("googleHint")}
        </p>

        <AuthDivider label={tLogin("or")} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label={t("fields.name")} required error={fieldErrors.name}>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t("placeholders.name")}
              autoComplete="name"
              className={inputClass("name")}
            />
          </AuthField>

          <AuthField
            label={t("fields.email")}
            required
            error={fieldErrors.email}
          >
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder={t("placeholders.email")}
              autoComplete="email"
              className={inputClass("email")}
            />
          </AuthField>

          <AuthField
            label={t("fields.password")}
            required
            error={fieldErrors.password}
          >
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder={t("placeholders.password")}
              autoComplete="new-password"
              className={inputClass("password")}
            />
          </AuthField>

          <AuthField
            label={t("fields.confirmPassword")}
            required
            error={fieldErrors.confirmPassword}
          >
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder={t("placeholders.confirmPassword")}
              autoComplete="new-password"
              className={inputClass("confirmPassword")}
            />
          </AuthField>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-ring/40"
            />
            <span className="text-sm leading-relaxed text-foreground">
              {t("acceptTermsPrefix")}{" "}
              <Link
                href="/terms-of-service"
                className="font-medium text-primary underline-offset-2 hover:text-primary hover:underline dark:text-primary dark:hover:text-primary"
              >
                {tLogin("termsOfService")}
              </Link>{" "}
              {tLogin("legalAnd")}{" "}
              <Link
                href="/privacy-policy"
                className="font-medium text-primary underline-offset-2 hover:text-primary hover:underline dark:text-primary dark:hover:text-primary"
              >
                {tLogin("privacyPolicy")}
              </Link>
              .
            </span>
          </label>
          {fieldErrors.acceptTerms && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {fieldErrors.acceptTerms}
            </p>
          )}

          <AuthPrimaryButton loading={isLoading}>
            {isLoading ? t("submitting") : t("submit")}
          </AuthPrimaryButton>
        </form>

        <AuthFooterLink>
          {t("hasAccount")}{" "}
          <Link
            href={
              callbackPath === "/organizations"
                ? "/auth/login"
                : `/auth/login?callbackUrl=${encodeURIComponent(callbackPath)}`
            }
            className="font-medium text-primary transition-colors hover:text-primary"
          >
            {t("loginLink")}
          </Link>
        </AuthFooterLink>
      </AuthCard>
    </AuthShell>
  );
};

export default function RegisterPage() {
  const t = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="text-muted-foreground">{t("loading")}</div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
