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

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Link } from "@/navigation";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
    try {
      await fetch("/api/admin/stats/refresh", { method: "POST" });
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
      <AdminLayout title={t("title")} description={t("description")}>
        <MotionlessLoading />
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout title={t("title")}>
        <p className="text-red-400">{error ?? "Erro ao carregar dados"}</p>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      label: "Organizações",
      value: stats.organizations.total,
      sub: `${stats.organizations.active} ativas`,
      icon: Building2,
      color: "text-violet-400",
    },
    {
      label: "Usuários",
      value: stats.totalUsers,
      sub: "Cadastrados na plataforma",
      icon: Users,
      color: "text-blue-400",
    },
    {
      label: "Salas",
      value: stats.totalRooms,
      sub: "Em todas as orgs",
      icon: DoorOpen,
      color: "text-emerald-400",
    },
    {
      label: "Reservas (30d)",
      value: stats.reservationsLast30Days,
      sub: "Últimos 30 dias",
      icon: Calendar,
      color: "text-amber-400",
    },
    {
      label: "Incidentes abertos",
      value: stats.openIncidents,
      sub: "Requerem atenção",
      icon: AlertTriangle,
      color: "text-orange-400",
    },
  ];

  return (
    <AdminLayout title={t("title")} description={t("analyticsDescription")}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          Retenção (30d): {stats.retentionRate}% · Orgs ativas:{" "}
          {stats.activeOrganizationsLast30Days}/{stats.organizations.total}
        </p>
        <button
          type="button"
          onClick={refreshDailyStats}
          disabled={refreshing}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500 disabled:opacity-50"
        >
          {refreshing ? "Atualizando..." : "Atualizar métricas diárias"}
        </button>
      </div>
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <Card
                key={card.label}
                className="border-white/10 bg-white/5 backdrop-blur"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{card.label}</p>
                      <p className="mt-1 text-3xl font-bold text-white">
                        {card.value}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{card.sub}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${card.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <MotionlessChartsGrid>
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-violet-400" />
                Novas organizações por semana
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyNewOrganizations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #374151",
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-blue-400" />
                Novos usuários por semana
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyNewUsers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #374151",
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </MotionlessChartsGrid>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">
                Distribuição por plano
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.organizationsByPlan.length === 0 ? (
                <p className="text-sm text-gray-500">Sem dados</p>
              ) : (
                stats.organizationsByPlan.map(row => (
                  <div
                    key={row.planId ?? "none"}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-200">{row.planName}</span>
                    <span className="text-gray-400">{row.count} orgs</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">
                Trials expirando (7d)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.expiringTrials.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum trial expirando</p>
              ) : (
                stats.expiringTrials.map(trial => (
                  <div
                    key={trial.organizationId}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <Link
                      href={`/admin/organizations/${trial.organizationId}`}
                      className="text-gray-200 hover:text-white"
                    >
                      {trial.organizationName}
                    </Link>
                    <span className="text-gray-500">
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
              <CardTitle className="text-amber-200">
                Organizações sem atividade (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.inactiveOrganizations.map(org => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                >
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="text-gray-200 hover:text-white"
                  >
                    {org.name}
                  </Link>
                  <span className="text-gray-500">
                    criada em{" "}
                    {new Date(org.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">
              Top organizações por reservas (30d)
            </CardTitle>
            <Link
              href="/admin/organizations"
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {stats.topOrganizationsByReservations.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma reserva recente</p>
            ) : (
              <MotionlessTopOrgsList
                orgs={stats.topOrganizationsByReservations}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
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
          className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600/20 text-xs font-bold text-violet-300">
              {i + 1}
            </span>
            <Link
              href={`/admin/organizations/${org.id}`}
              className="font-medium text-gray-200 hover:text-white"
            >
              {org.name}
            </Link>
          </div>
          <span className="text-sm text-gray-400">{org.count} reservas</span>
        </div>
      ))}
    </div>
  );
}
