"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Play,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import { PageLayout } from "@/components/layout/PageLayout";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

const ICON_ACCENTS = [
  "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
  "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200",
] as const;

type HubMenuItem = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
};

const GradeHorariaPage: React.FC = () => {
  const t = useTranslations("GradeHoraria.hub");
  const tCommon = useTranslations("GradeHoraria.common");
  const [currentPage, setCurrentPage] = useState("grade-horaria");

  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });

  const menuItems: HubMenuItem[] = [
    {
      id: "turmas",
      title: t("menu.classes.title"),
      description: t("menu.classes.description"),
      icon: Users,
      url: "/grade-horaria/turmas",
    },
    {
      id: "disciplinas",
      title: t("menu.subjects.title"),
      description: t("menu.subjects.description"),
      icon: BookOpen,
      url: "/grade-horaria/disciplinas",
    },
    {
      id: "professores",
      title: t("menu.teachers.title"),
      description: t("menu.teachers.description"),
      icon: GraduationCap,
      url: "/grade-horaria/professores",
    },
    {
      id: "cargas",
      title: t("menu.loads.title"),
      description: t("menu.loads.description"),
      icon: Clock,
      url: "/grade-horaria/cargas",
    },
    {
      id: "disponibilidades",
      title: t("menu.availability.title"),
      description: t("menu.availability.description"),
      icon: Calendar,
      url: "/grade-horaria/disponibilidades",
    },
    {
      id: "gerar",
      title: t("menu.generate.title"),
      description: t("menu.generate.description"),
      icon: Play,
      url: "/grade-horaria/gerar",
    },
    {
      id: "configuracoes",
      title: t("menu.settings.title"),
      description: t("menu.settings.description"),
      icon: Settings,
      url: "/grade-horaria/configuracoes",
    },
  ];

  return (
    <OrgAdminGuard>
      <PageLayout
        currentPage={currentPage}
        onNavigate={navigate}
        isNavigating={isNavigating}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-blue-500" />
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

        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const accent = ICON_ACCENTS[index % ICON_ACCENTS.length];

            return (
              <Link
                key={item.id}
                href={item.url}
                className={cn(
                  "group flex h-full flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-all duration-200",
                  "hover:border-slate-300 hover:shadow-md dark:hover:border-slate-600",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
                    accent
                  )}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </div>

                <h2 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-slate-600 transition-colors group-hover:text-foreground dark:text-slate-400">
                  {tCommon("access")}
                  <ArrowRight
                    className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default GradeHorariaPage;
