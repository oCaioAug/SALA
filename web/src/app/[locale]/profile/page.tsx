"use client";

import {
  Bell,
  Calendar,
  Crown,
  Edit,
  Lock,
  Mail,
  Save,
  Settings,
  Shield,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";

import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { AvatarUpload } from "@/components/forms/AvatarUpload";
import { useApp } from "@/lib/hooks/useApp";
import { getIntlLocale } from "@/lib/utils";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useTranslations, useLocale } from "next-intl";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  updatedAt: string;
  image?: string;
}

const ProfilePage: React.FC = () => {
  const t = useTranslations("ProfilePage");
  const locale = useLocale();
  const { data: session, update } = useSession();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState("profile");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const { showSuccess, showError } = useApp();

  // Hook de navegação
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  // Carregar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.email) return;

      try {
        setLoading(true);
        const response = await fetch(
          `/api/users/profile?email=${session.user.email}`
        );

        if (!response.ok) {
          throw new Error(t("errors.userLoadError"));
        }

        const data = await response.json();
        setUserData(data);
        setEditForm({
          name: data.name || "",
          email: data.email || "",
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
        showError(t("errors.userLoadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session?.user?.email, showError]);

  // Função para atualizar avatar
  const handleAvatarUpdate = async (newAvatarUrl: string | null) => {
    if (userData) {
      setUserData({
        ...userData,
        image: newAvatarUrl || undefined,
      });

      // Atualizar a sessão se necessário
      await update({
        ...session?.user,
        image: newAvatarUrl || undefined,
      });

      showSuccess(newAvatarUrl ? t("avatar.updated") : t("avatar.removed"));
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
        throw new Error(t("errors.saveError"));
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setIsEditing(false);

      // Atualizar a sessão
      await update({
        name: updatedUser.name,
        email: updatedUser.email,
      });

      showSuccess(t("save.success"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showError(t("errors.saveError"));
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

  // Formatação de data
  const formatDate = (dateString: string) => {
    const intlLocale = getIntlLocale(locale);

    return new Date(dateString).toLocaleDateString(intlLocale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <LoadingPage message={t("loading")} />;
  }

  if (!userData) {
    return (
      <ErrorPage
        error={t("errors.userLoadError")}
        onRetry={() => router.push("/dashboard")}
        retryLabel={t("actions.backToDashboard")}
      />
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
              <UserIcon className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {t("title")}
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {session?.user?.role === "ADMIN" && (
              <Link href="/users">
                <Button variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  {t("actions.manageUsers")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card do perfil principal */}
        <div className="lg:col-span-2">
          <Card variant="elevated" className="p-6">
            <div className="flex items-start justify-between mb-6">
              <CardTitle className="text-2xl">{t("personalInfo")}</CardTitle>
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
                    {t("actions.cancel")}
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    {t("actions.edit")}
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-6">
              {/* Foto do perfil */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                <AvatarUpload
                  currentAvatar={userData.image}
                  userName={userData.name || t("userWithoutName")}
                  onAvatarUpdate={handleAvatarUpdate}
                  disabled={saveLoading}
                />

                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                    {userData.name || t("userWithoutName")}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userData.role === "ADMIN"
                          ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30"
                          : "bg-green-500/20 text-green-600 dark:text-green-300 border border-green-500/30"
                      }`}
                    >
                      {userData.role === "ADMIN" ? (
                        <>
                          <Crown className="w-4 h-4 inline mr-1" />
                          {t("roles.admin")}
                        </>
                      ) : (
                        <>
                          <UserIcon className="w-4 h-4 inline mr-1" />
                          {t("roles.user")}
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-gray-400 text-sm">
                    {t("ownProfilePictureDescription")}
                  </p>
                </div>
              </div>

              {/* Campos de edição */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    {t("fullName")}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t("fullNamePlaceholder")}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                      <UserIcon className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                      <span className="text-slate-900 dark:text-white">
                        {userData.name || t("userWithoutName")}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    {t("email")}
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder={t("emailPlaceholder")}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                      <Mail className="w-5 h-5 text-slate-500 dark:text-gray-400" />
                      <span className="text-slate-900 dark:text-white">
                        {userData.email}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 block">
                    {t("role")}
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    {userData.role === "ADMIN" ? (
                      <>
                        <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-purple-600 dark:text-purple-400 font-medium">
                          {t("roles.admin")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {t("roles.user")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="flex-1"
                  >
                    {saveLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        {t("save.loading")}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t("save.save")}
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
            <CardTitle className="text-lg mb-4">{t("accountInfo")}</CardTitle>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                <div>
                  <p className="text-slate-600 dark:text-gray-400">
                    {t("memberSince")}
                  </p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {formatDate(userData.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Edit className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                <div>
                  <p className="text-slate-600 dark:text-gray-400">
                    {t("lastUpdate")}
                  </p>
                  <p className="text-slate-900 dark:text-white font-medium">
                    {formatDate(userData.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Card de configurações */}
          <Card variant="elevated" className="p-6">
            <CardTitle className="text-lg mb-4">
              {t("settings.title")}
            </CardTitle>

            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                <Bell className="w-4 h-4" />
                <span>{t("settings.notifications")}</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                <Lock className="w-4 h-4" />
                <span>{t("settings.security")}</span>
              </button>

              <button className="w-full flex items-center gap-3 p-3 text-left text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
                <span>{t("settings.preferences")}</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProfilePage;
