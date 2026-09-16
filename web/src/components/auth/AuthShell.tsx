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
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden flex-col justify-between border-r border-border bg-card px-12 py-10 lg:flex lg:w-[44%] xl:w-[42%] xl:px-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-sm font-bold">S</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                S.A.L.A.
              </span>
            </Link>

            <div className="mt-14 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("badge")}
              </p>
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground xl:text-4xl">
                {t("headline")}
                <span className="mt-1 block text-primary">
                  {t("headlineAccent")}
                </span>
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                {t("description")}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex flex-1 flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-border px-6 py-4 lg:px-10">
            <Link href="/" className="inline-flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-xs font-bold">S</span>
              </div>
              <span className="font-semibold text-foreground">S.A.L.A.</span>
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

          <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-6 lg:px-10">
            <div className={wide ? "w-full max-w-2xl" : "w-full max-w-[420px]"}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
