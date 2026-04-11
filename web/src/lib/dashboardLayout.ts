import type { Layout, LayoutItem, ResponsiveLayouts } from "react-grid-layout/legacy";

export const DASHBOARD_WIDGET_IDS = [
  "stat-total",
  "stat-available",
  "stat-in-use",
  "stat-reserved",
  "chart-room-status",
  "chart-weekly",
  "chart-reservation-status",
  "chart-top-rooms",
  "widget-incidents",
  "widget-solicitations",
  "shortcut-salas",
  "shortcut-agendamentos",
  "shortcut-incidentes",
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export const DASHBOARD_LAYOUT_VERSION = 1 as const;

export type StoredDashboardLayout = {
  version: typeof DASHBOARD_LAYOUT_VERSION;
  layouts: ResponsiveLayouts;
  hiddenWidgets?: DashboardWidgetId[];
};

const BP = ["lg", "md", "sm", "xs", "xxs"] as const;
export type DashboardBreakpoint = (typeof BP)[number];

export const DASHBOARD_BREAKPOINTS: readonly DashboardBreakpoint[] = BP;

export const DASHBOARD_GRID_COLS: Record<DashboardBreakpoint, number> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
};

export const DASHBOARD_WIDGET_GRID_KEY: Record<DashboardWidgetId, string> = {
  "stat-total": "widgetStatTotal",
  "stat-available": "widgetStatAvailable",
  "stat-in-use": "widgetStatInUse",
  "stat-reserved": "widgetStatReserved",
  "chart-room-status": "widgetChartRoomStatus",
  "chart-weekly": "widgetChartWeekly",
  "chart-reservation-status": "widgetChartReservationStatus",
  "chart-top-rooms": "widgetChartTopRooms",
  "widget-incidents": "widgetIncidents",
  "widget-solicitations": "widgetSolicitations",
  "shortcut-salas": "widgetShortcutSalas",
  "shortcut-agendamentos": "widgetShortcutAgendamentos",
  "shortcut-incidentes": "widgetShortcutIncidentes",
};

export const WIDGET_DRAG_MIME = "application/x-sala-dashboard-widget";

function item(
  id: DashboardWidgetId,
  x: number,
  y: number,
  w: number,
  h: number,
  minW: number,
  minH: number
): LayoutItem {
  return { i: id, x, y, w, h, minW, minH };
}

export const DEFAULT_DASHBOARD_LAYOUTS: ResponsiveLayouts = {
  lg: [
    item("stat-total", 0, 0, 3, 4, 2, 3),
    item("stat-available", 3, 0, 3, 4, 2, 3),
    item("stat-in-use", 6, 0, 3, 4, 2, 3),
    item("stat-reserved", 9, 0, 3, 4, 2, 3),
    item("chart-room-status", 0, 4, 4, 9, 2, 6),
    item("chart-weekly", 4, 4, 8, 9, 3, 6),
    item("chart-reservation-status", 0, 13, 6, 10, 2, 7),
    item("chart-top-rooms", 6, 13, 6, 10, 2, 7),
    item("widget-incidents", 0, 23, 6, 11, 2, 8),
    item("widget-solicitations", 6, 23, 6, 11, 2, 7),
    item("shortcut-salas", 0, 34, 4, 8, 2, 5),
    item("shortcut-agendamentos", 4, 34, 4, 8, 2, 5),
    item("shortcut-incidentes", 8, 34, 4, 8, 2, 5),
  ],
  md: [
    item("stat-total", 0, 0, 3, 3, 2, 2),
    item("stat-available", 3, 0, 3, 3, 2, 2),
    item("stat-in-use", 6, 0, 2, 3, 2, 2),
    item("stat-reserved", 8, 0, 2, 3, 2, 2),
    item("chart-room-status", 0, 3, 3, 10, 2, 6),
    item("chart-weekly", 3, 3, 7, 10, 3, 6),
    item("chart-reservation-status", 0, 13, 5, 10, 2, 7),
    item("chart-top-rooms", 5, 13, 5, 10, 2, 7),
    item("widget-incidents", 0, 23, 5, 11, 2, 8),
    item("widget-solicitations", 5, 23, 5, 11, 2, 7),
    item("shortcut-salas", 0, 34, 4, 8, 2, 5),
    item("shortcut-agendamentos", 4, 34, 3, 8, 2, 5),
    item("shortcut-incidentes", 7, 34, 3, 8, 2, 5),
  ],
  sm: [
    item("stat-total", 0, 0, 3, 4, 2, 3),
    item("stat-available", 3, 0, 3, 4, 2, 3),
    item("stat-in-use", 0, 4, 3, 4, 2, 3),
    item("stat-reserved", 3, 4, 3, 4, 2, 3),
    item("chart-room-status", 0, 8, 6, 11, 2, 7),
    item("chart-weekly", 0, 19, 6, 13, 2, 8),
    item("chart-reservation-status", 0, 32, 6, 12, 2, 8),
    item("chart-top-rooms", 0, 44, 6, 12, 2, 8),
    item("widget-incidents", 0, 56, 6, 12, 2, 8),
    item("widget-solicitations", 0, 68, 6, 10, 2, 7),
    item("shortcut-salas", 0, 78, 6, 8, 2, 5),
    item("shortcut-agendamentos", 0, 86, 6, 8, 2, 5),
    item("shortcut-incidentes", 0, 94, 6, 8, 2, 5),
  ],
  xs: [
    item("stat-total", 0, 0, 2, 4, 1, 3),
    item("stat-available", 2, 0, 2, 4, 1, 3),
    item("stat-in-use", 0, 4, 2, 4, 1, 3),
    item("stat-reserved", 2, 4, 2, 4, 1, 3),
    item("chart-room-status", 0, 8, 4, 12, 2, 8),
    item("chart-weekly", 0, 20, 4, 14, 2, 9),
    item("chart-reservation-status", 0, 34, 4, 13, 2, 8),
    item("chart-top-rooms", 0, 47, 4, 13, 2, 8),
    item("widget-incidents", 0, 60, 4, 13, 2, 8),
    item("widget-solicitations", 0, 73, 4, 11, 2, 7),
    item("shortcut-salas", 0, 84, 4, 9, 2, 5),
    item("shortcut-agendamentos", 0, 93, 4, 9, 2, 5),
    item("shortcut-incidentes", 0, 102, 4, 9, 2, 5),
  ],
  xxs: [
    item("stat-total", 0, 0, 2, 5, 2, 3),
    item("stat-available", 0, 5, 2, 5, 2, 3),
    item("stat-in-use", 0, 10, 2, 5, 2, 3),
    item("stat-reserved", 0, 15, 2, 5, 2, 3),
    item("chart-room-status", 0, 20, 2, 14, 2, 9),
    item("chart-weekly", 0, 34, 2, 16, 2, 10),
    item("chart-reservation-status", 0, 50, 2, 15, 2, 9),
    item("chart-top-rooms", 0, 65, 2, 15, 2, 9),
    item("widget-incidents", 0, 80, 2, 15, 2, 9),
    item("widget-solicitations", 0, 95, 2, 12, 2, 8),
    item("shortcut-salas", 0, 107, 2, 10, 2, 6),
    item("shortcut-agendamentos", 0, 117, 2, 10, 2, 6),
    item("shortcut-incidentes", 0, 127, 2, 10, 2, 6),
  ],
};

function isLayoutItem(x: unknown): x is LayoutItem {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.i === "string" &&
    DASHBOARD_WIDGET_IDS.includes(o.i as DashboardWidgetId) &&
    typeof o.x === "number" &&
    typeof o.y === "number" &&
    typeof o.w === "number" &&
    typeof o.h === "number" &&
    Number.isFinite(o.x) &&
    Number.isFinite(o.y) &&
    Number.isFinite(o.w) &&
    Number.isFinite(o.h) &&
    o.w > 0 &&
    o.h > 0
  );
}

function mergeBreakpointLayout(
  defaults: Layout,
  saved: Layout | undefined
): Layout {
  const merged: LayoutItem[] = [];
  for (const id of DASHBOARD_WIDGET_IDS) {
    const def = defaults.find((d: LayoutItem) => d.i === id);
    if (!def) continue;
    const s = saved?.find((it: LayoutItem) => it.i === id);
    if (s && isLayoutItem(s)) {
      merged.push({
        ...def,
        ...s,
        i: id,
        minW: def.minW,
        minH: def.minH,
      });
    } else {
      merged.push({ ...def });
    }
  }
  return merged;
}

export function mergeDashboardLayouts(
  saved: ResponsiveLayouts | null | undefined
): ResponsiveLayouts {
  const out: ResponsiveLayouts = {};
  for (const bp of BP) {
    const defaults = DEFAULT_DASHBOARD_LAYOUTS[bp] ?? [];
    const savedBp = saved?.[bp] as Layout | undefined;
    out[bp] = mergeBreakpointLayout(defaults, savedBp);
  }
  return out;
}

export function cloneResponsiveLayouts(
  layouts: ResponsiveLayouts
): ResponsiveLayouts {
  return JSON.parse(JSON.stringify(layouts)) as ResponsiveLayouts;
}

export function getDefaultLayoutItem(
  id: DashboardWidgetId,
  bp: DashboardBreakpoint
): LayoutItem | undefined {
  return DEFAULT_DASHBOARD_LAYOUTS[bp]?.find((d) => d.i === id);
}

export function clampLayoutItemToCols(
  item: LayoutItem,
  cols: number
): LayoutItem {
  const { x, w } = item;
  const cw = Math.min(Math.max(1, w), cols);
  let cx = Math.max(0, x);
  if (cx + cw > cols) cx = Math.max(0, cols - cw);
  return { ...item, x: cx, w: cw };
}

export function parseHiddenWidgetIds(value: unknown): DashboardWidgetId[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is DashboardWidgetId =>
      typeof v === "string" &&
      DASHBOARD_WIDGET_IDS.includes(v as DashboardWidgetId)
  );
}

export function filterLayoutsByHidden(
  layouts: ResponsiveLayouts,
  hidden: ReadonlySet<DashboardWidgetId>
): ResponsiveLayouts {
  const out: ResponsiveLayouts = {};
  for (const bp of BP) {
    out[bp] = (layouts[bp] ?? []).filter(
      (it) => !hidden.has(it.i as DashboardWidgetId)
    );
  }
  return out;
}
