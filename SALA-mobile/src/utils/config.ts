// Configurações da aplicação
import { Platform } from "react-native";

// Função para determinar a URL base da API baseada na plataforma
const getApiBaseUrl = () => {
  if (Platform.OS === "web") {
    // Para web, pode usar localhost
    return "https://sala.ocaioaug.com.br//api";
  } else {
    // Para emuladores Android/iOS, precisa usar o IP da máquina
    // Android emulator: 10.0.2.2
    // iOS simulator: localhost funciona
    if (Platform.OS === "android") {
      return "https://sala.ocaioaug.com.br//api"; // IP especial para Android emulator
    } else {
      return "http://localhost:3000/api"; // iOS simulator
    }
  }
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 10000,
};

// Mock User Configuration (para desenvolvimento)
export const MOCK_USER = {
  id: "cmfxaptqw0000xfy4xzmfb871", // ID real do usuário logado via Google
  name: "CAIO AUGUSTO LUZ GOMES",
  email: "caio.augusto@aedb.br",
  role: "USER" as const,
};

// App Configuration
export const APP_CONFIG = {
  VERSION: "1.0.0",
  BUILD: "2024.09.15",
  NAME: "S.A.L.A.",
  FULL_NAME: "Sistema de Agendamento de Laboratórios e Ambientes",
};

// Time Configuration
export const TIME_CONFIG = {
  DEFAULT_START_HOUR: 8,
  DEFAULT_END_HOUR: 18,
  DEFAULT_INTERVAL_MINUTES: 60,
  MAX_RESERVATION_HOURS: 8,
};

// UI Configuration
export const UI_CONFIG = {
  REFRESH_THRESHOLD: 50,
  CACHE_DURATION: 2 * 60 * 1000, // 2 minutes
};
