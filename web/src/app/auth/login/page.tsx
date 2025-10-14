"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

const LoginPage: React.FC = () => {
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

    // Simular login (substituir por lógica real)
    setTimeout(() => {
      setIsLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLoginWithGoogleClick = async () => {
    try {
      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: false,
      });

      if (result?.error) {
        console.error("Erro no login:", result.error);
        router.push(`/auth/error?error=${result.error}`);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      console.error("Erro ao tentar fazer login:", error);
      router.push("/auth/error?error=Default");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            S.A.L.A
          </CardTitle>
          <p className="text-gray-400">Sistema de Gerenciamento de Salas</p>
        </CardHeader>

        <CardContent>
          {urlError && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
              <strong>Erro de autenticação:</strong>{" "}
              {urlError === "Callback"
                ? "Erro no callback do Google. Verifique as configurações do OAuth."
                : urlError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 mb-3">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seuemail@aedb.br"
              required
            />

            <Input
              label="Senha"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Sua senha"
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                />
                Lembrar-me
              </label>

              <button
                type="button"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="space-y-3">
            <Button
              onClick={handleLoginWithGoogleClick}
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-3 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <FcGoogle className="w-5 h-5 mt" />
              Entrar com Google
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Não tem uma conta?{" "}
                <button className="text-blue-400 hover:text-blue-300 transition-colors">
                  Crie uma agora
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
