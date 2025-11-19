import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { NotificationManager } from '../services/NotificationManager';
import { NativeNotificationService } from '../services/NativeNotificationService';
import { NotificationType, CreateNotificationRequest } from '../types/notifications';
import { ReservationStatusEnum } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

export const NotificationDebugScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<string>('Não testado');
  
  const notificationManager = NotificationManager.getInstance();
  const nativeService = NativeNotificationService.getInstance();

  const testNotifications = [
    {
      id: 'test-approved',
      type: NotificationType.RESERVATION_APPROVED,
      title: '✅ Reserva Aprovada!',
      body: 'Sua reserva para a Sala de Reuniões foi aprovada para hoje às 14:00',
      icon: 'checkmark-circle',
      color: '#10B981',
    },
    {
      id: 'test-rejected',
      type: NotificationType.RESERVATION_REJECTED,
      title: '❌ Reserva Rejeitada',
      body: 'Sua reserva para o Auditório foi rejeitada. Motivo: Conflito de horário',
      icon: 'close-circle',
      color: '#EF4444',
    },
    {
      id: 'test-cancelled',
      type: NotificationType.RESERVATION_CANCELLED,
      title: '🚫 Reserva Cancelada',
      body: 'Sua reserva para a Sala de Treinamento foi cancelada pelo administrador',
      icon: 'ban',
      color: '#F59E0B',
    },
    {
      id: 'test-reminder',
      type: NotificationType.RESERVATION_REMINDER,
      title: '⏰ Lembrete de Reserva',
      body: 'Sua reserva na Sala de Reuniões começará em 15 minutos!',
      icon: 'time',
      color: '#3B82F6',
    },
    {
      id: 'test-expiring',
      type: NotificationType.RESERVATION_EXPIRING,
      title: '⚠️ Reserva Expirando',
      body: 'Sua reserva no Laboratório expirará em 5 minutos',
      icon: 'warning',
      color: '#F59E0B',
    },
    {
      id: 'test-system',
      type: NotificationType.SYSTEM_UPDATE,
      title: '📢 Atualização do Sistema',
      body: 'Nova versão do aplicativo disponível com melhorias de desempenho',
      icon: 'information-circle',
      color: '#6B7280',
    },
  ];

  // Função simples para testar push token
  const testPushToken = async () => {
    try {
      console.log('🔴🔴🔴 TESTE PUSH TOKEN INICIADO 🔴🔴🔴');
      setLoading(true);
      setTokenStatus('🔄 Obtendo...');
      
      const token = await nativeService.getExpoPushToken();
      console.log('📱 Token recebido:', token ? 'SIM' : 'NÃO');
      
      if (token) {
        setPushToken(token);
        setTokenStatus('✅ Token obtido!');
        Alert.alert('Sucesso!', `Token: ${token.substring(0, 30)}...`);
        console.log('✅ SUCESSO!');
      } else {
        setTokenStatus('❌ Falha ao obter');
        Alert.alert('Erro', 'Não foi possível obter o token');
        console.log('❌ FALHA!');
      }
    } catch (error) {
      console.error('🔴 ERRO:', error);
      setTokenStatus('❌ Erro');
      Alert.alert('Erro', String(error));
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (testNotification: any) => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    try {
      setLoading(true);

      // Criar notificação de teste
      const notificationData = {
        id: `${testNotification.id}-${Date.now()}`,
        userId: user.id,
        type: testNotification.type,
        title: testNotification.title,
        body: testNotification.body,
        data: {
          testId: testNotification.id,
          timestamp: new Date().toISOString(),
        },
        read: false,
        createdAt: new Date().toISOString(),
      };

      // Enviar notificação nativa
      await nativeService.schedulePushNotification(notificationData);
      
      console.log('🔔 Notificação de teste enviada:', testNotification.title);
      
      Alert.alert(
        'Notificação Enviada!', 
        `"${testNotification.title}" foi enviada com sucesso`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Erro ao enviar notificação de teste:', error);
      Alert.alert('Erro', 'Falha ao enviar notificação de teste');
    } finally {
      setLoading(false);
    }
  };

  const sendTimedNotification = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const futureTime = new Date(Date.now() + 10 * 1000); // 10 segundos no futuro
      
      const notificationData = {
        id: `timed-test-${Date.now()}`,
        userId: user.id,
        type: NotificationType.RESERVATION_REMINDER,
        title: '⏰ Teste de Lembrete',
        body: `Esta notificação foi agendada para ${futureTime.toLocaleTimeString()}`,
        data: {
          scheduledFor: futureTime.toISOString(),
        },
        read: false,
        createdAt: new Date().toISOString(),
      };

      await nativeService.scheduleTimedNotification(notificationData, futureTime);
      
      Alert.alert(
        'Lembrete Agendado!', 
        `Notificação será exibida em 10 segundos (${futureTime.toLocaleTimeString()})`
      );
    } catch (error) {
      console.error('❌ Erro ao agendar lembrete:', error);
      Alert.alert('Erro', 'Falha ao agendar lembrete');
    } finally {
      setLoading(false);
    }
  };

  const testVibration = async () => {
    try {
      await nativeService.vibrateDevice();
      Alert.alert('Vibração', 'Teste de vibração executado!');
    } catch (error) {
      Alert.alert('Erro', 'Falha no teste de vibração');
    }
  };

  const checkPermissions = async () => {
    try {
      const hasPermissions = await nativeService.areNotificationsEnabled();
      Alert.alert(
        'Permissões de Notificação', 
        hasPermissions ? 'Permissões concedidas ✅' : 'Permissões negadas ❌'
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao verificar permissões');
    }
  };

  const clearBadge = async () => {
    try {
      await nativeService.clearBadgeCount();
      Alert.alert('Badge', 'Contador de badge limpo!');
    } catch (error) {
      Alert.alert('Erro', 'Falha ao limpar badge');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="bug-outline" size={32} color="#EF4444" />
          <Text style={styles.headerTitle}>Debug de Notificações</Text>
          <Text style={styles.headerSubtitle}>
            Teste todas as funcionalidades de notificação
          </Text>
        </View>

        {/* Controles Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controles Gerais</Text>
          
          <TouchableOpacity style={styles.controlButton} onPress={checkPermissions}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#3B82F6" />
            <Text style={styles.controlButtonText}>Verificar Permissões</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={testVibration}>
            <Ionicons name="phone-portrait-outline" size={24} color="#8B5CF6" />
            <Text style={styles.controlButtonText}>Testar Vibração</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={clearBadge}>
            <Ionicons name="notifications-off-outline" size={24} color="#6B7280" />
            <Text style={styles.controlButtonText}>Limpar Badge</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.timedButton} onPress={sendTimedNotification}>
            <Ionicons name="timer-outline" size={24} color="#F59E0B" />
            <Text style={styles.timedButtonText}>Agendar Notificação (10s)</Text>
          </TouchableOpacity>
        </View>

        {/* Teste Push Token */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Teste Push Token</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status: </Text>
            <Text style={styles.statusValue}>{tokenStatus}</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Token: </Text>
            <Text style={styles.statusValue}>
              {pushToken ? `${pushToken.substring(0, 40)}...` : 'Não obtido'}
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: '#3B82F6' }]} 
            onPress={testPushToken}
            disabled={loading}
          >
            <Ionicons name="key-outline" size={24} color="#FFFFFF" />
            <Text style={[styles.controlButtonText, { color: '#FFFFFF' }]}>
              {loading ? '⏳ Obtendo...' : '🔑 Testar Push Token'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notificações de Teste */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações de Teste</Text>
          
          {testNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationButton, { borderLeftColor: notification.color }]}
              onPress={() => sendTestNotification(notification)}
              disabled={loading}
            >
              <View style={styles.notificationContent}>
                <Ionicons 
                  name={notification.icon as any} 
                  size={24} 
                  color={notification.color} 
                />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationBody}>{notification.body}</Text>
                </View>
              </View>
              <Ionicons name="send-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="small" />
            <Text style={styles.loadingText}>Enviando...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerTitle: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  controlButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  timedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  timedButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  notificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 4,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 60,
  },
  statusValue: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
});