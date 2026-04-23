"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Room = { status: string };

function StatCardShell({
  children,
  iconSlot,
  className,
}: {
  children: React.ReactNode;
  iconSlot: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      variant="elevated"
      className={cn(
        "group flex h-full min-h-0 flex-col justify-center overflow-x-hidden overflow-y-auto p-3 sm:p-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
        <div className="shrink-0">{iconSlot}</div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Card>
  );
}

export function StatTotalWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell
      iconSlot={
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-3 transition-transform duration-300 group-hover:scale-105">
          <Building2 className="h-6 w-6 text-emerald-400" />
        </div>
      }
    >
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
        {rooms.length}
      </p>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
        {t("stats.total")}
      </p>
    </StatCardShell>
  );
}

export function StatAvailableWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell
      iconSlot={
        <div className="rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-3 transition-transform duration-300 group-hover:scale-105">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-400">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
        </div>
      }
    >
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
        {rooms.filter(r => r.status === "LIVRE").length}
      </p>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
        {t("stats.available")}
      </p>
    </StatCardShell>
  );
}

export function StatInUseWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell
      iconSlot={
        <div className="rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 p-3 transition-transform duration-300 group-hover:scale-105">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-rose-400">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
        </div>
      }
    >
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
        {rooms.filter(r => r.status === "EM_USO").length}
      </p>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
        {t("stats.inUse")}
      </p>
    </StatCardShell>
  );
}

export function StatReservedWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell
      iconSlot={
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 p-3 transition-transform duration-300 group-hover:scale-105">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400">
            <div className="h-3 w-3 rounded-full bg-white" />
          </div>
        </div>
      }
    >
      <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
        {rooms.filter(r => r.status === "RESERVADO").length}
      </p>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">
        {t("stats.reserved")}
      </p>
    </StatCardShell>
  );
}
