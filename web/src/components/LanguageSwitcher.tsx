"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { ChangeEvent, useTransition } from "react";

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const localActive = useLocale();

  const onSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = e.target.value;

    startTransition(() => {
      // Substitui o locale na URL atual (ex: /pt/about -> /en/about)
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const t = useTranslations("LanguageSwitcher");

  return (
    <label className="border-2 rounded">
      <p className="sr-only">{t("changeLanguage")}</p>
      <select
        defaultValue={localActive}
        className="bg-transparent py-2"
        onChange={onSelectChange}
        disabled={isPending}
      >
        <option value="pt">{t("portuguese")}</option>
        <option value="en">{t("english")}</option>
      </select>
    </label>
  );
}
