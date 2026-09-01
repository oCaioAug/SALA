"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { Suspense, useState } from "react";

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
  AuthLegalFooter,
  AuthPrimaryButton,
} from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { ApiErrorCode } from "@/lib/api/error-codes";
import { getSafeCallbackPath } from "@/lib/auth/callback-path";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

const LoginContent: React.FC = () => {
  const t = useTranslations("Auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlError = searchParams.get("error");
  const registered = searchParams.get("registered");
  const passwordReset = searchParams.get("reset");
  const callbackPath =
    getSafeCallbackPath(searchParams.get("callbackUrl")) ?? "/organizations";
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthOnly, setOauthOnly] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(null);
    setOauthOnly(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setOauthOnly(false);

    try {
      const intentRes = await fetch("/api/auth/login-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const intent = await intentRes.json();

      if (!intentRes.ok) {
        setFormError(t("invalidCredentials"));
        return;
      }

      if (!intent.ok) {
        if (intent.code === ApiErrorCode.OAUTH_ONLY_ACCOUNT) {
          setOauthOnly(true);
          setFormError(t("oauthOnlyAccount"));
          return;
        }
        setFormError(t("invalidCredentials"));
        return;
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl: callbackPath,
      });

      if (result?.error) {
        setFormError(t("invalidCredentials"));
        return;
      }

      router.push(callbackPath);
    } catch {
      setFormError(t("connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithGoogleClick = async () => {
    try {
      await signIn("google", {
        callbackUrl: callbackPath,
        redirect: true,
      });
    } catch {
      router.push("/auth/error?error=Default");
    }
  };

  const resolveUrlError = () => {
    if (!urlError) return null;
    if (urlError === "Callback") return t("callbackError");
    if (urlError === "OAuthAccountNotLinked") return t("oauthAccountNotLinked");
    return urlError;
  };

  const showError = urlError || formError;
  const inputClass = (hasError?: boolean) =>
    cn(authInputClass, hasError && authInputErrorClass);

  return (
    <AuthShell>
      <AuthCard title={t("title")} subtitle={t("subtitle")}>
        {registered === "1" && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {t("registeredSuccess")}
          </div>
        )}

        {passwordReset === "1" && (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {t("passwordResetSuccess")}
          </div>
        )}

        {showError && (
          <AuthError>
            <strong>{t("authError")}</strong> {formError ?? resolveUrlError()}
          </AuthError>
        )}
        {oauthOnly && (
          <div className="-mt-3 mb-6">
            <AuthGoogleButton
              label={t("loginWithGoogle")}
              onClick={handleLoginWithGoogleClick}
              disabled={isLoading}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthField label={t("email")} required>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("emailPlaceholder")}
              required
              autoComplete="email"
              className={inputClass()}
            />
          </AuthField>

          <AuthField label={t("password")} required>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t("passwordPlaceholder")}
              required
              autoComplete="current-password"
              className={inputClass()}
            />
            <div className="mt-2 text-right">
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-primary transition-colors hover:text-primary"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </AuthField>

          <AuthPrimaryButton loading={isLoading}>
            {isLoading ? t("loading") : t("login")}
          </AuthPrimaryButton>
        </form>

        <AuthDivider label={t("or")} />

        {!oauthOnly && (
          <div className="space-y-4">
            <AuthGoogleButton
              label={t("loginWithGoogle")}
              onClick={handleLoginWithGoogleClick}
              disabled={isLoading}
            />
            <p className="text-center text-xs text-slate-500">
              {t("googleHint")}
            </p>
          </div>
        )}

        <AuthFooterLink>
          {t("noAccount")}{" "}
          <Link
            href={
              callbackPath === "/organizations"
                ? "/auth/register"
                : `/auth/register?callbackUrl=${encodeURIComponent(callbackPath)}`
            }
            className="font-medium text-primary transition-colors hover:text-primary"
          >
            {t("createAccount")}
          </Link>
        </AuthFooterLink>

        <AuthLegalFooter>
          {t("legalConsent")}{" "}
          <Link
            href="/terms-of-service"
            className="text-primary/90 underline-offset-2 hover:text-primary hover:underline"
          >
            {t("termsOfService")}
          </Link>{" "}
          {t("legalAnd")}{" "}
          <Link
            href="/privacy-policy"
            className="text-primary/90 underline-offset-2 hover:text-primary hover:underline"
          >
            {t("privacyPolicy")}
          </Link>
          .
        </AuthLegalFooter>
      </AuthCard>
    </AuthShell>
  );
};

const LoginPage: React.FC = () => {
  const t = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-950">
          <div className="text-muted-foreground">{t("loading")}</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
