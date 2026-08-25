"use client";

import {
  AlertTriangle,
  Bell,
  Building2,
  Calendar,
  ClipboardList,
  Clock,
  Compass,
  DoorOpen,
  Eye,
  LayoutDashboard,
  Network,
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
  const { isOrgAdmin, canAccessSolicitacoes, canAccessSalas } =
    useOrgPermissions();

  const myOrganizationsItem = {
    id: "inicio",
    label: t("menuItems.inicio.label"),
    icon: Building2,
    active: currentPage === "inicio",
  };

  const solicitacoesMenuItem = {
    id: "solicitacoes",
    label: t("menuItems.solicitacoes.label"),
    icon: ClipboardList,
    active: currentPage === "solicitacoes",
  };

  const salasMenuItem = {
    id: "salas",
    label: t("menuItems.salas.label"),
    icon: DoorOpen,
    active: currentPage === "salas",
  };

  const adminMenuItems = [
    {
      id: "dashboard",
      label: t("menuItems.dashboard.label"),
      icon: LayoutDashboard,
      active: currentPage === "dashboard",
    },
    salasMenuItem,
    solicitacoesMenuItem,
    {
      id: "setores",
      label: t("menuItems.setores.label"),
      icon: Network,
      active: currentPage === "setores",
    },
    {
      id: "agendamentos",
      label: t("menuItems.agendamentos.label"),
      icon: Calendar,
      active: currentPage === "agendamentos",
    },
    {
      id: "incidentes",
      label: t("menuItems.incidentes.label"),
      icon: AlertTriangle,
      active: currentPage === "incidentes",
    },
    {
      id: "grade-horaria",
      label: t("menuItems.gradeHoraria.label"),
      icon: Clock,
      active: currentPage.startsWith("grade-horaria"),
    },
    {
      id: "vision",
      label: t("menuItems.vision.label"),
      icon: Eye,
      active: currentPage === "vision",
    },
    {
      id: "users",
      label: t("menuItems.users.label"),
      icon: Users,
      active: currentPage === "users",
    },
    {
      id: "profile",
      label: t("menuItems.profile.label"),
      icon: User,
      active: currentPage === "profile",
    },
    {
      id: "notificacoes",
      label: t("menuItems.notificacoes.label"),
      icon: Bell,
      active: currentPage === "notificacoes",
    },
    {
      id: "configuracoes",
      label: t("menuItems.configuracoes.label"),
      icon: Settings,
      active: currentPage === "configuracoes",
    },
  ];

  const memberMenuItems = [
    {
      id: "explorar",
      label: t("menuItems.explorar.label"),
      icon: Compass,
      active: currentPage === "explorar",
    },
    ...(canAccessSalas ? [salasMenuItem] : []),
    ...(canAccessSolicitacoes ? [solicitacoesMenuItem] : []),
    {
      id: "agendamentos",
      label: t("menuItems.agendamentosMember.label"),
      icon: Calendar,
      active: currentPage === "agendamentos",
    },
    {
      id: "incidentes",
      label: t("menuItems.incidentesMember.label"),
      icon: AlertTriangle,
      active: currentPage === "incidentes",
    },
    {
      id: "profile",
      label: t("menuItems.profile.label"),
      icon: User,
      active: currentPage === "profile",
    },
    {
      id: "notificacoes",
      label: t("menuItems.notificacoes.label"),
      icon: Bell,
      active: currentPage === "notificacoes",
    },
  ];

  const menuItems = isOrgAdmin ? adminMenuItems : memberMenuItems;

  return (
    <div
      className={cn(
        "flex flex-col border-border bg-sidebar text-sidebar-foreground",
        variant === "desktop" &&
          "sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r md:flex",
        variant === "mobile" && "h-full min-h-0 w-full border-0"
      )}
    >
      {variant !== "mobile" && (
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight text-foreground">
                {tCommon("systemName")}
              </h1>
              <p className="truncate text-[11px] text-muted-foreground">
                {tCommon("systemDescription")}
              </p>
            </div>
          </div>
        </div>
      )}

      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col px-2 py-3",
          variant === "mobile" && "min-h-0"
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <h2 className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("navigation")}
          </h2>
          <ul className="space-y-0.5">
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

        <div className="mt-3 shrink-0 space-y-1 border-t border-border pt-3">
          <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("footer")}
          </p>
          <SidebarNavButton
            item={myOrganizationsItem}
            isNavigating={isNavigating}
            onNavigate={onNavigate}
          />
        </div>
      </nav>
    </div>
  );
};

type SidebarMenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
        "relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
        item.active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-1 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        isNavigating && !item.active && "cursor-not-allowed opacity-50",
        isNavigating && item.active && "opacity-80"
      )}
    >
      <IconComponent
        className={cn(
          "h-4 w-4 shrink-0",
          item.active ? "text-primary" : "text-muted-foreground"
        )}
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {isNavigating && item.active && (
        <div className="ml-auto h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      )}
    </button>
  );
}

export { Sidebar };
