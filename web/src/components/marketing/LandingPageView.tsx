"use client";

import { useTranslations } from "next-intl";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";

const featureBorders = [
  "hover:border-violet-500/40",
  "hover:border-blue-500/40",
  "hover:border-emerald-500/40",
  "hover:border-amber-500/40",
  "hover:border-pink-500/40",
  "hover:border-cyan-500/40",
] as const;

const stepBadgeClass = {
  violet:
    "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  emerald:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
} as const;

export function LandingPageView() {
  const t = useTranslations("LandingPage");

  const steps = ["step1", "step2", "step3", "step4"] as const;
  const stepColors = ["violet", "blue", "emerald", "amber"] as const;
  const features = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
              <span className="text-sm font-bold text-white">S</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              S.A.L.A.
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/terms-of-service"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t("nav.terms")}
            </Link>
            <Link
              href="/privacy-policy"
              className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t("nav.privacy")}
            </Link>
            <AppPreferencesControls variant="marketing" />
            <Link
              href="/auth/login"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/4 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl dark:bg-violet-600/20" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-800 dark:text-violet-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />
            {t("hero.badge")}
          </div>
          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            <span className="text-foreground">{t("hero.titleLine1")}</span>
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-blue-400">
              {t("hero.titleLine2")}
            </span>
            <br />
            <span className="text-foreground">{t("hero.titleLine3")}</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            <strong className="font-semibold text-foreground">
              {t("hero.subtitleBold")}
            </strong>{" "}
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/auth/login"
              className="w-full rounded-xl bg-violet-600 px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:bg-violet-500 sm:w-auto"
            >
              {t("hero.ctaLogin")}
            </Link>
            <a
              href="#features"
              className="w-full rounded-xl border border-border bg-background px-8 py-3.5 text-base font-medium text-foreground transition-all duration-200 hover:bg-muted sm:w-auto"
            >
              {t("hero.ctaFeatures")}
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              {t("features.title")}
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f}
                className={cn(
                  "rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md",
                  featureBorders[i]
                )}
              >
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t(`features.${f}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`features.${f}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/50 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              {t("howItWorks.title")}
            </h2>
            <p className="text-muted-foreground">{t("howItWorks.subtitle")}</p>
          </div>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step} className="flex items-start gap-6">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold",
                    stepBadgeClass[stepColors[i]]
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="pt-1">
                  <h3 className="mb-1 text-lg font-semibold text-foreground">
                    {t(`howItWorks.${step}.title`)}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {t(`howItWorks.${step}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground">
            {t("cta.title")}
          </h2>
          <p className="mb-8 text-muted-foreground">{t("cta.subtitle")}</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-violet-500"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm text-muted-foreground">{t("footer.brand")}</span>
          <div className="flex items-center gap-6">
            <Link
              href="/terms-of-service"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("footer.login")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
