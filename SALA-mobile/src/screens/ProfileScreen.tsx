import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { User } from "../types";
import { getInitials } from "../utils";
import { useAuth } from "../context/AuthContext";

const ProfileScreen: React.FC = () => {
  const { user: authUser, signOut } = useAuth();

  // Use authenticated user or fallback to mock data
  const [user] = useState<User>({
    id: authUser?.id || "user-mock-id",
    name: authUser?.name || "João Silva",
    email: authUser?.email || "joao.silva@email.com",
    role: "USER",
    avatar: authUser?.picture,
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-09-15T14:30:00Z",
  });

  const handleEditProfile = () => {
    Alert.alert(
      "Em Desenvolvimento",
      "Funcionalidade de edição de perfil em breve!"
    );
  };

  const handleChangePassword = () => {
    Alert.alert(
      "Em Desenvolvimento",
      "Funcionalidade de alteração de senha em breve!"
    );
  };

  const handleNotificationSettings = () => {
    Alert.alert("Em Desenvolvimento", "Configurações de notificação em breve!");
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

  const menuItems = [
    {
      icon: "person-outline",
      title: "Editar Perfil",
      subtitle: "Alterar informações pessoais",
      onPress: handleEditProfile,
      showArrow: true,
    },
    {
      icon: "lock-closed-outline",
      title: "Alterar Senha",
      subtitle: "Modificar sua senha de acesso",
      onPress: handleChangePassword,
      showArrow: true,
    },
    {
      icon: "notifications-outline",
      title: "Notificações",
      subtitle: "Configurar alertas e lembretes",
      onPress: handleNotificationSettings,
      showArrow: true,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
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
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Reservas Feitas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Concluídas</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#F59E0B" />
          <Text style={styles.statNumber}>2</Text>
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
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <View
                style={[
                  styles.menuIconContainer,
                  item.danger && styles.menuIconContainerDanger,
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.danger ? "#EF4444" : "#6B7280"}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text
                  style={[
                    styles.menuTitle,
                    item.danger && styles.menuTitleDanger,
                  ]}
                >
                  {item.title}
                </Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
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
  menuSubtitle: {
    fontSize: 13,
    color: "#6B7280",
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
