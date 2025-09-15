import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Room } from "../types";
import StatusBadge from "./StatusBadge";
import { truncateText } from "../utils";

interface RoomCardProps {
  room: Room;
  onPress: () => void;
  style?: ViewStyle;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onPress, style }) => {
  const getStatusIcon = (status: Room["status"]) => {
    switch (status) {
      case "LIVRE":
        return "checkmark-circle";
      case "EM_USO":
        return "person";
      case "RESERVADO":
        return "time";
      default:
        return "help-circle";
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="business"
            size={20}
            color="#374151"
            style={styles.icon}
          />
          <Text style={styles.title} numberOfLines={1}>
            {room.name}
          </Text>
        </View>
        <StatusBadge status={room.status} size="small" />
      </View>

      <View style={styles.content}>
        {room.description && (
          <Text style={styles.description} numberOfLines={2}>
            {truncateText(room.description, 80)}
          </Text>
        )}

        <View style={styles.details}>
          {room.capacity && (
            <View style={styles.detailItem}>
              <Ionicons name="people" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                Capacidade: {room.capacity} pessoas
              </Text>
            </View>
          )}

          {room.items && room.items.length > 0 && (
            <View style={styles.detailItem}>
              <Ionicons name="list" size={16} color="#6B7280" />
              <Text style={styles.detailText}>
                {room.items.length} {room.items.length === 1 ? "item" : "itens"}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statusIndicator}>
          <Ionicons
            name={getStatusIcon(room.status)}
            size={16}
            color="#6B7280"
          />
          <Text style={styles.statusText}>
            {room.status === "LIVRE"
              ? "Disponível agora"
              : room.status === "EM_USO"
              ? "Em uso"
              : "Reservada"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
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
    alignItems: "center",
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  content: {
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 20,
  },
  details: {
    gap: 4,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});

export default RoomCard;
