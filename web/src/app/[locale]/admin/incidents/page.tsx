"use client";

import {
  IncidentPriority,
  IncidentStatus,
} from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Flame,
  List,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import {
  AdminIncidentDetailModal,
  AdminIncidentListItem,
} from "@/components/admin/AdminIncidentDetailModal";
import { AdminPageContent, AdminPageHeader } from "@/components/admin/AdminLayout";
import { AdminMetricCards } from "@/components/admin/AdminMetricCards";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTabPanel, AdminTabs } from "@/components/admin/AdminTabs";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Link } from "@/navigation";

type IncidentScope = "open" | "resolved";

interface IncidentStats {
  open: number;
  resolved: number;
  criticalOpen: number;
  total: number;
}

interface OrganizationOption {
  id: string;
  name: string;
}

export default function AdminIncidentsPage() {
  const t = useTranslations("Admin.incidents");
  const [scope, setScope] = useState<IncidentScope>("open");
  const [incidents, setIncidents] = useState<AdminIncidentListItem[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [organizationFilter, setOrganizationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/incidents/stats");
    if (res.ok) setStats(await res.json());
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    fetch("/api/admin/organizations?pageSize=100")
      .then(r => (r.ok ? r.json() : { data: [] }))
      .then(json =>
        setOrganizations(
          (json.data as OrganizationOption[]).map(o => ({
            id: o.id,
            name: o.name,
          }))
        )
      )
      .catch(() => setOrganizations([]));
  }, [fetchStats]);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope,
        page: String(page),
        pageSize: "15",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (organizationFilter) params.set("organizationId", organizationFilter);

      const res = await fetch(`/api/admin/incidents?${params}`);
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setIncidents(json.data);
      setTotalPages(json.pagination.totalPages);
      setTotal(json.pagination.total);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [
    scope,
    page,
    search,
    statusFilter,
    priorityFilter,
    organizationFilter,
  ]);

  useEffect(() => {
    const timer = setTimeout(fetchIncidents, 300);
    return () => clearTimeout(timer);
  }, [fetchIncidents]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleScopeChange = (tabId: string) => {
    setScope(tabId as IncidentScope);
    setStatusFilter("");
    setPage(1);
  };

  const metricCards = [
    {
      id: "open",
      label: t("stats.open"),
      value: stats?.open ?? 0,
      sub: t("stats.openSub"),
      icon: AlertTriangle,
      iconClassName: "text-orange-400",
    },
    {
      id: "critical",
      label: t("stats.critical"),
      value: stats?.criticalOpen ?? 0,
      sub: t("stats.criticalSub"),
      icon: Flame,
      iconClassName: "text-red-400",
    },
    {
      id: "resolved",
      label: t("stats.resolved"),
      value: stats?.resolved ?? 0,
      sub: t("stats.resolvedSub"),
      icon: CheckCircle2,
      iconClassName: "text-emerald-400",
    },
    {
      id: "total",
      label: t("stats.total"),
      value: stats?.total ?? 0,
      sub: t("stats.totalSub"),
      icon: List,
      iconClassName: "text-violet-400",
    },
  ];

  const scopeTabs = [
    { id: "open", label: t("tabs.open"), icon: AlertTriangle },
    { id: "resolved", label: t("tabs.resolved"), icon: CheckCircle2 },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <AdminPageContent>
        <AdminMetricCards
          className="mb-6"
          metrics={metricCards}
          loading={statsLoading}
        />

        <AdminTabs
          className="mb-6"
          tabs={scopeTabs}
          activeTab={scope}
          onTabChange={handleScopeChange}
        />

        <AdminTabPanel tabId={scope} activeTab={scope}>
          <AdminFilterBar
            className="mb-6"
            searchTitle={t("searchTitle")}
            searchPlaceholder={t("searchPlaceholder")}
            searchValue={search}
            onSearchChange={value => {
              setSearch(value);
              setPage(1);
            }}
            filters={[
              {
                id: "organization",
                label: t("organizationFilter"),
                value: organizationFilter,
                onChange: value => {
                  setOrganizationFilter(value);
                  setPage(1);
                },
                allLabel: t("allOrganizations"),
                options: organizations.map(org => ({
                  value: org.id,
                  label: org.name,
                })),
              },
              {
                id: "status",
                label: t("statusFilter"),
                value: statusFilter,
                onChange: value => {
                  setStatusFilter(value);
                  setPage(1);
                },
                allLabel: t("allStatuses"),
                options: Object.values(IncidentStatus).map(value => ({
                  value,
                  label: value,
                })),
              },
              {
                id: "priority",
                label: t("priorityFilter"),
                value: priorityFilter,
                onChange: value => {
                  setPriorityFilter(value);
                  setPage(1);
                },
                allLabel: t("allPriorities"),
                options: Object.values(IncidentPriority).map(value => ({
                  value,
                  label: value,
                })),
              },
            ]}
          />

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : incidents.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="h-12 w-12 text-gray-600" />}
              title={t("emptyTitle")}
              description={t("emptyDesc")}
            />
          ) : (
            <>
              <div className="space-y-3">
                {incidents.map(incident => (
                  <Card
                    key={incident.id}
                    className="border-border bg-card transition-colors hover:border-violet-500/30"
                  >
                    <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <AdminStatusBadge
                            status={incident.status}
                            kind="incident"
                          />
                          <AdminStatusBadge
                            status={incident.priority}
                            kind="incidentPriority"
                          />
                          <span className="text-xs text-muted-foreground">
                            {incident.category}
                          </span>
                        </div>
                        <h3 className="font-medium text-foreground">
                          {incident.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {incident.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <Link
                            href={`/admin/organizations/${incident.organization.id}`}
                            className="text-violet-600 hover:text-violet-500 dark:text-violet-700 dark:text-violet-300 dark:hover:text-violet-200"
                          >
                            {incident.organization.name}
                          </Link>
                          <span>
                            {new Date(incident.createdAt).toLocaleString(
                              "pt-BR"
                            )}
                          </span>
                          {(incident.room ?? incident.item) && (
                            <span>
                              {incident.room?.name ?? incident.item?.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(incident.id)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        {t("viewDetails")}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    page={page}
                    pageSize={15}
                    total={total}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </AdminTabPanel>
      </AdminPageContent>

      <AdminIncidentDetailModal
        incidentId={selectedId}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedId(null);
        }}
        onUpdated={() => {
          fetchIncidents();
          fetchStats();
        }}
      />
    </>
  );
}
