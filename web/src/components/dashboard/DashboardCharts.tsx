"use client";

import { useTranslations } from "next-intl";

import type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";
import {
  DashboardChartReservationStatusTile,
  DashboardChartRoomStatusTile,
  DashboardChartTopRoomsTile,
  DashboardChartWeeklyTile,
} from "@/components/dashboard/DashboardChartTiles";
import { cn } from "@/lib/utils";

export type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";

type RoomLite = { status: string };

type Props = {
  rooms: RoomLite[];
  stats: DashboardChartStats | null;
  statsLoading: boolean;
  embedded?: boolean;
};

/** Visão agrupada dos gráficos (ex.: telas que não usam o grid por tile). */
export function DashboardCharts({
  rooms,
  stats,
  statsLoading,
  embedded = false,
}: Props) {
  const t = useTranslations("DashboardHome.charts");

  return (
    <div className={cn("space-y-6", embedded ? "mb-0" : "mb-10")}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t("sectionTitle")}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {stats && stats.scope === "all"
            ? t("sectionDescAdmin")
            : t("sectionDescUser")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <DashboardChartRoomStatusTile
            rooms={rooms}
            statsLoading={statsLoading}
          />
        </div>
        <div className="lg:col-span-8">
          <DashboardChartWeeklyTile
            stats={stats}
            statsLoading={statsLoading}
          />
        </div>
        <div className="lg:col-span-6">
          <DashboardChartReservationStatusTile
            stats={stats}
            statsLoading={statsLoading}
          />
        </div>
        <div className="lg:col-span-6">
          <DashboardChartTopRoomsTile
            stats={stats}
            statsLoading={statsLoading}
          />
        </div>
      </div>
    </div>
  );
}
