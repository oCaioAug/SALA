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
  openLabel,
  interactive = true,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  openLabel: string;
  /** When false, renders a non-navigating card (landing demo). */
  interactive?: boolean;
}) {
  const body = (
    <Card
      variant="elevated"
      className={cn(
        "group flex h-full min-h-0 flex-col justify-between gap-3 overflow-x-hidden overflow-y-auto p-4 transition-colors",
        interactive && "hover:border-slate-400 dark:hover:border-slate-500"
      )}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 text-base font-semibold leading-snug text-foreground">
          {title}
        </h3>
        <p className="text-xs leading-snug text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>
      {interactive ? (
        <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
          {openLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </Card>
  );

  if (!interactive) {
    return <div className="block h-full min-h-0 min-w-0">{body}</div>;
  }

  return (
    <Link href={href} className="block h-full min-h-0 min-w-0">
      {body}
    </Link>
  );
}

export function ShortcutSalasWidget({
  interactive = true,
}: {
  interactive?: boolean;
}) {
  const th = useTranslations("DashboardHome");
  return (
    <ShortcutCard
      href="/salas"
      title={th("shortcutSalasTitle")}
      description={th("shortcutSalasDesc")}
      icon={DoorOpen}
      openLabel={th("open")}
      interactive={interactive}
    />
  );
}

export function ShortcutAgendamentosWidget({
  interactive = true,
}: {
  interactive?: boolean;
}) {
  const th = useTranslations("DashboardHome");
  return (
    <ShortcutCard
      href="/agendamentos"
      title={th("shortcutAgendamentosTitle")}
      description={th("shortcutAgendamentosDesc")}
      icon={Calendar}
      openLabel={th("open")}
      interactive={interactive}
    />
  );
}

export function ShortcutIncidentesWidget({
  interactive = true,
}: {
  interactive?: boolean;
}) {
  const th = useTranslations("DashboardHome");
  return (
    <ShortcutCard
      href="/incidentes"
      title={th("shortcutIncidentesTitle")}
      description={th("shortcutIncidentesDesc")}
      icon={AlertTriangle}
      openLabel={th("open")}
      interactive={interactive}
    />
  );
}
