"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function LandingHeroDashboard() {
  const t = useTranslations("LandingPage.hero");
  const alt = t("dashboardAlt");

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-2xl sm:-inset-10 sm:blur-3xl"
        aria-hidden
      />
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-[0_24px_80px_-12px_rgba(15,23,42,0.35)] ring-1 ring-black/5 backdrop-blur-sm dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.55)] dark:ring-white/10">
        <Image
          src="/images/landing/dashboard-light.png"
          alt={alt}
          width={1837}
          height={935}
          priority
          quality={95}
          sizes="(max-width: 1280px) 100vw, 1024px"
          className="h-auto w-full dark:hidden"
        />
        <Image
          src="/images/landing/dashboard-dark.png"
          alt={alt}
          width={1837}
          height={935}
          priority
          quality={95}
          sizes="(max-width: 1280px) 100vw, 1024px"
          className="hidden h-auto w-full dark:block"
        />
      </div>
    </div>
  );
}
