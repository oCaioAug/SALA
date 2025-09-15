// Configurações da aplicação

// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://localhost:3000/api", // Altere para a URL do seu backend
  TIMEOUT: 10000,
};

// Mock User Configuration (para desenvolvimento)
export const MOCK_USER = {
  id: "user-mock-id",
  name: "João Silva",
  email: "joao.silva@email.com",
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
