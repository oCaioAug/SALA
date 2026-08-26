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
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AvatarUpload } from "@/components/forms/AvatarUpload";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { getIntlLocale } from "@/lib/utils";

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
  const t = useTranslations("ProfilePage");
  const locale = useLocale();

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

  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const { isOrgAdmin: isAdmin } = useOrgPermissions();
  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);

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
        router.push("/users");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, showError, router, t]);

  const handleAvatarUpdate = async (newAvatarUrl: string | null) => {
    if (userData) {
      setUserData({
        ...userData,
        image: newAvatarUrl || undefined,
      });

      showSuccess(newAvatarUrl ? t("avatar.updated") : t("avatar.removed"));
    }
  };

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
        throw new Error(errorData.error || t("errors.saveError"));
      }

      const updatedUser = await response.json();
      setUserData(updatedUser);
      setIsEditing(false);

      showSuccess(t("save.success"));
    } catch (error) {
      console.error("Erro ao salvar:", error);
      showError(error instanceof Error ? error.message : t("errors.saveError"));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setEditForm({
        name: userData.name || "",
        email: userData.email || "",
      });
    }
    setIsEditing(false);
  };

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
        throw new Error(t("errors.userRoleChangeError"));
      }

      setUserData(prev => (prev ? { ...prev, role: newRole } : null));
      showSuccess(
        `Usuário agora é ${
          newRole === "ADMIN" ? "administrador" : "usuário comum"
        }`
      );
    } catch (error) {
      console.error("Erro ao alterar role:", error);
      showError(t("errors.userRoleChangeError"));
    } finally {
      setActionLoading(false);
    }
  };

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

  if (!isAdmin && !isOwnProfile) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <Shield className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-semibold text-foreground">
              {t("accessDenied")}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {t("accessDeniedDescription")}
            </p>
            <Link href="/dashboard">
              <Button>{t("backToDashboard")}</Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
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
            error={t("userNotFound")}
            onRetry={() => router.push("/users")}
            retryLabel={t("backToListUsers")}
          />
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <Link href="/users">
                    <Button variant="outline" size="sm">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t("actions.back")}
                    </Button>
                  </Link>

                  <div>
                    <h1 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
                      {isOwnProfile
                        ? t("title")
                        : t("titleUser", {
                            name: userData.name || t("userWithoutName"),
                          })}
                    </h1>
                    <p className="text-slate-600 dark:text-gray-400">
                      {isOwnProfile
                        ? t("description")
                        : t("descriptionUser", {
                            name: userData.name || t("userWithoutName"),
                          })}
                    </p>
                  </div>
                </div>

                {isAdmin && !isOwnProfile ? (
                  <Button
                    variant="outline"
                    onClick={handleToggleRole}
                    loading={actionLoading}
                    className={
                      userData.role === "ADMIN"
                        ? "text-orange-600 hover:text-orange-500 dark:text-orange-400 dark:hover:text-orange-300"
                        : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                    }
                  >
                    {userData.role === "ADMIN" ? (
                      <>
                        <UserIcon className="mr-2 h-4 w-4" />
                        {t("actions.removeAdmin")}
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        {t("actions.makeAdmin")}
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card variant="elevated" className="p-6">
                  <div className="mb-6 flex items-start justify-between">
                    <CardTitle className="text-2xl">
                      {t("personalInfo")}
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

                  <div className="space-y-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                      <AvatarUpload
                        currentAvatar={userData.image}
                        userName={userData.name || t("userWithoutName")}
                        onAvatarUpdate={handleAvatarUpdate}
                        disabled={saveLoading || (!isAdmin && !isOwnProfile)}
                      />

                      <div className="flex-1">
                        <h3 className="mb-1 text-xl font-semibold text-slate-900 dark:text-white">
                          {userData.name || t("userWithoutName")}
                        </h3>
                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className={`rounded-full border px-3 py-1 text-sm font-medium ${
                              userData.role === "ADMIN"
                                ? "border-slate-500/30 bg-slate-600/20 text-slate-700 dark:text-slate-300"
                                : "border-green-500/30 bg-green-500/20 text-green-600 dark:text-green-300"
                            }`}
                          >
                            {userData.role === "ADMIN" ? (
                              <>
                                <Crown className="mr-1 inline h-4 w-4" />
                                {t("roles.admin")}
                              </>
                            ) : (
                              <>
                                <UserIcon className="mr-1 inline h-4 w-4" />
                                {t("roles.user")}
                              </>
                            )}
                          </span>

                          {isOwnProfile ? (
                            <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-700 dark:text-blue-300">
                              {t("you")}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-gray-400">
                          {isOwnProfile
                            ? t("ownProfilePictureDescription")
                            : t("anotherUserProfilePictureDescription")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t("fullName")}
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={e =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-gray-400"
                            placeholder={t("fullNamePlaceholder")}
                          />
                        ) : (
                          <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800/50">
                            <UserIcon className="h-5 w-5 text-slate-500 dark:text-gray-400" />
                            <span className="text-slate-900 dark:text-white">
                              {userData.name || t("fullNameRequired")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t("email")}
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
                            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder-gray-400"
                            placeholder={t("emailPlaceholder")}
                          />
                        ) : (
                          <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800/50">
                            <Mail className="h-5 w-5 text-slate-500 dark:text-gray-400" />
                            <span className="text-slate-900 dark:text-white">
                              {userData.email}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t("role")}
                        </label>
                        <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800/50">
                          {userData.role === "ADMIN" ? (
                            <>
                              <Crown className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {t("roles.admin")}
                              </span>
                            </>
                          ) : (
                            <>
                              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {t("roles.user")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <Button
                          onClick={handleSave}
                          loading={saveLoading}
                          className="flex-1"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {saveLoading ? t("save.loading") : t("save.save")}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card variant="elevated" className="p-6">
                  <CardTitle className="mb-4 text-lg">
                    {t("accountInfo")}
                  </CardTitle>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                      <div>
                        <p className="text-slate-600 dark:text-gray-400">
                          {t("memberSince")}
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {formatDate(userData.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                      <Edit className="h-4 w-4 text-slate-500 dark:text-gray-400" />
                      <div>
                        <p className="text-slate-600 dark:text-gray-400">
                          {t("lastUpdate")}
                        </p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {formatDate(userData.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card variant="elevated" className="p-6">
                  <CardTitle className="mb-4 text-lg">
                    {t("activityStats")}
                  </CardTitle>

                  <div className="py-4 text-center">
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {t("activityStatsDescription")}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </PageLayout>
    </ProtectedRoute>
  );
};

export default UserProfilePage;
