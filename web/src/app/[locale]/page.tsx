import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LandingPageView } from "@/components/marketing/LandingPageView";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    title: t("landingTitle"),
    description: t("landingDescription"),
  };
}

export default function HomePage() {
  return <LandingPageView />;
}
