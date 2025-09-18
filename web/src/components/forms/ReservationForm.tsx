'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Room, User } from '@/lib/types';
import { Calendar, Clock, User as UserIcon, Building2, AlertCircle } from 'lucide-react';

interface ReservationFormProps {
  rooms?: Room[];
  users?: User[];
  selectedDate?: Date;
  selectedRoomId?: string;
  onSubmit: (reservation: {
    userId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ReservationForm: React.FC<ReservationFormProps> = ({
  rooms = [],
  users = [],
  selectedDate,
  selectedRoomId,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState({
    userId: '',
    roomId: selectedRoomId || '',
    startTime: '',
    endTime: '',
    purpose: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preencher horários baseado na data selecionada
  useEffect(() => {
    if (selectedDate) {
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();
      
      if (isToday) {
        // Se for hoje, sugerir horário atual + 1 hora
        const now = new Date();
        const startTime = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
        const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 horas
        
        setFormData(prev => ({
          ...prev,
          startTime: startTime.toISOString().slice(0, 16),
          endTime: endTime.toISOString().slice(0, 16)
        }));
      } else {
        // Se for outro dia, sugerir horário padrão
        const dateStr = selectedDate.toISOString().slice(0, 10);
        setFormData(prev => ({
          ...prev,
          startTime: `${dateStr}T09:00`,
          endTime: `${dateStr}T11:00`
        }));
      }
    }
  }, [selectedDate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Usuário é obrigatório';
    }

    if (!formData.roomId) {
      newErrors.roomId = 'Sala é obrigatória';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de fim é obrigatório';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);

      if (start >= end) {
        newErrors.endTime = 'Horário de fim deve ser posterior ao início';
      }

      if (start < new Date()) {
        newErrors.startTime = 'Horário de início não pode ser no passado';
      }

      // Verificar se a duração não é muito longa (máximo 30 dias)
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (duration > 30) {
        newErrors.endTime = 'Reserva não pode exceder 30 dias';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        userId: formData.userId,
        roomId: formData.roomId,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        purpose: formData.purpose || undefined
      });
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpar erro quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Calcular duração da reserva
  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      
      if (diffDays > 1) {
        return `${diffDays} dias`;
      } else {
        return `${diffHours} horas`;
      }
    }
    return '';
  };

  const getAvailableRooms = () => {
    return rooms.filter(room => room.status === 'LIVRE' || room.status === 'RESERVADO');
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data selecionada */}
      {selectedDate && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">
              Agendando para: {formatSelectedDate()}
            </span>
          </div>
        </div>
      )}

      {/* Usuário */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Usuário *
        </label>
        <div className="relative">
          <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.userId ? 'border-red-500' : 'border-gray-600'
            }`}
            required
          >
            <option value="">Selecione um usuário</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        {errors.userId && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.userId}
          </p>
        )}
      </div>

      {/* Sala */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Sala *
        </label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            name="roomId"
            value={formData.roomId}
            onChange={handleInputChange}
            className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.roomId ? 'border-red-500' : 'border-gray-600'
            }`}
            required
          >
            <option value="">Selecione uma sala</option>
            {getAvailableRooms().map(room => (
              <option key={room.id} value={room.id}>
                {room.name} {room.capacity && `(${room.capacity} pessoas)`}
              </option>
            ))}
          </select>
        </div>
        {errors.roomId && (
          <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.roomId}
          </p>
        )}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Início *
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.startTime ? 'border-red-500' : 'border-gray-600'
              }`}
              required
            />
          </div>
          {errors.startTime && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.startTime}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Fim *
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.endTime ? 'border-red-500' : 'border-gray-600'
              }`}
              required
            />
          </div>
          {errors.endTime && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.endTime}
            </p>
          )}
        </div>
      </div>

      {/* Indicador de duração */}
      {formData.startTime && formData.endTime && calculateDuration() && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-blue-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Duração da reserva: {calculateDuration()}
            </span>
          </div>
        </div>
      )}

      {/* Propósito */}
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Propósito da Reserva
        </label>
        <textarea
          name="purpose"
          value={formData.purpose}
          onChange={handleInputChange}
          placeholder="Descreva o propósito da reserva (opcional)"
          className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>

      {/* Informações adicionais */}
      <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Informações Importantes:</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Reservas podem ser feitas com até 1 hora de antecedência</li>
          <li>• Duração máxima de 30 dias por reserva</li>
          <li>• Múltiplas salas podem ser reservadas no mesmo dia</li>
          <li>• A sala será automaticamente marcada como "Reservada"</li>
          <li>• Você receberá confirmação por email</li>
        </ul>
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting || loading}
        >
          {isSubmitting ? 'Criando Reserva...' : 'Criar Reserva'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export { ReservationForm };
