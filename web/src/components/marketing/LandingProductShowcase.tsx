"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { LandingCalendarioDemo } from "@/components/marketing/LandingCalendarioDemo";
import { LandingDashboardPlayground } from "@/components/marketing/LandingDashboardPlayground";
import { LandingIncidentesDemo } from "@/components/marketing/LandingIncidentesDemo";
import { LandingReservasDemo } from "@/components/marketing/LandingReservasDemo";
import { cn } from "@/lib/utils";

type ProductTab = "dashboard" | "reservations" | "incidents" | "calendar";

const TABS: ProductTab[] = [
  "dashboard",
  "reservations",
  "incidents",
  "calendar",
];

export function LandingProductShowcase() {
  const t = useTranslations("LandingPage.product");
  const [activeTab, setActiveTab] = useState<ProductTab>("dashboard");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label={t("title")}
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
      >
        {TABS.map(tab => {
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
                selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`tabs.${tab}`)}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {activeTab === "dashboard" ? (
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-foreground sm:text-base">
              {t("dashboardCta")}
            </p>
            <LandingDashboardPlayground />
          </div>
        ) : null}
        {activeTab === "reservations" ? <LandingReservasDemo /> : null}
        {activeTab === "incidents" ? <LandingIncidentesDemo /> : null}
        {activeTab === "calendar" ? <LandingCalendarioDemo /> : null}
      </div>
    </div>
  );
}
