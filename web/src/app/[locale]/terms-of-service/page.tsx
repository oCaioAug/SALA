import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalDocumentView } from "@/components/marketing/LegalDocumentView";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("termsTitle"),
    description: t("termsDescription"),
  };
}

export default function TermsOfServicePage() {
  return <LegalDocumentView type="terms" />;
}
