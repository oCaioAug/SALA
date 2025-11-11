"use client";

import {
  ArrowLeft,
  Calendar,
  Crown,
  Edit,
  Mail,
  Save,
  Shield,
  User as UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AvatarUpload } from "@/components/forms/AvatarUpload";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
  image?: string;
}

const UserProfilePage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [currentPage, setCurrentPage] = useState("users");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { showSuccess, showError } = useApp();

  // Hook de navegação
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Verificar se é admin
  const isAdmin = session?.user?.role === "ADMIN";
  const isOwnProfile = session?.user?.id === userId;

  // Carregar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
          throw new Error("Erro ao carregar dados do usuário");
        }

        const data = await response.json();
        setUserData(data);
        setEditForm({
          name: data.name || "",
          email: data.email || "",
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        showError("Erro ao carregar dados do usuário");
        router.push("/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, showError, router]);

  // Função para atualizar avatar (apenas admin ou próprio usuário)
  const handleAvatarUpdate = async (newAvatarUrl: string | null) => {
    if (userData) {
      setUserData({
        ...userData,
        image: newAvatarUrl || undefined,
      });

      showSuccess(
        newAvatarUrl
          ? "Avatar atualizado com sucesso!"
          : "Avatar removido com sucesso!"
      );
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!userData) return;

    try {
      setSaveLoading(true);

      const response = await fetch(`/api/users/${userData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar alterações");
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setIsEditing(false);

      showSuccess("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showError(
        error instanceof Error ? error.message : "Erro ao salvar alterações"
      );
    } finally {
      setSaveLoading(false);
    }
  };

  // Cancelar edição
  const handleCancel = () => {
    if (userData) {
      setEditForm({
        name: userData.name || "",
        email: userData.email || "",
      });
    }
    setIsEditing(false);
  };

  // Alterar role
  const handleToggleRole = async () => {
    if (!userData || !isAdmin) return;

    try {
      setActionLoading(true);
      const newRole = userData.role === "ADMIN" ? "USER" : "ADMIN";

      const response = await fetch(`/api/users/${userData.id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Erro ao alterar permissão do usuário");
      }

      setUserData(prev => (prev ? { ...prev, role: newRole } : null));
      showSuccess(
        `Usuário agora é ${
          newRole === "ADMIN" ? "administrador" : "usuário comum"
        }`
      );
    } catch (error) {
      console.error("Erro ao alterar role:", error);
      showError("Erro ao alterar permissão do usuário");
    } finally {
      setActionLoading(false);
    }
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Verificar acesso
  if (!isAdmin && !isOwnProfile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-400 mb-6">
              Você não tem permissão para visualizar este perfil.
            </p>
            <Link href="/dashboard">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!userData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">
              Usuário não encontrado
            </h2>
            <p className="text-gray-400 mb-6">
              O usuário solicitado não foi encontrado.
            </p>
            <Link href="/users">
              <Button>Voltar à Lista de Usuários</Button>
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
                  <Link href="/users">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar
                    </Button>
                  </Link>

                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                      <UserIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-2">
                        {isOwnProfile
                          ? "Meu Perfil"
                          : `Perfil de ${userData.name || "Usuário"}`}
                      </h1>
                      <p className="text-gray-400">
                        {isOwnProfile
                          ? "Gerencie suas informações pessoais"
                          : "Visualize e edite informações do usuário"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {isAdmin && !isOwnProfile && (
                    <Button
                      variant="outline"
                      onClick={handleToggleRole}
                      disabled={actionLoading}
                      className={
                        userData.role === "ADMIN"
                          ? "text-orange-400 hover:text-orange-300"
                          : "text-purple-400 hover:text-purple-300"
                      }
                    >
                      {actionLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : userData.role === "ADMIN" ? (
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
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card do perfil principal */}
              <div className="lg:col-span-2">
                <Card variant="elevated" className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <CardTitle className="text-2xl text-white">
                      Informações Pessoais
                    </CardTitle>
                    <Button
                      variant="outline"
                      onClick={() =>
                        isEditing ? handleCancel() : setIsEditing(true)
                      }
                      disabled={saveLoading}
                    >
                      {isEditing ? (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Foto do perfil */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                      <AvatarUpload
                        currentAvatar={userData.image}
                        userName={userData.name || "Usuário"}
                        onAvatarUpdate={handleAvatarUpdate}
                        disabled={saveLoading || (!isAdmin && !isOwnProfile)}
                      />

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1">
                          {userData.name || "Usuário sem nome"}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              userData.role === "ADMIN"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-green-500/20 text-green-300 border border-green-500/30"
                            }`}
                          >
                            {userData.role === "ADMIN" ? (
                              <>
                                <Crown className="w-4 h-4 inline mr-1" />
                                Administrador
                              </>
                            ) : (
                              <>
                                <UserIcon className="w-4 h-4 inline mr-1" />
                                Usuário
                              </>
                            )}
                          </span>

                          {isOwnProfile && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {isOwnProfile
                            ? "Esta é sua foto de perfil. Será exibida em suas reservas e interações."
                            : "Foto de perfil do usuário. Pode ser alterada por administradores."}
                        </p>
                      </div>
                    </div>

                    {/* Campos de edição */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          Nome Completo
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={e =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Digite o nome completo"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-white">
                              {userData.name || "Nome não informado"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={e =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Digite o email"
                          />
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span className="text-white">{userData.email}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                          Função
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          {userData.role === "ADMIN" ? (
                            <>
                              <Crown className="w-5 h-5 text-purple-400" />
                              <span className="text-purple-400 font-medium">
                                Administrador
                              </span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-5 h-5 text-green-400" />
                              <span className="text-green-400 font-medium">
                                Usuário
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botões de ação */}
                    {isEditing && (
                      <div className="flex gap-3 pt-4 border-t border-slate-700">
                        <Button
                          onClick={handleSave}
                          disabled={saveLoading}
                          className="flex-1"
                        >
                          {saveLoading ? (
                            <>
                              <LoadingSpinner size="sm" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Salvar Alterações
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Sidebar de informações */}
              <div className="space-y-6">
                {/* Card de informações da conta */}
                <Card variant="elevated" className="p-6">
                  <CardTitle className="text-lg text-white mb-4">
                    Informações da Conta
                  </CardTitle>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400">Membro desde</p>
                        <p className="text-white font-medium">
                          {formatDate(userData.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Edit className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-400">Última atualização</p>
                        <p className="text-white font-medium">
                          {formatDate(userData.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Card de estatísticas (se disponível) */}
                <Card variant="elevated" className="p-6">
                  <CardTitle className="text-lg text-white mb-4">
                    Atividade
                  </CardTitle>

                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">
                      Estatísticas de atividade serão implementadas em breve.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default UserProfilePage;
