import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import ApiService from "../services/api";
import {
  RootStackParamList,
  IncidentPriority,
  IncidentCategory,
  INCIDENT_PRIORITY_LABELS,
  INCIDENT_CATEGORY_LABELS,
  INCIDENT_PRIORITY_COLORS,
} from "../types";

type ReportIncidentRouteProp = RouteProp<RootStackParamList, "ReportIncident">;
type ReportIncidentNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReportIncident"
>;

const ReportIncidentScreen: React.FC = () => {
  const route = useRoute<ReportIncidentRouteProp>();
  const navigation = useNavigation<ReportIncidentNavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { roomId, itemId } = route.params || {};

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<IncidentPriority>("MEDIUM");
  const [category, setCategory] = useState<IncidentCategory>("OTHER");
  const [submitting, setSubmitting] = useState(false);

  const priorities: IncidentPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  const categories: IncidentCategory[] = [
    "EQUIPMENT_FAILURE",
    "INFRASTRUCTURE",
    "SOFTWARE",
    "SAFETY",
    "MAINTENANCE",
    "ELECTRICAL",
    "NETWORK",
    "OTHER",
  ];

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert("Erro", "O título é obrigatório");
      return false;
    }

    if (title.trim().length < 5) {
      Alert.alert("Erro", "O título deve ter pelo menos 5 caracteres");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Erro", "A descrição é obrigatória");
      return false;
    }

    if (description.trim().length < 10) {
      Alert.alert("Erro", "A descrição deve ter pelo menos 10 caracteres");
      return false;
    }

    if (!roomId && !itemId) {
      Alert.alert("Erro", "O incidente deve estar relacionado a uma sala ou item");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    setSubmitting(true);

    try {
      const incidentData = {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        reportedById: user.id,
        roomId: roomId || undefined,
        itemId: itemId || undefined,
      };

      await ApiService.createIncident(incidentData);

      Alert.alert(
        "Sucesso!",
        "Incidente reportado com sucesso. Os administradores serão notificados.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Erro ao criar incidente:", error);
      Alert.alert("Erro", error.message || "Não foi possível reportar o incidente");
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Reportar Incidente</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Informação sobre o local */}
        {(roomId || itemId) && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              {roomId
                ? "Este incidente será relacionado à sala atual"
                : "Este incidente será relacionado ao item atual"}
            </Text>
          </View>
        )}

        {/* Título */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Título <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Projetor não está funcionando"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!submitting}
          />
          <Text style={styles.helperText}>
            {title.length}/100 caracteres
          </Text>
        </View>

        {/* Descrição */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Descrição <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva o problema em detalhes..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
            editable={!submitting}
          />
          <Text style={styles.helperText}>
            {description.length}/1000 caracteres
          </Text>
        </View>

        {/* Prioridade */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prioridade</Text>
          <View style={styles.optionsContainer}>
            {priorities.map((p) => {
              const isSelected = priority === p;
              const colorConfig = INCIDENT_PRIORITY_COLORS[p];
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.optionButton,
                    isSelected && {
                      backgroundColor: colorConfig.backgroundColor,
                      borderColor: colorConfig.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setPriority(p)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && { color: colorConfig.color, fontWeight: "600" },
                    ]}
                  >
                    {INCIDENT_PRIORITY_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Categoria */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.optionsContainer}>
            {categories.map((c) => {
              const isSelected = category === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected,
                  ]}
                  onPress={() => setCategory(c)}
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                    ]}
                  >
                    {INCIDENT_CATEGORY_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botão de Enviar */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Reportar Incidente</Text>
            </>
          )}
        </TouchableOpacity>
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
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF8FF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#1E40AF",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#DBEAFE",
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  optionTextSelected: {
    color: "#3B82F6",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ReportIncidentScreen;


