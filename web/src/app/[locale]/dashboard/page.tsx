"use client";

import { Building2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
const DashboardPage: React.FC = () => {
  const t = useTranslations("Dashboard");
  const th = useTranslations("DashboardHome");

  const { data: session } = useSession();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartStats, setChartStats] = useState<DashboardChartStats | null>(
    null
  );
  const [chartStatsLoading, setChartStatsLoading] = useState(true);

  const {
    roomsCache,
    setRoomsCache,
    lastFetchTime,
    setLastFetchTime,
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

  useEffect(() => {
    if (!session?.user?.email) {
      setChartStatsLoading(false);
      return;
    }

    let cancelled = false;

    const loadChartStats = async () => {
      setChartStatsLoading(true);
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("stats");
        const data = (await res.json()) as DashboardChartStats;
        if (!cancelled) setChartStats(data);
      } catch {
        if (!cancelled) {
          setChartStats({
            weeklyReservations: [],
            reservationStatus: [],
            topRooms: [],
            scope: "mine",
            incidents: { byStatus: [], total: 0, open: 0 },
            solicitations: { pending: 0 },
          });
        }
      } finally {
        if (!cancelled) setChartStatsLoading(false);
      }
    };

    void loadChartStats();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  return (
    <PageLayout
      currentPage={currentPage}
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
      <div className="mb-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-3">
            <Building2 className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {th("title")}
            </h1>
            <p className="text-slate-600 dark:text-gray-400">
              {th("subtitle")}
            </p>
            <p className="mt-3 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
              {t("header.description")}
            </p>
          </div>
        </div>

        <DashboardGrid
          rooms={rooms}
          chartStats={chartStats}
          chartStatsLoading={chartStatsLoading}
        />
      </div>
      )}
    </PageLayout>
  );
};

export default DashboardPage;
