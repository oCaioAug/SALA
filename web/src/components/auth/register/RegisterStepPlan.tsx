"use client";

import { Building2, Check, Crown, Rocket } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { PublicPlan } from "./types";

type RegisterStepPlanProps = {
  plans: PublicPlan[];
  selectedPlanId: string;
  loading: boolean;
  error: string | null;
  onSelect: (plan: PublicPlan) => void;
};

function getPlanIcon(slug: string) {
  if (slug.includes("enterprise")) return Crown;
  if (slug.includes("business")) return Building2;
  if (slug.includes("starter")) return Rocket;
  return Building2;
}

export function RegisterStepPlan({
  plans,
  selectedPlanId,
  loading,
  error,
  onSelect,
}: RegisterStepPlanProps) {
  const t = useTranslations("Auth.register.step2");

  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">{t("loading")}</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">{t("empty")}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center lg:text-left">
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map(plan => {
          const Icon = getPlanIcon(plan.slug);
          const isSelected = selectedPlanId === plan.id;

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelect(plan)}
              className={cn(
                "group relative flex flex-col rounded-2xl border p-5 text-left transition-all",
                "focus:outline-none focus:ring-2 focus:ring-violet-500/30",
                isSelected
                  ? "border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                  : "border-border bg-card hover:border-violet-500/30 hover:bg-muted/40"
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    isSelected
                      ? "bg-violet-500/20 text-violet-600 dark:text-violet-300"
                      : "bg-muted text-muted-foreground group-hover:text-violet-600 dark:group-hover:text-violet-300"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {isSelected && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <h3 className="text-base font-semibold text-foreground">{plan.name}</h3>

              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <li>{t("rooms", { count: plan.maxRooms })}</li>
                <li>{t("users", { count: plan.maxUsers })}</li>
                <li>
                  {plan.maxReservationsPerMonth
                    ? t("reservations", { count: plan.maxReservationsPerMonth })
                    : t("unlimitedReservations")}
                </li>
              </ul>

              <p className="mt-4 text-xs text-emerald-600 dark:text-emerald-400">{t("trialDays")}</p>

              <span
                className={cn(
                  "mt-4 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold",
                  isSelected
                    ? "bg-violet-600 text-white"
                    : "bg-muted text-foreground group-hover:bg-muted/80"
                )}
              >
                {isSelected ? t("selected") : t("select")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
