import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ReservationWithDetails,
  RESERVATION_STATUS_CONFIG,
  ReservationStatusEnum,
} from "../types";
import { formatDate, formatTime, formatDateRange } from "../utils";

interface ReservationCardProps {
  reservation: ReservationWithDetails;
  onCancel?: (reservationId: string) => void;
  showCancelButton?: boolean;
}

const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onCancel,
  showCancelButton = true,
}) => {
  const config = RESERVATION_STATUS_CONFIG[reservation.status] || {
    color: "#6B7280",
    backgroundColor: "#F3F4F6",
    text: reservation.status || "Desconhecido",
  };

  console.log("🎫 Status da reserva:", reservation.status, "Config:", config);

  const handleCancel = () => {
    Alert.alert(
      "Cancelar Reserva",
      "Tem certeza que deseja cancelar esta reserva?",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Sim",
          style: "destructive",
          onPress: () => onCancel?.(reservation.id),
        },
      ]
    );
  };

  const canCancel =
    (reservation.status === ReservationStatusEnum.ACTIVE ||
      reservation.status === ReservationStatusEnum.APPROVED ||
      reservation.status === ReservationStatusEnum.PENDING) &&
    new Date(reservation.startTime) > new Date();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName} numberOfLines={1}>
            {reservation.room.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: config.backgroundColor },
            ]}
          >
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.text}
            </Text>
          </View>
        </View>

        {showCancelButton && canCancel && onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={24} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.timeInfo}>
          <View style={styles.timeItem}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.timeText}>
              {formatDate(reservation.startTime)}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.timeText}>
              {formatDateRange(reservation.startTime, reservation.endTime)}
            </Text>
          </View>
        </View>

        {reservation.purpose && (
          <View style={styles.purposeContainer}>
            <Text style={styles.purposeLabel}>Finalidade:</Text>
            <Text style={styles.purposeText} numberOfLines={2}>
              {reservation.purpose}
            </Text>
          </View>
        )}

        <View style={styles.userInfo}>
          <Ionicons name="person" size={16} color="#6B7280" />
          <Text style={styles.userText}>
            Reservado por: {reservation.user.name}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.createdAt}>
          Criada em {formatDate(reservation.createdAt)} às{" "}
          {formatTime(reservation.createdAt)}
        </Text>

        {reservation.status === "ACTIVE" && (
          <View style={styles.activeIndicator}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Ativa</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  roomInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  roomName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 4,
  },
  content: {
    gap: 12,
  },
  timeInfo: {
    gap: 8,
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  purposeContainer: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
  },
  purposeLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  purposeText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userText: {
    fontSize: 12,
    color: "#6B7280",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  createdAt: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  activeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activeText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "600",
  },
});

export default ReservationCard;
