"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { GripVertical, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Layout,
  LayoutItem,
  ResponsiveLayouts,
} from "react-grid-layout/legacy";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";

import type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";
import {
  DashboardChartReservationStatusTile,
  DashboardChartRoomStatusTile,
  DashboardChartTopRoomsTile,
  DashboardChartWeeklyTile,
} from "@/components/dashboard/DashboardChartTiles";
import {
  DashboardIncidentTile,
  DashboardSolicitationsTile,
} from "@/components/dashboard/DashboardIncidentTiles";
import {
  ShortcutAgendamentosWidget,
  ShortcutIncidentesWidget,
  ShortcutSalasWidget,
} from "@/components/dashboard/DashboardShortcutWidgets";
import {
  StatAvailableWidget,
  StatInUseWidget,
  StatReservedWidget,
  StatTotalWidget,
} from "@/components/dashboard/DashboardStatWidgets";
import { DashboardWidgetPalette } from "@/components/dashboard/DashboardWidgetPalette";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import {
  clampLayoutItemToCols,
  cloneResponsiveLayouts,
  DASHBOARD_BREAKPOINTS,
  DASHBOARD_GRID_COLS,
  DASHBOARD_LAYOUT_VERSION,
  DASHBOARD_WIDGET_GRID_KEY,
  DASHBOARD_WIDGET_IDS,
  type DashboardWidgetId,
  filterLayoutsByHidden,
  getDefaultLayoutItem,
  mergeDashboardLayouts,
  parseHiddenWidgetIds,
  WIDGET_DRAG_MIME,
} from "@/lib/dashboardLayout";
import { useApp } from "@/lib/hooks/useApp";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = WidthProvider(Responsive);

const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const DROP_PLACEHOLDER_I = "__dropping__";

function sameItemLayout(a: LayoutItem, b: LayoutItem): boolean {
  return (
    a.i === b.i &&
    Math.round(a.x) === Math.round(b.x) &&
    Math.round(a.y) === Math.round(b.y) &&
    Math.round(a.w) === Math.round(b.w) &&
    Math.round(a.h) === Math.round(b.h)
  );
}

/** Evita setState em loop quando o grid e gráficos (ResponsiveContainer) se alimentam. */
function layoutRectsMatch(
  prev: ResponsiveLayouts,
  next: ResponsiveLayouts
): boolean {
  for (const bp of DASHBOARD_BREAKPOINTS) {
    const pa = prev[bp] ?? [];
    const nb = next[bp] ?? [];
    if (pa.length !== nb.length) return false;
    for (const aItem of pa) {
      const bItem = nb.find((l) => l.i === aItem.i);
      if (!bItem || !sameItemLayout(aItem, bItem)) return false;
    }
  }
  return true;
}

function mergeLayoutsFromGrid(
  prev: ResponsiveLayouts,
  all: ResponsiveLayouts
): ResponsiveLayouts {
  const next = cloneResponsiveLayouts(prev);
  for (const bp of DASHBOARD_BREAKPOINTS) {
    const incoming = (all[bp] ?? []).filter(
      (it) =>
        it.i !== DROP_PLACEHOLDER_I &&
        DASHBOARD_WIDGET_IDS.includes(it.i as DashboardWidgetId)
    );
    const row = [...(next[bp] ?? [])];
    for (const it of incoming) {
      const idx = row.findIndex((l) => l.i === it.i);
      if (idx >= 0) {
        const base = row[idx];
        if (!base) continue;
        row[idx] = {
          ...base,
          ...it,
          i: it.i,
          minW: base.minW,
          minH: base.minH,
        };
      }
    }
    next[bp] = row;
  }
  return next;
}

type Props = {
  rooms: { status: string }[];
  chartStats: DashboardChartStats | null;
  chartStatsLoading: boolean;
};

function placeWidgetAtBottom(
  layouts: ResponsiveLayouts,
  id: DashboardWidgetId,
  hiddenForMaxY: readonly DashboardWidgetId[]
): ResponsiveLayouts {
  const next = cloneResponsiveLayouts(layouts);
  const hiddenSet = new Set(
    hiddenForMaxY.filter((h) => h !== id)
  );
  for (const bp of DASHBOARD_BREAKPOINTS) {
    const def = getDefaultLayoutItem(id, bp);
    if (!def) continue;
    const cols = DASHBOARD_GRID_COLS[bp];
    const row = [...(next[bp] ?? [])];
    const visibleMaxY = row
      .filter((l) => !hiddenSet.has(l.i as DashboardWidgetId))
      .reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const placed = clampLayoutItemToCols(
      {
        ...def,
        i: id,
        x: 0,
        y: visibleMaxY,
        w: def.w,
        h: def.h,
        minW: def.minW,
        minH: def.minH,
      },
      cols
    );
    const idx = row.findIndex((l) => l.i === id);
    if (idx >= 0) {
      next[bp] = row.map((l, i) => (i === idx ? placed : l));
    }
  }
  return next;
}

function applyDropFromPalette(
  layouts: ResponsiveLayouts,
  id: DashboardWidgetId,
  dropped: LayoutItem
): ResponsiveLayouts {
  const next = cloneResponsiveLayouts(layouts);
  for (const bp of DASHBOARD_BREAKPOINTS) {
    const def = getDefaultLayoutItem(id, bp);
    if (!def) continue;
    const cols = DASHBOARD_GRID_COLS[bp];
    const merged = clampLayoutItemToCols(
      {
        ...def,
        i: id,
        x: dropped.x,
        y: dropped.y,
        w: dropped.w,
        h: dropped.h,
        minW: def.minW,
        minH: def.minH,
      },
      cols
    );
    const row = [...(next[bp] ?? [])];
    next[bp] = row.map((l) => (l.i === id ? merged : l));
  }
  return next;
}

function WidgetShell({
  editMode,
  dragLabel,
  children,
  className,
  onRemoveFromDashboard,
  removeLabel,
}: {
  editMode: boolean;
  dragLabel: string;
  children: React.ReactNode;
  className?: string;
  onRemoveFromDashboard?: () => void;
  removeLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-sm dark:border-slate-700/90 dark:bg-slate-950/80",
        className
      )}
    >
      {editMode ? (
        <div className="flex shrink-0 items-stretch justify-between gap-1 border-b border-slate-200/80 dark:border-slate-700/80">
          <div
            className="dashboard-widget-drag flex min-w-0 flex-1 cursor-grab items-center gap-2 px-3 py-2 active:cursor-grabbing"
            title={dragLabel}
          >
            <GripVertical
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden
            />
            <span className="select-none truncate text-xs font-medium text-slate-500 dark:text-slate-400">
              {dragLabel}
            </span>
          </div>
          {onRemoveFromDashboard ? (
            <button
              type="button"
              className="dashboard-widget-no-drag my-1 mr-2 shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
              onClick={onRemoveFromDashboard}
              aria-label={removeLabel ?? "Remove"}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden p-2 sm:p-3",
          editMode ? "pt-1.5" : "pt-2"
        )}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

export function DashboardGrid({
  rooms,
  chartStats,
  chartStatsLoading,
}: Props) {
  const { data: session } = useSession();
  const { showSuccess, showError } = useApp();
  const tGrid = useTranslations("DashboardHome.grid");

  const [layouts, setLayouts] = useState<ResponsiveLayouts>(() =>
    mergeDashboardLayouts(null)
  );
  const [hiddenWidgets, setHiddenWidgets] = useState<DashboardWidgetId[]>([]);
  const hiddenWidgetsRef = useRef(hiddenWidgets);
  hiddenWidgetsRef.current = hiddenWidgets;

  const [layoutsReady, setLayoutsReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [widgetDrawerOpen, setWidgetDrawerOpen] = useState(false);
  /** Mantém o drawer montado durante HTML5 drag até soltar, com overlay transparente ao grid. */
  const [paletteDragging, setPaletteDragging] = useState(false);
  const preEditLayoutsRef = useRef<ResponsiveLayouts | null>(null);
  const preEditHiddenRef = useRef<DashboardWidgetId[] | null>(null);
  const draggingPaletteIdRef = useRef<DashboardWidgetId | null>(null);
  /** Durante edição, evitamos `setLayouts` em todo `onLayoutChange` (ciclo com compactação do RGL). */
  const latestLayoutsRef = useRef<ResponsiveLayouts>(mergeDashboardLayouts(null));
  const isEditingRef = useRef(false);
  isEditingRef.current = isEditing;

  const hiddenSet = useMemo(
    () => new Set(hiddenWidgets),
    [hiddenWidgets]
  );

  const visibleLayouts = useMemo(
    () => filterLayoutsByHidden(layouts, hiddenSet),
    [layouts, hiddenSet]
  );

  const visibleIds = useMemo(
    () => DASHBOARD_WIDGET_IDS.filter((id) => !hiddenSet.has(id)),
    [hiddenSet]
  );

  useEffect(() => {
    if (!session?.user?.email) {
      setLayoutsReady(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/dashboard/layout");
        if (!res.ok) throw new Error("layout");
        const data = (await res.json()) as {
          merged: ResponsiveLayouts;
          hiddenWidgets?: unknown;
        };
        if (!cancelled && data.merged) {
          setLayouts(data.merged);
          setHiddenWidgets(parseHiddenWidgetIds(data.hiddenWidgets));
        }
      } catch {
        if (!cancelled) {
          setLayouts(mergeDashboardLayouts(null));
          setHiddenWidgets([]);
        }
      } finally {
        if (!cancelled) setLayoutsReady(true);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  useEffect(() => {
    if (!isEditing) {
      latestLayoutsRef.current = cloneResponsiveLayouts(layouts);
    }
  }, [layouts, isEditing]);

  const handleLayoutChange = useCallback(
    (_current: Layout, all: ResponsiveLayouts) => {
      if (isEditing) {
        const prev = latestLayoutsRef.current;
        const next = mergeLayoutsFromGrid(prev, all);
        latestLayoutsRef.current = next;
        return;
      }

      setLayouts((prev) => {
        const next = mergeLayoutsFromGrid(prev, all);
        const matched = layoutRectsMatch(prev, next);
        return matched ? prev : next;
      });
    },
    [isEditing]
  );

  const closeWidgetDrawer = useCallback(() => {
    setWidgetDrawerOpen(false);
    setPaletteDragging(false);
  }, []);

  const beginEdit = useCallback(() => {
    preEditLayoutsRef.current = cloneResponsiveLayouts(layouts);
    preEditHiddenRef.current = [...hiddenWidgets];
    latestLayoutsRef.current = cloneResponsiveLayouts(layouts);
    setIsEditing(true);
  }, [layouts, hiddenWidgets]);

  const cancelEdit = useCallback(() => {
    if (preEditLayoutsRef.current) {
      setLayouts(cloneResponsiveLayouts(preEditLayoutsRef.current));
    }
    if (preEditHiddenRef.current) {
      setHiddenWidgets(preEditHiddenRef.current);
    }
    preEditLayoutsRef.current = null;
    preEditHiddenRef.current = null;
    setIsEditing(false);
    closeWidgetDrawer();
  }, [closeWidgetDrawer]);

  const putLayout = useCallback(
    async (nextLayouts: ResponsiveLayouts, nextHidden: DashboardWidgetId[]) => {
      if (!session?.user?.email) return false;
      const res = await fetch("/api/dashboard/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: DASHBOARD_LAYOUT_VERSION,
          layouts: nextLayouts,
          hiddenWidgets: nextHidden,
        }),
      });
      return res.ok;
    },
    [session?.user?.email]
  );

  const saveEdit = useCallback(async () => {
    if (!session?.user?.email) return;
    setSaving(true);
    try {
      const snapshot = cloneResponsiveLayouts(latestLayoutsRef.current);
      if (!(await putLayout(snapshot, hiddenWidgets))) throw new Error("save");
      setLayouts(snapshot);
      preEditLayoutsRef.current = null;
      preEditHiddenRef.current = null;
      setIsEditing(false);
      closeWidgetDrawer();
      showSuccess(tGrid("saveSuccess"));
    } catch {
      showError(tGrid("saveError"));
    } finally {
      setSaving(false);
    }
  }, [
    closeWidgetDrawer,
    hiddenWidgets,
    putLayout,
    session?.user?.email,
    showError,
    showSuccess,
    tGrid,
  ]);

  const restoreDefault = useCallback(async () => {
    if (!session?.user?.email) return;
    if (!window.confirm(tGrid("restoreConfirm"))) return;
    setSaving(true);
    const defaults = mergeDashboardLayouts(null);
    setLayouts(defaults);
    setHiddenWidgets([]);
    preEditLayoutsRef.current = null;
    preEditHiddenRef.current = null;
    setIsEditing(false);
    closeWidgetDrawer();
    try {
      if (!(await putLayout(defaults, []))) throw new Error("restore");
      showSuccess(tGrid("restoreSuccess"));
    } catch {
      showError(tGrid("restoreError"));
    } finally {
      setSaving(false);
    }
  }, [closeWidgetDrawer, putLayout, session?.user?.email, showError, showSuccess, tGrid]);

  const hideWidget = useCallback((id: DashboardWidgetId) => {
    setHiddenWidgets((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const insertWidgetAtBottom = useCallback((id: DashboardWidgetId) => {
    const nh = hiddenWidgetsRef.current.filter((x) => x !== id);
    setHiddenWidgets(nh);
    setLayouts((prev) => {
      const base = isEditingRef.current ? latestLayoutsRef.current : prev;
      const next = placeWidgetAtBottom(base, id, nh);
      if (isEditingRef.current) {
        latestLayoutsRef.current = cloneResponsiveLayouts(next);
      }
      return next;
    });
  }, []);

  const onDropFromPalette = useCallback(
    (_layout: Layout, droppedItem: LayoutItem | undefined, e: Event) => {
      const de = e as DragEvent;
      const raw =
        de.dataTransfer?.getData(WIDGET_DRAG_MIME) ||
        de.dataTransfer?.getData("text/plain");
      if (
        !raw ||
        !DASHBOARD_WIDGET_IDS.includes(raw as DashboardWidgetId) ||
        !droppedItem
      ) {
        return;
      }
      const id = raw as DashboardWidgetId;
      const nh = hiddenWidgetsRef.current.filter((x) => x !== id);
      setHiddenWidgets(nh);
      setLayouts((prev) => {
        const base = isEditingRef.current ? latestLayoutsRef.current : prev;
        const next = applyDropFromPalette(base, id, droppedItem);
        if (isEditingRef.current) {
          latestLayoutsRef.current = cloneResponsiveLayouts(next);
        }
        return next;
      });
    },
    []
  );

  const onDropDragOver = useCallback((_e: React.DragEvent) => {
    const id = draggingPaletteIdRef.current;
    if (!id) return false;
    const def = getDefaultLayoutItem(id, "lg");
    return def ? { w: def.w, h: def.h } : false;
  }, []);

  const openWidgetDrawer = useCallback(() => {
    if (!session?.user?.email) return;
    if (!isEditing) beginEdit();
    setWidgetDrawerOpen(true);
  }, [beginEdit, isEditing, session?.user?.email]);

  const renderWidget = (id: DashboardWidgetId) => {
    let inner: React.ReactNode = null;
    switch (id) {
      case "stat-total":
        inner = <StatTotalWidget rooms={rooms} />;
        break;
      case "stat-available":
        inner = <StatAvailableWidget rooms={rooms} />;
        break;
      case "stat-in-use":
        inner = <StatInUseWidget rooms={rooms} />;
        break;
      case "stat-reserved":
        inner = <StatReservedWidget rooms={rooms} />;
        break;
      case "chart-room-status":
        inner = (
          <DashboardChartRoomStatusTile
            rooms={rooms}
            statsLoading={chartStatsLoading}
            embedded
          />
        );
        break;
      case "chart-weekly":
        inner = (
          <DashboardChartWeeklyTile
            stats={chartStats}
            statsLoading={chartStatsLoading}
            embedded
          />
        );
        break;
      case "chart-reservation-status":
        inner = (
          <DashboardChartReservationStatusTile
            stats={chartStats}
            statsLoading={chartStatsLoading}
            embedded
          />
        );
        break;
      case "chart-top-rooms":
        inner = (
          <DashboardChartTopRoomsTile
            stats={chartStats}
            statsLoading={chartStatsLoading}
            embedded
          />
        );
        break;
      case "widget-incidents":
        inner = (
          <DashboardIncidentTile
            stats={chartStats}
            statsLoading={chartStatsLoading}
            embedded
          />
        );
        break;
      case "widget-solicitations":
        inner = (
          <DashboardSolicitationsTile
            stats={chartStats}
            statsLoading={chartStatsLoading}
            embedded
          />
        );
        break;
      case "shortcut-salas":
        inner = <ShortcutSalasWidget />;
        break;
      case "shortcut-agendamentos":
        inner = <ShortcutAgendamentosWidget />;
        break;
      case "shortcut-incidentes":
        inner = <ShortcutIncidentesWidget />;
        break;
      default:
        return null;
    }

    return (
      <WidgetShell
        editMode={isEditing}
        dragLabel={tGrid(DASHBOARD_WIDGET_GRID_KEY[id])}
        onRemoveFromDashboard={isEditing ? () => hideWidget(id) : undefined}
        removeLabel={tGrid("removeWidget")}
      >
        {inner}
      </WidgetShell>
    );
  };

  if (!layoutsReady) {
    return (
      <div className="mb-10 h-[420px] animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/80" />
    );
  }

  const canCustomize = Boolean(session?.user?.email);

  return (
    <div className="mb-10">
      {canCustomize ? (
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {isEditing ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {tGrid("editModeHint")}
            </p>
          ) : (
            <span className="hidden min-h-[1.25rem] sm:block" aria-hidden />
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!isEditing ? (
              <Button type="button" size="sm" variant="outline" onClick={beginEdit}>
                {tGrid("editDashboard")}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => void restoreDefault()}
                >
                  {tGrid("restoreDefault")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={openWidgetDrawer}
                >
                  {tGrid("addWidgets")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={cancelEdit}
                >
                  {tGrid("cancelEdit")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => void saveEdit()}
                >
                  {saving ? tGrid("saving") : tGrid("saveDashboard")}
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}

      <Drawer
        isOpen={widgetDrawerOpen || paletteDragging}
        passThrough={paletteDragging}
        closeOnEscape={!paletteDragging}
        onClose={closeWidgetDrawer}
        title={tGrid("widgetDrawerTitle")}
        size="lg"
        side="right"
      >
        <DashboardWidgetPalette
          hiddenIds={hiddenSet}
          onPaletteDragStart={(wid) => {
            draggingPaletteIdRef.current = wid;
            setPaletteDragging(true);
            setWidgetDrawerOpen(false);
          }}
          onPaletteDragEnd={() => {
            draggingPaletteIdRef.current = null;
            setPaletteDragging(false);
          }}
          onAddClick={(wid) => insertWidgetAtBottom(wid)}
        />
      </Drawer>

      <ResponsiveGridLayout
        className="layout"
        layouts={visibleLayouts}
        breakpoints={GRID_BREAKPOINTS}
        cols={DASHBOARD_GRID_COLS}
        rowHeight={28}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        {...(isEditing
          ? {
              draggableHandle: ".dashboard-widget-drag" as const,
              draggableCancel: ".dashboard-widget-no-drag",
            }
          : {})}
        compactType="vertical"
        preventCollision={false}
        isDraggable={isEditing}
        isResizable={isEditing}
        isDroppable={isEditing}
        droppingItem={{
          i: DROP_PLACEHOLDER_I,
          x: 0,
          y: 0,
          w: 3,
          h: 4,
          minW: 1,
          minH: 1,
        }}
        onDrop={onDropFromPalette}
        onDropDragOver={onDropDragOver}
        resizeHandles={["se", "s", "e"]}
      >
        {visibleIds.map((id) => (
          <div key={id} className="h-full min-w-0">
            {renderWidget(id)}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
