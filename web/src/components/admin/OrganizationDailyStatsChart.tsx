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
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="label" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="reservationsCount"
                name={t("reservations")}
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="activeUsersCount"
                name={t("activeUsers")}
                stroke="#3b82f6"
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
