"use client";

import {
  AlertTriangle,
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  ClipboardList,
  Clock,
  Compass,
  DoorOpen,
  Eye,
  GraduationCap,
  LayoutDashboard,
  Network,
  Play,
  Settings,
  User,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isNavigating?: boolean;
  /** desktop: barra lateral fixa; mobile: conteúdo dentro do drawer */
  variant?: "desktop" | "mobile";
}

type SidebarSubMenuItem = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
};

type SidebarMenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  children?: SidebarSubMenuItem[];
};

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

  const isGradeHorariaActive = currentPage.startsWith("grade-horaria");
  const [gradeHorariaOpen, setGradeHorariaOpen] = useState(isGradeHorariaActive);

  useEffect(() => {
    if (isGradeHorariaActive) {
      setGradeHorariaOpen(true);
    }
  }, [isGradeHorariaActive]);

  const myOrganizationsItem: SidebarMenuItem = {
    id: "inicio",
    label: t("menuItems.inicio.label"),
    icon: Building2,
    active: currentPage === "inicio",
  };

  const solicitacoesMenuItem: SidebarMenuItem = {
    id: "solicitacoes",
    label: t("menuItems.solicitacoes.label"),
    icon: ClipboardList,
    active: currentPage === "solicitacoes",
  };

  const salasMenuItem: SidebarMenuItem = {
    id: "salas",
    label: t("menuItems.salas.label"),
    icon: DoorOpen,
    active: currentPage === "salas",
  };

  const gradeHorariaSubItems: SidebarSubMenuItem[] = [
    {
      id: "grade-horaria",
      label: "Visão Geral",
      icon: Clock,
      active: currentPage === "grade-horaria",
    },
    {
      id: "grade-horaria-turmas",
      label: "Turmas",
      icon: Users,
      active: currentPage === "grade-horaria-turmas",
    },
    {
      id: "grade-horaria-disciplinas",
      label: "Disciplinas",
      icon: BookOpen,
      active: currentPage === "grade-horaria-disciplinas",
    },
    {
      id: "grade-horaria-professores",
      label: "Professores",
      icon: GraduationCap,
      active: currentPage === "grade-horaria-professores",
    },
    {
      id: "grade-horaria-cargas",
      label: "Cargas Horárias",
      icon: Clock,
      active: currentPage === "grade-horaria-cargas",
    },
    {
      id: "grade-horaria-disponibilidades",
      label: "Disponibilidades",
      icon: Calendar,
      active: currentPage === "grade-horaria-disponibilidades",
    },
    {
      id: "grade-horaria-gerar",
      label: "Gerar Grade",
      icon: Play,
      active: currentPage === "grade-horaria-gerar",
    },
    {
      id: "grade-horaria-configuracoes",
      label: "Configurações",
      icon: Settings,
      active: currentPage === "grade-horaria-configuracoes",
    },
  ];

  const adminMenuItems: SidebarMenuItem[] = [
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
      active: isGradeHorariaActive,
      children: gradeHorariaSubItems,
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

  const memberMenuItems: SidebarMenuItem[] = [
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
                {item.children ? (
                  <SidebarNavParentGroup
                    item={item}
                    isOpen={gradeHorariaOpen}
                    onToggle={() => setGradeHorariaOpen(prev => !prev)}
                    isNavigating={isNavigating}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <SidebarNavButton
                    item={item}
                    isNavigating={isNavigating}
                    onNavigate={onNavigate}
                  />
                )}
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

function SidebarNavParentGroup({
  item,
  isOpen,
  onToggle,
  isNavigating,
  onNavigate,
}: {
  item: SidebarMenuItem;
  isOpen: boolean;
  onToggle: () => void;
  isNavigating: boolean;
  onNavigate: (page: string) => void;
}) {
  const IconComponent = item.icon;

  const handleClick = () => {
    if (!isOpen) {
      onToggle();
      onNavigate(item.id);
    } else {
      onToggle();
    }
  };

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={handleClick}
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
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180 text-foreground"
          )}
        />
      </button>

      {isOpen && item.children && (
        <ul className="my-1 ml-4 space-y-0.5 border-l border-border/60 pl-3">
          {item.children.map(child => (
            <li key={child.id}>
              <SidebarSubNavButton
                item={child}
                isNavigating={isNavigating}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SidebarSubNavButton({
  item,
  isNavigating,
  onNavigate,
}: {
  item: SidebarSubMenuItem;
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
        "relative flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        item.active
          ? "bg-sidebar-accent/80 font-medium text-primary before:absolute before:inset-y-1 before:-left-3 before:w-0.5 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        isNavigating && !item.active && "cursor-not-allowed opacity-50",
        isNavigating && item.active && "opacity-80"
      )}
    >
      {IconComponent && (
        <IconComponent
          className={cn(
            "h-3.5 w-3.5 shrink-0",
            item.active ? "text-primary" : "text-muted-foreground"
          )}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {isNavigating && item.active && (
        <div className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      )}
    </button>
  );
}

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

