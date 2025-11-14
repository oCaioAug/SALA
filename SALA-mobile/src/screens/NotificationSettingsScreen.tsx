import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { NotificationPreferencesService } from '../services/NotificationPreferencesService';
import { NotificationPreferences } from '../types/notifications';
import { ProfileService } from '../services/ProfileService';
import LoadingSpinner from '../components/LoadingSpinner';

const REMINDER_OPTIONS = [
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
];

const QUIET_HOURS_OPTIONS = [
  { start: '22:00', end: '07:00', label: 'Noite (22:00 - 07:00)' },
  { start: '23:00', end: '08:00', label: 'Noite tardía (23:00 - 08:00)' },
  { start: '21:00', end: '06:00', label: 'Noite cedo (21:00 - 06:00)' },
];

export const NotificationSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  
  const currentToken = ProfileService.getCurrentToken();
  const preferencesService = new NotificationPreferencesService(currentToken!);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const prefs = await preferencesService.getPreferences(user.id);
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      Alert.alert('Erro', 'Não foi possível carregar as configurações de notificação');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      if (user?.id && preferences) {
        const updatedPrefs = await preferencesService.updatePreferences(user.id, updates);
        setPreferences(updatedPrefs);
      }
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      Alert.alert('Erro', 'Não foi possível salvar as configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const handleReminderChange = (minutes: number) => {
    updatePreferences({ reminderMinutes: minutes });
  };

  const handleQuietHoursChange = (start: string, end: string) => {
    updatePreferences({ 
      quietHoursStart: start, 
      quietHoursEnd: end,
      quietHoursEnabled: true 
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Carregando configurações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Erro ao carregar configurações</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPreferences}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="notifications-outline" size={32} color="#3B82F6" />
          <Text style={styles.headerTitle}>Configurações de Notificação</Text>
          <Text style={styles.headerSubtitle}>
            Personalize como você recebe notificações
          </Text>
        </View>

        {/* Notificações Gerais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações Push</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait-outline" size={24} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Notificações Push</Text>
                <Text style={styles.settingDescription}>
                  Receber notificações no dispositivo
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.pushEnabled}
              onValueChange={(value) => handleToggle('pushEnabled', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Mudanças de Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status das Reservas</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="refresh-outline" size={24} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Mudanças de Status</Text>
                <Text style={styles.settingDescription}>
                  Notificar quando status das reservas mudarem
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.statusChanges}
              onValueChange={(value) => handleToggle('statusChanges', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Lembretes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lembretes</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="time-outline" size={24} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Lembretes de Reserva</Text>
                <Text style={styles.settingDescription}>
                  Lembrar sobre reservas próximas
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.reminderEnabled}
              onValueChange={(value) => handleToggle('reminderEnabled', value)}
              disabled={saving}
            />
          </View>

          {preferences.reminderEnabled && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Tempo de Antecedência</Text>
              {REMINDER_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    preferences.reminderMinutes === option.value && styles.optionItemSelected
                  ]}
                  onPress={() => handleReminderChange(option.value)}
                  disabled={saving}
                >
                  <Text style={[
                    styles.optionText,
                    preferences.reminderMinutes === option.value && styles.optionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                  {preferences.reminderMinutes === option.value && (
                    <Ionicons name="checkmark" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Som e Vibração */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Som e Vibração</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-high-outline" size={24} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Som</Text>
                <Text style={styles.settingDescription}>
                  Tocar som nas notificações
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.soundEnabled}
              onValueChange={(value) => handleToggle('soundEnabled', value)}
              disabled={saving}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="phone-portrait-outline" size={24} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Vibração</Text>
                <Text style={styles.settingDescription}>
                  Vibrar o dispositivo nas notificações
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.vibrationEnabled}
              onValueChange={(value) => handleToggle('vibrationEnabled', value)}
              disabled={saving}
            />
          </View>
        </View>

        {/* Horário Silencioso */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário Silencioso</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="moon-outline" size={24} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Modo Silencioso</Text>
                <Text style={styles.settingDescription}>
                  Silenciar notificações em horários específicos
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.quietHoursEnabled}
              onValueChange={(value) => handleToggle('quietHoursEnabled', value)}
              disabled={saving}
            />
          </View>

          {preferences.quietHoursEnabled && (
            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Período Silencioso</Text>
              {QUIET_HOURS_OPTIONS.map((option, index) => {
                const isSelected = preferences.quietHoursStart === option.start && 
                                 preferences.quietHoursEnd === option.end;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      isSelected && styles.optionItemSelected
                    ]}
                    onPress={() => handleQuietHoursChange(option.start, option.end)}
                    disabled={saving}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Loading overlay */}
      {saving && (
        <View style={styles.savingOverlay}>
          <View style={styles.savingContainer}>
            <LoadingSpinner size="small" />
            <Text style={styles.savingText}>Salvando...</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  subSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
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
  savingText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});