"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/navigation";

export function LandingPageView() {
  const t = useTranslations("LandingPage");

  const steps = ["step1", "step2", "step3", "step4"] as const;
  const stepColors = ["violet", "blue", "emerald", "amber"] as const;
  const features = ["f1", "f2", "f3", "f4", "f5", "f6"] as const;
  const featureBorders = [
    "hover:border-violet-500/30",
    "hover:border-blue-500/30",
    "hover:border-emerald-500/30",
    "hover:border-amber-500/30",
    "hover:border-pink-500/30",
    "hover:border-cyan-500/30",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              S.A.L.A.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/terms-of-service"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block"
            >
              {t("nav.terms")}
            </Link>
            <Link
              href="/privacy-policy"
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors hidden sm:block"
            >
              {t("nav.privacy")}
            </Link>
            <Link
              href="/auth/login"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {t("nav.login")}
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            {t("hero.badge")}
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            <span className="text-white">{t("hero.titleLine1")}</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              {t("hero.titleLine2")}
            </span>
            <br />
            <span className="text-white">{t("hero.titleLine3")}</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            <strong className="text-gray-200">{t("hero.subtitleBold")}</strong>{" "}
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 text-base"
            >
              {t("hero.ctaLogin")}
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 font-medium px-8 py-3.5 rounded-xl transition-all duration-200 text-base"
            >
              {t("hero.ctaFeatures")}
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t("features.title")}
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f}
                className={`bg-gray-900/60 border border-white/5 rounded-2xl p-6 transition-all duration-300 ${featureBorders[i]}`}
              >
                <h3 className="text-white font-semibold text-lg mb-2">
                  {t(`features.${f}.title`)}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t(`features.${f}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-gray-400">{t("howItWorks.subtitle")}</p>
          </div>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <div key={step} className="flex gap-6 items-start">
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg bg-${stepColors[i]}-500/15 text-${stepColors[i]}-400`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="pt-1">
                  <h3 className="text-white font-semibold text-lg mb-1">
                    {t(`howItWorks.${step}.title`)}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {t(`howItWorks.${step}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-gray-400 mb-8">{t("cta.subtitle")}</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200"
          >
            {t("cta.button")}
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-gray-400 text-sm">{t("footer.brand")}</span>
          <div className="flex items-center gap-6">
            <Link
              href="/terms-of-service"
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              {t("footer.terms")}
            </Link>
            <Link
              href="/privacy-policy"
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/auth/login"
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              {t("footer.login")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
