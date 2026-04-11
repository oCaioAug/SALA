export type DashboardChartStats = {
  weeklyReservations: { key: string; label: string; count: number }[];
  reservationStatus: { status: string; count: number }[];
  topRooms: { name: string; count: number }[];
  scope: "all" | "mine";
  incidents: {
    byStatus: { status: string; count: number }[];
    total: number;
    open: number;
  };
  solicitations: {
    pending: number;
  };
};
