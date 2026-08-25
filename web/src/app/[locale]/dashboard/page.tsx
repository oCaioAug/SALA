"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { OrgAdminGuard } from "@/components/auth/OrgAdminGuard";
import type { DashboardChartStats } from "@/components/dashboard/dashboardChartStats";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { ErrorPage } from "@/components/layout/ErrorPage";
import { LoadingPage } from "@/components/layout/LoadingPage";
import { PageLayout } from "@/components/layout/PageLayout";
import { useApp } from "@/lib/hooks/useApp";
import { useNavigation } from "@/lib/hooks/useNavigation";
import { useNotificationHandler } from "@/lib/hooks/useNotificationHandler";
import { useOrgPermissions } from "@/lib/hooks/useOrgPermissions";
const DashboardPage: React.FC = () => {
  const t = useTranslations("Dashboard");
  const th = useTranslations("DashboardHome");

  const { data: session } = useSession();
  const router = useRouter();
  const { isOrgMember, isLoading: permLoading } = useOrgPermissions();
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
    if (!permLoading && isOrgMember) {
      router.replace("/explorar");
    }
  }, [isOrgMember, permLoading, router]);

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
    <OrgAdminGuard>
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
          <DashboardGrid
            rooms={rooms}
            chartStats={chartStats}
            chartStatsLoading={chartStatsLoading}
            title={th("title")}
            subtitle={th("subtitle")}
          />
        )}
      </PageLayout>
    </OrgAdminGuard>
  );
};

export default DashboardPage;
