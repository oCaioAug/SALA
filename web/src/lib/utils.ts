import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte o locale do next-intl para o formato do Intl API
 * @param locale - Locale do next-intl (ex: "pt", "en", "es", "fr", "ja")
 * @returns Locale formatado para Intl (ex: "pt-BR", "en-US", "es", "fr", "ja")
 */
export function getIntlLocale(locale: string): string {
  if (locale === "pt") return "pt-BR";
  if (locale === "en") return "en-US";
  if (locale === "es") return "es-ES";
  if (locale === "fr") return "fr-FR";
  if (locale === "ja") return "ja-JP";
  return locale;
}
