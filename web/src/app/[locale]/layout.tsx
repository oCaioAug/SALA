import "../globals.css";

import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import Script from "next/script";

import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ProductionErrorLogger from "@/components/ui/ProductionErrorLogger";
import { ToastProvider } from "@/components/ui/Toast";
import { AppProvider } from "@/lib/hooks/useApp";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";
import { routing } from "@/navigation";

import AuthProvider from "../_providers/auth";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("appTitle"),
    description: t("appDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validar locale
  const validLocales = routing.locales as readonly string[];
  if (!validLocales.includes(locale)) {
    console.error(
      `Locale inválido no layout: ${locale}. Locales suportados:`,
      validLocales
    );
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
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
          <meta
            name="google-site-verification"
            content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION}
          />
        )}
      </head>
      <body
        className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ProductionErrorLogger />
          <ErrorBoundary>
            <ThemeProvider>
              <AuthProvider>
                <ToastProvider>
                  <AppProvider>{children}</AppProvider>
                </ToastProvider>
              </AuthProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
