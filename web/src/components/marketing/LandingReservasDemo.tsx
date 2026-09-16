"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Decision = "pending" | "approved" | "rejected";

type MockReservation = {
  id: string;
  roomKey: "lab1" | "lab2" | "auditorium";
  whenKey: "r1" | "r2" | "r3" | "r4";
  requesterKey: "u1" | "u2" | "u3" | "u4";
};

const INITIAL: MockReservation[] = [
  { id: "1", roomKey: "lab2", whenKey: "r1", requesterKey: "u1" },
  { id: "2", roomKey: "auditorium", whenKey: "r2", requesterKey: "u2" },
  { id: "3", roomKey: "lab1", whenKey: "r3", requesterKey: "u3" },
  { id: "4", roomKey: "lab2", whenKey: "r4", requesterKey: "u4" },
];

export function LandingReservasDemo() {
  const t = useTranslations("LandingPage.product");
  const [items, setItems] = useState(INITIAL);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const decide = (id: string, decision: "approved" | "rejected") => {
    setDecisions(prev => ({ ...prev, [id]: decision }));
    window.setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== id));
    }, 450);
  };

  const reset = () => {
    setItems(INITIAL);
    setDecisions({});
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {t("demos.reservations.hint")}
        </p>
        {items.length === 0 ? (
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            {t("demos.reservations.reset")}
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 px-5 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            {t("demos.reservations.empty")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map(item => {
            const decision = decisions[item.id] ?? "pending";
            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-xl border border-border bg-card px-4 py-3 transition-opacity duration-300",
                  decision !== "pending" && "opacity-50"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {t(`rooms.${item.roomKey}`)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`demos.reservations.when.${item.whenKey}`)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("demos.reservations.by", {
                        name: t(
                          `demos.reservations.requesters.${item.requesterKey}`
                        ),
                      })}
                    </p>
                  </div>

                  {decision === "pending" ? (
                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => decide(item.id, "approved")}
                      >
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        {t("demos.reservations.approve")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => decide(item.id, "rejected")}
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        {t("demos.reservations.reject")}
                      </Button>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        decision === "approved"
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {decision === "approved"
                        ? t("demos.reservations.approved")
                        : t("demos.reservations.rejected")}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
