"use client";

import {
  Bell,
  Database,
  Palette,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useLocale, useTranslations } from "next-intl";

const ConfiguracoesPage: React.FC = () => {
  const t = useTranslations("SettingsPage");
  const locale = useLocale();
  const [currentPage, setCurrentPage] = useState("configuracoes");
  const { showInfo } = useApp();

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const handleNotificationClick = () => {
    console.log("Notificação clicada");
  };

  const configuracoesItems = [
    {
      id: "perfil",
      title: t("items.profile.title"),
      description: t("items.profile.description"),
      icon: <UserIcon className="w-6 h-6" />,
      action: () => showInfo(t("items.showInfo")),
      url: "/profile",
    },
    {
      id: "notificacoes",
      title: t("items.notifications.title"),
      description: t("items.notifications.description"),
      icon: <Bell className="w-6 h-6" />,
      action: () => showInfo(t("items.showInfo")),
      url: "/notifications",
    },
    {
      id: "seguranca",
      title: t("items.security.title"),
      description: t("items.security.description"),
      icon: <Shield className="w-6 h-6" />,
      action: () => showInfo(t("items.showInfo")),
      url: "/security",
    },
    {
      id: "banco-dados",
      title: t("items.database.title"),
      description: t("items.database.description"),
      icon: <Database className="w-6 h-6" />,
      action: () => showInfo(t("items.showInfo")),
      url: "/database",
    },
    {
      id: "aparencia",
      title: t("items.appearance.title"),
      description: t("items.appearance.description"),
      icon: <Palette className="w-6 h-6" />,
      action: () => showInfo(t("items.showInfo")),
      url: "/appearance",
    },
  ];

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={handleNotificationClick}
      notificationUpdateTrigger={0}
    >
      {/* Header da página */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-slate-600 dark:text-gray-400">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {configuracoesItems.map(item => (
          <Card
            key={item.id}
            variant="elevated"
            hover
            className="cursor-pointer"
            onClick={item.action}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg text-yellow-500">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{item.title}</CardTitle>
                  <p className="text-slate-600 dark:text-gray-400 text-sm mb-4">
                    {item.description}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={e => {
                      e.stopPropagation();
                      item.action();
                    }}
                  >
                    <Link href={item.url} className="w-full">
                      {t("actions.configure")}
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações do sistema */}
      <div className="mt-12">
        <Card variant="elevated">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">{t("systemInfo")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-gray-400">
                  {t("version")}:
                </span>
                <span className="text-slate-900 dark:text-white ml-2">
                  1.0.0
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-gray-400">
                  {t("lastUpdate")}:
                </span>
                <span className="text-slate-900 dark:text-white ml-2">
                  {t("today")}
                </span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-gray-400">
                  {t("databaseStatus")}:
                </span>
                <span className="text-green-500 ml-2">{t("connected")}</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-gray-400">
                  {t("currentUser")}:
                </span>
                <span className="text-slate-900 dark:text-white ml-2">
                  {t("system")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ConfiguracoesPage;
