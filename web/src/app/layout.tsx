import "./globals.css";

import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { ToastProvider } from "@/components/ui/Toast";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import ProductionErrorLogger from "@/components/ui/ProductionErrorLogger";
import { AppProvider } from "@/lib/hooks/useApp";
import { ThemeProvider } from "@/lib/providers/ThemeProvider";

import AuthProvider from "./_providers/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SALA - Sistema de Gerenciamento de Salas",
  description: "Sistema completo para gerenciamento de salas, itens e reservas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased dark`}
        suppressHydrationWarning
      >
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
      </body>
    </html>
  );
}
