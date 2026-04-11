"use client";

import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

import {
  DASHBOARD_WIDGET_GRID_KEY,
  DASHBOARD_WIDGET_IDS,
  type DashboardWidgetId,
  WIDGET_DRAG_MIME,
} from "@/lib/dashboardLayout";

type Props = {
  hiddenIds: ReadonlySet<DashboardWidgetId>;
  onPaletteDragStart: (id: DashboardWidgetId) => void;
  onPaletteDragEnd: () => void;
  onAddClick: (id: DashboardWidgetId) => void;
};

export function DashboardWidgetPalette({
  hiddenIds,
  onPaletteDragStart,
  onPaletteDragEnd,
  onAddClick,
}: Props) {
  const tGrid = useTranslations("DashboardHome.grid");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {tGrid("paletteHint")}
      </p>
      <ul className="flex flex-col gap-2">
        {DASHBOARD_WIDGET_IDS.map((id) => {
          const title = tGrid(DASHBOARD_WIDGET_GRID_KEY[id]);
          const isHidden = hiddenIds.has(id);

          return (
            <li key={id}>
              <div
                draggable
                className="flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-900/60"
                onDragStart={(e) => {
                  onPaletteDragStart(id);
                  e.dataTransfer.effectAllowed = "copy";
                  e.dataTransfer.setData(WIDGET_DRAG_MIME, id);
                  e.dataTransfer.setData("text/plain", id);
                }}
                onDragEnd={() => onPaletteDragEnd()}
              >
                <GripVertical
                  className="h-5 w-5 shrink-0 text-slate-400"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isHidden
                      ? tGrid("paletteHiddenBadge")
                      : tGrid("paletteOnBoardBadge")}
                  </div>
                </div>
                {isHidden ? (
                  <button
                    type="button"
                    className="dashboard-widget-no-drag shrink-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onAddClick(id);
                    }}
                  >
                    {tGrid("paletteAddButton")}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
