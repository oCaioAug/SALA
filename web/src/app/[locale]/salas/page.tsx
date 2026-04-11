"use client";

import { Building2, Grid, List, Plus, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { HiUsers } from "react-icons/hi2";
import { MdInventory2 } from "react-icons/md";

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
import { Room } from "@/lib/types";
import { safeLocalStorage } from "@/lib/utils/clientSafe";
import { Link } from "@/navigation";

const VIEW_MODE_KEY = "sala-view-mode";

const SalasPage: React.FC = () => {
  const t = useTranslations("Dashboard");
  const ts = useTranslations("SalasPage");

  const { data: session } = useSession();
  const [currentPageNav, setCurrentPageNav] = useState("salas");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

        if (roomsCache.length > 0 && now - lastFetchTime < cacheExpiry) {
          setRooms(roomsCache);
          setLoading(false);
          return;
        }

        const response = await fetch("/api/rooms");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Erro ${response.status}: ${response.statusText}`
          );
        }
        const data = await response.json();

        setRooms(data);
        setRoomsCache(data);
        setLastFetchTime(now);
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

  const filteredRooms = rooms.filter((room: any) => {
    const items = room.items || [];
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      items.some((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

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
    roomData: Omit<Room, "id" | "createdAt" | "updatedAt">
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
    const inner = (
      <>
        <div className={list ? "min-w-0 flex-1" : "mb-4"}>
          <div className="mb-4 flex items-start justify-between">
            <StatusBadge status={room.status} />
            {room.reservations && room.reservations.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 dark:border-amber-500/30 dark:bg-amber-500/20">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500 dark:bg-amber-400"></div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {t("card.reservedTag")}
                </span>
              </div>
            )}
          </div>

          <CardTitle
            className={`mb-2 text-xl transition-colors duration-300 group-hover:text-blue-400 ${list ? "line-clamp-1" : ""}`}
          >
            {room.name}
          </CardTitle>
          <CardDescription className={`mb-4 ${list ? "line-clamp-2" : ""}`}>
            {room.description}
          </CardDescription>

          {room.capacity ? (
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600">
                <HiUsers
                  className="h-3 w-3 text-slate-600 dark:text-slate-400"
                  aria-hidden
                />
              </div>
              <span>{t("card.people", { count: room.capacity })}</span>
            </div>
          ) : null}

          {!list && (
            <div className="mb-4">
              <div className="space-y-2">
                {room.items?.slice(0, 2).map((item: any) => {
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
                      className="flex items-center gap-3 rounded-lg bg-slate-100 p-2 transition-colors duration-300 group-hover:bg-slate-200 dark:bg-slate-700/30 dark:group-hover:bg-slate-700/50"
                    >
                      {itemImage ? (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                          <img
                            src={itemImage}
                            alt={item.name}
                            className="h-full w-full object-contain p-0.5"
                          />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-200 text-sm dark:bg-slate-600">
                          {item.icon ? (
                            <span className="text-lg leading-none">
                              {item.icon}
                            </span>
                          ) : (
                            <MdInventory2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {t("card.quantity", { count: item.quantity })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {room.items?.length > 2 && (
                  <div className="py-2 text-center">
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-600 dark:bg-slate-700/50 dark:text-slate-500">
                      {t("card.moreItems", {
                        count: room.items.length - 2,
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={
            list
              ? "flex w-full shrink-0 flex-col gap-2 sm:w-44"
              : "border-t border-slate-200 pt-4 dark:border-slate-700/50"
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
        className={`group animate-scaleIn ${list ? "flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch" : ""}`}
      >
        {inner}
      </Card>
    );
  };

  return (
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
            {session?.user?.role === "ADMIN" && (
              <Link href="/users">
                <Button variant="outline">{t("actions.users")}</Button>
              </Link>
            )}
            <Button onClick={handleAddRoom}>
              <Plus className="mr-2 h-4 w-4" />
              {t("actions.newRoom")}
            </Button>
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
              <option value="RESERVADO">{t("filters.statusReserved")}</option>
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
      </div>

      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={
            <Building2 className="h-8 w-8 text-slate-500 dark:text-gray-400" />
          }
          title={
            searchTerm || statusFilter !== "all"
              ? t("empty.notFoundTitle")
              : t("empty.noDataTitle")
          }
          description={
            searchTerm || statusFilter !== "all"
              ? t("empty.notFoundDesc")
              : t("empty.noDataDesc")
          }
          action={
            searchTerm || statusFilter !== "all"
              ? undefined
              : { label: t("empty.createFirst"), onClick: handleAddRoom }
          }
        />
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedRooms.map((room: any) => renderRoomCard(room, false))}
              <Card
                variant="outlined"
                hover
                className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center border-2 border-dashed border-slate-300 animate-scaleIn group dark:border-slate-500/50 dark:hover:border-blue-500/50"
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
              {paginatedRooms.map((room: any) => renderRoomCard(room, true))}
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
  );
};

export default SalasPage;
