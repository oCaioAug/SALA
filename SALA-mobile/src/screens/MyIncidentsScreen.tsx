import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import ApiService from "../services/api";
import {
  RootStackParamList,
  Incident,
  INCIDENT_STATUS_LABELS,
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_PRIORITY_COLORS,
} from "../types";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, formatTime } from "../utils";

type MyIncidentsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MyIncidents"
>;

const MyIncidentsScreen: React.FC = () => {
  const navigation = useNavigation<MyIncidentsNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadIncidents = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await ApiService.getUserIncidents(user.id);
      setIncidents(data);
    } catch (error: any) {
      console.error("Erro ao carregar incidentes:", error);
      if (!refreshing) {
        Alert.alert("Erro", "Não foi possível carregar os incidentes");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, refreshing]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadIncidents();
  }, [loadIncidents]);

  const getStatusColor = (status: Incident["status"]) => {
    switch (status) {
      case "RESOLVED":
        return { color: "#10B981", backgroundColor: "#D1FAE5" };
      case "IN_PROGRESS":
        return { color: "#8B5CF6", backgroundColor: "#EDE9FE" };
      case "IN_ANALYSIS":
        return { color: "#3B82F6", backgroundColor: "#DBEAFE" };
      case "REPORTED":
        return { color: "#F59E0B", backgroundColor: "#FEF3C7" };
      case "CANCELLED":
        return { color: "#6B7280", backgroundColor: "#F3F4F6" };
      default:
        return { color: "#6B7280", backgroundColor: "#F3F4F6" };
    }
  };

  const getStatusIcon = (status: Incident["status"]) => {
    switch (status) {
      case "RESOLVED":
        return "checkmark-circle";
      case "IN_PROGRESS":
        return "hourglass";
      case "IN_ANALYSIS":
        return "search";
      case "REPORTED":
        return "alert-circle";
      case "CANCELLED":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando incidentes..." />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Incidentes</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
      >
        {incidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Nenhum incidente reportado</Text>
            <Text style={styles.emptyText}>
              Você ainda não reportou nenhum incidente. Use o botão "Reportar
              Incidente" na tela de detalhes da sala para reportar um problema.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <Text style={styles.statsTitle}>Resumo</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>{incidents.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {
                      incidents.filter((i) => i.status === "RESOLVED").length
                    }
                  </Text>
                  <Text style={styles.statLabel}>Resolvidos</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>
                    {
                      incidents.filter(
                        (i) =>
                          i.status === "REPORTED" ||
                          i.status === "IN_ANALYSIS" ||
                          i.status === "IN_PROGRESS"
                      ).length
                    }
                  </Text>
                  <Text style={styles.statLabel}>Em Andamento</Text>
                </View>
              </View>
            </View>

            {incidents.map((incident) => {
              const statusColors = getStatusColor(incident.status);
              const priorityColors =
                INCIDENT_PRIORITY_COLORS[incident.priority];
              const statusIcon = getStatusIcon(incident.status);

              return (
                <TouchableOpacity
                  key={incident.id}
                  style={styles.incidentCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.incidentHeader}>
                    <View style={styles.incidentTitleContainer}>
                      <Text style={styles.incidentTitle} numberOfLines={2}>
                        {incident.title}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColors.backgroundColor },
                      ]}
                    >
                      <Ionicons
                        name={statusIcon as any}
                        size={14}
                        color={statusColors.color}
                      />
                      <Text
                        style={[styles.statusText, { color: statusColors.color }]}
                      >
                        {INCIDENT_STATUS_LABELS[incident.status]}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.incidentDescription} numberOfLines={2}>
                    {incident.description}
                  </Text>

                  <View style={styles.incidentMeta}>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: priorityColors.backgroundColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: priorityColors.color },
                        ]}
                      >
                        {INCIDENT_PRIORITY_LABELS[incident.priority]}
                      </Text>
                    </View>

                    <View style={styles.categoryBadge}>
                      <Ionicons name="pricetag" size={12} color="#6B7280" />
                      <Text style={styles.categoryText}>
                        {INCIDENT_CATEGORY_LABELS[incident.category]}
                      </Text>
                    </View>
                  </View>

                  {(incident.room || incident.item) && (
                    <View style={styles.locationContainer}>
                      <Ionicons name="location" size={14} color="#6B7280" />
                      <Text style={styles.locationText}>
                        {incident.room
                          ? `Sala: ${incident.room.name}`
                          : incident.item
                          ? `Item: ${incident.item.name}`
                          : ""}
                      </Text>
                    </View>
                  )}

                  {incident.assignedTo && (
                    <View style={styles.assignedContainer}>
                      <Ionicons name="person" size={14} color="#6B7280" />
                      <Text style={styles.assignedText}>
                        Atribuído a: {incident.assignedTo.name}
                      </Text>
                    </View>
                  )}

                  {incident.resolutionNotes && (
                    <View style={styles.resolutionContainer}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                      <Text style={styles.resolutionText}>
                        {incident.resolutionNotes}
                      </Text>
                    </View>
                  )}

                  <View style={styles.incidentFooter}>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.dateText}>
                        {formatDate(incident.createdAt)} às{" "}
                        {formatTime(incident.createdAt)}
                      </Text>
                    </View>
                    {incident.actualResolutionTime && (
                      <View style={styles.dateContainer}>
                        <Ionicons name="checkmark" size={12} color="#10B981" />
                        <Text style={[styles.dateText, styles.resolvedDate]}>
                          Resolvido em {formatDate(incident.actualResolutionTime)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3B82F6",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  statsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3B82F6",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  incidentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  incidentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  incidentTitleContainer: {
    flex: 1,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  incidentDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  incidentMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    color: "#6B7280",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
  },
  assignedContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  assignedText: {
    fontSize: 12,
    color: "#6B7280",
  },
  resolutionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    gap: 8,
  },
  resolutionText: {
    flex: 1,
    fontSize: 13,
    color: "#065F46",
    lineHeight: 18,
  },
  incidentFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  resolvedDate: {
    color: "#10B981",
    fontWeight: "500",
  },
});

export default MyIncidentsScreen;


