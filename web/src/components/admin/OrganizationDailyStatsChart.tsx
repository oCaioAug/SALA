"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { getIntlLocale } from "@/lib/utils";

interface DailyStatPoint {
  date: string;
  reservationsCount: number;
  activeUsersCount: number;
  openIncidentsCount: number;
  roomsCount: number;
  membersCount: number;
}

interface OrganizationDailyStatsChartProps {
  organizationId: string;
}

export function OrganizationDailyStatsChart({
  organizationId,
}: OrganizationDailyStatsChartProps) {
  const t = useTranslations("Admin.charts");
  const locale = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartGrid = isDark ? "#374151" : "#e2e8f0";
  const chartTick = isDark ? "#9ca3af" : "#64748b";
  const chartTooltipStyle = isDark
    ? { background: "#111827", border: "1px solid #374151", color: "#f3f4f6" }
    : { background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" };
  const [data, setData] = useState<(DailyStatPoint & { label: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          `/api/admin/organizations/${organizationId}/daily-stats`
        );
        if (res.ok) {
          const raw = await res.json();
          setData(
            raw.map((row: DailyStatPoint) => ({
              ...row,
              label: new Date(row.date).toLocaleDateString(
                getIntlLocale(locale),
                {
                  day: "2-digit",
                  month: "2-digit",
                }
              ),
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [organizationId, locale]);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">{t("usageTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noHistory")}</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
              <XAxis
                dataKey="label"
                tick={{ fill: chartTick, fontSize: 11 }}
              />
              <YAxis tick={{ fill: chartTick, fontSize: 11 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="reservationsCount"
                name={t("reservations")}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="activeUsersCount"
                name={t("activeUsers")}
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="openIncidentsCount"
                name={t("openIncidents")}
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
