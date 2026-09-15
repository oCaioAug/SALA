"use client";

import { OrganizationStatus } from "@/lib/auth/roles";
import { Building2, CheckCircle2, Clock, Plus, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AdminActionError } from "@/components/admin/AdminActionError";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import {
  AdminPageContent,
  AdminPageHeader,
} from "@/components/admin/AdminLayout";
import { AdminMetricCards } from "@/components/admin/AdminMetricCards";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Switch } from "@/components/ui/Switch";
import { Link } from "@/navigation";

interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: string;
  deletedAt?: string | null;
  owner: { id: string; name: string | null; email: string };
  plan: { id: string; name: string; slug: string } | null;
  _count: { members: number; rooms: number };
}

interface OrganizationStats {
  total: number;
  active: number;
  suspended: number;
  trial: number;
}

interface PlanOption {
  id: string;
  name: string;
}

export default function OrganizationsPage() {
  const t = useTranslations("Admin.organizations");
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>(
    []
  );
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.organizations) setStats(data.organizations);
      })
      .finally(() => setStatsLoading(false));

    fetch("/api/admin/plans")
      .then(res => (res.ok ? res.json() : []))
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    const fetchOrgs = async () => {
      setLoading(true);
      setListError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "12",
        });
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (planFilter) params.set("planId", planFilter);
        if (includeDeleted) params.set("includeDeleted", "true");

        const res = await fetch(`/api/admin/organizations?${params}`);
        if (!res.ok) throw new Error(t("loadError"));
        const json = await res.json();
        setOrganizations(json.data);
        setTotal(json.pagination.total);
      } catch {
        setOrganizations([]);
        setListError(t("loadError"));
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchOrgs, 300);
    return () => clearTimeout(debounce);
  }, [search, statusFilter, planFilter, page, includeDeleted, t]);

  const metricCards = [
    {
      id: "total",
      label: t("metricTotal"),
      value: stats?.total ?? 0,
      sub: t("metricTotalSub"),
      icon: Building2,
      iconClassName: "text-primary",
    },
    {
      id: "active",
      label: t("metricActive"),
      value: stats?.active ?? 0,
      sub: t("metricActiveSub"),
      icon: CheckCircle2,
      iconClassName: "text-emerald-400",
    },
    {
      id: "trial",
      label: t("metricTrial"),
      value: stats?.trial ?? 0,
      sub: t("metricTrialSub"),
      icon: Clock,
      iconClassName: "text-amber-400",
    },
    {
      id: "suspended",
      label: t("metricSuspended"),
      value: stats?.suspended ?? 0,
      sub: t("metricSuspendedSub"),
      icon: XCircle,
      iconClassName: "text-red-400",
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href="/admin/organizations/new">
            <Button className="flex items-center gap-2 bg-primary hover:bg-primary">
              <Plus className="h-4 w-4" />
              {t("newOrg")}
            </Button>
          </Link>
        }
      />
      <AdminPageContent>
        <AdminActionError
          message={listError}
          onDismiss={() => setListError(null)}
        />
        <AdminMetricCards
          className="mb-6"
          metrics={metricCards}
          loading={statsLoading}
        />

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
              id: "status",
              label: t("filterStatus"),
              value: statusFilter,
              onChange: value => {
                setStatusFilter(value);
                setPage(1);
              },
              allLabel: t("allStatuses"),
              native: true,
              options: [
                {
                  value: OrganizationStatus.ACTIVE,
                  label: t("filterActive"),
                },
                {
                  value: OrganizationStatus.SUSPENDED,
                  label: t("filterSuspended"),
                },
                { value: OrganizationStatus.TRIAL, label: t("filterTrial") },
              ],
            },
            {
              id: "plan",
              label: t("filterPlan"),
              value: planFilter,
              onChange: value => {
                setPlanFilter(value);
                setPage(1);
              },
              allLabel: t("allPlans"),
              options: plans.map(plan => ({
                value: plan.id,
                label: plan.name,
              })),
            },
          ]}
          actions={
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={includeDeleted}
                onChange={e => {
                  setIncludeDeleted(e.target.checked);
                  setPage(1);
                }}
                aria-label={t("includeDeleted")}
              />
              {t("includeDeleted")}
            </label>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : organizations.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-12 w-12 text-gray-600" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {organizations.map(org => (
                <Link key={org.id} href={`/admin/organizations/${org.id}`}>
                  <Card
                    className={`border-border bg-card p-0 transition-colors hover:border-primary/30 hover:bg-muted ${
                      org.deletedAt ? "opacity-75" : ""
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-foreground">
                            {org.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {org.slug}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <AdminStatusBadge
                            status={org.status}
                            kind="organization"
                          />
                          {org.deletedAt && (
                            <AdminStatusBadge
                              status="deleted"
                              kind="danger"
                              label={t("deleted")}
                            />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          {t("ownerPrefix")}{" "}
                          <span className="text-muted-foreground">
                            {org.owner.name ?? org.owner.email}
                          </span>
                        </p>
                        <p>
                          {t("planPrefix")}{" "}
                          <span className="text-muted-foreground">
                            {org.plan?.name ?? t("noPlan")}
                          </span>
                        </p>
                        <p>
                          {t("membersRooms", {
                            members: org._count.members,
                            rooms: org._count.rooms,
                          })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Pagination
                page={page}
                pageSize={12}
                total={total}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </AdminPageContent>
    </>
  );
}
