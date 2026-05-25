"use client";

import { Building2, MapPin, Plug, Search, Snowflake } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { HiUsers } from "react-icons/hi2";

import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
import { RoomStatus } from "@/lib/types";
import { Link, useRouter } from "@/navigation";

type RoomItem = {
  id: string;
  name: string;
  quantity: number;
};

type ActiveReservation = {
  id: string;
  startTime: string;
  endTime: string;
  user?: { id: string; name: string | null };
};

type ExploreRoom = {
  id: string;
  name: string;
  description: string | null;
  status: RoomStatus;
  capacity: number | null;
  locationDescription: string | null;
  outletCount: number | null;
  climateControlled: boolean;
  items: RoomItem[];
  reservations?: ActiveReservation[];
};

const STATUS_ORDER: Record<RoomStatus, number> = {
  LIVRE: 0,
  RESERVADO: 1,
  EM_USO: 2,
};

export default function ExplorarPage() {
  const t = useTranslations("ExplorarPage");
  const td = useTranslations("Dashboard.filters");
  const router = useRouter();
  const {
    isOrgAdmin,
    isSuperAdmin,
    hasOrganization,
    isLoading: permLoading,
  } = useOrgPermissions();
  const [currentPage, setCurrentPage] = useState("explorar");
  const [rooms, setRooms] = useState<ExploreRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [equipmentFilter, setEquipmentFilter] = useState("");

  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage,
  });
  const { handleNotificationClick } = useNotificationHandler();

  useEffect(() => {
    if (!permLoading && isSuperAdmin && !hasOrganization) {
      router.replace("/inicio");
      return;
    }
    if (!permLoading && isOrgAdmin) {
      router.replace("/dashboard");
    }
  }, [isOrgAdmin, isSuperAdmin, hasOrganization, permLoading, router]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (isSuperAdmin && !hasOrganization) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/rooms");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? t("errorLoad"));
        }
        setRooms(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : t("errorLoad"));
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [t, isSuperAdmin, hasOrganization]);

  const stats = useMemo(() => {
    return {
      total: rooms.length,
      livre: rooms.filter(r => r.status === "LIVRE").length,
      emUso: rooms.filter(r => r.status === "EM_USO").length,
      reservado: rooms.filter(r => r.status === "RESERVADO").length,
    };
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const term = search.trim().toLowerCase();
    const equip = equipmentFilter.trim().toLowerCase();

    return rooms
      .filter(room => {
        if (statusFilter !== "all" && room.status !== statusFilter)
          return false;
        if (term) {
          const haystack = [
            room.name,
            room.description ?? "",
            room.locationDescription ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        if (equip) {
          const hasItem = room.items.some(i =>
            i.name.toLowerCase().includes(equip)
          );
          if (!hasItem) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        if (statusDiff !== 0) return statusDiff;
        return a.name.localeCompare(b.name);
      });
  }, [rooms, search, statusFilter, equipmentFilter]);

  const recommended = useMemo(
    () => filteredRooms.filter(r => r.status === "LIVRE").slice(0, 3),
    [filteredRooms]
  );

  return (
    <PageLayout
      currentPage={currentPage}
      onNavigate={navigate}
      isNavigating={isNavigating}
      onNotificationClick={() => {}}
      onNotificationItemClick={handleNotificationClick}
      notificationUpdateTrigger={0}
    >
      {loading || permLoading ? (
        <LoadingPage variant="embedded" message={t("loading")} />
      ) : error ? (
        <ErrorPage
          variant="embedded"
          error={error}
          onRetry={() => window.location.reload()}
          retryLabel={t("retry")}
        />
      ) : (
        <div className="space-y-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 p-3">
                <Building2 className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  {t("title")}
                </h1>
                <p className="text-slate-600 dark:text-gray-400">
                  {t("subtitle")}
                </p>
              </div>
            </div>
            <Link href="/agendamentos">
              <Button>{t("bookRoom")}</Button>
            </Link>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label={t("statsTotal")} value={stats.total} />
            <StatCard
              label={td("statusFree")}
              value={stats.livre}
              tone="green"
            />
            <StatCard
              label={td("statusInUse")}
              value={stats.emUso}
              tone="red"
            />
            <StatCard
              label={td("statusReserved")}
              value={stats.reservado}
              tone="amber"
            />
          </div>

          {recommended.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                {t("recommended")}
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                {recommended.map(room => (
                  <RoomExploreCard key={room.id} room={room} compact />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <input
                type="text"
                value={equipmentFilter}
                onChange={e => setEquipmentFilter(e.target.value)}
                placeholder={t("equipmentPlaceholder")}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800 dark:text-white lg:w-72"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">{td("statusAll")}</option>
                <option value="LIVRE">{td("statusFree")}</option>
                <option value="EM_USO">{td("statusInUse")}</option>
                <option value="RESERVADO">{td("statusReserved")}</option>
              </select>
            </div>

            {filteredRooms.length === 0 ? (
              <EmptyState
                icon={
                  <Building2 className="h-8 w-8 text-slate-500 dark:text-gray-400" />
                }
                title={t("emptyTitle")}
                description={t("emptyDesc")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredRooms.map(room => (
                  <RoomExploreCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </PageLayout>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "red" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-500/30 bg-emerald-500/10"
      : tone === "red"
        ? "border-red-500/30 bg-red-500/10"
        : tone === "amber"
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800/50";

  return (
    <Card className={toneClass}>
      <CardContent className="p-4">
        <p className="text-sm text-slate-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function RoomExploreCard({
  room,
  compact = false,
}: {
  room: ExploreRoom;
  compact?: boolean;
}) {
  const t = useTranslations("ExplorarPage");
  const active = room.reservations?.[0];

  return (
    <Card className="border-slate-200 dark:border-gray-700">
      <CardContent className={`space-y-3 ${compact ? "p-4" : "p-5"}`}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {room.name}
          </h3>
          <StatusBadge status={room.status} />
        </div>

        {room.description && !compact && (
          <p className="line-clamp-2 text-sm text-slate-600 dark:text-gray-400">
            {room.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-gray-400">
          {room.locationDescription && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {room.locationDescription}
            </span>
          )}
          {room.capacity != null && (
            <span className="inline-flex items-center gap-1">
              <HiUsers className="h-3.5 w-3.5" />
              {room.capacity}
            </span>
          )}
          {room.climateControlled && (
            <span className="inline-flex items-center gap-1">
              <Snowflake className="h-3.5 w-3.5" />
              {t("climate")}
            </span>
          )}
          {room.outletCount != null && room.outletCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Plug className="h-3.5 w-3.5" />
              {room.outletCount}
            </span>
          )}
        </div>

        {room.status === "EM_USO" && active?.user?.name && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {t("inUseBy", { name: active.user.name })}
          </p>
        )}

        {room.items.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {room.items.slice(0, compact ? 4 : 8).map(item => (
              <span
                key={item.id}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-gray-700 dark:text-gray-200"
              >
                {item.name}
                {item.quantity > 1 ? ` (${item.quantity})` : ""}
              </span>
            ))}
            {room.items.length > (compact ? 4 : 8) && (
              <span className="text-xs text-slate-500">
                +{room.items.length - (compact ? 4 : 8)}
              </span>
            )}
          </div>
        )}

        <Link href={`/salas/${room.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            {t("viewDetails")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
