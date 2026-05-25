"use client";

import { PlatformRole } from "@prisma/client";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface PlatformUser {
  id: string;
  name: string | null;
  email: string;
  platformRole: PlatformRole;
  createdAt: string;
  memberships: {
    organization: { id: string; name: string; slug: string };
    role: string;
  }[];
}

export default function AdminUsersPage() {
  const t = useTranslations("Admin.users");
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("platformRole", roleFilter);
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

  const toggleSuperAdmin = async (user: PlatformUser) => {
    const nextRole =
      user.platformRole === PlatformRole.SUPER_ADMIN
        ? PlatformRole.NONE
        : PlatformRole.SUPER_ADMIN;
    const action =
      nextRole === PlatformRole.SUPER_ADMIN
        ? "promover a SUPER_ADMIN"
        : "remover SUPER_ADMIN";
    if (!confirm(`Confirma ${action} para ${user.email}?`)) return;

    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/platform-role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformRole: nextRole }),
      });
      if (res.ok) await fetchUsers();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout title={t("title")} description={t("description")}>
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-white"
        >
          <option value="all">Todos os papéis</option>
          <option value="NONE">Usuários comuns</option>
          <option value="SUPER_ADMIN">Super admins</option>
        </select>
      </div>

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
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updatingId === user.id}
                  onClick={() => toggleSuperAdmin(user)}
                >
                  {user.platformRole === PlatformRole.SUPER_ADMIN
                    ? "Remover SUPER_ADMIN"
                    : "Promover SUPER_ADMIN"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function MotionlessUserBlock({ user }: { user: PlatformUser }) {
  return (
    <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-white">
          {user.name ?? user.email}
          {user.platformRole === PlatformRole.SUPER_ADMIN && (
            <span className="ml-2 rounded bg-violet-600/30 px-2 py-0.5 text-xs text-violet-300">
              SUPER_ADMIN
            </span>
          )}
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
