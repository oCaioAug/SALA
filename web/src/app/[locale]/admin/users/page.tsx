"use client";

import { PlatformRole } from "@/lib/auth/roles";
import { Eye, Shield, UserCheck, Users, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminFilterBar } from "@/components/admin/AdminFilterBar";
import { AdminPageContent, AdminPageHeader } from "@/components/admin/AdminLayout";
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

interface UserStats {
  total: number;
  superAdmins: number;
  regular: number;
  withOrganization: number;
  withoutOrganization: number;
}

export default function AdminUsersPage() {
  const t = useTranslations("Admin.users");
  const [users, setUsers] = useState<AdminUserDetail[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("platformRole", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

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
    try {
      const res = await fetch(`/api/admin/users/${user.id}/platform-role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformRole: nextRole }),
      });
      if (res.ok) {
        await fetchUsers();
        await refreshStats();
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...user, platformRole: nextRole });
        }
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
      iconClassName: "text-violet-400",
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
          onSearchChange={setSearch}
          filters={[
            {
              id: "platformRole",
              label: t("roleFilter"),
              value: roleFilter,
              onChange: setRoleFilter,
              allLabel: t("allRoles"),
              options: [
                { value: PlatformRole.NONE, label: t("regularUsers") },
                { value: PlatformRole.SUPER_ADMIN, label: t("superAdmins") },
              ],
            },
          ]}
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
          <div className="space-y-3">
            {users.map(user => (
              <Card key={user.id} className="border-white/10 bg-white/5">
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
  return (
    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-medium text-white">
          {user.name ?? user.email}
          <AdminStatusBadge status={user.platformRole} kind="platformRole" />
        </p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
      <p className="text-sm text-gray-400">
        {user.memberships.length === 0
          ? "Sem organização"
          : user.memberships
              .map(m => `${m.organization.name} (${m.role})`)
              .join(", ")}
      </p>
    </div>
  );
}
