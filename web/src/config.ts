// src/config.ts
export const locales = ["pt", "en", "es", "fr", "ja"] as const;
export const localePrefix = "always"; // Ou 'as-needed'
export const defaultLocale = "pt";
export type Locale = (typeof locales)[number];
