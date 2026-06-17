"use client";

import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  Compass,
  DoorOpen,
  Eye,
  LayoutDashboard,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isNavigating?: boolean;
  /** desktop: barra lateral fixa; mobile: conteúdo dentro do drawer */
  variant?: "desktop" | "mobile";
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isNavigating = false,
  variant = "desktop",
}) => {
  const t = useTranslations("Sidebar");
  const tCommon = useTranslations("Common");
  const { isOrgAdmin } = useOrgPermissions();

  const myOrganizationsItem = {
    id: "inicio",
    label: t("menuItems.inicio.label"),
    icon: Building2,
    description: t("menuItems.inicio.description"),
    active: currentPage === "inicio",
  };

  const adminMenuItems = [
    {
      id: "dashboard",
      label: t("menuItems.dashboard.label"),
      icon: LayoutDashboard,
      description: t("menuItems.dashboard.description"),
      active: currentPage === "dashboard",
    },
    {
      id: "salas",
      label: t("menuItems.salas.label"),
      icon: DoorOpen,
      description: t("menuItems.salas.description"),
      active: currentPage === "salas",
    },
    {
      id: "solicitacoes",
      label: t("menuItems.solicitacoes.label"),
      icon: ClipboardList,
      description: t("menuItems.solicitacoes.description"),
      active: currentPage === "solicitacoes",
    },
    {
      id: "agendamentos",
      label: t("menuItems.agendamentos.label"),
      icon: Calendar,
      description: t("menuItems.agendamentos.description"),
      active: currentPage === "agendamentos",
    },
    {
      id: "incidentes",
      label: t("menuItems.incidentes.label"),
      icon: AlertTriangle,
      description: t("menuItems.incidentes.description"),
      active: currentPage === "incidentes",
    },
    {
      id: "vision",
      label: t("menuItems.vision.label"),
      icon: Eye,
      description: t("menuItems.vision.description"),
      active: currentPage === "vision",
    },
    {
      id: "users",
      label: t("menuItems.users.label"),
      icon: Users,
      description: t("menuItems.users.description"),
      active: currentPage === "users",
    },
    {
      id: "profile",
      label: t("menuItems.profile.label"),
      icon: User,
      description: t("menuItems.profile.description"),
      active: currentPage === "profile",
    },
    {
      id: "notificacoes",
      label: t("menuItems.notificacoes.label"),
      icon: Bell,
      description: t("menuItems.notificacoes.description"),
      active: currentPage === "notificacoes",
    },
    {
      id: "configuracoes",
      label: t("menuItems.configuracoes.label"),
      icon: Settings,
      description: t("menuItems.configuracoes.description"),
      active: currentPage === "configuracoes",
    },
  ];

  const memberMenuItems = [
    {
      id: "explorar",
      label: t("menuItems.explorar.label"),
      icon: Compass,
      description: t("menuItems.explorar.description"),
      active: currentPage === "explorar",
    },
    {
      id: "agendamentos",
      label: t("menuItems.agendamentosMember.label"),
      icon: Calendar,
      description: t("menuItems.agendamentosMember.description"),
      active: currentPage === "agendamentos",
    },
    {
      id: "incidentes",
      label: t("menuItems.incidentesMember.label"),
      icon: AlertTriangle,
      description: t("menuItems.incidentesMember.description"),
      active: currentPage === "incidentes",
    },
    {
      id: "profile",
      label: t("menuItems.profile.label"),
      icon: User,
      description: t("menuItems.profile.description"),
      active: currentPage === "profile",
    },
    {
      id: "notificacoes",
      label: t("menuItems.notificacoes.label"),
      icon: Bell,
      description: t("menuItems.notificacoes.description"),
      active: currentPage === "notificacoes",
    },
  ];

  const menuItems = isOrgAdmin ? adminMenuItems : memberMenuItems;

  return (
    <div
      className={cn(
        "flex flex-col border-slate-200 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 shadow-2xl transition-colors duration-300 dark:border-slate-700/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900",
        variant === "desktop" &&
          "sticky top-0 hidden h-screen w-72 shrink-0 overflow-y-auto border-r md:flex",
        variant === "mobile" && "h-full min-h-0 w-full border-0 shadow-none"
      )}
    >
      {variant !== "mobile" && (
        <div className="border-b border-slate-200 p-6 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {tCommon("systemName")}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {tCommon("systemDescription")}
              </p>
            </div>
          </div>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-slate-400 to-transparent dark:via-slate-600"></div>
        </div>
      )}

      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col px-4 py-6",
          variant === "mobile" && "min-h-0"
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {t("navigation")}
          </h2>
          <ul className="space-y-1">
            {menuItems.map(item => (
              <li key={item.id}>
                <SidebarNavButton
                  item={item}
                  isNavigating={isNavigating}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 shrink-0 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700/50">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {t("footer")}
          </p>
          <SidebarNavButton
            item={myOrganizationsItem}
            isNavigating={isNavigating}
            onNavigate={onNavigate}
          />
          <div className="rounded-xl border border-slate-300 bg-slate-200/80 p-4 transition-colors duration-300 dark:border-slate-700/50 dark:bg-slate-800/50">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {tCommon("online")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-500">
              {tCommon("lastUpdate")}
            </p>
          </div>
        </div>
      </nav>
    </div>
  );
};

type SidebarMenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  active: boolean;
};

function SidebarNavButton({
  item,
  isNavigating,
  onNavigate,
}: {
  item: SidebarMenuItem;
  isNavigating: boolean;
  onNavigate: (page: string) => void;
}) {
  const IconComponent = item.icon;

  return (
    <button
      type="button"
      onClick={() => onNavigate(item.id)}
      disabled={isNavigating}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left transition-all duration-300",
        item.active
          ? "border border-blue-500/30 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-slate-900 shadow-lg dark:text-white"
          : "text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 hover:shadow-md dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-white",
        isNavigating && !item.active && "cursor-not-allowed opacity-50",
        isNavigating && item.active && "animate-pulse"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-300",
          !item.active && "group-hover:opacity-100"
        )}
      />
      <div
        className={cn(
          "relative z-10 rounded-lg p-2 transition-all duration-300",
          item.active
            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
            : "bg-slate-200/80 text-slate-600 group-hover:bg-slate-300 group-hover:text-slate-900 dark:bg-slate-700/50 dark:text-slate-400 dark:group-hover:bg-slate-600 dark:group-hover:text-white"
        )}
      >
        <IconComponent className="h-4 w-4" />
      </div>
      <div className="relative z-10 min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{item.label}</div>
        <div
          className={cn(
            "truncate text-xs transition-colors duration-300",
            item.active
              ? "text-blue-600 dark:text-blue-200"
              : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
          )}
        >
          {item.description}
        </div>
      </div>
      {item.active && (
        <div className="relative z-10 h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
      )}
      {isNavigating && item.active && (
        <div className="relative z-10 ml-auto h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-900 dark:border-t-white" />
      )}
      {!item.active && (
        <ChevronRight className="relative z-10 h-4 w-4 text-slate-500 transition-colors duration-300 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
      )}
    </button>
  );
}

export { Sidebar };
