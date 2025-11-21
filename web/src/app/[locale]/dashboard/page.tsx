"use client";

import { Building2, Grid, List, Plus, Search } from "lucide-react";
import { Link } from "@/navigation";
import { useRouter } from "@/navigation";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl"; // Importação correta

import { RoomForm } from "@/components/forms/RoomForm";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
import { Room } from "@/lib/types";

const DashboardPage: React.FC = () => {
  // Inicializando o hook de tradução com o namespace 'Dashboard'
  const t = useTranslations("Dashboard");

  const { data: session } = useSession();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    currentPage,
    onPageChange: setCurrentPage,
  });

  const { handleNotificationClick: globalNotificationHandler } =
    useNotificationHandler();

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
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
          err instanceof Error ? err.message : t("feedback.errorGeneric"); // Tradução de erro genérico
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [session?.user?.email, roomsCache, lastFetchTime, showError, t]);

  const filteredRooms = rooms.filter((room: any) => {
    const matchesSearch =
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.items.some((item: any) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      statusFilter === "all" || room.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleAddRoom = () => {
    setCreateRoomModalOpen(true);
  };

  const handleCreateRoom = async (
    roomData: Omit<Room, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error(t("feedback.errorCreate")); // Tradução
      }

      const newRoom = await response.json();
      setRooms((prev: any[]) => [...prev, newRoom]);
      setCreateRoomModalOpen(false);
      // Tradução com parâmetro dinâmico
      showSuccess(t("feedback.successCreate", { name: newRoom.name }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("feedback.errorCreate");
      showError(errorMessage);
    }
  };

  if (loading) {
    return <LoadingPage message={t("feedback.loading")} />;
  }

  if (error) {
    return (
      <ErrorPage
        error={error}
        onRetry={() => window.location.reload()}
        retryLabel={t("actions.retry")}
      />
    );
  }

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
      onNotificationItemClick={globalNotificationHandler}
      notificationUpdateTrigger={0}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {t("header.title")}
              </h1>
              <p className="text-slate-600 dark:text-gray-400">
                {t("header.description")}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {session?.user?.role === "ADMIN" && (
              <Link href="/users">
                <Button variant="outline">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  {t("actions.users")}
                </Button>
              </Link>
            )}
            <Button onClick={handleAddRoom}>
              <Plus className="w-4 h-4 mr-2" />
              {t("actions.newRoom")}
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 dark:text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("filters.searchPlaceholder")}
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setStatusFilter(e.target.value)
              }
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* Values mantidos em caps lock pois devem bater com o backend/enum */}
              <option value="all">{t("filters.statusAll")}</option>
              <option value="LIVRE">{t("filters.statusFree")}</option>
              <option value="EM_USO">{t("filters.statusInUse")}</option>
              <option value="RESERVADO">{t("filters.statusReserved")}</option>
            </select>

            <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-slate-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-l-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-r-lg transition-colors ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Card Total */}
          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {rooms.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {t("stats.total")}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-1 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Disponíveis */}
          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {rooms.filter((r: any) => r.status === "LIVRE").length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {t("stats.available")}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        rooms.length > 0
                          ? (rooms.filter((r: any) => r.status === "LIVRE")
                              .length /
                              rooms.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Em Uso */}
          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-red-500/20 to-rose-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-rose-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {rooms.filter((r: any) => r.status === "EM_USO").length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {t("stats.inUse")}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2">
                  <div
                    className="bg-gradient-to-r from-red-500 to-rose-500 h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        rooms.length > 0
                          ? (rooms.filter((r: any) => r.status === "EM_USO")
                              .length /
                              rooms.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Reservadas */}
          <Card variant="elevated" hover className="group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {rooms.filter((r: any) => r.status === "RESERVADO").length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {t("stats.reserved")}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 mt-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-500 h-1 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        rooms.length > 0
                          ? (rooms.filter((r: any) => r.status === "RESERVADO")
                              .length /
                              rooms.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={
            <Building2 className="w-8 h-8 text-slate-500 dark:text-gray-400" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room: any) => (
            <Card
              key={room.id}
              variant="elevated"
              hover
              className="group animate-scaleIn"
            >
              {/* Header do Card */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-4">
                  <StatusBadge status={room.status} />
                  {room.reservations && room.reservations.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-500/20 rounded-full border border-amber-300 dark:border-amber-500/30">
                      <div className="w-2 h-2 bg-amber-500 dark:bg-amber-400 rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                        {t("card.reservedTag")}
                      </span>
                    </div>
                  )}
                </div>

                <CardTitle className="text-xl mb-2 group-hover:text-blue-400 transition-colors duration-300">
                  {room.name}
                </CardTitle>
                <CardDescription className="mb-4">
                  {room.description}
                </CardDescription>

                {room.capacity && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                    <div className="w-4 h-4 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                      <span className="text-xs">👥</span>
                    </div>
                    {/* Tradução com parametro de quantidade */}
                    <span>{t("card.people", { count: room.capacity })}</span>
                  </div>
                )}
              </div>

              {/* Lista de Itens */}
              <div className="mb-4">
                <div className="space-y-2">
                  {room.items.slice(0, 2).map((item: any) => {
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
                        className="flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-700/30 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700/50 transition-colors duration-300"
                      >
                        {itemImage ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="w-full h-full object-contain p-0.5"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                            {item.icon || "📦"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {t("card.quantity", { count: item.quantity })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {room.items.length > 2 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-slate-600 dark:text-slate-500 bg-slate-200 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                        {t("card.moreItems", {
                          count: room.items.length - 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/50">
                <Link href={`/salas/${room.id}`} className="w-full">
                  <Button
                    variant="secondary"
                    className="w-full group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                  >
                    {t("actions.viewDetails")}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}

          {/* Card Criar Nova Sala (Fim da Lista) */}
          <Card
            variant="outlined"
            hover
            className="border-dashed border-2 border-slate-300 dark:border-slate-500/50 hover:border-blue-500/50 cursor-pointer group animate-scaleIn flex flex-col items-center justify-center h-full min-h-[300px]"
            onClick={handleAddRoom}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
              {t("card.createTitle")}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm text-center max-w-48">
              {t("card.createDescription")}
            </p>
            <div className="mt-6 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 rounded-full border border-blue-200 dark:border-blue-500/20">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                {t("actions.clickToStart")}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        title={t("modal.createTitle")}
      >
        <RoomForm
          onSubmit={handleCreateRoom}
          onCancel={() => setCreateRoomModalOpen(false)}
        />
      </Modal>
    </PageLayout>
  );
};

export default DashboardPage;
