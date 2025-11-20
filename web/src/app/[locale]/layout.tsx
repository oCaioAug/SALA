import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ToastProvider } from "@/components/ui/Toast";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ProductionErrorLogger from "@/components/ui/ProductionErrorLogger";
import { AppProvider } from "@/lib/hooks/useApp";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { routing } from "@/navigation";

import AuthProvider from "../_providers/auth";
import "../globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SALA - Sistema de Gerenciamento de Salas",
  description: "Sistema completo para gerenciamento de salas, itens e reservas",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validar locale
  const validLocales = routing.locales as readonly string[];
  if (!validLocales.includes(locale)) {
    console.error(`Locale inválido no layout: ${locale}. Locales suportados:`, validLocales);
    notFound();
  }

  // Carregar mensagens - passar o locale explicitamente
  let messages;
  try {
    // Passar o locale explicitamente para garantir que seja usado
    messages = await getMessages({ locale });
  } catch (error) {
    console.error("Erro ao carregar mensagens no layout:", error);
    // Tentar carregar diretamente como fallback
    try {
      messages = (await import(`@/i18n/dictionaries/${locale}.json`)).default;
    } catch (fallbackError) {
      console.error("Erro ao carregar mensagens via fallback:", fallbackError);
      notFound();
    }
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ProductionErrorLogger />
        <ErrorBoundary>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <AppProvider>
                  <NextIntlClientProvider messages={messages}>
                    {children}
                  </NextIntlClientProvider>
                </AppProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
