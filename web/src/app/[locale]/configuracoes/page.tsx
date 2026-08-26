"use client";

import { Bell, Palette, Settings, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { AppPreferencesControls } from "@/components/preferences/AppPreferencesControls";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { Link } from "@/navigation";

const ConfiguracoesPage: React.FC = () => {
  const t = useTranslations("SettingsPage");
  const [currentPage, setCurrentPage] = useState("configuracoes");

  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const handleNotificationClick = () => {
    navigate("notificacoes");
  };

  return (
    <OrgAdminGuard>
      <PageLayout
        currentPage={currentPage}
        onNavigate={navigate}
        isNavigating={isNavigating}
        onNotificationClick={handleNotificationClick}
        notificationUpdateTrigger={0}
      >
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <Settings className="h-8 w-8 text-yellow-500" />
            <div>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {t("title")}
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                {t("description")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/profile" className="block">
            <Card variant="elevated" hover className="h-full cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-500">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-lg">
                      {t("items.profile.title")}
                    </CardTitle>
                    <p className="mb-4 text-sm text-slate-600 dark:text-gray-400">
                      {t("items.profile.description")}
                    </p>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {t("actions.configure")} →
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/notificacoes" className="block">
            <Card variant="elevated" hover className="h-full cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-500">
                    <Bell className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-lg">
                      {t("items.notifications.title")}
                    </CardTitle>
                    <p className="mb-4 text-sm text-slate-600 dark:text-gray-400">
                      {t("items.notifications.description")}
                    </p>
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      {t("actions.configure")} →
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card variant="elevated" className="h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-500">
                  <Palette className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <CardTitle className="mb-2 text-lg">
                    {t("items.appearance.title")}
                  </CardTitle>
                  <p className="mb-4 text-sm text-slate-600 dark:text-gray-400">
                    {t("items.appearance.description")}
                  </p>
                  <AppPreferencesControls
                    variant="tenant"
                    showLabels
                    languageDropdownPlacement="bottom"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12">
          <Card variant="elevated">
            <CardContent className="p-6">
              <h3 className="mb-4 text-xl font-semibold">{t("systemInfo")}</h3>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-slate-600 dark:text-gray-400">
                    {t("version")}:
                  </span>
                  <span className="ml-2 text-slate-900 dark:text-white">
                    1.0.0
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-gray-400">
                    {t("lastUpdate")}:
                  </span>
                  <span className="ml-2 text-slate-900 dark:text-white">
                    {t("today")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-gray-400">
                    {t("databaseStatus")}:
                  </span>
                  <span className="ml-2 text-green-500">{t("connected")}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-gray-400">
                    {t("currentUser")}:
                  </span>
                  <span className="ml-2 text-slate-900 dark:text-white">
                    {t("system")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default ConfiguracoesPage;
