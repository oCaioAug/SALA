import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import { NativeNotificationService } from "../services/NativeNotificationService";
import AuthService from "../../services/AuthService";

const DebugScreen = () => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string>('Não testado');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("=== DEBUG OAUTH CONFIGURATION ===");
    console.log("Constants.expoConfig?.extra:", Constants.expoConfig?.extra);
    console.log(
      "Google Client ID:",
      Constants.expoConfig?.extra?.googleClientId
    );

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: "sala",
    });
    console.log("Redirect URI:", redirectUri);
    console.log("==================================");
  }, []);

  const testPushTokenObtention = async () => {
    try {
      setIsLoading(true);
      console.log('🧪 === TESTE: Obtendo Push Token ===');
      
      const notificationService = NativeNotificationService.getInstance();
      
      // Solicitar permissões primeiro
      const hasPermissions = await notificationService.requestPermissions();
      console.log('📋 Permissões concedidas:', hasPermissions);
      
      if (!hasPermissions) {
        Alert.alert('Erro', 'Permissões de notificação negadas');
        setRegistrationStatus('❌ Permissões negadas');
        return;
      }
      
      // Obter token
      const token = await notificationService.getExpoPushToken();
      console.log('🔑 Push Token obtido:', token);
      
      setPushToken(token);
      
      if (token) {
        setRegistrationStatus('✅ Token obtido com sucesso');
        Alert.alert('Sucesso!', `Token obtido: ${token?.substring(0, 30)}...`);
      } else {
        setRegistrationStatus('❌ Falha ao obter token');
        Alert.alert('Erro', 'Não foi possível obter o push token');
      }
    } catch (error) {
      console.error('❌ Erro ao obter push token:', error);
      setRegistrationStatus(`❌ Erro: ${error}`);
      Alert.alert('Erro', `Falha ao obter token: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testPushRegistration = async () => {
    try {
      if (!pushToken) {
        Alert.alert('Erro', 'Primeiro obtenha o push token');
        return;
      }

      setIsLoading(true);
      console.log('🧪 === TESTE: Registrando Push Token no Backend ===');
      
      const authService = AuthService.getInstance();
      const success = await authService.registerPushToken(pushToken, 'mobile');
      
      console.log('📡 Resultado do registro no backend:', success);
      
      if (success) {
        setRegistrationStatus('🚀 Token registrado no backend!');
        Alert.alert('Sucesso!', 'Push token registrado no backend com sucesso!');
      } else {
        setRegistrationStatus('❌ Falha no registro do backend');
        Alert.alert('Erro', 'Falha ao registrar token no backend');
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      setRegistrationStatus(`❌ Erro no registro: ${error}`);
      Alert.alert('Erro', `Falha no registro: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFullPushFlow = async () => {
    try {
      setIsLoading(true);
      console.log('🧪 === TESTE COMPLETO: Push Notification Flow ===');
      
      setRegistrationStatus('🔄 Testando fluxo completo...');
      
      // 1. Obter token
      await testPushTokenObtention();
      
      // 2. Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Registrar no backend
      if (pushToken) {
        await testPushRegistration();
      }
      
      console.log('✅ Teste completo finalizado');
    } catch (error) {
      console.error('❌ Erro no teste completo:', error);
      setRegistrationStatus(`❌ Erro no teste completo: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clientId = Constants.expoConfig?.extra?.googleClientId;
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "sala",
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OAuth Debug Info</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Google Client ID:</Text>
        <Text style={styles.value}>{clientId || "NÃO CONFIGURADO"}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Redirect URI:</Text>
        <Text style={styles.value}>{redirectUri}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Scheme:</Text>
        <Text style={styles.value}>sala</Text>
      </View>

      {/* SEÇÃO DE PUSH NOTIFICATIONS */}
      <Text style={[styles.title, { marginTop: 30 }]}>🔔 Push Notifications Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Status:</Text>
        <Text style={styles.value}>{registrationStatus}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Push Token:</Text>
        <Text style={styles.value}>
          {pushToken ? `${pushToken.substring(0, 40)}...` : 'Não obtido'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]}
          onPress={testPushTokenObtention}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Obtendo...' : '🔑 Obter Push Token'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={testPushRegistration}
          disabled={isLoading || !pushToken}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Registrando...' : '📡 Registrar no Backend'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.successButton]}
          onPress={testFullPushFlow}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? '⏳ Testando...' : '🚀 Teste Completo'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Constants.expoConfig?.extra:</Text>
        <Text style={styles.value}>
          {JSON.stringify(Constants.expoConfig?.extra, null, 2)}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace",
  },
  buttonContainer: {
    marginVertical: 15,
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  secondaryButton: {
    backgroundColor: "#FF9500",
  },
  successButton: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default DebugScreen;
