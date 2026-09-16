"use client";

import { PlatformRole } from "@/lib/auth/roles";
import {
  Eye,
  RotateCcw,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
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
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { Switch } from "@/components/ui/Switch";
import { useApiErrorMessage } from "@/lib/hooks/useApiErrorMessage";

interface UserStats {
  total: number;
  superAdmins: number;
  regular: number;
  withOrganization: number;
  withoutOrganization: number;
}

type PendingAction =
  | { type: "promote" | "delete" | "restore"; user: AdminUserDetail }
  | null;

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
  const [listError, setListError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  useEffect(() => {
    fetch("/api/admin/users/stats")
      .then(res => (res.ok ? res.json() : null))
      .then(setStats)
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setListError(null);
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
      } else {
        setListError(await fromResponse(res));
        setUsers([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, includeDeleted, page, pageSize, fromResponse]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const refreshStats = async () => {
    const statsRes = await fetch("/api/admin/users/stats");
    if (statsRes.ok) setStats(await statsRes.json());
  };

  const executePendingAction = async () => {
    if (!pendingAction) return;
    const { type, user } = pendingAction;
    setUpdatingId(user.id);
    setActionError(null);
    try {
      let res: Response;
      if (type === "promote") {
        const nextRole =
          user.platformRole === PlatformRole.SUPER_ADMIN
            ? PlatformRole.NONE
            : PlatformRole.SUPER_ADMIN;
        res = await fetch(`/api/admin/users/${user.id}/platform-role`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platformRole: nextRole }),
        });
        if (!res.ok) {
          setActionError(await fromResponse(res));
          return;
        }
        if (selectedUser?.id === user.id) {
          setSelectedUser({ ...user, platformRole: nextRole });
        }
      } else if (type === "delete") {
        res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
        if (!res.ok) {
          setActionError(await fromResponse(res));
          return;
        }
        if (selectedUser?.id === user.id) {
          setModalOpen(false);
          setSelectedUser(null);
        }
      } else {
        res = await fetch(`/api/admin/users/${user.id}/restore`, {
          method: "POST",
        });
        if (!res.ok) {
          setActionError(await fromResponse(res));
          return;
        }
      }
      setPendingAction(null);
      await fetchUsers();
      await refreshStats();
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

  const confirmTitle =
    pendingAction?.type === "promote"
      ? pendingAction.user.platformRole === PlatformRole.SUPER_ADMIN
        ? t("removeSuperAdmin")
        : t("promoteSuperAdmin")
      : pendingAction?.type === "delete"
        ? t("deleteUser")
        : t("restoreUser");

  const confirmDescription = pendingAction
    ? pendingAction.type === "promote"
      ? t("confirmPromoteDesc", { email: pendingAction.user.email })
      : pendingAction.type === "delete"
        ? t("confirmDeleteDesc", { email: pendingAction.user.email })
        : t("confirmRestoreDesc", { email: pendingAction.user.email })
    : "";

  return (
    <>
      <AdminPageHeader title={t("title")} description={t("description")} />
      <AdminPageContent>
        <AdminActionError
          message={actionError ?? listError}
          onDismiss={() => {
            setActionError(null);
            setListError(null);
          }}
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
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12 text-gray-600" />}
            title={t("emptyTitle")}
            description={t("emptyDesc")}
          />
        ) : (
          <>
            <div className="space-y-2">
              {users.map(user => {
                const isSuperAdmin =
                  user.platformRole === PlatformRole.SUPER_ADMIN;
                const isDeleted = Boolean(user.deletedAt);
                return (
                  <Card
                    key={user.id}
                    className={`border-border bg-card p-0 transition-colors hover:border-primary/30 ${
                      isDeleted ? "opacity-75" : ""
                    }`}
                  >
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <UserListItem user={user} />
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUserDetail(user)}
                        >
                          <Eye className="mr-1.5 h-4 w-4" />
                          {t("viewDetails")}
                        </Button>
                        {isDeleted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === user.id}
                            onClick={() =>
                              setPendingAction({ type: "restore", user })
                            }
                          >
                            <RotateCcw className="mr-1.5 h-4 w-4" />
                            {t("restoreUser")}
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === user.id}
                              onClick={() =>
                                setPendingAction({ type: "promote", user })
                              }
                            >
                              <Shield className="mr-1.5 h-4 w-4" />
                              {isSuperAdmin
                                ? t("removeSuperAdmin")
                                : t("promoteSuperAdmin")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={updatingId === user.id}
                              onClick={() =>
                                setPendingAction({ type: "delete", user })
                              }
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              {t("deleteUser")}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
        onToggleSuperAdmin={user =>
          setPendingAction({ type: "promote", user })
        }
        onDeleteUser={user => setPendingAction({ type: "delete", user })}
        onRestoreUser={user => setPendingAction({ type: "restore", user })}
        updating={updatingId === selectedUser?.id}
      />

      <ConfirmModal
        isOpen={Boolean(pendingAction)}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={t("confirmAction")}
        cancelLabel={t("cancelAction")}
        variant={
          pendingAction?.type === "delete" ||
          (pendingAction?.type === "promote" &&
            pendingAction.user.platformRole === PlatformRole.SUPER_ADMIN)
            ? "destructive"
            : "default"
        }
        loading={Boolean(pendingAction && updatingId === pendingAction.user.id)}
        onConfirm={executePendingAction}
        onCancel={() => setPendingAction(null)}
      />
    </>
  );
}

function UserListItem({ user }: { user: AdminUserDetail }) {
  const t = useTranslations("Admin.users");
  const tRoles = useTranslations("Admin.badges.organizationRole");
  const isSuperAdmin = user.platformRole === PlatformRole.SUPER_ADMIN;
  const visibleMemberships = user.memberships.slice(0, 2);
  const extraMemberships = user.memberships.length - visibleMemberships.length;

  const roleLabel = (role: string) => {
    try {
      return tRoles(role as "OWNER" | "ADMIN" | "MEMBER");
    } catch {
      return role;
    }
  };

  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="truncate font-medium text-foreground">
          {user.name ?? user.email}
        </p>
        {isSuperAdmin && (
          <AdminStatusBadge status={user.platformRole} kind="platformRole" />
        )}
        {user.deletedAt && (
          <AdminStatusBadge
            status="deleted"
            kind="danger"
            label={t("deleted")}
          />
        )}
      </div>
      <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {user.memberships.length === 0 ? (
          <span>{t("noOrganizations")}</span>
        ) : (
          <>
            {visibleMemberships.map(m => (
              <span
                key={`${m.organization.id}-${m.role}`}
                className="inline-flex max-w-full items-center rounded-md bg-muted px-2 py-0.5"
              >
                <span className="truncate">
                  {m.organization.name}
                  <span className="text-muted-foreground/80">
                    {" "}
                    · {roleLabel(m.role)}
                  </span>
                </span>
              </span>
            ))}
            {extraMemberships > 0 && (
              <span className="text-muted-foreground">+{extraMemberships}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
