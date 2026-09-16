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
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { AvatarUpload } from "@/components/forms/AvatarUpload";
import { AccountSecurityForm } from "@/components/account/AccountSecurityForm";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { cn, getIntlLocale } from "@/lib/utils";

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
  const { isOrgAdmin } = useOrgPermissions();
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
  const [hasPassword, setHasPassword] = useState(false);

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
        const [profileRes, meRes] = await Promise.all([
          fetch(`/api/users/profile?email=${session.user.email}`),
          fetch("/api/users/me"),
        ]);

        if (!profileRes.ok) {
          throw new Error(t("errors.userLoadError"));
        }

        const data = await profileRes.json();
        setUserData(data);
        setEditForm({
          name: data.name || "",
          email: data.email || "",
        });

        if (meRes.ok) {
          const me = await meRes.json();
          setHasPassword(Boolean(me.hasPassword));
        }
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

  const isAdmin = userData?.role === "ADMIN";
  const fieldInputClass =
    "h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-400";

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
    >
      {loading ? (
        <LoadingPage variant="embedded" message={t("loading")} />
      ) : !userData ? (
        <ErrorPage
          variant="embedded"
          error={t("errors.userLoadError")}
          onRetry={() => router.push("/dashboard")}
          retryLabel={t("actions.backToDashboard")}
        />
      ) : (
        <>
          {/* Header da página */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-foreground sm:text-2xl mb-2">
                    {t("title")}
                  </h1>
                  <p className="text-slate-600 dark:text-gray-400">
                    {t("description")}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                {isOrgAdmin && (
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
              <Card variant="elevated" className="overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <CardTitle className="text-lg">{t("personalInfo")}</CardTitle>
                  <Button
                    variant={isEditing ? "ghost" : "outline"}
                    size="sm"
                    onClick={() =>
                      isEditing ? handleCancel() : setIsEditing(true)
                    }
                    disabled={saveLoading}
                  >
                    {isEditing ? (
                      <>
                        <X className="mr-2 h-4 w-4" />
                        {t("actions.cancel")}
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        {t("actions.edit")}
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-b border-border bg-muted/30 px-6 py-6">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <AvatarUpload
                      currentAvatar={userData.image}
                      userName={userData.name || t("userWithoutName")}
                      onAvatarUpdate={handleAvatarUpdate}
                      disabled={saveLoading}
                      layout="profile"
                      className="shrink-0"
                    />

                    <div className="min-w-0 flex-1 space-y-3">
                      {!isEditing ? (
                        <>
                          <div>
                            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                              {userData.name || t("userWithoutName")}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset",
                                  isAdmin
                                    ? "bg-slate-500/10 text-slate-700 ring-slate-500/20 dark:text-slate-300"
                                    : "bg-emerald-500/10 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300"
                                )}
                              >
                                {isAdmin ? (
                                  <Crown className="h-3 w-3" aria-hidden />
                                ) : (
                                  <UserIcon className="h-3 w-3" aria-hidden />
                                )}
                                {isAdmin ? t("roles.admin") : t("roles.user")}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">{userData.email}</span>
                          </div>

                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {t("ownProfilePictureDescription")}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t("ownProfilePictureDescription")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div className="p-6">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label
                            htmlFor="profile-name"
                            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            {t("fullName")}
                          </label>
                          <input
                            id="profile-name"
                            type="text"
                            value={editForm.name}
                            onChange={e =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className={fieldInputClass}
                            placeholder={t("fullNamePlaceholder")}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="profile-email"
                            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                          >
                            {t("email")}
                          </label>
                          <input
                            id="profile-email"
                            type="email"
                            value={editForm.email}
                            onChange={e =>
                              setEditForm({
                                ...editForm,
                                email: e.target.value,
                              })
                            }
                            className={fieldInputClass}
                            placeholder={t("emailPlaceholder")}
                          />
                        </div>
                      </div>

                    <div className="mt-5 flex justify-end border-t border-border pt-5">
                      <Button onClick={handleSave} disabled={saveLoading}>
                        {saveLoading ? (
                          <>
                            <LoadingSpinner size="sm" />
                            {t("save.loading")}
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {t("save.save")}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>

            {/* Sidebar de informações */}
            <div className="space-y-6">
              {/* Card de informações da conta */}
              <Card variant="elevated" className="p-6">
                <CardTitle className="text-lg mb-4">
                  {t("accountInfo")}
                </CardTitle>

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

              <Card variant="elevated" className="p-6">
                <AccountSecurityForm
                  hasPassword={hasPassword}
                  onSuccess={action => {
                    setHasPassword(true);
                    showSuccess(
                      action === "change"
                        ? t("security.changed")
                        : t("security.created")
                    );
                  }}
                />
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
        </>
      )}
    </PageLayout>
  );
};

export default ProfilePage;
