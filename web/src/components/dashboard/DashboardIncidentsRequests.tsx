"use client";

import { useTranslations } from "next-intl";

import type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";
import {
  DashboardIncidentTile,
  DashboardSolicitationsTile,
} from "@/components/dashboard/DashboardIncidentTiles";
import { cn } from "@/lib/utils";

type Props = {
  stats: DashboardChartStats | null;
  statsLoading: boolean;
  embedded?: boolean;
};

/** Visão agrupada de incidentes + solicitações (fora do grid por tile). */
export function DashboardIncidentsRequests({
  stats,
  statsLoading,
  embedded = false,
}: Props) {
  const t = useTranslations("DashboardHome.incidentsAndRequests");

  return (
    <div className={cn("space-y-6", embedded ? "mb-0" : "mb-10")}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("sectionTitle")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {stats?.scope === "all"
            ? t("sectionDescAdmin")
            : t("sectionDescUser")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardIncidentTile
          stats={stats}
          statsLoading={statsLoading}
        />
        <DashboardSolicitationsTile
          stats={stats}
          statsLoading={statsLoading}
        />
      </div>
    </div>
  );
}
