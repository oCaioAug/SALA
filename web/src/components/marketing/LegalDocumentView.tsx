"use client";

import { useTranslations } from "next-intl";

import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Link } from "@/navigation";

type LegalDocType = "terms" | "privacy";

interface LegalDocumentViewProps {
  type: LegalDocType;
}

export function LegalDocumentView({ type }: LegalDocumentViewProps) {
  const t = useTranslations(`Legal.${type}`);

  const sectionKeys = [
    "s1",
    "s2",
    "s3",
    "s4",
    "s5",
    "s6",
    "s7",
    "s8",
    "s9",
    "s10",
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("backLink")}
          </Link>
          <AppPreferencesControls variant="marketing" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <h1 className="mt-2 text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("lastUpdatedLabel")}: {t("lastUpdated")}
          </p>
        </div>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          {sectionKeys.map(key => (
            <section key={key}>
              <h2 className="mb-3 text-xl font-semibold text-foreground">
                {t(`sections.${key}.title`)}
              </h2>
              <p>{t(`sections.${key}.body`)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
