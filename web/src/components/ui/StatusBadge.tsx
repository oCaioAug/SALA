"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RoomBadgePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
  children: React.ReactNode;
}

function RoomBadgePill({ className, children, ...props }: RoomBadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const roomStatusStyles: Record<RoomStatus, string> = {
  LIVRE:
    "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300",
  EM_USO: "bg-rose-500/15 text-rose-800 ring-rose-500/25 dark:text-rose-300",
  RESERVADO:
    "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-200",
};

const activeReservationStyle =
  "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-200";

interface StatusBadgeProps {
  status: RoomStatus;
  className?: string;
}

function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations("Dashboard.filters");

  const statusLabels: Record<RoomStatus, string> = {
    LIVRE: t("statusFree"),
    EM_USO: t("statusInUse"),
    RESERVADO: t("statusReserved"),
  };

  return (
    <RoomBadgePill
      role="status"
      className={cn(roomStatusStyles[status], className)}
    >
      {statusLabels[status]}
    </RoomBadgePill>
  );
}

interface RoomActiveReservationBadgeProps {
  className?: string;
}

function RoomActiveReservationBadge({ className }: RoomActiveReservationBadgeProps) {
  const t = useTranslations("Dashboard.card");

  return (
    <RoomBadgePill
      role="status"
      className={cn(activeReservationStyle, className)}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
      {t("reservedTag")}
    </RoomBadgePill>
  );
}

interface RoomStatusBadgesProps {
  status: RoomStatus;
  hasActiveReservation?: boolean;
  className?: string;
}

function RoomStatusBadges({
  status,
  hasActiveReservation = false,
  className,
}: RoomStatusBadgesProps) {
  const showActiveReservation =
    hasActiveReservation && status !== "RESERVADO";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <StatusBadge status={status} />
      {showActiveReservation ? <RoomActiveReservationBadge /> : null}
    </div>
  );
}

export {
  RoomActiveReservationBadge,
  RoomBadgePill,
  RoomStatusBadges,
  StatusBadge,
};
