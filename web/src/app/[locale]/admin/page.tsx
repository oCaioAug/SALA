"use client";

import {
  AlertTriangle,
  Building2,
  Calendar,
  DoorOpen,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  AdminPageContent,
  AdminPageHeader,
} from "@/components/admin/AdminLayout";
import { Link } from "@/navigation";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { useTheme } from "@/lib/providers/ThemeProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface AdminStats {
  organizations: {
    active: number;
    suspended: number;
    trial: number;
    total: number;
  };
  totalUsers: number;
  totalRooms: number;
  reservationsLast30Days: number;
  openIncidents: number;
  weeklyNewOrganizations: { label: string; count: number }[];
  weeklyNewUsers: { label: string; count: number }[];
  topOrganizationsByReservations: { id: string; name: string; count: number }[];
  organizationsByPlan: {
    planId: string | null;
    planName: string;
    count: number;
  }[];
  expiringTrials: {
    organizationId: string;
    organizationName: string;
    planName: string;
    currentPeriodEnd: string;
  }[];
  inactiveOrganizations: { id: string; name: string; createdAt: string }[];
  activeOrganizationsLast30Days: number;
  retentionRate: number;
}

export default function AdminDashboardPage() {
  const t = useTranslations("Admin.dashboard");
  const { fromResponse } = useApiErrorMessage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartGrid = isDark ? "#374151" : "#e2e8f0";
  const chartTick = isDark ? "#9ca3af" : "#64748b";
  const chartTooltipStyle = isDark
    ? { background: "#111827", border: "1px solid #374151", color: "#f3f4f6" }
    : { background: "#ffffff", border: "1px solid #e2e8f0", color: "#0f172a" };
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        setError(await fromResponse(res));
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  };

  const refreshDailyStats = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/stats/refresh", { method: "POST" });
      if (!res.ok) {
        setError(await fromResponse(res));
        return;
      }
      await fetchStats();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <>
        <AdminPageHeader title={t("title")} description={t("description")} />
        <AdminPageContent>
          <MotionlessLoading />
        </AdminPageContent>
      </>
    );
  }

  if (error || !stats) {
    return (
      <>
        <AdminPageHeader title={t("title")} />
        <AdminPageContent>
          <p className="text-red-400">{error ?? t("loadDataError")}</p>
        </AdminPageContent>
      </>
    );
  }

  const statCards = [
    {
      label: t("organizationsTotal"),
      value: stats.organizations.total,
      sub: t("organizationsActiveSub", {
        count: stats.organizations.active,
      }),
      icon: Building2,
      color: "text-primary dark:text-primary",
    },
    {
      label: t("totalUsers"),
      value: stats.totalUsers,
      sub: t("totalUsersSub"),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: t("totalRooms"),
      value: stats.totalRooms,
      sub: t("totalRoomsSub"),
      icon: DoorOpen,
      color: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("reservations30d"),
      value: stats.reservationsLast30Days,
      sub: t("reservations30dSub"),
      icon: Calendar,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      label: t("openIncidents"),
      value: stats.openIncidents,
      sub: t("openIncidentsSub"),
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        description={t("analyticsDescription")}
        actions={
          <Button
            type="button"
            onClick={refreshDailyStats}
            disabled={refreshing}
          >
            {refreshing ? "Atualizando..." : "Atualizar métricas diárias"}
          </Button>
        }
      />
      <AdminPageContent>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Retenção (30d): {stats.retentionRate}% · Orgs ativas:{" "}
            {stats.activeOrganizationsLast30Days}/{stats.organizations.total}
          </p>
        </div>
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {statCards.map(card => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.label}
                  className="border-border bg-card backdrop-blur"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {card.label}
                        </p>
                        <p className="mt-1 text-3xl font-bold text-foreground">
                          {card.value}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {card.sub}
                        </p>
                      </div>
                      <Icon className={`h-8 w-8 ${card.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <MotionlessChartsGrid>
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Novas organizações por semana
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyNewOrganizations}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: chartTick, fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: chartTick, fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Users className="h-5 w-5 text-blue-400" />
                  Novos usuários por semana
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyNewUsers}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: chartTick, fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: chartTick, fontSize: 11 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </MotionlessChartsGrid>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Distribuição por plano
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.organizationsByPlan.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                ) : (
                  stats.organizationsByPlan.map(row => (
                    <div
                      key={row.planId ?? "none"}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span className="text-foreground">{row.planName}</span>
                      <span className="text-muted-foreground">
                        {row.count} orgs
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Trials expirando (7d)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.expiringTrials.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum trial expirando
                  </p>
                ) : (
                  stats.expiringTrials.map(trial => (
                    <div
                      key={trial.organizationId}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                    >
                      <Link
                        href={`/admin/organizations/${trial.organizationId}`}
                        className="text-foreground hover:text-foreground"
                      >
                        {trial.organizationName}
                      </Link>
                      <span className="text-muted-foreground">
                        {new Date(trial.currentPeriodEnd).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {stats.inactiveOrganizations.length > 0 && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="text-amber-900 dark:text-amber-200">
                  Organizações sem atividade (30d)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats.inactiveOrganizations.map(org => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="text-foreground hover:text-foreground"
                    >
                      {org.name}
                    </Link>
                    <span className="text-muted-foreground">
                      criada em{" "}
                      {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground">
                Top organizações por reservas (30d)
              </CardTitle>
              <Link
                href="/admin/organizations"
                className="text-sm text-primary hover:text-primary dark:text-primary dark:hover:text-primary dark:text-primary"
              >
                Ver todas
              </Link>
            </CardHeader>
            <CardContent>
              {stats.topOrganizationsByReservations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma reserva recente
                </p>
              ) : (
                <MotionlessTopOrgsList
                  orgs={stats.topOrganizationsByReservations}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </AdminPageContent>
    </>
  );
}

function MotionlessLoading() {
  return (
    <div className="flex justify-center py-20">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function MotionlessChartsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 lg:grid-cols-2">{children}</div>;
}

function MotionlessTopOrgsList({
  orgs,
}: {
  orgs: { id: string; name: string; count: number }[];
}) {
  return (
    <div className="space-y-3">
      {orgs.map((org, i) => (
        <div
          key={org.id}
          className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary dark:text-primary">
              {i + 1}
            </span>
            <Link
              href={`/admin/organizations/${org.id}`}
              className="font-medium text-foreground hover:text-foreground"
            >
              {org.name}
            </Link>
          </div>
          <span className="text-sm text-muted-foreground">
            {org.count} reservas
          </span>
        </div>
      ))}
    </div>
  );
}
