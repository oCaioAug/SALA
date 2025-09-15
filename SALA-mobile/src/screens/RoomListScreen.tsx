import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";

import { Room, RootStackParamList } from "../types";
import ApiService from "../services/api";
import RoomCard from "../components/RoomCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

type RoomListNavigationProp = StackNavigationProp<
  RootStackParamList,
  "RoomList"
>;

const RoomListScreen: React.FC = () => {
  const navigation = useNavigation<RoomListNavigationProp>();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Room["status"] | "ALL">(
    "ALL"
  );

  const loadRooms = useCallback(async () => {
    try {
      const data = await ApiService.getRooms();
      setRooms(data);
      setFilteredRooms(data);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as salas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    let filtered = rooms;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (room.description &&
            room.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((room) => room.status === statusFilter);
    }

    setFilteredRooms(filtered);
  }, [rooms, searchQuery, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRooms();
  }, [loadRooms]);

  const handleRoomPress = (roomId: string) => {
    navigation.navigate("RoomDetails", { roomId });
  };

  const getStatusFilterText = (status: Room["status"] | "ALL") => {
    switch (status) {
      case "ALL":
        return "Todas";
      case "LIVRE":
        return "Livres";
      case "EM_USO":
        return "Em Uso";
      case "RESERVADO":
        return "Reservadas";
      default:
        return "Todas";
    }
  };

  const cycleStatusFilter = () => {
    const statuses: (Room["status"] | "ALL")[] = [
      "ALL",
      "LIVRE",
      "EM_USO",
      "RESERVADO",
    ];
    const currentIndex = statuses.indexOf(statusFilter);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setStatusFilter(statuses[nextIndex]);
  };

  if (loading) {
    return <LoadingSpinner message="Carregando salas..." />;
  }

  const renderRoom = ({ item }: { item: Room }) => (
    <RoomCard room={item} onPress={() => handleRoomPress(item.id)} />
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar salas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={cycleStatusFilter}
        >
          <Ionicons name="funnel" size={20} color="#3B82F6" />
          <Text style={styles.filterText}>
            {getStatusFilterText(statusFilter)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredRooms.length}{" "}
          {filteredRooms.length === 1 ? "sala encontrada" : "salas encontradas"}
        </Text>
      </View>

      {/* Rooms List */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon="business-outline"
          title="Nenhuma sala encontrada"
          subtitle={
            searchQuery
              ? "Tente ajustar sua busca ou filtros"
              : "Não há salas disponíveis no momento"
          }
        />
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  clearButton: {
    marginLeft: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  summaryText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
});

export default RoomListScreen;
