"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { cn } from "@/lib/utils";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri";
type SlotKey = "morning" | "afternoon";

type Booking = {
  day: DayKey;
  slot: SlotKey;
  roomKey: "lab1" | "lab2" | "auditorium";
  titleKey: "b1" | "b2" | "b3";
};

const DAYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri"];
const SLOTS: SlotKey[] = ["morning", "afternoon"];

const BOOKINGS: Booking[] = [
  { day: "mon", slot: "morning", roomKey: "lab2", titleKey: "b1" },
  { day: "wed", slot: "afternoon", roomKey: "auditorium", titleKey: "b2" },
  { day: "fri", slot: "morning", roomKey: "lab1", titleKey: "b3" },
];

function bookingAt(day: DayKey, slot: SlotKey) {
  return BOOKINGS.find(b => b.day === day && b.slot === slot);
}

export function LandingCalendarioDemo() {
  const t = useTranslations("LandingPage.product");
  const [selected, setSelected] = useState<string | null>("wed-afternoon");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("demos.calendar.hint")}
      </p>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[88px_repeat(5,1fr)] border-b border-border">
            <div className="p-2" />
            {DAYS.map(day => (
              <div
                key={day}
                className="border-l border-border px-2 py-2.5 text-center text-xs font-semibold text-foreground"
              >
                {t(`demos.calendar.days.${day}`)}
              </div>
            ))}
          </div>

          {SLOTS.map(slot => (
            <div
              key={slot}
              className="grid grid-cols-[88px_repeat(5,1fr)] border-b border-border last:border-b-0"
            >
              <div className="flex items-center px-3 py-3 text-xs font-medium text-muted-foreground">
                {t(`demos.calendar.slots.${slot}`)}
              </div>
              {DAYS.map(day => {
                const key = `${day}-${slot}`;
                const booking = bookingAt(day, slot);
                const isSelected = selected === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={cn(
                      "min-h-[72px] border-l border-border p-2 text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 ring-1 ring-inset ring-primary/40"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {booking ? (
                      <div className="rounded-md bg-slate-900 px-2 py-1.5 text-white dark:bg-slate-100 dark:text-slate-900">
                        <p className="truncate text-[11px] font-semibold">
                          {t(`rooms.${booking.roomKey}`)}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] opacity-80">
                          {t(`demos.calendar.bookings.${booking.titleKey}`)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/70">
                        {t("demos.calendar.free")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {selected ? (
        <p className="text-xs text-muted-foreground">
          {(() => {
            const [day, slot] = selected.split("-") as [DayKey, SlotKey];
            const booking = bookingAt(day, slot);
            if (!booking) {
              return t("demos.calendar.selectedFree", {
                day: t(`demos.calendar.days.${day}`),
                slot: t(`demos.calendar.slots.${slot}`),
              });
            }
            return t("demos.calendar.selectedBusy", {
              day: t(`demos.calendar.days.${day}`),
              slot: t(`demos.calendar.slots.${slot}`),
              room: t(`rooms.${booking.roomKey}`),
              title: t(`demos.calendar.bookings.${booking.titleKey}`),
            });
          })()}
        </p>
      ) : null}
    </div>
  );
}
