import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
});

// Exportar navegação tipada
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
