import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Room, RootStackParamList } from "../types";
import ApiService from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { MOCK_USER } from "../utils/config";
import { useAuth } from "../context/AuthContext";
import {
  formatDate,
  formatTime,
  generateTimeSlots,
  isValidTimeRange,
} from "../utils";

type CreateReservationRouteProp = RouteProp<
  RootStackParamList,
  "CreateReservation"
>;
type CreateReservationNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CreateReservation"
>;

const CreateReservationScreen: React.FC = () => {
  const route = useRoute<CreateReservationRouteProp>();
  const navigation = useNavigation<CreateReservationNavigationProp>();
  const { roomId } = route.params;
  const { user } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [purpose, setPurpose] = useState("");

  // Date/Time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // User ID from authenticated user or fallback to MOCK_USER
  const userId = user?.id || MOCK_USER.id;

  useEffect(() => {
    loadRoomDetails();
    initializeTimes();
  }, []);

  const loadRoomDetails = async () => {
    try {
      const roomData = await ApiService.getRoomById(roomId);
      setRoom(roomData);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os detalhes da sala");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const initializeTimes = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(now.getHours() + 1, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setStartTime(start);
    setEndTime(end);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);

      // Update start and end times to match the selected date
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(startTime.getHours(), startTime.getMinutes());

      const newEndTime = new Date(selectedDate);
      newEndTime.setHours(endTime.getHours(), endTime.getMinutes());

      setStartTime(newStartTime);
      setEndTime(newEndTime);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setStartTime(newStartTime);

      // Auto-adjust end time to be 1 hour after start time
      const newEndTime = new Date(newStartTime);
      newEndTime.setHours(newStartTime.getHours() + 1);
      setEndTime(newEndTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      const newEndTime = new Date(selectedDate);
      newEndTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setEndTime(newEndTime);
    }
  };

  const validateForm = () => {
    const now = new Date();

    if (startTime <= now) {
      Alert.alert("Erro", "O horário de início deve ser no futuro");
      return false;
    }

    if (!isValidTimeRange(startTime, endTime)) {
      Alert.alert("Erro", "O horário de fim deve ser após o horário de início");
      return false;
    }

    const duration =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (duration > 8) {
      Alert.alert("Erro", "A duração máxima da reserva é de 8 horas");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      console.log("Verificando disponibilidade:", {
        roomId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });

      // Check availability first
      const isAvailable = await ApiService.checkRoomAvailability(
        roomId,
        startTime.toISOString(),
        endTime.toISOString()
      );

      console.log("Resultado da verificação de disponibilidade:", isAvailable);

      if (!isAvailable) {
        Alert.alert(
          "Horário Indisponível",
          "Este horário já está reservado. Por favor, escolha outro horário disponível.",
          [{ text: "OK", style: "default" }]
        );
        return;
      }

      // Create reservation
      await ApiService.createReservation({
        userId,
        roomId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        purpose: purpose.trim() || undefined,
      });

      Alert.alert("Sucesso!", "Reserva criada com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("RoomList"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("Erro", error.message || "Não foi possível criar a reserva");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (!room) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Sala não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Room Info */}
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room.name}</Text>
        <Text style={styles.roomDescription}>{room.description}</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Date Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Data da Reserva</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#3B82F6" />
            <Text style={styles.dateButtonText}>
              {formatDate(selectedDate)}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Time Selection */}
        <View style={styles.timeContainer}>
          <View style={styles.timeGroup}>
            <Text style={styles.label}>Início</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Ionicons name="time" size={20} color="#3B82F6" />
              <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeGroup}>
            <Text style={styles.label}>Fim</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Ionicons name="time" size={20} color="#3B82F6" />
              <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Purpose */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Finalidade (Opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Descreva a finalidade da reserva..."
            value={purpose}
            onChangeText={setPurpose}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Duration Info */}
        <View style={styles.durationInfo}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text style={styles.durationText}>
            Duração:{" "}
            {Math.round(
              (endTime.getTime() - startTime.getTime()) / (1000 * 60)
            )}{" "}
            minutos
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <LoadingSpinner size="small" color="#FFFFFF" message="" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>Confirmar Reserva</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={handleStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={handleEndTimeChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  roomInfo: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roomName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  roomDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
  },
  timeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  timeGroup: {
    flex: 1,
    gap: 8,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    gap: 8,
    justifyContent: "center",
  },
  timeButtonText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    fontSize: 16,
    color: "#374151",
    minHeight: 80,
  },
  durationInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    color: "#1E40AF",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
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
    textAlign: "center",
  },
});

export default CreateReservationScreen;
