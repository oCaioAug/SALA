"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError?: () => void }>;
  translations?: {
    title: string;
    description: string;
    retry: string;
  };
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Atualiza o state para que a próxima renderização mostre a UI de erro
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log do erro para monitoramento
    console.error("ErrorBoundary capturou um erro:", error, errorInfo);

    // Filtrar erros conhecidos que não são críticos
    const nonCriticalErrors = [
      'can\'t access property "postMessage"',
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ];

    const isNonCritical = nonCriticalErrors.some(msg =>
      error.message.includes(msg)
    );

    if (isNonCritical) {
      // Para erros não críticos, apenas log e continue
      console.warn("Erro não crítico ignorado:", error.message);
      this.setState({ hasError: false });
      return;
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.props.fallback) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    if (this.state.hasError) {
      const { translations } = this.props;
      const title = translations?.title || "Oops! Algo deu errado";
      const description =
        translations?.description ||
        "Ocorreu um erro inesperado. Tente recarregar a página.";
      const retry = translations?.retry || "Tentar novamente";

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full space-y-8 p-6">
            <div className="text-center">
              <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
              <button
                onClick={this.resetError}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {retry}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper funcional para usar useTranslations
const ErrorBoundaryWithTranslations: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError?: () => void }>;
}> = ({ children, fallback }) => {
  const t = useTranslations("ErrorBoundary");

  const translations = {
    title: t("title"),
    description: t("description"),
    retry: t("retry"),
  };

  return (
    <ErrorBoundary fallback={fallback} translations={translations}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryWithTranslations;
