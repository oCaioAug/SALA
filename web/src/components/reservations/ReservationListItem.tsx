"use client";

import { ChevronRight, Clock, User as UserIcon } from "lucide-react";

import { getReservationStatusStyle } from "@/lib/reservations/status";
import { cn } from "@/lib/utils";

export interface ReservationListItemProps {
  title: string;
  userName?: string;
  startTime: Date;
  endTime: Date;
  purpose?: string | null;
  status: string;
  statusLabel: string;
  onClick: () => void;
  formatDateTime: (date: Date) => string;
}

export function ReservationListItem({
  title,
  userName,
  startTime,
  endTime,
  purpose,
  status,
  statusLabel,
  onClick,
  formatDateTime,
}: ReservationListItemProps) {
  const timeRange = `${formatDateTime(startTime)} – ${formatDateTime(endTime)}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-lg border border-border bg-card p-4 text-left transition-all",
        "hover:border-slate-300 hover:shadow-sm dark:hover:border-slate-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 ring-inset",
                getReservationStatusStyle(status)
              )}
            >
              {statusLabel}
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4">
            {userName ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">{userName}</span>
              </span>
            ) : null}
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{timeRange}</span>
            </span>
          </div>

          {purpose ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/80">
              {purpose}
            </p>
          ) : null}
        </div>

        <ChevronRight
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      </div>
    </button>
  );
}
