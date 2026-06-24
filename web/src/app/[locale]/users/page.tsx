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

  // Hook de navegação
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
    } catch {
      showError(t("sessionTestError"));
    }
  };


  // Verificar se não é admin
  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="page-container flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
              {t("accessDenied")}
            </h2>
            <p className="text-slate-600 dark:text-gray-400 mb-6">{t("accessDeniedDescription")}</p>
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
      onNotificationClick={() => {}}
    >
      {/* Header da página */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
              <Users className="w-8 h-8 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl mb-2">
                {t("title")}
              </h1>
              <p className="text-slate-600 dark:text-gray-400">{t("description")}</p>
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
              <p className="text-sm text-slate-600 dark:text-gray-400">
                {t("stats.total")}
              </p>
            </div>
          </div>
        </div>

        {isAdmin && <OrganizationInvitesPanel />}

        {/* Filtros e busca */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 dark:text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 transition-all placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">{t("filters.allRoles")}</option>
            <option value="ADMIN">{t("filters.admin")}</option>
            <option value="USER">{t("filters.user")}</option>
          </select>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {users.length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t("stats.total")}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Crown className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {users.filter(u => u.role === "ADMIN").length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t("stats.admin")}
                </p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <UserIcon className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {users.filter(u => u.role === "USER").length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t("stats.user")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {t("errorLoadingUsers")}
            </h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              {t("tryAgain")}
            </Button>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-slate-500 dark:text-gray-400" />}
          title={t("noUsersFound")}
          description={t("noUsersFoundDescription")}
        />
      ) : (
        <div className="space-y-4">
          {paginatedUsers.map(user => (
            <Card
              key={user.id}
              variant="elevated"
              hover
              className="group"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "Avatar"}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-xl object-cover shadow-lg"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${getUserGradient(user.name)} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <span className="text-white font-semibold text-lg">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                        {user.role === "ADMIN" ? (
                          <Crown className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                          <UserIcon className="w-3 h-3 text-green-500 dark:text-green-400" />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {user.name || t("userWithoutName")}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "ADMIN"
                              ? "bg-purple-500/10 text-purple-700 border border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                              : "bg-green-500/10 text-green-700 border border-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30"
                          }`}
                        >
                          {user.role === "ADMIN"
                            ? t("adminRole")
                            : t("userRole")}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-gray-400 mt-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Link para editar perfil */}
                    <Link href={`/profile/${user.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>

                    {/* Botão para alterar role */}
                    {user.id !== session?.user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleRole(user.id, user.role)
                        }
                        disabled={actionLoading === user.id || !isAdmin}
                        className={`${
                          user.role === "ADMIN"
                            ? "text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 hover:bg-orange-500/10"
                            : "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-500/10"
                        } ${
                          !isAdmin
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
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
                            <UserIcon className="w-4 h-4 mr-2" />
                            {t("removeAdmin")}
                          </>
                        ) : (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            {t("makeAdmin")}
                          </>
                        )}
                      </Button>
                    )}

                    {/* Indicador de usuário atual */}
                    {user.id === session?.user?.id && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 rounded-full border border-blue-500/20 dark:border-blue-500/30">
                        <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
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
