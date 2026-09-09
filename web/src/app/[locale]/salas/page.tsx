"use client";

import { ArrowRight, Building2, Grid, List, Plus, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useMemo, useState } from "react";
import { HiUsers } from "react-icons/hi2";
import { MdInventory2 } from "react-icons/md";

import { SalasAccessGuard } from "@/components/auth/SalasAccessGuard";
import { RoomForm } from "@/components/forms/RoomForm";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { RoomStatusBadges } from "@/components/ui/StatusBadge";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { Room } from "@/lib/types";
import { cn } from "@/lib/utils";
import { safeLocalStorage } from "@/lib/utils/clientSafe";
import { Link } from "@/navigation";

const VIEW_MODE_KEY = "sala-view-mode";

const FILTER_TRIGGER_CLASS =
  "h-full border-slate-300 bg-white text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white";

const SalasPage: React.FC = () => {
  const t = useTranslations("Dashboard");
  const ts = useTranslations("SalasPage");

  const { data: session } = useSession();
  const { isOrgAdmin, canAccessSalas } = useOrgPermissions();
  const [currentPageNav, setCurrentPageNav] = useState("salas");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [sectors, setSectors] = useState<
    { id: string; name: string; canManageInScope: boolean }[]
  >([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [createRoomLoading, setCreateRoomLoading] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    isCreateRoomModalOpen,
    setCreateRoomModalOpen,
    roomsCache,
    setRoomsCache,
    lastFetchTime,
    setLastFetchTime,
    showSuccess,
    showError,
  } = useApp();

  const { navigate, isNavigating } = useNavigation({
    currentPage: currentPageNav,
    onPageChange: setCurrentPageNav,
  });

  const { handleNotificationClick: globalNotificationHandler } =
    useNotificationHandler();

  const mapSectors = (
    sectorsData: Array<{
      id: string;
      name: string;
      members?: Array<{
        userId: string;
        canManageRooms?: boolean;
        canEditRooms?: boolean;
        canManageItems?: boolean;
      }>;
    }>
  ) => {
    const userId = session?.user?.id;
    return sectorsData
      .map(s => {
        const me = s.members?.find(m => m.userId === userId);
        return {
          id: s.id,
          name: s.name,
          canManageInScope:
            isOrgAdmin ||
            Boolean(
              me?.canManageRooms ?? me?.canEditRooms ?? me?.canManageItems
            ),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  useEffect(() => {
    const stored = safeLocalStorage.getItem(VIEW_MODE_KEY);
    if (stored === "list" || stored === "grid") {
      setViewMode(stored);
    }
  }, []);

  useEffect(() => {
    safeLocalStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!session) {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!session?.user?.email) return;

      try {
        setLoading(true);
        setError(null);

        const now = Date.now();
        const cacheExpiry = 5 * 60 * 1000;

        if (lastFetchTime > 0 && now - lastFetchTime < cacheExpiry) {
          setRooms(roomsCache);
          if (sectors.length === 0) {
            const sectorsResponse = await fetch("/api/sectors");
            if (sectorsResponse.ok) {
              const sectorsData = await sectorsResponse.json();
              if (Array.isArray(sectorsData)) {
                setSectors(mapSectors(sectorsData));
              }
            }
          }
          setLoading(false);
          return;
        }

        const [roomsResponse, sectorsResponse] = await Promise.all([
          fetch("/api/rooms"),
          fetch("/api/sectors"),
        ]);
        if (!roomsResponse.ok) {
          const errorData = await roomsResponse.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Erro ${roomsResponse.status}: ${roomsResponse.statusText}`
          );
        }
        const data = await roomsResponse.json();

        setRooms(data);
        setRoomsCache(data);
        setLastFetchTime(now);

        if (sectorsResponse.ok) {
          const sectorsData = await sectorsResponse.json();
          if (Array.isArray(sectorsData)) {
            setSectors(mapSectors(sectorsData));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar salas:", err);
        const errorMessage =
          err instanceof Error ? err.message : t("feedback.errorGeneric");
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [session?.user?.email, roomsCache, lastFetchTime, showError, t]);

  const sectorOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const sector of sectors) {
      byId.set(sector.id, sector.name);
    }
    for (const room of rooms) {
      const id = room.sectorId || room.sector?.id;
      const name = room.sector?.name;
      if (id && name && !byId.has(id)) {
        byId.set(id, name);
      }
    }
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sectors, rooms]);

  const orphanCount = rooms.filter(
    (room: any) => !room.sectorId && !room.sector?.id
  ).length;

  const filteredRooms = rooms.filter((room: any) => {
    const items = room.items || [];
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      items.some((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;

    const roomSectorId = room.sectorId || room.sector?.id || null;
    const matchesSector =
      sectorFilter === "all" ||
      (sectorFilter === "noSector" && !roomSectorId) ||
      (sectorFilter !== "noSector" && roomSectorId === sectorFilter);

    const managedSectorIds = new Set(
      sectors.filter(s => s.canManageInScope).map(s => s.id)
    );
    const matchesManagerScope =
      isOrgAdmin ||
      (canAccessSalas && !!roomSectorId && managedSectorIds.has(roomSectorId));

    return (
      matchesSearch && matchesStatus && matchesSector && matchesManagerScope
    );
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sectorFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredRooms.length / pageSize));
    setPage(p => Math.min(p, maxPage));
  }, [filteredRooms.length, pageSize]);

  const totalFiltered = filteredRooms.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRooms = filteredRooms.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleAddRoom = () => setCreateRoomModalOpen(true);

  const handleCreateRoom = async (
    roomData: Omit<
      Room,
      "id" | "createdAt" | "updatedAt" | "organizationId" | "deletedAt"
    >
  ) => {
    try {
      setCreateRoomLoading(true);
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error(t("feedback.errorCreate"));
      }

      const newRoom = await response.json();
      setRooms((prev: any[]) => [...prev, newRoom]);
      setRoomsCache([...roomsCache, newRoom]);
      setCreateRoomModalOpen(false);
      showSuccess(t("feedback.successCreate", { name: newRoom.name }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("feedback.errorCreate");
      showError(errorMessage);
    } finally {
      setCreateRoomLoading(false);
    }
  };

  const renderRoomCard = (room: any, list: boolean) => {
    const hasActiveReservation =
      Array.isArray(room.reservations) && room.reservations.length > 0;
    const extraItems = Math.max(0, (room.items?.length ?? 0) - 2);
    const previewItems = room.items?.slice(0, 2) ?? [];
    const description = room.description?.trim();

    const renderItemRow = (item: any) => {
      const itemImage =
        item.images && item.images.length > 0
          ? item.images[0].path.replace(
              "/api/uploads/items/images/original_",
              "/api/uploads/items/images/thumb_"
            )
          : null;

      return (
        <div className="flex h-[3.25rem] items-center gap-2.5 rounded-lg bg-muted/50 px-2.5">
          {itemImage ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-background">
              <img
                src={itemImage}
                alt={item.name}
                className="h-full w-full object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              {item.icon ? (
                <span className="text-sm leading-none">{item.icon}</span>
              ) : (
                <MdInventory2 className="h-3.5 w-3.5" />
              )}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {item.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("card.quantity", { count: item.quantity })}
            </p>
          </div>
        </div>
      );
    };

    const renderPreviewItems = (compact = false) => {
      if (compact) {
        if (previewItems.length === 0) {
          return null;
        }

        return (
          <div className="mt-3 space-y-2">
            {previewItems.map((item: any) => (
              <div key={item.id}>{renderItemRow(item)}</div>
            ))}
            {extraItems > 0 ? (
              <p className="text-center text-xs font-medium text-blue-600 dark:text-blue-400">
                {t("card.moreItems", { count: extraItems })}
              </p>
            ) : null}
          </div>
        );
      }

      const itemSlots: Array<any | null> = [
        previewItems[0] ?? null,
        previewItems[1] ?? null,
      ];

      return (
        <div className="mt-auto flex min-h-[9.75rem] flex-col border-t border-border/60 pt-3">
          <div className="flex flex-1 flex-col justify-end gap-2">
            {itemSlots.map((item, index) => (
              <div key={item?.id ?? `item-slot-${index}`} className="h-[3.25rem]">
                {item ? renderItemRow(item) : null}
              </div>
            ))}
          </div>
          <p
            className={cn(
              "min-h-5 pt-1 text-center text-xs font-medium",
              extraItems > 0
                ? "text-blue-600 dark:text-blue-400"
                : "invisible"
            )}
            aria-hidden={extraItems === 0}
          >
            {extraItems > 0
              ? t("card.moreItems", { count: extraItems })
              : "\u00A0"}
          </p>
        </div>
      );
    };

    const inner = (
      <>
        <div
          className={list ? "min-w-0 flex-1" : "flex min-h-0 flex-1 flex-col"}
        >
          <div className="mb-3">
            <RoomStatusBadges
              status={room.status}
              hasActiveReservation={hasActiveReservation}
            />
          </div>

          <CardTitle
            className={cn(
              "mb-1 line-clamp-2 font-bold leading-snug text-foreground",
              list ? "text-xl" : "text-lg sm:text-xl"
            )}
          >
            {room.name}
          </CardTitle>

          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
            <span
              className={cn(
                room.sector?.name
                  ? "font-medium text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground"
              )}
            >
              {room.sector?.name || ts("noSector")}
            </span>
            {room.capacity ? (
              <>
                <span
                  className="hidden h-1 w-1 rounded-full bg-muted-foreground/40 sm:inline"
                  aria-hidden
                />
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <HiUsers className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {t("card.people", { count: room.capacity })}
                </span>
              </>
            ) : null}
          </div>

          {description ? (
            <CardDescription className="mb-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
              {description}
            </CardDescription>
          ) : (
            !list && (
              <div
                className="mb-3 min-h-[2.5rem]"
                aria-hidden
              />
            )
          )}

          {!list && renderPreviewItems()}
          {list && renderPreviewItems(true)}
        </div>

        <div
          className={
            list
              ? "flex w-full shrink-0 flex-col gap-2 sm:w-44"
              : "mt-4 shrink-0 border-t border-border/60 pt-3"
          }
        >
          <Link href={`/salas/${room.id}`} className="w-full">
            <Button
              variant={list ? "primary" : "outline"}
              className="w-full group/btn"
            >
              {t("actions.viewDetails")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </>
    );

    return (
      <Card
        key={room.id}
        variant="elevated"
        hover
        className={cn(
          "group animate-scaleIn h-full",
          list
            ? "flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch"
            : "flex flex-col p-4 sm:p-5"
        )}
      >
        {inner}
      </Card>
    );
  };

  return (
    <SalasAccessGuard>
      <PageLayout
        currentPage={currentPageNav}
        onNavigate={navigate}
        isNavigating={isNavigating}
        onNotificationClick={() => {}}
        onNotificationItemClick={globalNotificationHandler}
        notificationUpdateTrigger={0}
      >
        {loading ? (
          <LoadingPage variant="embedded" message={t("feedback.loading")} />
        ) : error ? (
          <ErrorPage
            variant="embedded"
            error={error}
            onRetry={() => window.location.reload()}
            retryLabel={t("actions.retry")}
          />
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h1 className="mb-2 text-xl font-semibold text-foreground sm:text-2xl">
                      {ts("title")}
                    </h1>
                    <p className="text-slate-600 dark:text-gray-400">
                      {ts("subtitle")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isOrgAdmin && (
                    <Link href="/users">
                      <Button variant="outline">{t("actions.users")}</Button>
                    </Link>
                  )}
                  {isOrgAdmin && (
                    <Button onClick={handleAddRoom}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("actions.newRoom")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("filters.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                  />
                </div>

                <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
                  <SearchableSelect
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                      { value: "all", label: t("filters.statusAll") },
                      { value: "LIVRE", label: t("filters.statusFree") },
                      { value: "EM_USO", label: t("filters.statusInUse") },
                      {
                        value: "RESERVADO",
                        label: t("filters.statusReserved"),
                      },
                    ]}
                    placeholder={t("filters.statusAll")}
                    allowEmpty={false}
                    className="h-11 w-full min-w-0 flex-1 sm:w-40 sm:flex-none"
                    triggerClassName={FILTER_TRIGGER_CLASS}
                  />

                  <SearchableSelect
                    value={sectorFilter}
                    onChange={setSectorFilter}
                    options={[
                      { value: "all", label: ts("filters.sectorAll") },
                      { value: "noSector", label: ts("filters.noSector") },
                      ...sectorOptions.map(sector => ({
                        value: sector.id,
                        label: sector.name,
                      })),
                    ]}
                    placeholder={ts("filters.sectorAll")}
                    allowEmpty={false}
                    className="h-11 w-full min-w-0 flex-1 sm:w-44 sm:flex-none"
                    triggerClassName={FILTER_TRIGGER_CLASS}
                  />

                  <div
                    role="group"
                    aria-label={t("filters.viewMode")}
                    className="inline-flex h-11 shrink-0 items-center rounded-lg border border-slate-300 bg-slate-100/90 p-1 dark:border-gray-600 dark:bg-gray-900/60"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      aria-pressed={viewMode === "grid"}
                      title={t("filters.gridView")}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-md transition-all",
                        viewMode === "grid"
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                          : "text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200"
                      )}
                    >
                      <Grid className="h-4 w-4" aria-hidden />
                      <span className="sr-only">{t("filters.gridView")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-pressed={viewMode === "list"}
                      title={t("filters.listView")}
                      className={cn(
                        "inline-flex h-9 w-9 items-center justify-center rounded-md transition-all",
                        viewMode === "list"
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-gray-800 dark:text-white dark:ring-gray-700"
                          : "text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200"
                      )}
                    >
                      <List className="h-4 w-4" aria-hidden />
                      <span className="sr-only">{t("filters.listView")}</span>
                    </button>
                  </div>
                </div>
              </div>

              {orphanCount > 0 && sectorFilter !== "noSector" ? (
                <button
                  type="button"
                  onClick={() => setSectorFilter("noSector")}
                  className="mb-6 w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20"
                >
                  {ts("orphanBanner", { count: orphanCount })}
                </button>
              ) : null}
            </div>

            {filteredRooms.length === 0 ? (
              <EmptyState
                icon={
                  <Building2 className="h-8 w-8 text-slate-500 dark:text-gray-400" />
                }
                title={
                  searchTerm || statusFilter !== "all" || sectorFilter !== "all"
                    ? t("empty.notFoundTitle")
                    : t("empty.noDataTitle")
                }
                description={
                  searchTerm || statusFilter !== "all" || sectorFilter !== "all"
                    ? t("empty.notFoundDesc")
                    : t("empty.noDataDesc")
                }
                action={
                  searchTerm || statusFilter !== "all" || sectorFilter !== "all"
                    ? undefined
                    : { label: t("empty.createFirst"), onClick: handleAddRoom }
                }
              />
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {paginatedRooms.map((room: any) =>
                      renderRoomCard(room, false)
                    )}
                    <Card
                      variant="outlined"
                      hover
                      className="flex h-full min-h-[280px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 animate-scaleIn group dark:border-slate-500/50 dark:hover:border-blue-500/50"
                      onClick={handleAddRoom}
                    >
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                        <Plus className="h-5 w-5" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        {t("card.createTitle")}
                      </h3>
                      <p className="max-w-48 text-center text-sm text-muted-foreground">
                        {t("card.createDescription")}
                      </p>
                    </Card>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {paginatedRooms.map((room: any) =>
                      renderRoomCard(room, true)
                    )}
                  </div>
                )}

                <Pagination
                  className="mt-8"
                  page={safePage}
                  pageSize={pageSize}
                  total={totalFiltered}
                  onPageChange={setPage}
                  onPageSizeChange={size => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              </>
            )}

            <Drawer
              isOpen={isCreateRoomModalOpen}
              onClose={() => setCreateRoomModalOpen(false)}
              title={t("modal.createTitle")}
            >
              <RoomForm
                onSubmit={handleCreateRoom}
                onCancel={() => setCreateRoomModalOpen(false)}
                loading={createRoomLoading}
              />
            </Drawer>
          </>
        )}
      </PageLayout>
    </SalasAccessGuard>
  );
};

export default SalasPage;
