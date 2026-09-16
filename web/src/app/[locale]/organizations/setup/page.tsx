"use client";

import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OrganizationSetupWizard } from "@/components/organization/OrganizationSetupWizard";
import { OrganizationsShell } from "@/components/organization/OrganizationsShell";
import { Link } from "@/navigation";

export default function OrganizationSetupPage() {
  const t = useTranslations("OrganizationSetup");

  return (
    <ProtectedRoute>
      <OrganizationsShell>
        <header className="mb-6 space-y-2">
          <Link
            href="/organizations"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("backToHub")}
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="rounded-lg border border-border bg-card/50 p-6 shadow-sm shadow-black/10 backdrop-blur-xl sm:p-8">
          <OrganizationSetupWizard cancelHref="/organizations" />
        </div>
      </OrganizationsShell>
    </ProtectedRoute>
  );
}
