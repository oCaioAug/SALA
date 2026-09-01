"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState, useTransition } from "react";
import { FaCheck } from "react-icons/fa";

import {
  type DropdownPlacement,
  preferencesDropdownClass,
  preferencesMenuItemClass,
  preferencesTriggerClass,
  type PreferencesVariant,
} from "@/components/preferences/preference-styles";
import { locales } from "@/config";
import { usePathname, useRouter } from "@/navigation";

type LanguageSwitcherProps = {
  variant?: PreferencesVariant;
  showLabel?: boolean;
  dropdownPlacement?: DropdownPlacement;
};

const MENU_ITEM_HEIGHT = 44;
const MENU_VERTICAL_PADDING = 16;

export default function LanguageSwitcher({
  variant = "tenant",
  showLabel = true,
  dropdownPlacement = "auto",
}: LanguageSwitcherProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"top" | "bottom">(
    "bottom"
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    if (dropdownPlacement === "top") {
      setMenuPlacement("top");
      return;
    }

    if (dropdownPlacement === "bottom") {
      setMenuPlacement("bottom");
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight =
      locales.length * MENU_ITEM_HEIGHT + MENU_VERTICAL_PADDING;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;

    if (spaceBelow >= menuHeight) {
      setMenuPlacement("bottom");
    } else if (spaceAbove >= menuHeight) {
      setMenuPlacement("top");
    } else {
      setMenuPlacement(spaceAbove > spaceBelow ? "top" : "bottom");
    }
  }, [isOpen, dropdownPlacement]);

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
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={preferencesTriggerClass(variant)}
        aria-label={t("changeLanguage")}
        aria-expanded={isOpen}
        disabled={isPending}
      >
        <Languages className="h-5 w-5" />
        {showLabel && (
          <span className="hidden text-sm font-medium sm:inline">
            {localeLabels[localeActive] || localeActive}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div className={preferencesDropdownClass(variant, menuPlacement)}>
            <div className="py-2">
              {locales.map(locale => (
                <button
                  key={locale}
                  type="button"
                  onClick={() => handleLocaleChange(locale)}
                  disabled={isPending}
                  className={preferencesMenuItemClass(
                    variant,
                    locale === localeActive
                  )}
                >
                  <span>{localeLabels[locale]}</span>
                  {locale === localeActive && (
                    <FaCheck className="ml-auto h-4 w-4 shrink-0" aria-hidden />
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
