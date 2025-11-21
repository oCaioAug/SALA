"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { useTransition, useState } from "react";
import { locales } from "@/config";

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const localeActive = useLocale();

  const t = useTranslations("LanguageSwitcher");

  const localeLabels: Record<string, string> = {
    pt: t("portuguese"),
    en: t("english"),
    es: t("spanish"),
    fr: t("french"),
    ja: t("japanese"),
  };

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === localeActive) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
      setIsOpen(false);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-300"
        aria-label={t("changeLanguage")}
        disabled={isPending}
      >
        <Languages className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:inline">
          {localeLabels[localeActive] || localeActive}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600/50 rounded-xl shadow-2xl z-50 overflow-hidden transition-colors duration-300">
            <div className="py-2">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => handleLocaleChange(locale)}
                  disabled={isPending}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 ${
                    locale === localeActive
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                      : ""
                  }`}
                >
                  <span className="text-sm">{localeLabels[locale]}</span>
                  {locale === localeActive && (
                    <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
