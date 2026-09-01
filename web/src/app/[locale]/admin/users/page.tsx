"use client";

import { PlatformRole } from "@/lib/auth/roles";
import { Eye, Shield, UserCheck, Users, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminActionError } from "@/components/admin/AdminActionError";
import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import {
  AdminPageContent,
  AdminPageHeader,
} from "@/components/admin/AdminLayout";
import { AdminMetricCards } from "@/components/admin/AdminMetricCards";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import {
  AdminUserDetail,
  AdminUserDetailModal,
} from "@/components/admin/AdminUserDetailModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";

interface UserStats {
  total: number;
  superAdmins: number;
  regular: number;
  withOrganization: number;
  withoutOrganization: number;
}

export default function AdminUsersPage() {
  const t = useTranslations("Admin.users");
  const { fromResponse } = useApiErrorMessage();
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users/stats")
      .then(res => (res.ok ? res.json() : null))
      .then(setStats)
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("search", search);
      if (roleFilter) params.set("platformRole", roleFilter);
      if (includeDeleted) params.set("includeDeleted", "true");
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data);
        setTotal(json.pagination?.total ?? json.data.length);
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, includeDeleted, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const refreshStats = async () => {
    const statsRes = await fetch("/api/admin/users/stats");
    if (statsRes.ok) setStats(await statsRes.json());
  };

  const toggleSuperAdmin = async (user: AdminUserDetail) => {
    const nextRole =
      user.platformRole === PlatformRole.SUPER_ADMIN
        ? PlatformRole.NONE
        : PlatformRole.SUPER_ADMIN;
    const action =
      nextRole === PlatformRole.SUPER_ADMIN
        ? t("promoteSuperAdmin")
        : t("removeSuperAdmin");
    if (!confirm(`${action} — ${user.email}?`)) return;

    setUpdatingId(user.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/platform-role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformRole: nextRole }),
      });
      if (!res.ok) {
        setActionError(await fromResponse(res));
        return;
      }
      await fetchUsers();
      await refreshStats();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, platformRole: nextRole });
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const openUserDetail = (user: AdminUserDetail) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const metricCards = [
    {
      id: "total",
      label: t("stats.total"),
      value: stats?.total ?? 0,
      sub: t("stats.totalSub"),
      icon: Users,
      iconClassName: "text-blue-400",
    },
    {
      id: "superAdmins",
      label: t("stats.superAdmins"),
      value: stats?.superAdmins ?? 0,
      sub: t("stats.superAdminsSub"),
      icon: Shield,
      iconClassName: "text-primary",
    },
    {
      id: "withOrg",
      label: t("stats.withOrg"),
      value: stats?.withOrganization ?? 0,
      sub: t("stats.withOrgSub"),
      icon: UserCheck,
      iconClassName: "text-emerald-400",
    },
    {
      id: "withoutOrg",
      label: t("stats.withoutOrg"),
      value: stats?.withoutOrganization ?? 0,
      sub: t("stats.withoutOrgSub"),
      icon: UserX,
      iconClassName: "text-amber-400",
    },
  ];

  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <AdminPageContent>
        <AdminActionError
          message={actionError}
          onDismiss={() => setActionError(null)}
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
              id: "platformRole",
              label: t("roleFilter"),
              value: roleFilter,
              onChange: value => {
                setRoleFilter(value);
                setPage(1);
              },
              allLabel: t("allRoles"),
              native: true,
              options: [
                { value: PlatformRole.NONE, label: t("regularUsers") },
                { value: PlatformRole.SUPER_ADMIN, label: t("superAdmins") },
              ],
            },
          ]}
          actions={
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={e => {
                  setIncludeDeleted(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 rounded border-border"
              />
              {t("includeDeleted")}
            </label>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12 text-gray-600" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        ) : (
          <>
            <div className="space-y-3">
              {users.map(user => (
                <Card key={user.id} className="border-border bg-card">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <MotionlessUserBlock user={user} />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openUserDetail(user)}
                      >
                        <Eye className="mr-1.5 h-4 w-4" />
                        {t("viewDetails")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={updatingId === user.id}
                        onClick={() => toggleSuperAdmin(user)}
                      >
                        {user.platformRole === PlatformRole.SUPER_ADMIN
                          ? t("removeSuperAdmin")
                          : t("promoteSuperAdmin")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pagination
              className="mt-6"
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={size => {
                setPageSize(size);
                setPage(1);
              }}
              pageSizeOptions={[15, 30, 50]}
            />
          </>
        )}
      </AdminPageContent>

      <AdminUserDetailModal
        user={selectedUser}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        onToggleSuperAdmin={toggleSuperAdmin}
        updating={updatingId === selectedUser?.id}
      />
    </>
  );
}

function MotionlessUserBlock({ user }: { user: AdminUserDetail }) {
  const t = useTranslations("Admin.users");
  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
          {user.name ?? user.email}
          <AdminStatusBadge status={user.platformRole} kind="platformRole" />
          {user.deletedAt && (
            <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs text-red-300">
              {t("deleted")}
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {user.memberships.length === 0
          ? t("noOrganizations")
          : user.memberships
              .map(m => `${m.organization.name} (${m.role})`)
              .join(", ")}
      </p>
    </div>
  );
}
