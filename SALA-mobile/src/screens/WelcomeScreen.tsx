import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted }) => {
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const isConnected = await ApiService.testConnection();
      if (isConnected) {
        Alert.alert("Sucesso", "Conectividade com o servidor OK!");
      } else {
        Alert.alert("Erro", "Não foi possível conectar com o servidor");
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao testar conectividade");
    } finally {
      setTesting(false);
    }
  };
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="business" size={64} color="#3B82F6" />
        </View>
        <Text style={styles.title}>Bem-vindo ao S.A.L.A.</Text>
        <Text style={styles.subtitle}>
          Sistema de Agendamento de Laboratórios e Ambientes
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons name="search" size={32} color="#10B981" />
          <Text style={styles.featureTitle}>Encontre Salas</Text>
          <Text style={styles.featureDescription}>
            Visualize todas as salas disponíveis com informações detalhadas
          </Text>
        </View>

        <View style={styles.feature}>
          <Ionicons name="calendar" size={32} color="#F59E0B" />
          <Text style={styles.featureTitle}>Faça Reservas</Text>
          <Text style={styles.featureDescription}>
            Reserve salas rapidamente para suas atividades
          </Text>
        </View>

        <View style={styles.feature}>
          <Ionicons name="list" size={32} color="#EF4444" />
          <Text style={styles.featureTitle}>Gerencie Reservas</Text>
          <Text style={styles.featureDescription}>
            Acompanhe e gerencie todas as suas reservas
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.testButton, testing && styles.testButtonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        <Text style={styles.testButtonText}>
          {testing ? "Testando..." : "Testar Conectividade"}
        </Text>
        <Ionicons name="wifi" size={20} color="#3B82F6" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={onGetStarted}>
        <Text style={styles.buttonText}>Começar</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  content: {
    flexGrow: 1,
    padding: 32,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EBF8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 48,
    gap: 24,
  },
  feature: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
  },
  testButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#3B82F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default WelcomeScreen;
