"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

const AuthErrorContent: React.FC = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "Configuration":
        return "Erro de configuração do provedor de autenticação.";
      case "AccessDenied":
        return "Acesso negado. Você cancelou o login ou não tem permissão.";
      case "Verification":
        return "Token de verificação inválido ou expirado.";
      case "Default":
        return "Ocorreu um erro durante a autenticação.";
      case "Callback":
        return "Erro no callback do Google. Verifique se o redirect URI está configurado corretamente.";
      default:
        return "Erro desconhecido durante a autenticação.";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-400 mb-2">
            Erro de Autenticação
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <div className="text-gray-300">
            <p className="mb-2">{getErrorMessage(error)}</p>

            {error && (
              <div className="bg-gray-800 p-3 rounded text-sm text-left">
                <p>
                  <strong>Código do erro:</strong> {error}
                </p>
                {errorDescription && (
                  <p>
                    <strong>Descrição:</strong> {errorDescription}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Link href="/auth/login">
              <Button className="w-full">Tentar Novamente</Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Ir para Dashboard
              </Button>
            </Link>
          </div>

          <div className="text-xs text-gray-500">
            <p>Se o problema persistir, verifique:</p>
            <ul className="text-left mt-2 space-y-1">
              <li>• Configuração do Google OAuth</li>
              <li>• Redirect URIs autorizados</li>
              <li>• Variáveis de ambiente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AuthErrorPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-white">Carregando...</div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
};

export default AuthErrorPage;
