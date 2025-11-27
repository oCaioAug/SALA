import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { User } from "../types";
import { getInitials } from "../utils";
import { useAuth } from "../context/AuthContext";
import { ProfileService } from "../services/ProfileService";
import { API_CONFIG } from "../utils/config";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user: authUser, signOut } = useAuth();

  // Estados
  const [user, setUser] = useState<User>({
    id: authUser?.id || "user-mock-id",
    name: authUser?.name || "João Silva",
    email: authUser?.email || "joao.silva@email.com",
    role: "USER",
    avatar: authUser?.picture,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-09-15T14:30:00Z",
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [hasPendingUpdates, setHasPendingUpdates] = useState(false);

  // Estados para estatísticas de reservas
  const [reservationStats, setReservationStats] = useState({
    total: 0,
    completed: 0,
    active: 0,
    loading: true,
  });

  // Carregar perfil no início
  useEffect(() => {
    loadProfile();
    loadReservationStats();
    checkPendingUpdates();
  }, []);

  const loadProfile = async () => {
    if (!authUser?.id) return;

    setLoading(true);
    try {
      const result = await ProfileService.getUserProfile(authUser.id);

      if (result.success && result.user) {
        console.log("🖼️  Avatar debug:", {
          userImage: result.user.image,
          userAvatar: result.user.avatar,
          authUserPicture: authUser?.picture,
        });

        // Mapear 'image' da API para 'avatar' do app para consistência
        const mappedUser = {
          ...result.user,
          avatar: result.user.image || result.user.avatar,
        };

        console.log("🖼️  Avatar final:", mappedUser.avatar);
        setUser(mappedUser);
        setIsOffline(result.fromCache || false);
      } else {
        console.log("Erro ao carregar perfil:", result.error);
        // Manter dados do authUser como fallback
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPendingUpdates = async () => {
    try {
      const pending = await ProfileService.hasPendingUpdates();
      setHasPendingUpdates(pending);
    } catch (error) {
      console.error("Erro ao verificar atualizações pendentes:", error);
    }
  };

  const loadReservationStats = async () => {
    if (!authUser?.id) return;

    setReservationStats(prev => ({ ...prev, loading: true }));
    
    try {
      console.log('📊 Carregando estatísticas de reservas para usuário:', authUser.id);
      
      // Fazer requisição para API
      const response = await fetch(`${API_CONFIG.BASE_URL}/reservations/user/${authUser.id}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const stats = await response.json();
        console.log('📊 Estatísticas recebidas:', stats);
        
        setReservationStats({
          total: stats.total || 0,
          completed: stats.completed || 0,
          active: stats.active || 0,
          loading: false,
        });
      } else {
        console.error('Erro ao buscar estatísticas:', response.status);
        // Manter dados zerados em caso de erro
        setReservationStats({
          total: 0,
          completed: 0,
          active: 0,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de reservas:', error);
      setReservationStats({
        total: 0,
        completed: 0,
        active: 0,
        loading: false,
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    await loadReservationStats();
    await checkPendingUpdates();

    // Tentar sincronizar atualizações pendentes
    if (hasPendingUpdates) {
      await handleSyncPendingUpdates();
    }

    setRefreshing(false);
  };

  const handleSyncPendingUpdates = async () => {
    try {
      const results = await ProfileService.syncPendingUpdates();
      const successCount = results.filter((r) => r.success).length;

      if (successCount > 0) {
        Alert.alert(
          "Sincronização",
          `${successCount} atualização(ões) sincronizada(s) com sucesso!`
        );
        await loadProfile();
        await checkPendingUpdates();
      }
    } catch (error) {
      console.error("Erro na sincronização:", error);
    }
  };

  const handleEditProfile = () => {
    console.log("📝 Navegando para EditProfile com user:", {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      image: user.image,
    });
    (navigation as any).navigate("EditProfile", { user });
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Em Desenvolvimento",
      "Funcionalidade de alteração de senha em breve!"
    );
  };

  const handleNotificationSettings = () => {
    console.log("🔔 Navegando para configurações de notificação");
    (navigation as any).navigate("NotificationSettings");
  };

  const handleHelp = () => {
    Alert.alert(
      "Ajuda",
      "Para suporte, entre em contato com o administrador do sistema através do email: admin@sala.com"
    );
  };

  const handleAbout = () => {
    Alert.alert(
      "Sobre o S.A.L.A.",
      "Sistema de Agendamento de Laboratórios e Ambientes\n\nVersão 1.0.0\n\nDesenvolvido para facilitar o gerenciamento e reserva de salas e laboratórios."
    );
  };

  const handleLogout = () => {
    Alert.alert("Sair", "Tem certeza que deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert(
              "Erro",
              "Não foi possível fazer logout. Tente novamente."
            );
          }
        },
      },
    ]);
  };

  const handleMyIncidents = () => {
    (navigation as any).navigate("MyIncidents");
  };

  const menuItems = [
    {
      icon: "person-outline",
      title: "Editar Perfil",
      subtitle: "Alterar informações pessoais",
      onPress: handleEditProfile,
      showArrow: true,
    },
    {
      icon: "warning-outline",
      title: "Meus Incidentes",
      subtitle: "Visualizar incidentes reportados",
      onPress: handleMyIncidents,
      showArrow: true,
    },
    // {
    //   icon: "lock-closed-outline",
    //   title: "Alterar Senha",
    //   subtitle: "Modificar sua senha de acesso",
    //   onPress: handleChangePassword,
    //   showArrow: true,
    // },
    {
      icon: "notifications-outline",
      title: "Notificações",
      subtitle: "Configurar alertas e lembretes",
      onPress: handleNotificationSettings,
      showArrow: true,
    },
    {
      icon: "bug-outline",
      title: "Debug Notificações",
      subtitle: "Testar sistema de notificações",
      onPress: () => (navigation as any).navigate("NotificationDebug"),
      showArrow: true,
      isDevelopment: true, // Flag para identificar item de desenvolvimento
    },
    {
      icon: "help-circle-outline",
      title: "Ajuda",
      subtitle: "Suporte e informações",
      onPress: handleHelp,
      showArrow: true,
    },
    {
      icon: "information-circle-outline",
      title: "Sobre",
      subtitle: "Informações do aplicativo",
      onPress: handleAbout,
      showArrow: true,
    },
    {
      icon: "log-out-outline",
      title: "Sair",
      subtitle: "Encerrar sessão",
      onPress: handleLogout,
      showArrow: false,
      danger: true,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={["#3B82F6"]}
          tintColor="#3B82F6"
        />
      }
    >
      {/* Indicador offline/pendências */}
      {(isOffline || hasPendingUpdates) && (
        <View style={styles.statusIndicator}>
          <View style={styles.statusContent}>
            <Ionicons
              name={isOffline ? "cloud-offline" : "sync"}
              size={16}
              color="#F59E0B"
            />
            <Text style={styles.statusText}>
              {isOffline
                ? "Modo offline"
                : hasPendingUpdates
                ? "Há alterações para sincronizar"
                : ""}
            </Text>
            {hasPendingUpdates && (
              <TouchableOpacity
                onPress={handleSyncPendingUpdates}
                style={styles.syncButton}
              >
                <Text style={styles.syncButtonText}>Sincronizar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              style={styles.avatar}
              onLoad={() =>
                console.log("✅ Avatar Profile carregado:", user.avatar)
              }
              onError={(error) =>
                console.error(
                  "❌ Erro ao carregar avatar Profile:",
                  error.nativeEvent,
                  "URL:",
                  user.avatar
                )
              }
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === "ADMIN" ? "Administrador" : "Usuário"}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="calendar" size={24} color="#3B82F6" />
          <Text style={styles.statNumber}>
            {reservationStats.loading ? '...' : reservationStats.total}
          </Text>
          <Text style={styles.statLabel}>Reservas Feitas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>
            {reservationStats.loading ? '...' : reservationStats.completed}
          </Text>
          <Text style={styles.statLabel}>Concluídas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {reservationStats.loading ? '...' : reservationStats.active}
          </Text>
          <Text style={styles.statLabel}>Ativas</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              item.danger && styles.menuItemDanger,
              item.isDevelopment && styles.menuItemDebug,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIconContainer,
                  item.danger && styles.menuIconContainerDanger,
                  item.isDevelopment && styles.menuIconContainerDebug,
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={
                    item.danger 
                      ? "#EF4444" 
                      : item.isDevelopment 
                        ? "#EF4444" 
                        : "#6B7280"
                  }
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text
                  style={[
                    styles.menuTitle,
                    item.danger && styles.menuTitleDanger,
                    item.isDevelopment && styles.menuTitleDebug,
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={[
                  styles.menuSubtitle,
                  item.isDevelopment && styles.menuSubtitleDebug,
                ]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>

            {item.showArrow && (
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>S.A.L.A. v1.0.0</Text>
        <Text style={styles.buildText}>Build 2024.09.15</Text>
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
    paddingBottom: 40,
  },
  statusIndicator: {
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#92400E",
    flex: 1,
  },
  syncButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  profileHeader: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  profileInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: "#EBF8FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  menuContainer: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemDanger: {
    borderBottomColor: "#FEE2E2",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconContainerDanger: {
    backgroundColor: "#FEE2E2",
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  menuTitleDanger: {
    color: "#EF4444",
  },
  menuTitleDebug: {
    color: "#EF4444",
    fontWeight: "700",
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  menuSubtitleDebug: {
    color: "#DC2626",
    fontWeight: "500",
  },
  menuItemDebug: {
    backgroundColor: "#FEF2F2",
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  menuIconContainerDebug: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 32,
    paddingHorizontal: 20,
  },
  versionText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: "#D1D5DB",
  },
});

export default ProfileScreen;
