"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
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

            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                {t("goDashboard")}
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
  );
};

const AuthErrorPage: React.FC = () => {
  const t = useTranslations("Auth.errorPage");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">{t("loading")}</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
};

export default AuthErrorPage;
