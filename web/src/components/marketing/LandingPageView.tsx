"use client";

import { useTranslations } from "next-intl";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { LandingFeatureStack } from "@/components/marketing/LandingFeatureStack";
import { LandingHeroDashboard } from "@/components/marketing/LandingHeroDashboard";
import { LandingHowTimeline } from "@/components/marketing/LandingHowTimeline";
import { LandingProductShowcase } from "@/components/marketing/LandingProductShowcase";
import { LandingScrollPaintText } from "@/components/marketing/LandingScrollPaintText";
import { ThemeToggle } from "@/components/preferences/ThemeToggle";
import { Link } from "@/navigation";

export function LandingPageView() {
  const t = useTranslations("LandingPage");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">S</span>
            </div>
            <span className="text-base font-semibold tracking-tight">
              S.A.L.A.
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <a
              href="#produto"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("nav.product")}
            </a>
            <a
              href="#recursos"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("nav.features")}
            </a>
            <a
              href="#como-funciona"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("nav.howItWorks")}
            </a>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher variant="marketing" />
            <ThemeToggle variant="marketing" />
            <Link
              href="/auth/login"
              className="ml-1 hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/auth/register"
              className="rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("nav.start")}
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative isolate">
        <div
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          aria-hidden="true"
        >
          <video
            className="h-full w-full object-cover motion-reduce:hidden"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/videos/hero-office.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background/92 via-background/80 to-background" />
        </div>

        <div className="px-5 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-36">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="landing-fade-up mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              style={{ animationDelay: "0.05s" }}
            >
              {t("hero.badge")}
            </p>
            <p
              className="landing-fade-up mb-4 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
              style={{ animationDelay: "0.12s" }}
            >
              S.A.L.A.
            </p>
            <h1
              className="landing-fade-up mb-5 text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl lg:text-4xl"
              style={{ animationDelay: "0.2s" }}
            >
              {t("hero.titleLine1")}{" "}
              <span className="text-primary">{t("hero.titleLine2")}</span>
            </h1>
            <p
              className="landing-fade-up mx-auto mb-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: "0.3s" }}
            >
              {t("hero.subtitle")}
            </p>
            <div
              className="landing-fade-up flex flex-col items-center justify-center gap-3 sm:flex-row"
              style={{ animationDelay: "0.4s" }}
            >
              <Link
                href="/auth/register"
                className="inline-flex w-full items-center justify-center rounded-md bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
              >
                {t("hero.ctaStart")}
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex w-full items-center justify-center rounded-md border border-border bg-card/90 px-7 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-muted sm:w-auto"
              >
                {t("hero.ctaLogin")}
              </Link>
            </div>
          </div>

          <div
            className="landing-fade-up relative z-10 mx-auto mt-10 max-w-5xl sm:mt-14"
            style={{ animationDelay: "0.5s" }}
          >
            <LandingHeroDashboard />
          </div>
        </div>
      </section>

      <section
        id="produto"
        className="scroll-mt-24 px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t("product.title")}
            </h2>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
              {t("product.subtitle")}
            </p>
          </div>

          <LandingProductShowcase />
        </div>
      </section>

      <section
        id="recursos"
        className="scroll-mt-24 border-t border-border bg-muted/40 px-5 py-20 sm:px-6 sm:py-24"
      >
        <div className="mx-auto mb-10 max-w-5xl text-center sm:mb-12">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("features.title")}
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("features.subtitle")}
          </p>
        </div>
        <LandingFeatureStack />
      </section>

      <LandingScrollPaintText />

      <section
        id="como-funciona"
        className="scroll-mt-24 px-5 py-20 sm:px-6 sm:py-24"
      >
        <div className="mx-auto mb-12 max-w-5xl text-center">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("howItWorks.title")}
          </h2>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            {t("howItWorks.subtitle")}
          </p>
        </div>
        <LandingHowTimeline />
      </section>

      <section className="border-t border-border bg-muted/40 px-5 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("cta.title")}
          </h2>
          <p className="mb-8 text-sm text-muted-foreground sm:text-base">
            {t("cta.subtitle")}
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-md bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("cta.button")}
          </Link>
          <p className="mt-4">
            <Link
              href="/auth/login"
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {t("cta.login")}
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-center text-sm text-muted-foreground sm:text-left">
            {t("footer.brand")}
          </span>
          <div className="flex items-center gap-5">
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
