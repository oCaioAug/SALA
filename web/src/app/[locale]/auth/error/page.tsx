"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Link } from "@/navigation";

const AuthErrorContent: React.FC = () => {
  const t = useTranslations("Auth.errorPage");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const getErrorMessage = (errorCode: string | null) => {
    if (!errorCode) return t("errors.unknown");
    const key = `errors.${errorCode}` as const;
    try {
      return t(key);
    } catch {
      return t("errors.unknown");
    }
  };

  return (
    <div className="relative min-h-screen bg-background p-4 text-foreground">
      <div className="absolute right-4 top-4">
        <AppPreferencesControls variant="marketing" />
      </div>
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-400 mb-2">
              {t("title")}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-4">
            <div className="text-gray-300">
              <p className="mb-2">{getErrorMessage(error)}</p>

              {error && (
                <div className="bg-gray-800 p-3 rounded text-sm text-left">
                  <p>
                    <strong>{t("errorCodeLabel")}</strong> {error}
                  </p>
                  {errorDescription && (
                    <p>
                      <strong>{t("errorDescriptionLabel")}</strong>{" "}
                      {errorDescription}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Link href="/auth/login">
                <Button className="w-full">{t("tryAgain")}</Button>
              </Link>

              <Link href="/organizations">
                <Button variant="outline" className="w-full">
                  {t("goToHub")}
                </Button>
              </Link>
            </div>

            <div className="text-xs text-gray-500">
              <p>{t("troubleshootTitle")}</p>
              <ul className="text-left mt-2 space-y-1">
                <li>• {t("troubleshootOAuth")}</li>
                <li>• {t("troubleshootRedirect")}</li>
                <li>• {t("troubleshootEnv")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AuthErrorPage: React.FC = () => {
  const t = useTranslations("Auth.errorPage");

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-muted-foreground">{t("loading")}</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
};

export default AuthErrorPage;
