"use client";

import {
  Calendar,
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
import React, { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

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

  const { showSuccess, showError } = useApp();

  // Hook de navegação
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Verificar se o usuário é admin
  const isAdmin = session?.user?.role === "ADMIN";

  // Debug da sessão
  useEffect(() => {
    console.log("🔍 Sessão do usuário:", {
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
            errorData.error || `Erro ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Erro ao carregar usuários:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [showError]);

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Alterar role do usuário
  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      console.log("🔄 Alterando role do usuário:", { userId, currentRole });
      setActionLoading(userId);
      const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
      console.log("📝 Novo role:", newRole);

      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      console.log("📡 Resposta da API:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erro na API:", errorData);
        throw new Error(
          errorData.error || "Erro ao alterar permissão do usuário"
        );
      }

      const result = await response.json();
      console.log("✅ Resultado da API:", result);

      // Atualizar a lista local
      setUsers(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, role: newRole as "ADMIN" | "USER" }
            : user
        )
      );

      showSuccess(
        `Usuário agora é ${
          newRole === "ADMIN" ? "administrador" : "usuário comum"
        }`
      );
    } catch (error) {
      console.error("❌ Erro ao alterar role:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Erro ao alterar permissão do usuário"
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
      console.log("🧪 Teste da sessão:", data);
      if (response.ok) {
        showSuccess("Sessão válida! Verifique o console para detalhes.");
      } else {
        showError(`Erro na sessão: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao testar sessão:", error);
      showError("Erro ao testar sessão");
    }
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Verificar se não é admin
  if (!isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-400 mb-6">
              Você precisa ser administrador para acessar esta página.
            </p>
            <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
        <Sidebar
          currentPage={currentPage}
          onNavigate={navigate}
          isNavigating={isNavigating}
        />

        <div className="flex-1 flex flex-col">
          <Header onNotificationClick={() => {}} />

          <main className="flex-1 p-6">
            {/* Header da página */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Gerenciamento de Usuários
                    </h1>
                    <p className="text-gray-400">
                      Visualize e gerencie os usuários do sistema
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={testSession}
                    className="px-3 py-2 text-sm"
                  >
                    🧪 Testar Sessão
                  </Button>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {users.length}
                    </p>
                    <p className="text-sm text-gray-400">Usuários</p>
                  </div>
                </div>
              </div>

              {/* Filtros e busca */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Funções</option>
                  <option value="ADMIN">Administradores</option>
                  <option value="USER">Usuários</option>
                </select>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card variant="elevated" hover className="group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white mb-1">
                        {users.length}
                      </p>
                      <p className="text-sm text-slate-400 font-medium">
                        Total de Usuários
                      </p>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" hover className="group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-violet-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <Crown className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white mb-1">
                        {users.filter(u => u.role === "ADMIN").length}
                      </p>
                      <p className="text-sm text-slate-400 font-medium">
                        Administradores
                      </p>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" hover className="group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <UserIcon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white mb-1">
                        {users.filter(u => u.role === "USER").length}
                      </p>
                      <p className="text-sm text-slate-400 font-medium">
                        Usuários Comuns
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
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Erro ao carregar usuários
                  </h3>
                  <p className="text-gray-400 text-sm mb-6">{error}</p>
                  <Button onClick={() => window.location.reload()}>
                    Tentar Novamente
                  </Button>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={<Users className="w-8 h-8 text-gray-400" />}
                title="Nenhum usuário encontrado"
                description="Não há usuários que correspondam aos filtros selecionados."
              />
            ) : (
              <div className="space-y-4">
                {filteredUsers.map(user => (
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
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-semibold text-lg">
                                  {user.name
                                    ?.split(" ")
                                    .map(n => n[0])
                                    .join("") || "U"}
                                </span>
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-800 flex items-center justify-center">
                              {user.role === "ADMIN" ? (
                                <Crown className="w-3 h-3 text-yellow-400" />
                              ) : (
                                <UserIcon className="w-3 h-3 text-green-400" />
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-white">
                                {user.name || "Usuário sem nome"}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === "ADMIN"
                                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                    : "bg-green-500/20 text-green-300 border border-green-500/30"
                                }`}
                              >
                                {user.role === "ADMIN"
                                  ? "Administrador"
                                  : "Usuário"}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                {user.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Criado em {formatDate(user.createdAt)}
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
                                  ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                                  : "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                              } ${
                                !isAdmin ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              title={
                                !isAdmin
                                  ? "Apenas administradores podem alterar permissões"
                                  : undefined
                              }
                            >
                              {actionLoading === user.id ? (
                                <LoadingSpinner size="sm" />
                              ) : user.role === "ADMIN" ? (
                                <>
                                  <UserIcon className="w-4 h-4 mr-2" />
                                  Remover Admin
                                </>
                              ) : (
                                <>
                                  <Crown className="w-4 h-4 mr-2" />
                                  Tornar Admin
                                </>
                              )}
                            </Button>
                          )}

                          {/* Indicador de usuário atual */}
                          {user.id === session?.user?.id && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span className="text-xs font-medium text-blue-300">
                                Você
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UsersPage;
