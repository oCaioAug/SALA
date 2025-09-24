import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ReservationWithDetails, RESERVATION_STATUS_CONFIG } from "../types";
import ApiService from "../services/api";
import ReservationCard from "../components/ReservationCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { MOCK_USER } from "../utils/config";

const MyReservationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithDetails[]>(
    []
  );
  const [filteredReservations, setFilteredReservations] = useState<
    ReservationWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "CANCELLED" | "COMPLETED"
  >("ALL");

  // User ID from authenticated user or fallback to MOCK_USER
  const userId = user?.id || MOCK_USER.id;

  const loadReservations = useCallback(async () => {
    try {
      console.log("🔍 Carregando reservas para usuário:", userId);

      // Buscar reservas específicas do usuário usando parâmetro da API
      const data = await ApiService.getUserReservations(userId);

      console.log("📋 Reservas encontradas:", data.length);
      console.log(
        "📋 Detalhes das reservas:",
        data.map((r: ReservationWithDetails) => ({
          id: r.id,
          roomName: r.room?.name,
          startTime: r.startTime,
          status: r.status,
        }))
      );

      setReservations(data);
      setFilteredReservations(data);
    } catch (error) {
      console.error("❌ Erro ao carregar reservas:", error);
      Alert.alert("Erro", "Não foi possível carregar suas reservas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  useEffect(() => {
    let filtered = reservations;

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (reservation) => reservation.status === statusFilter
      );
    }

    // Sort by start time (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    setFilteredReservations(filtered);
  }, [reservations, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReservations();
  }, [loadReservations]);

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await ApiService.cancelReservation(reservationId);
      Alert.alert("Sucesso", "Reserva cancelada com sucesso");
      loadReservations();
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message || "Não foi possível cancelar a reserva"
      );
    }
  };

  const getFilterText = (filter: typeof statusFilter) => {
    switch (filter) {
      case "ALL":
        return "Todas";
      case "ACTIVE":
        return "Ativas";
      case "CANCELLED":
        return "Canceladas";
      case "COMPLETED":
        return "Concluídas";
      default:
        return "Todas";
    }
  };

  const cycleStatusFilter = () => {
    const statuses: (typeof statusFilter)[] = [
      "ALL",
      "ACTIVE",
      "CANCELLED",
      "COMPLETED",
    ];
    const currentIndex = statuses.indexOf(statusFilter);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setStatusFilter(statuses[nextIndex]);
  };

  const getStatusStats = () => {
    const stats = {
      total: reservations.length,
      active: reservations.filter((r) => r.status === "ACTIVE").length,
      cancelled: reservations.filter((r) => r.status === "CANCELLED").length,
      completed: reservations.filter((r) => r.status === "COMPLETED").length,
    };
    return stats;
  };

  if (loading) {
    return <LoadingSpinner message="Carregando suas reservas..." />;
  }

  const stats = getStatusStats();

  const renderReservation = ({ item }: { item: ReservationWithDetails }) => (
    <ReservationCard reservation={item} onCancel={handleCancelReservation} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              { color: RESERVATION_STATUS_CONFIG.ACTIVE.color },
            ]}
          >
            {stats.active}
          </Text>
          <Text style={styles.statLabel}>Ativas</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              { color: RESERVATION_STATUS_CONFIG.COMPLETED.color },
            ]}
          >
            {stats.completed}
          </Text>
          <Text style={styles.statLabel}>Concluídas</Text>
        </View>
        <View style={styles.statItem}>
          <Text
            style={[
              styles.statNumber,
              { color: RESERVATION_STATUS_CONFIG.CANCELLED.color },
            ]}
          >
            {stats.cancelled}
          </Text>
          <Text style={styles.statLabel}>Canceladas</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={cycleStatusFilter}
        >
          <Ionicons name="funnel" size={20} color="#3B82F6" />
          <Text style={styles.filterText}>{getFilterText(statusFilter)}</Text>
          <Ionicons name="chevron-down" size={16} color="#3B82F6" />
        </TouchableOpacity>

        <Text style={styles.resultText}>
          {filteredReservations.length}{" "}
          {filteredReservations.length === 1 ? "reserva" : "reservas"}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredReservations}
        keyExtractor={(item) => item.id}
        renderItem={renderReservation}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          reservations.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="Nenhuma reserva encontrada"
              subtitle="Você ainda não fez nenhuma reserva. Explore as salas disponíveis e faça sua primeira reserva!"
            />
          ) : statusFilter !== "ALL" ? (
            <EmptyState
              icon="filter"
              title="Nenhuma reserva encontrada"
              subtitle={`Você não possui reservas com status "${getFilterText(
                statusFilter
              ).toLowerCase()}"`}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  resultText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default MyReservationsScreen;
