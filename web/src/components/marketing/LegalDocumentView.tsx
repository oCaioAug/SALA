"use client";

import { useTranslations } from "next-intl";

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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link
            href="/"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors mb-6 inline-block"
          >
            {t("backLink")}
          </Link>
          <h1 className="text-3xl font-bold text-white mt-2">{t("title")}</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {t("lastUpdatedLabel")}: {t("lastUpdated")}
          </p>
        </div>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          {sectionKeys.map(key => (
            <section key={key}>
              <h2 className="text-xl font-semibold text-white mb-3">
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
