"use client";

import {
  Crown,
  Edit,
  Mail,
  Search,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { HiBeaker } from "react-icons/hi2";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageLayout } from "@/components/layout/PageLayout";
import { OrganizationInvitesPanel } from "@/components/organization/OrganizationInvitesPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Pagination } from "@/components/ui/Pagination";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { getUserGradient, getUserInitials } from "@/lib/utils/userUtils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
  image?: string;
}

const UsersPage: React.FC = () => {
  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState("users");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(12);

  const { showSuccess, showError } = useApp();
  const t = useTranslations("UsersPage");
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const { isOrgAdmin: isAdmin } = useOrgPermissions();

  // Debug da sessão
  useEffect(() => {
    console.log("Sessão do usuário:", {
      hasSession: !!session,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      isAdmin,
    });
  }, [session, isAdmin]);

  // Carregar usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/users");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `${t("error", { status: response.status, statusText: response.statusText })}`
          );
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
        setError(t("errorUnknown"));
        showError(t("errorUnknown"));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [showError, t]);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    setListPage(1);
  }, [searchTerm, roleFilter]);

  const totalUsers = filteredUsers.length;
  const totalUserPages = Math.max(1, Math.ceil(totalUsers / listPageSize));
  const safeUserPage = Math.min(listPage, totalUserPages);
  const paginatedUsers = filteredUsers.slice(
    (safeUserPage - 1) * listPageSize,
    safeUserPage * listPageSize
  );

  // Alterar role do usuário
  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      console.log("Alterando role do usuário:", { userId, currentRole });
      setActionLoading(userId);
      const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
      console.log("Novo role:", newRole);

      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      console.log("Resposta da API:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Erro na API:", errorData);
        throw new Error(errorData.error || t("errorUserPermissionChange"));
      }

      const result = await response.json();
      console.log("Resultado da API:", result);

      // Atualizar a lista local
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, role: newRole as "ADMIN" | "USER" }
            : user
        )
      );

      showSuccess(
        t("userNowIs", {
          role: newRole === "ADMIN" ? t("admin") : t("user"),
        })
      );
    } catch (error) {
      console.error("Erro ao alterar role:", error);
      showError(
        error instanceof Error ? error.message : t("errorUserPermissionChange")
      );
    } finally {
      setActionLoading(null);
    }
  };

  // Função de teste da API
  const testSession = async () => {
    try {
      const response = await fetch("/api/test-session");
      const data = await response.json();
      console.log("Teste da sessão:", data);
      if (response.ok) {
        showSuccess(t("sessionValid"));
      } else {
        showError(t("sessionError", { error: data.error }));
      }
    } catch (_error) {
      showError(t("sessionTestError"));
    }
  };

  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="page-container flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Shield className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {t("accessDenied")}
            </h2>
            <p className="mb-6 text-slate-600 dark:text-slate-400">
              {t("accessDeniedDescription")}
            </p>
            <Link href="/organizations">
              <Button>{t("backToDashboard")}</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
    >
      <div className="mb-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
                {t("title")}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={testSession}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm"
            >
              <HiBeaker className="h-4 w-4 shrink-0" aria-hidden />
              {t("testSession")}
            </Button>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {users.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t("stats.total")}
              </p>
            </div>
          </div>
        </div>

        <OrganizationInvitesPanel />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">{t("filters.allRoles")}</option>
            <option value="ADMIN">{t("filters.admin")}</option>
            <option value="USER">{t("filters.user")}</option>
          </select>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div>
                <p className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">
                  {users.length}
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t("stats.total")}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div>
                <p className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">
                  {users.filter(u => u.role === "ADMIN").length}
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t("stats.admin")}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div>
                <p className="mb-1 text-xl font-semibold text-foreground sm:text-2xl">
                  {users.filter(u => u.role === "USER").length}
                </p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {t("stats.user")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <Users className="h-8 w-8 text-red-500 dark:text-red-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
              {t("errorLoadingUsers")}
            </h3>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              {error}
            </p>
            <Button onClick={() => window.location.reload()}>
              {t("tryAgain")}
            </Button>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-slate-400" />}
          title={t("noUsersFound")}
          description={t("noUsersFoundDescription")}
        />
      ) : (
        <div className="space-y-4">
          {paginatedUsers.map(user => (
            <Card key={user.id} variant="elevated" hover className="group">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "Avatar"}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-xl object-cover shadow-lg"
                        />
                      ) : (
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-md ${getUserGradient(user.name)}`}
                        >
                          <span className="text-lg font-semibold text-white">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white dark:border-slate-800 dark:bg-slate-800">
                        {user.role === "ADMIN" ? (
                          <Crown className="h-3 w-3 text-amber-500" />
                        ) : (
                          <UserIcon className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {user.name || t("userWithoutName")}
                        </h3>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${
                            user.role === "ADMIN"
                              ? "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-600/20 dark:text-slate-300"
                              : "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-300"
                          }`}
                        >
                          {user.role === "ADMIN"
                            ? t("adminRole")
                            : t("userRole")}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link href={`/profile/${user.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-100 transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>

                    {user.id !== session?.user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRole(user.id, user.role)}
                        disabled={actionLoading === user.id || !isAdmin}
                        className={`${
                          user.role === "ADMIN"
                            ? "text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                            : "text-slate-700 hover:bg-slate-600/10 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                        } ${!isAdmin ? "cursor-not-allowed opacity-50" : ""}`}
                        title={
                          !isAdmin
                            ? t("onlyAdminsCanChangePermissions")
                            : undefined
                        }
                      >
                        {actionLoading === user.id ? (
                          <LoadingSpinner size="sm" />
                        ) : user.role === "ADMIN" ? (
                          <>
                            <UserIcon className="mr-2 h-4 w-4" />
                            {t("removeAdmin")}
                          </>
                        ) : (
                          <>
                            <Crown className="mr-2 h-4 w-4" />
                            {t("makeAdmin")}
                          </>
                        )}
                      </Button>
                    )}

                    {user.id === session?.user?.id && (
                      <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 dark:border-blue-500/30 dark:bg-blue-500/20">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                          {t("you")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Pagination
            page={safeUserPage}
            pageSize={listPageSize}
            total={totalUsers}
            onPageChange={setListPage}
            onPageSizeChange={size => {
              setListPageSize(size);
              setListPage(1);
            }}
          />
        </div>
      )}
    </PageLayout>
  );
};

export default UsersPage;
