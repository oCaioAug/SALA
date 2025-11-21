export const i18nConfig = {
  locales: ["pt", "en"],
  defaultLocale: "pt",
  localeLabels: {
    pt: "Português",
    en: "English",
  },
  localeCurrencies: {
    pt: "BRL",
    en: "USD",
  },
} as const;

export type Locale = (typeof i18nConfig.locales)[number];
