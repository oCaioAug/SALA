"use client";

import { SubscriptionStatus } from "@prisma/client";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Eye,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import {
  AdminBillingSubscription,
  AdminBillingSubscriptionModal,
} from "@/components/admin/AdminBillingSubscriptionModal";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
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

type BillingScope = "all" | "active" | "attention" | "cancelled";

interface BillingStats {
  active: number;
  trialing: number;
  pastDue: number;
  cancelled: number;
  total: number;
  expiringSoon: number;
  orgsWithoutSubscription: number;
}

export default function AdminBillingPage() {
  const t = useTranslations("Admin.billing");
  const [scope, setScope] = useState<BillingScope>("all");
  const [subscriptions, setSubscriptions] = useState<AdminBillingSubscription[]>(
    []
  );
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [plans, setPlans] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/admin/billing/stats");
    if (res.ok) setStats(await res.json());
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    fetch("/api/admin/plans")
      .then(r => (r.ok ? r.json() : []))
      .then(setPlans)
      .catch(() => setPlans([]));
  }, [fetchStats]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        scope,
        page: String(page),
        pageSize: "15",
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("planId", planFilter);

      const res = await fetch(`/api/admin/billing/subscriptions?${params}`);
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      setSubscriptions(json.data);
      setTotalPages(json.pagination.totalPages);
      setTotal(json.pagination.total);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [scope, page, search, statusFilter, planFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchSubscriptions, 300);
    return () => clearTimeout(timer);
  }, [fetchSubscriptions]);

  const handleScopeChange = (tabId: string) => {
    setScope(tabId as BillingScope);
    setStatusFilter("");
    setPage(1);
  };

  const isExpiringSoon = (end: string) => {
    const endDate = new Date(end).getTime();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return endDate >= now && endDate <= now + sevenDays;
  };

  const metricCards = [
    {
      id: "active",
      label: t("stats.active"),
      value: (stats?.active ?? 0) + (stats?.trialing ?? 0),
      sub: t("stats.activeSub"),
      icon: CheckCircle2,
      iconClassName: "text-emerald-400",
    },
    {
      id: "attention",
      label: t("stats.attention"),
      value: (stats?.pastDue ?? 0) + (stats?.expiringSoon ?? 0),
      sub: t("stats.attentionSub"),
      icon: AlertCircle,
      iconClassName: "text-amber-400",
    },
    {
      id: "cancelled",
      label: t("stats.cancelled"),
      value: stats?.cancelled ?? 0,
      sub: t("stats.cancelledSub"),
      icon: XCircle,
      iconClassName: "text-red-400",
    },
    {
      id: "total",
      label: t("stats.total"),
      value: stats?.total ?? 0,
      sub: t("stats.totalSub", {
        count: stats?.orgsWithoutSubscription ?? 0,
      }),
      icon: CreditCard,
      iconClassName: "text-violet-400",
    },
  ];

  const scopeTabs = [
    { id: "all", label: t("tabs.all"), icon: CreditCard },
    { id: "active", label: t("tabs.active"), icon: CheckCircle2 },
    { id: "attention", label: t("tabs.attention"), icon: AlertCircle },
    { id: "cancelled", label: t("tabs.cancelled"), icon: XCircle },
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

        {stats && stats.orgsWithoutSubscription > 0 && (
          <Card className="mb-6 border-amber-500/20 bg-amber-500/5">
            <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-amber-200">
                {t("orgsWithoutSubscription", {
                  count: stats.orgsWithoutSubscription,
                })}
              </p>
              <Link
                href="/admin/organizations"
                className="text-sm text-violet-300 hover:text-violet-200"
              >
                {t("viewOrganizations")}
              </Link>
            </CardContent>
          </Card>
        )}

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
                id: "status",
                label: t("statusFilter"),
                value: statusFilter,
                onChange: value => {
                  setStatusFilter(value);
                  setPage(1);
                },
                allLabel: t("allStatuses"),
                options: Object.values(SubscriptionStatus).map(value => ({
                  value,
                  label: value,
                })),
              },
              {
                id: "plan",
                label: t("planFilter"),
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
          />

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : subscriptions.length === 0 ? (
            <EmptyState
              icon={<CreditCard className="h-12 w-12 text-gray-600" />}
              title={t("emptyTitle")}
              description={t("emptyDesc")}
            />
          ) : (
            <>
              <div className="space-y-3">
                {subscriptions.map(sub => {
                  const expiring = isExpiringSoon(sub.currentPeriodEnd);
                  return (
                    <Card
                      key={sub.id}
                      className="border-white/10 bg-white/5 transition-colors hover:border-violet-500/30"
                    >
                      <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <AdminStatusBadge
                              status={sub.status}
                              kind="subscription"
                            />
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300">
                              {sub.plan.name}
                            </span>
                            {expiring &&
                              sub.status !== SubscriptionStatus.CANCELLED && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                                  <CalendarClock className="h-3 w-3" />
                                  {t("expiringSoon")}
                                </span>
                              )}
                          </div>
                          <Link
                            href={`/admin/organizations/${sub.organization.id}`}
                            className="font-medium text-white hover:text-violet-200"
                          >
                            {sub.organization.name}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-500">
                            <span>
                              {t("renewsOn")}{" "}
                              {new Date(
                                sub.currentPeriodEnd
                              ).toLocaleDateString("pt-BR")}
                            </span>
                            <span>
                              {sub.organization.owner.name ??
                                sub.organization.owner.email}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedId(sub.id);
                            setModalOpen(true);
                          }}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          {t("manage")}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
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

      <AdminBillingSubscriptionModal
        subscriptionId={selectedId}
        plans={plans}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedId(null);
        }}
        onUpdated={() => {
          fetchSubscriptions();
          fetchStats();
        }}
      />
    </>
  );
}
