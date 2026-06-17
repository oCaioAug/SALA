"use client";

import { Building2, CalendarDays, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Link } from "@/navigation";

type AuthShellProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export function AuthShell({ children, wide = false }: AuthShellProps) {
  const t = useTranslations("Auth.shell");

  const highlights = [
    { icon: Building2, text: t("highlight1") },
    { icon: CalendarDays, text: t("highlight2") },
    { icon: ShieldCheck, text: t("highlight3") },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-[80px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden flex-col justify-between border-r border-border px-12 py-10 lg:flex lg:w-[44%] xl:w-[42%] xl:px-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-105">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-foreground">
                S.A.L.A.
              </span>
            </Link>

            <div className="mt-16 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-800 dark:text-violet-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                {t("badge")}
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground xl:text-[2.75rem]">
                {t("headline")}
                <span className="mt-1 block bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-400">
                  {t("headlineAccent")}
                </span>
              </h1>
              <p className="max-w-md text-base leading-relaxed text-muted-foreground">
                {t("description")}
              </p>
            </div>
          </div>

          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-violet-500 dark:text-violet-300">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 px-6 py-5 lg:px-10">
            <Link href="/" className="inline-flex items-center gap-2.5 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <span className="font-bold text-foreground">S.A.L.A.</span>
            </Link>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <AppPreferencesControls variant="marketing" />
              <Link
                href="/"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("backHome")}
              </Link>
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-2 lg:px-10">
            <div
              className={
                wide
                  ? "w-full max-w-2xl"
                  : "w-full max-w-[420px]"
              }
            >
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
