import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PrivacyPolicyView } from "@/components/marketing/PrivacyPolicyView";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
  };
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyView />;
}
