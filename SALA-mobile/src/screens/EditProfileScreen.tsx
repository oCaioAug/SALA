import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";

import { useAuth } from "../context/AuthContext";
import { ProfileService, ProfileUpdateData } from "../services/ProfileService";
import { User, RootStackParamList } from "../types";
import { getInitials } from "../utils";
import { API_CONFIG } from "../utils/config";

type EditProfileScreenRouteProp = RouteProp<RootStackParamList, "EditProfile">;

interface EditProfileScreenProps {
  route: EditProfileScreenRouteProp;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ route }) => {
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  const { user: userParam } = route.params;
  const insets = useSafeAreaInsets();

  // Estados
  const [user, setUser] = useState<User>({
    ...userParam,
    avatar: userParam.image || userParam.avatar || authUser?.picture,
  });
  const [formData, setFormData] = useState({
    name: userParam.name || "",
    email: userParam.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Carregar dados mais recentes do perfil
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!authUser?.id) return;

    setLoading(true);
    try {
      const result = await ProfileService.getUserProfile(authUser.id);

      if (result.success && result.user) {
        console.log("🖼️  Avatar debug EditProfile:", {
          userImage: result.user.image,
          userAvatar: result.user.avatar,
          authUserPicture: authUser?.picture,
        });

        // Mapear 'image' da API para 'avatar' do app para consistência
        const mappedUser = {
          ...result.user,
          avatar: result.user.image || result.user.avatar || authUser?.picture,
        };

        console.log("🖼️  Avatar final EditProfile:", mappedUser.avatar);
        setUser(mappedUser);
        setFormData({
          name: mappedUser.name || "",
          email: mappedUser.email || "",
        });
        setIsOffline(result.fromCache || false);
      } else {
        Alert.alert("Erro", result.error || "Erro ao carregar perfil");
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      Alert.alert("Erro", "Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  };

  // Função para selecionar e fazer upload de avatar
  const handleImagePicker = async () => {
    try {
      // Solicitar permissão
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Precisamos de permissão para acessar suas fotos."
        );
        return;
      }

      // Mostrar opções
      Alert.alert("Selecionar Foto", "Escolha uma opção:", [
        {
          text: "Câmera",
          onPress: () => pickImageFromCamera(),
        },
        {
          text: "Galeria",
          onPress: () => pickImageFromGallery(),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ]);
    } catch (error) {
      console.error("❌ Erro ao abrir seletor:", error);
      Alert.alert("Erro", "Não foi possível abrir o seletor de imagens");
    }
  };

  const pickImageFromCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permissão Negada",
          "Precisamos de permissão para acessar a câmera."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error("❌ Erro na câmera:", error);
      Alert.alert("Erro", "Não foi possível abrir a câmera");
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0]);
      }
    } catch (error) {
      console.error("❌ Erro na galeria:", error);
      Alert.alert("Erro", "Não foi possível abrir a galeria");
    }
  };

  const uploadAvatar = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    setUploadingAvatar(true);

    try {
      console.log("📤 Iniciando upload do avatar:", imageAsset.uri);

      // Obter token de autenticação
      const token = await ProfileService.getAuthToken(
        authUser?.email || user.email
      );

      if (!token) {
        throw new Error("Token de autenticação não disponível");
      }

      // Preparar dados para upload
      const formData = new FormData();
      formData.append("avatar", {
        uri: imageAsset.uri,
        type: imageAsset.mimeType || "image/jpeg",
        name: "avatar.jpg",
      } as any);

      // Fazer upload via API
      const url = `${API_CONFIG.BASE_URL}/users/avatar`;
      console.log("🌐 URL do upload:", url);
      console.log("🔐 Token:", token ? "Presente" : "Ausente");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("📡 Response status:", response.status);
      console.log(
        "📡 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Verificar se a resposta é JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error("❌ Resposta não é JSON:", textResponse);
        throw new Error(`Resposta inválida do servidor: ${response.status}`);
      }

      const result = await response.json();

      if (response.ok && result.success) {
        // Atualizar o avatar no estado local
        const newAvatarUrl = result.user.image || result.user.avatar;
        setUser((prev) => ({
          ...prev,
          avatar: newAvatarUrl,
        }));

        Alert.alert("Sucesso", "Avatar atualizado com sucesso!");
        console.log("✅ Avatar atualizado:", newAvatarUrl);
      } else {
        throw new Error(result.message || "Erro ao fazer upload");
      }
    } catch (error) {
      console.error("❌ Erro no upload do avatar:", error);
      Alert.alert(
        "Erro",
        "Não foi possível atualizar o avatar. Tente novamente."
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!authUser?.id) return;

    // Validação básica
    if (!formData.name.trim()) {
      Alert.alert("Erro", "Nome é obrigatório");
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert("Erro", "Email é obrigatório");
      return;
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert("Erro", "Email inválido");
      return;
    }

    setSaving(true);
    try {
      const updateData: ProfileUpdateData = {};

      // Verificar quais campos foram alterados
      if (formData.name !== user.name) {
        updateData.name = formData.name;
      }

      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }

      // Se nenhum campo foi alterado
      if (Object.keys(updateData).length === 0) {
        Alert.alert("Info", "Nenhuma alteração foi feita");
        setSaving(false);
        return;
      }

      const result = await ProfileService.updateUserProfile(
        authUser.id,
        updateData
      );

      if (result.success && result.user) {
        setUser(result.user);
        setIsOffline(result.fromCache || false);

        Alert.alert(
          "Sucesso",
          result.fromCache
            ? "Perfil salvo offline. Será sincronizado quando houver conexão."
            : "Perfil atualizado com sucesso!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert("Erro", result.error || "Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      Alert.alert("Erro", "Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Descartar alterações?",
      "Todas as alterações não salvas serão perdidas.",
      [
        { text: "Continuar editando", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Editar Perfil</Text>

        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text style={styles.saveButton}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Indicador offline */}
      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="#F59E0B" />
          <Text style={styles.offlineText}>
            Modo offline - alterações serão sincronizadas
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {user.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
                onLoad={() => console.log("✅ Avatar carregado:", user.avatar)}
                onError={(error) =>
                  console.error(
                    "❌ Erro ao carregar avatar:",
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

          <TouchableOpacity
            style={[
              styles.changePhotoButton,
              uploadingAvatar && styles.disabledButton,
            ]}
            onPress={handleImagePicker}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.changePhotoText}>Enviando...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="camera" size={16} color="#3B82F6" />
                <Text style={styles.changePhotoText}>Alterar foto</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.photoHint}>
            Toque para selecionar uma nova foto
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Nome */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nome Completo</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Digite seu nome completo"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Digite seu email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Role (read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de usuário</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>
                {user.role === "ADMIN" ? "Administrador" : "Usuário"}
              </Text>
            </View>
            <Text style={styles.inputHint}>
              Apenas administradores podem alterar o tipo de usuário
            </Text>
          </View>

          {/* Informações adicionais */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Informações da conta</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Conta criada</Text>
              <Text style={styles.infoValue}>
                {new Date(user.createdAt).toLocaleDateString("pt-BR")}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Última atualização</Text>
              <Text style={styles.infoValue}>
                {new Date(user.updatedAt).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#92400E",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
  photoHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  readOnlyText: {
    fontSize: 16,
    color: "#6B7280",
  },
  inputHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  infoSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  // Upload styles
  disabledButton: {
    opacity: 0.6,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default EditProfileScreen;
