"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, ArrowRight, Calendar, DoorOpen } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/Card";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";

function ShortcutCard({
  href,
  title,
  description,
  icon: Icon,
  gradientClass,
  openLabel,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradientClass: string;
  openLabel: string;
}) {
  return (
    <Link href={href} className="block h-full min-h-0 min-w-0">
      <Card
        variant="elevated"
        className="group flex h-full min-h-0 flex-col justify-between gap-3 overflow-hidden p-4 transition-shadow hover:shadow-xl"
      >
        <div
          className={cn(
            "inline-flex w-fit shrink-0 rounded-xl bg-gradient-to-br p-3",
            gradientClass
          )}
        >
          <Icon className="h-6 w-6 text-slate-800 dark:text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-base font-semibold leading-snug text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs leading-snug text-slate-600 dark:text-slate-400 sm:text-sm">
            {description}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
          {openLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Card>
    </Link>
  );
}

export function ShortcutSalasWidget() {
  const th = useTranslations("DashboardHome");
  return (
    <ShortcutCard
      href="/salas"
      title={th("shortcutSalasTitle")}
      description={th("shortcutSalasDesc")}
      icon={DoorOpen}
      gradientClass="from-blue-500/20 to-purple-500/20"
      openLabel={th("open")}
    />
  );
}

export function ShortcutAgendamentosWidget() {
  const th = useTranslations("DashboardHome");
  return (
    <ShortcutCard
      href="/agendamentos"
      title={th("shortcutAgendamentosTitle")}
      description={th("shortcutAgendamentosDesc")}
      icon={Calendar}
      gradientClass="from-emerald-500/20 to-teal-500/20"
      openLabel={th("open")}
    />
  );
}

export function ShortcutIncidentesWidget() {
  const th = useTranslations("DashboardHome");
  return (
    <ShortcutCard
      href="/incidentes"
      title={th("shortcutIncidentesTitle")}
      description={th("shortcutIncidentesDesc")}
      icon={AlertTriangle}
      gradientClass="from-amber-500/20 to-orange-500/20"
      openLabel={th("open")}
    />
  );
}
