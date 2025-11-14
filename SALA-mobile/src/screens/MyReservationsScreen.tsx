import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  ReservationWithDetails,
  RESERVATION_STATUS_CONFIG,
  ReservationStatusEnum,
} from "../types";
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
    "ALL" | ReservationStatusEnum
  >("ALL");
  const [showDropdown, setShowDropdown] = useState(false);

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
      if (statusFilter === ReservationStatusEnum.ACTIVE) {
        // Incluir tanto ACTIVE quanto APPROVED como "ativas"
        filtered = filtered.filter(
          (reservation) =>
            reservation.status === ReservationStatusEnum.ACTIVE ||
            reservation.status === ReservationStatusEnum.APPROVED
        );
      } else {
        filtered = filtered.filter(
          (reservation) => reservation.status === statusFilter
        );
      }
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
      case ReservationStatusEnum.ACTIVE:
        return "Ativas";
      case ReservationStatusEnum.APPROVED:
        return "Aprovadas";
      case ReservationStatusEnum.PENDING:
        return "Pendentes";
      case ReservationStatusEnum.REJECTED:
        return "Rejeitadas";
      case ReservationStatusEnum.CANCELLED:
        return "Canceladas";
      case ReservationStatusEnum.COMPLETED:
        return "Concluídas";
      default:
        return "Todas";
    }
  };

  const cycleStatusFilter = () => {
    setShowDropdown(true);
  };

  const selectFilter = (filter: typeof statusFilter) => {
    setStatusFilter(filter);
    setShowDropdown(false);
  };

  const getFilterOptions = (): Array<{
    value: typeof statusFilter;
    label: string;
    count: number;
  }> => {
    return [
      { value: "ALL" as const, label: "Todas", count: stats.total },
      {
        value: ReservationStatusEnum.ACTIVE,
        label: "Ativas",
        count: stats.active,
      },
      {
        value: ReservationStatusEnum.PENDING,
        label: "Pendentes",
        count: stats.pending,
      },
      {
        value: ReservationStatusEnum.APPROVED,
        label: "Aprovadas",
        count: reservations.filter(
          (r) => r.status === ReservationStatusEnum.APPROVED
        ).length,
      },
      {
        value: ReservationStatusEnum.REJECTED,
        label: "Rejeitadas",
        count: stats.rejected,
      },
      {
        value: ReservationStatusEnum.CANCELLED,
        label: "Canceladas",
        count: stats.cancelled,
      },
      {
        value: ReservationStatusEnum.COMPLETED,
        label: "Concluídas",
        count: stats.completed,
      },
    ];
  };

  const getStatusStats = () => {
    const stats = {
      total: reservations.length,
      active: reservations.filter(
        (r) =>
          r.status === ReservationStatusEnum.ACTIVE ||
          r.status === ReservationStatusEnum.APPROVED
      ).length,
      pending: reservations.filter(
        (r) => r.status === ReservationStatusEnum.PENDING
      ).length,
      rejected: reservations.filter(
        (r) => r.status === ReservationStatusEnum.REJECTED
      ).length,
      cancelled: reservations.filter(
        (r) => r.status === ReservationStatusEnum.CANCELLED
      ).length,
      completed: reservations.filter(
        (r) => r.status === ReservationStatusEnum.COMPLETED
      ).length,
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

  const renderDropdownOption = ({
    item,
  }: {
    item: { value: typeof statusFilter; label: string; count: number };
  }) => {
    const isSelected = statusFilter === item.value;
    const statusConfig =
      item.value !== "ALL"
        ? RESERVATION_STATUS_CONFIG[item.value as ReservationStatusEnum]
        : null;

    return (
      <TouchableOpacity
        style={[
          styles.dropdownOption,
          isSelected && styles.dropdownOptionSelected,
        ]}
        onPress={() => selectFilter(item.value)}
      >
        <View style={styles.dropdownOptionContent}>
          <View style={styles.dropdownOptionLeft}>
            {statusConfig && (
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusConfig.color },
                ]}
              />
            )}
            <Text
              style={[
                styles.dropdownOptionText,
                isSelected && styles.dropdownOptionTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </View>
          <View
            style={[styles.countBadge, isSelected && styles.countBadgeSelected]}
          >
            <Text
              style={[styles.countText, isSelected && styles.countTextSelected]}
            >
              {item.count}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Filtrar por Status</Text>
              <TouchableOpacity
                onPress={() => setShowDropdown(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={getFilterOptions()}
              keyExtractor={(item) => item.value}
              renderItem={renderDropdownOption}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  // Modal e Dropdown Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxHeight: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  dropdownOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  dropdownOptionSelected: {
    backgroundColor: "#EBF8FF",
  },
  dropdownOptionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: "#1D4ED8",
    fontWeight: "600",
  },
  countBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  countBadgeSelected: {
    backgroundColor: "#DBEAFE",
  },
  countText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  countTextSelected: {
    color: "#1D4ED8",
  },
});

export default MyReservationsScreen;
