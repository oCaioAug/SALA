import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

import { defaultLocale, localePrefix, locales } from "./config";

export const routing = defineRouting({
  locales: locales,
  defaultLocale: defaultLocale,
  localePrefix,
});

// Exportar navegação tipada
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
