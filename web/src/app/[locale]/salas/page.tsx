"use client";

import { Building2, Grid, List, Plus, Search } from "lucide-react";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { Room } from "@/lib/types";
import { safeLocalStorage } from "@/lib/utils/clientSafe";
import { Link } from "@/navigation";

const VIEW_MODE_KEY = "sala-view-mode";

const SalasPage: React.FC = () => {
  const t = useTranslations("Dashboard");
  const ts = useTranslations("SalasPage");

  const { data: session } = useSession();
  const { isOrgAdmin, isSectorManager } = useOrgPermissions();
  const [currentPageNav, setCurrentPageNav] = useState("salas");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [sectors, setSectors] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

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
                setSectors(
                  sectorsData
                    .map((s: { id: string; name: string }) => ({
                      id: s.id,
                      name: s.name,
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name))
                );
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
            setSectors(
              sectorsData
                .map((s: { id: string; name: string }) => ({
                  id: s.id,
                  name: s.name,
                }))
                .sort((a, b) => a.name.localeCompare(b.name))
            );
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

    const managedSectorIds = new Set(sectors.map(s => s.id));
    const matchesManagerScope =
      isOrgAdmin ||
      (isSectorManager &&
        !!roomSectorId &&
        managedSectorIds.has(roomSectorId));

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
    }
  };

  const renderRoomCard = (room: any, list: boolean) => {
    const hasActiveReservation =
      Array.isArray(room.reservations) && room.reservations.length > 0;
    const extraItems = Math.max(0, (room.items?.length ?? 0) - 2);
    const previewItems = room.items?.slice(0, 2) ?? [];

    const inner = (
      <>
        <div
          className={
            list
              ? "min-w-0 flex-1"
              : "flex min-h-0 flex-1 flex-col"
          }
        >
          <div className="mb-4 flex min-h-7 items-center justify-between gap-3">
            <StatusBadge status={room.status} />
            {hasActiveReservation ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>{t("card.reservedTag")}</span>
              </div>
            ) : (
              <span className="invisible text-xs" aria-hidden>
                {t("card.reservedTag")}
              </span>
            )}
          </div>

          <CardTitle
            className={`mb-1.5 line-clamp-2 min-h-[3.5rem] text-slate-900 transition-colors duration-300 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 ${
              list ? "min-h-0 text-xl" : "text-2xl font-bold leading-tight"
            }`}
          >
            {room.name}
          </CardTitle>

          <p
            className={`mb-3 line-clamp-1 font-medium ${
              room.sector?.name
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            } ${list ? "text-xs" : "text-sm"}`}
          >
            {room.sector?.name || ts("noSector")}
          </p>

          <CardDescription
            className={`mb-3 text-slate-600 dark:text-slate-400 ${
              list
                ? "line-clamp-2 min-h-0 text-sm"
                : "line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed"
            }`}
          >
            {room.description?.trim() || "\u00A0"}
          </CardDescription>

          <div className="mb-5 flex min-h-5 items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            {room.capacity ? (
              <>
                <HiUsers className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t("card.people", { count: room.capacity })}</span>
              </>
            ) : (
              <span className="invisible" aria-hidden>
                —
              </span>
            )}
          </div>

          {!list && (
            <div className="mt-auto flex min-h-[7.5rem] flex-col gap-2.5">
              {previewItems.map((item: any) => {
                const itemImage =
                  item.images && item.images.length > 0
                    ? item.images[0].path.replace(
                        "/api/uploads/items/images/original_",
                        "/api/uploads/items/images/thumb_"
                      )
                    : null;

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800/50"
                  >
                    {itemImage ? (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-slate-900">
                        <img
                          src={itemImage}
                          alt={item.name}
                          className="h-full w-full object-contain p-0.5"
                        />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                        {item.icon ? (
                          <span className="text-base leading-none">
                            {item.icon}
                          </span>
                        ) : (
                          <MdInventory2 className="h-4 w-4" />
                        )}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("card.quantity", { count: item.quantity })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {previewItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700">
                  —
                </div>
              ) : null}
              <div className="flex min-h-7 justify-center pt-1">
                {extraItems > 0 ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    {t("card.moreItems", { count: extraItems })}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div
          className={
            list
              ? "flex w-full shrink-0 flex-col gap-2 sm:w-44"
              : "mt-5 shrink-0 border-t border-slate-200 pt-4 dark:border-slate-700/50"
          }
        >
          <Link href={`/salas/${room.id}`} className="w-full">
            <Button variant="primary" className="w-full">
              {t("actions.viewDetails")}
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
        className={`group animate-scaleIn h-full ${
          list
            ? "flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch"
            : "flex flex-col p-5"
        }`}
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
                  <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3">
                    <Building2 className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
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

              <div className="mb-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-slate-500 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("filters.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-900 transition-all placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setStatusFilter(e.target.value)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="all">{t("filters.statusAll")}</option>
                    <option value="LIVRE">{t("filters.statusFree")}</option>
                    <option value="EM_USO">{t("filters.statusInUse")}</option>
                    <option value="RESERVADO">
                      {t("filters.statusReserved")}
                    </option>
                  </select>

                  <select
                    value={sectorFilter}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSectorFilter(e.target.value)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="all">{ts("filters.sectorAll")}</option>
                    <option value="noSector">{ts("filters.noSector")}</option>
                    {sectorOptions.map(sector => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex rounded-lg border border-slate-300 bg-white dark:border-gray-600 dark:bg-gray-800">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`rounded-l-lg p-3 transition-colors ${
                        viewMode === "grid"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`rounded-r-lg p-3 transition-colors ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      <List className="h-4 w-4" />
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
                  searchTerm ||
                  statusFilter !== "all" ||
                  sectorFilter !== "all"
                    ? t("empty.notFoundTitle")
                    : t("empty.noDataTitle")
                }
                description={
                  searchTerm ||
                  statusFilter !== "all" ||
                  sectorFilter !== "all"
                    ? t("empty.notFoundDesc")
                    : t("empty.noDataDesc")
                }
                action={
                  searchTerm ||
                  statusFilter !== "all" ||
                  sectorFilter !== "all"
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
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 transition-transform duration-300 group-hover:scale-110">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600">
                          <Plus className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <h3 className="mb-2 text-xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-blue-400 dark:text-white">
                        {t("card.createTitle")}
                      </h3>
                      <p className="max-w-48 text-center text-sm text-slate-600 dark:text-slate-400">
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
              />
            </Drawer>
          </>
        )}
      </PageLayout>
    </SalasAccessGuard>
  );
};

export default SalasPage;
