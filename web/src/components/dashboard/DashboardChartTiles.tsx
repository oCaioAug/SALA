"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn, getIntlLocale } from "@/lib/utils";

type RoomLite = { status: string };

const cardEmbed = (embedded: boolean) =>
  cn(
    "flex min-h-0 flex-col overflow-x-hidden overflow-y-auto",
    embedded && "h-full !p-3"
  );

const headerEmbed = (embedded: boolean) =>
  cn(embedded && "space-y-1 !pb-2");

const titleEmbed = (embedded: boolean) =>
  cn(embedded && "!text-base leading-tight");

const descEmbed = (embedded: boolean) =>
  cn(embedded && "!text-xs leading-snug");

const contentEmbed = (embedded: boolean) =>
  cn(
    "flex min-h-0 flex-col overflow-x-hidden overflow-y-auto",
    embedded && "!p-0 pt-0"
  );

const chartBox = (embedded: boolean) =>
  cn(
    "w-full min-w-0 max-w-full",
    embedded
      ? "aspect-auto h-full min-h-[100px] flex-1"
      : "h-[240px] min-h-[200px]"
  );

function ChartTileSkeleton({ embedded }: { embedded?: boolean }) {
  return (
    <Card
      variant="elevated"
      className={cn("animate-pulse", cardEmbed(Boolean(embedded)))}
    >
      <CardHeader className={headerEmbed(Boolean(embedded))}>
        <div className="h-5 w-32 max-w-full rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-44 max-w-full rounded bg-slate-100 dark:bg-slate-800" />
      </CardHeader>
      <CardContent className={cn(contentEmbed(Boolean(embedded)), "flex-1")}>
        <div className="min-h-[120px] flex-1 rounded-lg bg-slate-100 dark:bg-slate-800" />
      </CardContent>
    </Card>
  );
}

type RoomStatusTileProps = {
  rooms: RoomLite[];
  statsLoading: boolean;
  embedded?: boolean;
};

type StatsTileProps = {
  stats: DashboardChartStats | null;
  statsLoading: boolean;
  embedded?: boolean;
};

export function DashboardChartRoomStatusTile({
  rooms,
  statsLoading,
  embedded = false,
}: RoomStatusTileProps) {
  const t = useTranslations("DashboardHome.charts");

  const roomStatusConfig = useMemo(
    () =>
      ({
        livre: {
          label: t("roomStatus.livre"),
          color: "var(--color-chart-1)",
        },
        emUso: {
          label: t("roomStatus.emUso"),
          color: "var(--color-chart-2)",
        },
        reservado: {
          label: t("roomStatus.reservado"),
          color: "var(--color-chart-3)",
        },
      }) satisfies ChartConfig,
    [t]
  );

  const roomStatusData = useMemo(() => {
    const livre = rooms.filter(r => r.status === "LIVRE").length;
    const emUso = rooms.filter(r => r.status === "EM_USO").length;
    const reservado = rooms.filter(r => r.status === "RESERVADO").length;
    return [
      { key: "livre" as const, amount: livre, fill: "var(--color-livre)" },
      { key: "emUso" as const, amount: emUso, fill: "var(--color-emUso)" },
      {
        key: "reservado" as const,
        amount: reservado,
        fill: "var(--color-reservado)",
      },
    ];
  }, [rooms]);

  const hasRoomChart = rooms.length > 0;

  if (statsLoading) {
    return <ChartTileSkeleton embedded={embedded} />;
  }

  if (!hasRoomChart) {
    return (
      <Card variant="elevated" className={cardEmbed(embedded)}>
        <CardHeader className={headerEmbed(embedded)}>
          <CardTitle className={titleEmbed(embedded)}>
            {t("roomStatusTitle")}
          </CardTitle>
          <CardDescription className={descEmbed(embedded)}>
            {t("roomStatusDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            —
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className={cardEmbed(embedded)}>
      <CardHeader className={headerEmbed(embedded)}>
        <CardTitle className={titleEmbed(embedded)}>
          {t("roomStatusTitle")}
        </CardTitle>
        <CardDescription className={descEmbed(embedded)}>
          {t("roomStatusDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className={contentEmbed(embedded)}>
        <ChartContainer
          config={roomStatusConfig}
          className={cn(
            chartBox(embedded),
            embedded ? "max-h-full justify-center" : "mx-auto max-h-[280px]"
          )}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={roomStatusData}
              dataKey="amount"
              nameKey="key"
              innerRadius="42%"
              outerRadius="72%"
              strokeWidth={1}
              isAnimationActive={false}
            >
              {roomStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function DashboardChartWeeklyTile({
  stats,
  statsLoading,
  embedded = false,
}: StatsTileProps) {
  const t = useTranslations("DashboardHome.charts");
  const locale = useLocale();
  const intlLocale = getIntlLocale(locale);

  const weeklyConfig = {
    count: { label: t("weeklySeries"), color: "var(--color-chart-1)" },
  } satisfies ChartConfig;

  const weeklyData = useMemo(() => {
    if (!stats?.weeklyReservations?.length) return [];
    return stats.weeklyReservations.map(row => ({
      ...row,
      labelShort: new Date(row.label + "T12:00:00").toLocaleDateString(
        intlLocale,
        { day: "2-digit", month: "short" }
      ),
    }));
  }, [stats?.weeklyReservations, intlLocale]);

  const hasWeeklyData = Boolean(stats?.weeklyReservations?.length);

  if (statsLoading) {
    return <ChartTileSkeleton embedded={embedded} />;
  }

  return (
    <Card variant="elevated" className={cardEmbed(embedded)}>
      <CardHeader className={headerEmbed(embedded)}>
        <CardTitle className={titleEmbed(embedded)}>
          {t("weeklyTitle")}
        </CardTitle>
        <CardDescription className={descEmbed(embedded)}>
          {t("weeklyDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className={contentEmbed(embedded)}>
        {hasWeeklyData && weeklyData.length > 0 ? (
          <ChartContainer config={weeklyConfig} className={chartBox(embedded)}>
            <BarChart
              accessibilityLayer
              data={weeklyData}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="labelShort"
                tickLine={false}
                tickMargin={6}
                axisLine={false}
                interval="preserveStartEnd"
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("emptyWeekly")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardChartReservationStatusTile({
  stats,
  statsLoading,
  embedded = false,
}: StatsTileProps) {
  const t = useTranslations("DashboardHome.charts");

  const reservationStatusConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    const statuses = stats?.reservationStatus ?? [];
    const palette = [
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
    ];
    statuses.forEach((row, i) => {
      const labelKey =
        `reservationStatus.${row.status}` as Parameters<typeof t>[0];
      cfg[row.status] = {
        label: t(labelKey),
        color: palette[i % palette.length],
      };
    });
    return cfg;
  }, [stats?.reservationStatus, t]);

  const reservationStatusData = useMemo(() => {
    if (!stats?.reservationStatus?.length) return [];
    return stats.reservationStatus.map(row => ({
      status: row.status,
      count: row.count,
      fill: `var(--color-${row.status})`,
    }));
  }, [stats?.reservationStatus]);

  const hasStatus = (stats?.reservationStatus?.length ?? 0) > 0;

  if (statsLoading) {
    return <ChartTileSkeleton embedded={embedded} />;
  }

  return (
    <Card variant="elevated" className={cardEmbed(embedded)}>
      <CardHeader className={headerEmbed(embedded)}>
        <CardTitle className={titleEmbed(embedded)}>
          {t("reservationStatusTitle")}
        </CardTitle>
        <CardDescription className={descEmbed(embedded)}>
          {t("reservationStatusDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className={contentEmbed(embedded)}>
        {hasStatus ? (
          <ChartContainer config={reservationStatusConfig} className={chartBox(embedded)}>
            <BarChart
              accessibilityLayer
              data={reservationStatusData}
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
                width={embedded ? 72 : 96}
                tick={{ fontSize: 11 }}
                tickFormatter={value =>
                  t(`reservationStatus.${value}` as Parameters<typeof t>[0])
                }
              />
              <XAxis type="number" hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={4} isAnimationActive={false}>
                {reservationStatusData.map(entry => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("emptyStatus")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardChartTopRoomsTile({
  stats,
  statsLoading,
  embedded = false,
}: StatsTileProps) {
  const t = useTranslations("DashboardHome.charts");

  const topRoomsConfig = {
    count: { label: t("topRoomsSeries"), color: "var(--color-chart-4)" },
  } satisfies ChartConfig;

  const topRoomsData = useMemo(() => {
    if (!stats?.topRooms?.length) return [];
    return [...stats.topRooms]
      .sort((a, b) => a.count - b.count)
      .map(r => ({
        name:
          r.name.length > 22 ? `${r.name.slice(0, 20).trimEnd()}…` : r.name,
        count: r.count,
      }));
  }, [stats?.topRooms]);

  const hasTopRooms = (stats?.topRooms?.length ?? 0) > 0;

  if (statsLoading) {
    return <ChartTileSkeleton embedded={embedded} />;
  }

  return (
    <Card variant="elevated" className={cardEmbed(embedded)}>
      <CardHeader className={headerEmbed(embedded)}>
        <CardTitle className={titleEmbed(embedded)}>
          {stats && stats.scope === "all"
            ? t("topRoomsTitleAdmin")
            : t("topRoomsTitleUser")}
        </CardTitle>
        <CardDescription className={descEmbed(embedded)}>
          {stats && stats.scope === "all"
            ? t("topRoomsDescAdmin")
            : t("topRoomsDescUser")}
        </CardDescription>
      </CardHeader>
      <CardContent className={contentEmbed(embedded)}>
        {hasTopRooms ? (
          <ChartContainer config={topRoomsConfig} className={chartBox(embedded)}>
            <BarChart
              accessibilityLayer
              data={topRoomsData}
              layout="vertical"
              margin={{ left: 0, right: 4, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={4}
                axisLine={false}
                width={embedded ? 88 : 112}
                tick={{ fontSize: 11 }}
              />
              <XAxis type="number" hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={4}
                isAnimationActive={false}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("emptyTopRooms")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
