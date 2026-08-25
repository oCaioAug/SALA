"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type IncidentStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

type MockIncident = {
  id: string;
  titleKey: "i1" | "i2" | "i3";
  roomKey: "lab1" | "lab2" | "auditorium";
  status: IncidentStatus;
};

const INITIAL: MockIncident[] = [
  { id: "1", titleKey: "i1", roomKey: "lab1", status: "OPEN" },
  { id: "2", titleKey: "i2", roomKey: "auditorium", status: "IN_PROGRESS" },
  { id: "3", titleKey: "i3", roomKey: "lab2", status: "OPEN" },
];

const NEXT: Record<IncidentStatus, IncidentStatus | null> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

export function LandingIncidentesDemo() {
  const t = useTranslations("LandingPage.product");
  const [items, setItems] = useState(INITIAL);

  const advance = (id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const next = NEXT[item.status];
        return next ? { ...item, status: next } : item;
      })
    );
  };

  const reset = () => setItems(INITIAL);

  const allResolved = items.every(item => item.status === "RESOLVED");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("demos.incidents.hint")}
        </p>
        {allResolved ? (
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            {t("demos.incidents.reset")}
          </Button>
        ) : null}
      </div>

      <ul className="space-y-3">
        {items.map(item => {
          const next = NEXT[item.status];
          return (
            <li
              key={item.id}
              className={cn(
                "rounded-xl border border-border bg-card px-4 py-3",
                item.status === "RESOLVED" && "opacity-60"
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      item.status === "RESOLVED"
                        ? "text-muted-foreground"
                        : "text-amber-600"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {t(`demos.incidents.items.${item.titleKey}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`rooms.${item.roomKey}`)}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
                        item.status === "OPEN" &&
                          "bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
                        item.status === "IN_PROGRESS" &&
                          "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
                        item.status === "RESOLVED" &&
                          "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                      )}
                    >
                      {t(`demos.incidents.status.${item.status}`)}
                    </span>
                  </div>
                </div>

                {next ? (
                  <Button
                    type="button"
                    size="sm"
                    variant={item.status === "OPEN" ? "primary" : "outline"}
                    onClick={() => advance(item.id)}
                  >
                    {t(`demos.incidents.actions.${item.status}`)}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
