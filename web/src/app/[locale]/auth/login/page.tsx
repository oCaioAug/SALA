"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import React, { Suspense, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const LoginContent: React.FC = () => {
  const t = useTranslations("Auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se há erro na URL
  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar dados do usuário no localStorage apenas no lado do cliente
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
        router.push("/dashboard");
      } else {
        alert(data.error || t("error"));
      }
    } catch (error) {
      console.error("Erro no login:", error);
      alert(t("connectionError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLoginWithGoogleClick = async () => {
    try {
      console.log("🔄 Iniciando login com Google...");

      // Usar redirect: true para que o NextAuth handle o redirecionamento automaticamente
      await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (error) {
      console.error("❌ Erro ao tentar fazer login:", error);
      router.push("/auth/error?error=Default");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            {t("title")}
          </CardTitle>
          <p className="text-gray-400">{t("subtitle")}</p>
        </CardHeader>

        <CardContent>
          {urlError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
              <strong>{t("authError")}</strong>{" "}
              {urlError === "Callback"
                ? t("callbackError")
                : urlError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mb-3">
            <Input
              label={t("email")}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("emailPlaceholder")}
              required
            />

            <Input
              label={t("password")}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t("passwordPlaceholder")}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                {t("rememberMe")}
              </label>

              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {t("forgotPassword")}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("loading") : t("login")}
            </Button>
          </form>

          <div className="space-y-3">
            <Button
              onClick={handleLoginWithGoogleClick}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-3 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <FcGoogle className="w-5 h-5 mt" />
              {t("loginWithGoogle")}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                {t("noAccount")}{" "}
                <button className="text-blue-400 hover:text-blue-300 transition-colors">
                  {t("createAccount")}
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const t = useTranslations("Common");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">{t("loading")}</div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
