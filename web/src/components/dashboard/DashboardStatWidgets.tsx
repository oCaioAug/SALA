"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type Room = { status: string };

function StatCardShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      variant="elevated"
      className={cn(
        "flex h-full min-h-0 flex-col justify-center overflow-x-hidden overflow-y-auto p-3 sm:p-4",
        className
      )}
    >
      <div className="min-w-0">{children}</div>
    </Card>
  );
}

export function StatTotalWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <p className="text-xs font-medium sm:text-sm">{t("stats.total")}</p>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {rooms.length}
      </p>
    </StatCardShell>
  );
}

export function StatAvailableWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-600" />
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          {t("stats.available")}
        </p>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {rooms.filter(r => r.status === "LIVRE").length}
      </p>
    </StatCardShell>
  );
}

export function StatInUseWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-600" />
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          {t("stats.inUse")}
        </p>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {rooms.filter(r => r.status === "EM_USO").length}
      </p>
    </StatCardShell>
  );
}

export function StatReservedWidget({ rooms }: { rooms: Room[] }) {
  const t = useTranslations("Dashboard");
  return (
    <StatCardShell>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-slate-600" />
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">
          {t("stats.reserved")}
        </p>
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
        {rooms.filter(r => r.status === "RESERVADO").length}
      </p>
    </StatCardShell>
  );
}
