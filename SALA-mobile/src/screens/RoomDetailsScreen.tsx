import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import { Room, Item, RootStackParamList } from "../types";
import ApiService from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate, formatTime } from "../utils";

type RoomDetailsRouteProp = RouteProp<RootStackParamList, "RoomDetails">;
type RoomDetailsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RoomDetails"
>;

const RoomDetailsScreen: React.FC = () => {
  const route = useRoute<RoomDetailsRouteProp>();
  const navigation = useNavigation<RoomDetailsNavigationProp>();
  const { roomId } = route.params;

  const [room, setRoom] = useState<Room | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRoomDetails = useCallback(async () => {
    try {
      const [roomData, itemsData] = await Promise.all([
        ApiService.getRoomById(roomId),
        ApiService.getRoomItems(roomId),
      ]);

      setRoom(roomData);
      setItems(itemsData);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os detalhes da sala");
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roomId, navigation]);

  useEffect(() => {
    loadRoomDetails();
  }, [loadRoomDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRoomDetails();
  }, [loadRoomDetails]);

  const handleReserveRoom = () => {
    if (room?.status === "LIVRE") {
      navigation.navigate("CreateReservation", { roomId });
    } else {
      Alert.alert(
        "Sala Indisponível",
        "Esta sala não está disponível para reserva no momento."
      );
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando detalhes..." />;
  }

  if (!room) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Sala não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#3B82F6"]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{room.name}</Text>
          <StatusBadge status={room.status} size="large" />
        </View>

        {room.description && (
          <Text style={styles.description}>{room.description}</Text>
        )}
      </View>

      {/* Room Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações da Sala</Text>

        <View style={styles.infoContainer}>
          {room.capacity && (
            <View style={styles.infoItem}>
              <Ionicons name="people" size={24} color="#3B82F6" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Capacidade</Text>
                <Text style={styles.infoValue}>{room.capacity} pessoas</Text>
              </View>
            </View>
          )}

          <View style={styles.infoItem}>
            <Ionicons name="time" size={24} color="#3B82F6" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Última atualização</Text>
              <Text style={styles.infoValue}>
                {formatDate(room.updatedAt)} às {formatTime(room.updatedAt)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Items */}
      {items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Equipamentos Disponíveis ({items.length})
          </Text>

          <View style={styles.itemsContainer}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemIconContainer}>
                    <Ionicons
                      name={(item.icon as any) || "cube"}
                      size={20}
                      color="#3B82F6"
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemQuantity}>
                      Quantidade: {item.quantity}
                    </Text>
                  </View>
                </View>

                {item.description && (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                )}

                {item.specifications && item.specifications.length > 0 && (
                  <View style={styles.specificationsContainer}>
                    <Text style={styles.specificationsTitle}>
                      Especificações:
                    </Text>
                    {item.specifications.map((spec, index) => (
                      <Text key={index} style={styles.specification}>
                        • {spec}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Current Reservations */}
      {room.reservations && room.reservations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reservas Ativas</Text>

          <View style={styles.reservationsContainer}>
            {room.reservations
              .filter((r) => r.status === "ACTIVE")
              .map((reservation) => (
                <View key={reservation.id} style={styles.reservationCard}>
                  <View style={styles.reservationHeader}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.reservationDate}>
                      {formatDate(reservation.startTime)}
                    </Text>
                  </View>
                  <Text style={styles.reservationTime}>
                    {formatTime(reservation.startTime)} -{" "}
                    {formatTime(reservation.endTime)}
                  </Text>
                  {reservation.purpose && (
                    <Text style={styles.reservationPurpose}>
                      {reservation.purpose}
                    </Text>
                  )}
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Reserve Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.reserveButton,
            room.status !== "LIVRE" && styles.reserveButtonDisabled,
          ]}
          onPress={handleReserveRoom}
          disabled={room.status !== "LIVRE"}
        >
          <Ionicons
            name={room.status === "LIVRE" ? "calendar" : "lock-closed"}
            size={20}
            color="#FFFFFF"
            style={styles.buttonIcon}
          />
          <Text style={styles.reserveButtonText}>
            {room.status === "LIVRE" ? "Reservar Sala" : "Sala Indisponível"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  infoContainer: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  itemsContainer: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    color: "#6B7280",
  },
  itemDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  specificationsContainer: {
    marginTop: 8,
  },
  specificationsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  specification: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 8,
  },
  reservationsContainer: {
    gap: 8,
  },
  reservationCard: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  reservationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  reservationDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  reservationTime: {
    fontSize: 14,
    color: "#92400E",
    marginBottom: 4,
  },
  reservationPurpose: {
    fontSize: 13,
    color: "#78350F",
    fontStyle: "italic",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  reserveButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  reserveButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  buttonIcon: {
    marginRight: 4,
  },
  reserveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: "#EF4444",
    marginTop: 16,
    textAlign: "center",
  },
});

export default RoomDetailsScreen;
