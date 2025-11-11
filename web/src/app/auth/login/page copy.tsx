"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const LoginPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    try {
      if (
        process.env.NODE_ENV === "development" &&
        (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === "your-google-client-id")
      ) {
        alert(
          "Para usar o login com Google, configure as credenciais OAuth no arquivo .env\n\nVeja as instruções no console do navegador."
        );
        console.log(`
🔧 CONFIGURAÇÃO DO GOOGLE OAUTH NECESSÁRIA:

1. Acesse: https://console.cloud.google.com
2. Crie um projeto ou selecione um existente
3. Ative a Google+ API
4. Configure a tela de consentimento OAuth
5. Crie credenciais OAuth 2.0:
   - Tipo: Web application
   - Redirect URI: http://localhost:3000/api/auth/callback/google
6. Atualize o arquivo .env:
   GOOGLE_CLIENT_ID="seu-client-id"
   GOOGLE_CLIENT_SECRET="seu-client-secret"
        `);
        return;
      }
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (error) {
      console.error("Erro no login:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Sistema de Gestão de Salas
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Faça login para acessar o sistema
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            variant="outline"
            className="w-full flex items-center justify-center gap-3 py-3 border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <FcGoogle className="w-5 h-5" />
            Entrar com Google
          </Button>

          <div className="text-center text-sm text-gray-500">
            Ao fazer login, você concorda com nossos termos de uso
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
