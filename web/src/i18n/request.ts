import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

import { defaultLocale, type Locale, locales } from "../config";

// Re-exportar para compatibilidade
export { defaultLocale, locales };
export type { Locale };

export default getRequestConfig(async ({ requestLocale }) => {
  // O requestLocale pode vir do middleware ou do parâmetro explícito
  // Se não vier, usar o defaultLocale
  const resolvedLocale = await requestLocale;
  let locale = resolvedLocale || defaultLocale;

  // Validar se o locale é suportado
  if (!locale || !locales.includes(locale as any)) {
    console.error(
      `Locale não suportado: ${locale}. Locales disponíveis:`,
      locales
    );
    // Se o locale não for válido, usar o defaultLocale
    locale = defaultLocale;
  }

  try {
    const messages = (await import(`./dictionaries/${locale}.json`)).default;
    return {
      messages,
      locale: locale as Locale,
    };
  } catch (error) {
    console.error(`Erro ao carregar mensagens para locale ${locale}:`, error);
    notFound();
  }
});
