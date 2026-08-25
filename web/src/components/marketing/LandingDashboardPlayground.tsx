"use client";

import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import type {
  Layout,
  LayoutItem,
  ResponsiveLayouts,
} from "react-grid-layout/legacy";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";

import "react-grid-layout/css/styles.css";

import type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";
import {
  DashboardChartRoomStatusTile,
  DashboardChartWeeklyTile,
} from "@/components/dashboard/DashboardChartTiles";
import {
  DashboardIncidentTile,
  DashboardSolicitationsTile,
} from "@/components/dashboard/DashboardIncidentTiles";
import { ShortcutSalasWidget } from "@/components/dashboard/DashboardShortcutWidgets";
import {
  StatAvailableWidget,
  StatInUseWidget,
  StatReservedWidget,
  StatTotalWidget,
} from "@/components/dashboard/DashboardStatWidgets";
import { Button } from "@/components/ui/Button";
import { DASHBOARD_GRID_COLS } from "@/lib/dashboardLayout";
import { cn } from "@/lib/utils";

const ResponsiveGrid = WidthProvider(Responsive);

const DEMO_ROOMS = [
  { status: "LIVRE" },
  { status: "LIVRE" },
  { status: "LIVRE" },
  { status: "LIVRE" },
  { status: "LIVRE" },
  { status: "EM_USO" },
  { status: "RESERVADO" },
  { status: "RESERVADO" },
];

const DEMO_CHART_STATS: DashboardChartStats = {
  scope: "all",
  weeklyReservations: [
    { key: "w1", label: "2026-06-29", count: 2 },
    { key: "w2", label: "2026-07-06", count: 4 },
    { key: "w3", label: "2026-07-13", count: 3 },
    { key: "w4", label: "2026-07-20", count: 7 },
    { key: "w5", label: "2026-07-27", count: 5 },
    { key: "w6", label: "2026-08-03", count: 9 },
    { key: "w7", label: "2026-08-10", count: 11 },
    { key: "w8", label: "2026-08-17", count: 8 },
  ],
  reservationStatus: [
    { status: "APPROVED", count: 12 },
    { status: "PENDING", count: 3 },
    { status: "REJECTED", count: 1 },
  ],
  topRooms: [
    { name: "Lab 2", count: 9 },
    { name: "Auditório", count: 6 },
    { name: "Lab 1", count: 4 },
  ],
  incidents: {
    byStatus: [
      { status: "REPORTED", count: 2 },
      { status: "IN_PROGRESS", count: 1 },
    ],
    total: 3,
    open: 2,
  },
  solicitations: { pending: 2 },
};

type PlaygroundId =
  | "stat-total"
  | "stat-available"
  | "stat-in-use"
  | "stat-reserved"
  | "chart-room-status"
  | "chart-weekly"
  | "shortcut-salas"
  | "widget-solicitations"
  | "widget-incidents";

function item(
  id: PlaygroundId,
  x: number,
  y: number,
  w: number,
  h: number,
  minW: number,
  minH: number
): LayoutItem {
  return { i: id, x, y, w, h, minW, minH };
}

const DEFAULT_LAYOUTS: ResponsiveLayouts = {
  lg: [
    item("stat-total", 0, 0, 3, 6, 2, 4),
    item("stat-available", 3, 0, 3, 6, 2, 4),
    item("stat-in-use", 6, 0, 3, 6, 2, 4),
    item("stat-reserved", 9, 0, 3, 6, 2, 4),
    item("chart-room-status", 0, 6, 4, 9, 2, 6),
    item("chart-weekly", 4, 6, 8, 9, 3, 6),
    item("shortcut-salas", 0, 15, 4, 8, 2, 5),
    item("widget-solicitations", 4, 15, 4, 8, 2, 5),
    item("widget-incidents", 8, 15, 4, 8, 2, 5),
  ],
  md: [
    item("stat-total", 0, 0, 2, 5, 2, 4),
    item("stat-available", 2, 0, 3, 5, 2, 4),
    item("stat-in-use", 5, 0, 2, 5, 2, 4),
    item("stat-reserved", 7, 0, 3, 5, 2, 4),
    item("chart-room-status", 0, 5, 4, 9, 2, 6),
    item("chart-weekly", 4, 5, 6, 9, 3, 6),
    item("shortcut-salas", 0, 14, 3, 8, 2, 5),
    item("widget-solicitations", 3, 14, 4, 8, 2, 5),
    item("widget-incidents", 7, 14, 3, 8, 2, 5),
  ],
  sm: [
    item("stat-total", 0, 0, 3, 5, 2, 4),
    item("stat-available", 3, 0, 3, 5, 2, 4),
    item("stat-in-use", 0, 5, 3, 5, 2, 4),
    item("stat-reserved", 3, 5, 3, 5, 2, 4),
    item("chart-room-status", 0, 10, 6, 9, 2, 6),
    item("chart-weekly", 0, 19, 6, 9, 3, 6),
    item("shortcut-salas", 0, 28, 6, 7, 2, 5),
    item("widget-solicitations", 0, 35, 6, 8, 2, 5),
    item("widget-incidents", 0, 43, 6, 8, 2, 5),
  ],
  xs: [
    item("stat-total", 0, 0, 2, 5, 2, 4),
    item("stat-available", 2, 0, 2, 5, 2, 4),
    item("stat-in-use", 0, 5, 2, 5, 2, 4),
    item("stat-reserved", 2, 5, 2, 5, 2, 4),
    item("chart-room-status", 0, 10, 4, 9, 2, 6),
    item("chart-weekly", 0, 19, 4, 9, 2, 6),
    item("shortcut-salas", 0, 28, 4, 7, 2, 5),
    item("widget-solicitations", 0, 35, 4, 8, 2, 5),
    item("widget-incidents", 0, 43, 4, 8, 2, 5),
  ],
  xxs: [
    item("stat-total", 0, 0, 2, 5, 2, 4),
    item("stat-available", 0, 5, 2, 5, 2, 4),
    item("stat-in-use", 0, 10, 2, 5, 2, 4),
    item("stat-reserved", 0, 15, 2, 5, 2, 4),
    item("chart-room-status", 0, 20, 2, 8, 2, 6),
    item("chart-weekly", 0, 28, 2, 8, 2, 6),
    item("shortcut-salas", 0, 36, 2, 7, 2, 5),
    item("widget-solicitations", 0, 43, 2, 8, 2, 5),
    item("widget-incidents", 0, 51, 2, 8, 2, 5),
  ],
};

const WIDGET_LABEL_KEY: Record<PlaygroundId, string> = {
  "stat-total": "widgetStatTotal",
  "stat-available": "widgetStatAvailable",
  "stat-in-use": "widgetStatInUse",
  "stat-reserved": "widgetStatReserved",
  "chart-room-status": "widgetChartRoomStatus",
  "chart-weekly": "widgetChartWeekly",
  "shortcut-salas": "widgetShortcutSalas",
  "widget-solicitations": "widgetSolicitations",
  "widget-incidents": "widgetIncidents",
};

function DemoShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-full min-h-0 w-full min-w-0 overflow-hidden rounded-lg">
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden pt-9">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-2 pt-2">
        <div
          className="landing-demo-drag pointer-events-auto flex w-full min-w-0 cursor-grab items-center gap-2 rounded-md border border-border bg-card/95 px-2 py-1 shadow-sm backdrop-blur-sm active:cursor-grabbing"
          role="toolbar"
          aria-label={label}
          title={label}
        >
          <span className="min-w-0 flex-1 select-none truncate text-xs font-medium text-muted-foreground">
            {label}
          </span>
          <GripVertical
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

export function LandingDashboardPlayground() {
  const t = useTranslations("LandingPage.product");
  const tGrid = useTranslations("DashboardHome.grid");
  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() =>
    structuredClone(DEFAULT_LAYOUTS)
  );

  const restore = useCallback(() => {
    setLayouts(structuredClone(DEFAULT_LAYOUTS));
  }, []);

  const onLayoutChange = useCallback(
    (_current: Layout, all: ResponsiveLayouts) => {
      setLayouts(all);
    },
    []
  );

  const widgets = useMemo(
    () =>
      (
        [
          "stat-total",
          "stat-available",
          "stat-in-use",
          "stat-reserved",
          "chart-room-status",
          "chart-weekly",
          "shortcut-salas",
          "widget-solicitations",
          "widget-incidents",
        ] as PlaygroundId[]
      ).map(id => {
        const label = tGrid(WIDGET_LABEL_KEY[id]);
        let inner: React.ReactNode = null;
        switch (id) {
          case "stat-total":
            inner = <StatTotalWidget rooms={DEMO_ROOMS} />;
            break;
          case "stat-available":
            inner = <StatAvailableWidget rooms={DEMO_ROOMS} />;
            break;
          case "stat-in-use":
            inner = <StatInUseWidget rooms={DEMO_ROOMS} />;
            break;
          case "stat-reserved":
            inner = <StatReservedWidget rooms={DEMO_ROOMS} />;
            break;
          case "chart-room-status":
            inner = (
              <DashboardChartRoomStatusTile
                rooms={DEMO_ROOMS}
                statsLoading={false}
                embedded
              />
            );
            break;
          case "chart-weekly":
            inner = (
              <DashboardChartWeeklyTile
                stats={DEMO_CHART_STATS}
                statsLoading={false}
                embedded
              />
            );
            break;
          case "shortcut-salas":
            inner = <ShortcutSalasWidget interactive={false} />;
            break;
          case "widget-solicitations":
            inner = (
              <DashboardSolicitationsTile
                stats={DEMO_CHART_STATS}
                statsLoading={false}
                embedded
              />
            );
            break;
          case "widget-incidents":
            inner = (
              <DashboardIncidentTile
                stats={DEMO_CHART_STATS}
                statsLoading={false}
                embedded
              />
            );
            break;
          default:
            inner = null;
        }
        return (
          <div key={id} className="h-full min-h-0">
            <DemoShell label={label}>{inner}</DemoShell>
          </div>
        );
      }),
    [tGrid]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{t("dragHint")}</p>
        <Button type="button" size="sm" variant="outline" onClick={restore}>
          {t("restore")}
        </Button>
      </div>

      <div
        className={cn(
          "rounded-xl border border-border bg-muted/30 p-2 sm:p-3",
          "touch-pan-y"
        )}
      >
        <ResponsiveGrid
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={DASHBOARD_GRID_COLS}
          rowHeight={24}
          margin={[12, 12] as [number, number]}
          containerPadding={[4, 4] as [number, number]}
          onLayoutChange={onLayoutChange}
          isDraggable
          isResizable
          draggableHandle=".landing-demo-drag"
          compactType="vertical"
          useCSSTransforms
        >
          {widgets}
        </ResponsiveGrid>
      </div>
    </div>
  );
}
