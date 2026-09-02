"use client";

import {
  Building2,
  CalendarClock,
  FileText,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ElementType, ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { ReservationWithUser } from "@/lib/types";
import { getReservationStatusStyle } from "@/lib/reservations/status";
import { cn } from "@/lib/utils";

interface ReservationDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationWithUser | null;
  roomName: string;
  canCancel: boolean;
  onCancel: () => void;
  formatDateTime: (date: Date) => string;
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ElementType;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground ring-1 ring-border">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

export function ReservationDetailsDrawer({
  isOpen,
  onClose,
  reservation,
  roomName,
  canCancel,
  onCancel,
  formatDateTime,
}: ReservationDetailsDrawerProps) {
  const t = useTranslations("SchedulesPage");

  const getStatusText = (status: string): string => {
    switch (status) {
      case "PENDING":
        return t("statusFilter.pending");
      case "APPROVED":
        return t("statusFilter.approved");
      case "ACTIVE":
        return t("statusFilter.active");
      case "CANCELLED":
        return t("statusFilter.cancelled");
      case "COMPLETED":
        return t("statusFilter.completed");
      default:
        return t("statusFilter.unknown");
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("modal.details")}
      description={reservation ? roomName : undefined}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} className="sm:min-w-[7rem]">
            {t("close")}
          </Button>
          {canCancel && reservation ? (
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("cancelReservation")}
            </Button>
          ) : null}
        </div>
      }
    >
      {reservation ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("room")}
                </p>
                <p className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{roomName}</span>
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                  getReservationStatusStyle(reservation.status)
                )}
              >
                {getStatusText(reservation.status)}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              {t("start")} / {t("end")}
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm text-muted-foreground">{t("start")}</span>
                <span className="text-right text-sm font-medium text-foreground">
                  {formatDateTime(new Date(reservation.startTime))}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="text-sm text-muted-foreground">{t("end")}</span>
                <span className="text-right text-sm font-medium text-foreground">
                  {formatDateTime(new Date(reservation.endTime))}
                </span>
              </div>
            </div>
          </div>

          <DetailRow icon={UserIcon} label={t("user")}>
            <span className="truncate">{reservation.user.name}</span>
          </DetailRow>

          {reservation.purpose ? (
            <DetailRow icon={FileText} label={t("purpose")}>
              <p className="whitespace-pre-wrap font-normal leading-relaxed text-foreground">
                {reservation.purpose}
              </p>
            </DetailRow>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
