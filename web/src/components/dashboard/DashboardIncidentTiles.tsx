"use client";

import { AlertTriangle, ArrowRight, ClipboardList } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

type Props = {
  stats: DashboardChartStats | null;
  statsLoading: boolean;
  embedded?: boolean;
};

const cardEmbed = (embedded: boolean) =>
  cn(
    "flex min-h-0 flex-col overflow-hidden",
    embedded && "h-full min-h-0 flex-1 !p-3"
  );

const headerEmbed = (embedded: boolean) =>
  cn("shrink-0", embedded && "!pb-2 [&_.space-y-2]:space-y-1");

const titleEmbed = (embedded: boolean) =>
  cn(embedded && "!text-base leading-tight");

const descEmbed = (embedded: boolean) =>
  cn(embedded && "!text-xs leading-snug");

const chartBox = (embedded: boolean) =>
  cn(
    "w-full min-w-0 max-w-full [&_.recharts-responsive-container]:!size-full",
    embedded
      ? "!aspect-auto h-full min-h-0 flex-1"
      : "aspect-video h-[200px] min-h-[180px]"
  );

function TileSkeleton({ embedded }: { embedded?: boolean }) {
  return (
    <Card
      variant="elevated"
      className={cn("animate-pulse", cardEmbed(Boolean(embedded)))}
    >
      <CardHeader className={headerEmbed(Boolean(embedded))}>
        <div className="h-5 w-40 max-w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-52 max-w-full rounded bg-slate-100 dark:bg-slate-800" />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        <div className="h-full min-h-0 w-full rounded-lg bg-slate-100 dark:bg-slate-800" />
      </CardContent>
    </Card>
  );
}

export function DashboardIncidentTile({
  stats,
  statsLoading,
  embedded = false,
}: Props) {
  const t = useTranslations("DashboardHome.incidentsAndRequests");

  const statusLabel = (status: string) => {
    const key = `incidentStatus.${status}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : status;
  };

  const incidentStatusConfig = useMemo(() => {
    const rows = stats?.incidents?.byStatus ?? [];
    const cfg: ChartConfig = {};
    const palette = [
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
    ];
    rows.forEach((row, i) => {
      cfg[row.status] = {
        label: statusLabel(row.status),
        color: palette[i % palette.length],
      };
    });
    return cfg;
  }, [stats?.incidents?.byStatus, t]);

  const incidentChartData = useMemo(() => {
    if (!stats?.incidents?.byStatus?.length) return [];
    return stats.incidents.byStatus.map(row => ({
      status: row.status,
      count: row.count,
      fill: `var(--color-${row.status})`,
    }));
  }, [stats?.incidents?.byStatus]);

  const hasIncidents = (stats?.incidents?.total ?? 0) > 0;

  if (statsLoading) {
    return <TileSkeleton embedded={embedded} />;
  }

  return (
    <Card
      variant="elevated"
      className={cn("flex flex-col", cardEmbed(embedded))}
    >
      <CardHeader className={headerEmbed(embedded)}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="shrink-0 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className={titleEmbed(embedded)}>
              {t("incidentsTitle")}
            </CardTitle>
            <CardDescription className={descEmbed(embedded)}>
              {t("incidentsDesc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pt-0",
          embedded && "!px-0"
        )}
      >
        {hasIncidents ? (
          <>
            <div className="flex shrink-0 flex-wrap gap-3 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-400">
                  {t("openCountLabel")}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  {stats?.incidents?.open ?? 0}
                </p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400">
                  {t("totalLabel")}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  {stats?.incidents?.total ?? 0}
                </p>
              </div>
            </div>
            {incidentChartData.length > 0 ? (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <ChartContainer
                  config={incidentStatusConfig}
                  className={chartBox(embedded)}
                >
                  <BarChart
                    accessibilityLayer
                    data={incidentChartData}
                    layout="vertical"
                    margin={{ left: 0, right: 4, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                      dataKey="status"
                      type="category"
                      tickLine={false}
                      tickMargin={4}
                      axisLine={false}
                      width={embedded ? 76 : 104}
                      tick={{ fontSize: 11 }}
                      tickFormatter={value => statusLabel(String(value))}
                    />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={4}>
                      {incidentChartData.map(entry => (
                        <Cell key={entry.status} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            ) : null}
            {!embedded ? (
              <Link
                href="/incidentes"
                className="mt-auto inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary"
              >
                {t("openIncidentes")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </>
        ) : (
          <div className="flex flex-1 flex-col justify-between gap-4">
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("emptyIncidents")}
            </p>
            {!embedded ? (
              <Link
                href="/incidentes"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary"
              >
                {t("openIncidentes")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardSolicitationsTile({
  stats,
  statsLoading,
  embedded = false,
}: Props) {
  const t = useTranslations("DashboardHome.incidentsAndRequests");
  const pending = stats?.solicitations?.pending ?? 0;

  if (statsLoading) {
    return <TileSkeleton embedded={embedded} />;
  }

  return (
    <Card
      variant="elevated"
      className={cn("flex flex-col", cardEmbed(embedded))}
    >
      <CardHeader className={headerEmbed(embedded)}>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="shrink-0 text-muted-foreground">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className={titleEmbed(embedded)}>
              {t("solicitationsTitle")}
            </CardTitle>
            <CardDescription className={descEmbed(embedded)}>
              {t("solicitationsDesc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-x-hidden overflow-y-auto pt-0",
          embedded && "!px-0"
        )}
      >
        <div className="min-w-0">
          <p className="mb-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {t("pendingLabel")}
          </p>
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {pending}
          </p>
          {pending === 0 ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              {t("pendingZero")}
            </p>
          ) : null}
        </div>
        {!embedded ? (
          <Link
            href="/solicitacoes"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary"
          >
            {t("openSolicitacoes")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
