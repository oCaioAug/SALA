'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Calendar } from '@/components/ui/Calendar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReservationForm } from '@/components/forms/ReservationForm';
import { useNavigation } from '@/lib/hooks/useNavigation';
import { useApp } from '@/lib/hooks/useApp';
import { ReservationWithUser, Room, User } from '@/lib/types';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  User as UserIcon,
  Building2,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';



const AgendamentosPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('agendamentos');
  const [reservations, setReservations] = useState<ReservationWithUser[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedReservation, setSelectedReservation] = useState<ReservationWithUser | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createReservationLoading, setCreateReservationLoading] = useState(false);

  const { showSuccess, showError } = useApp();

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage
  });

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [reservationsResponse, roomsResponse, usersResponse] = await Promise.all([
          fetch('/api/reservations'),
          fetch('/api/rooms'),
          fetch('/api/users').catch(() => null) // API de usuários pode não existir ainda
        ]);

        if (!reservationsResponse.ok || !roomsResponse.ok) {
          throw new Error('Erro ao carregar dados');
        }

        const [reservationsData, roomsData, usersData] = await Promise.all([
          reservationsResponse.json(),
          roomsResponse.json(),
          usersResponse?.ok ? usersResponse.json() : Promise.resolve([])
        ]);

        setReservations(reservationsData);
        setRooms(roomsData);
        setUsers(usersData || []);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredReservations = reservations.filter(reservation => {
    const roomName = rooms.find(r => r.id === reservation.roomId)?.name || '';
    const matchesSearch = 
      (reservation.user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (reservation.purpose || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getReservationsForDate = (date: Date): ReservationWithUser[] => {
    return reservations.filter(reservation => {
      const startDate = new Date(reservation.startTime);
      const endDate = new Date(reservation.endTime);
      const checkDate = new Date(date);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  const handleReservationClick = (reservation: ReservationWithUser) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayReservations = getReservationsForDate(date);
    if (dayReservations.length > 0) {
      setSelectedReservation(dayReservations[0]);
      setIsDetailsModalOpen(true);
    } else {
      // Se não há reservas no dia, abrir modal de criação
      setIsCreateModalOpen(true);
    }
  };

  const handleCreateReservation = () => {
    setIsCreateModalOpen(true);
  };

  const handleSubmitReservation = async (reservationData: {
    userId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    purpose?: string;
  }) => {
    try {
      setCreateReservationLoading(true);
      
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar reserva');
      }

      const newReservation = await response.json();
      
      // Atualizar lista de reservas
      setReservations(prev => [newReservation, ...prev]);
      
      // Fechar modal
      setIsCreateModalOpen(false);
      
      // Mostrar sucesso
      showSuccess('Reserva criada com sucesso!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar reserva';
      showError(errorMessage);
    } finally {
      setCreateReservationLoading(false);
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar reserva');
      }

      setReservations(prev => prev.filter(r => r.id !== reservationId));
      showSuccess('Reserva cancelada com sucesso!');
      setIsDetailsModalOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar reserva';
      showError(errorMessage);
    }
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'APPROVED': return 'text-green-400 bg-green-500/10';
      case 'ACTIVE': return 'text-blue-400 bg-blue-500/10';
      case 'CANCELLED': return 'text-red-400 bg-red-500/10';
      case 'COMPLETED': return 'text-gray-400 bg-gray-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'APPROVED': return 'Aprovada';
      case 'ACTIVE': return 'Ativa';
      case 'CANCELLED': return 'Cancelada';
      case 'COMPLETED': return 'Concluída';
      default: return 'Desconhecido';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Erro ao carregar agendamentos</h3>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={navigate} isNavigating={isNavigating} />
      
      <div className="flex-1 flex flex-col">
        <Header onNotificationClick={() => {}} />
        
        <main className="flex-1 p-6">
          {/* Header da página */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                  <CalendarIcon className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Agendamentos</h1>
                  <p className="text-gray-400">Visualize e gerencie todos os agendamentos das salas</p>
                </div>
              </div>
              
              <Button onClick={handleCreateReservation} className="px-6 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Nova Reserva
              </Button>
            </div>

            {/* Filtros e busca */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por usuário, sala ou propósito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Status</option>
                <option value="APPROVED">Aprovadas</option>
                <option value="ACTIVE">Ativas</option>
                <option value="CANCELLED">Canceladas</option>
                <option value="COMPLETED">Concluídas</option>
              </select>
            </div>
          </div>

          {/* Calendário */}
          <div className="mb-8">
            <Calendar
              reservations={reservations}
              rooms={rooms}
              onReservationClick={handleReservationClick}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          {/* Lista de reservas do dia selecionado */}
          <Card variant="elevated">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div>
                  <CardTitle className="text-xl">
                    Reservas de {selectedDate.toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: '2-digit', 
                      month: 'long' 
                    })}
                  </CardTitle>
                  <p className="text-gray-400 text-sm">
                    {getReservationsForDate(selectedDate).length} reserva(s) encontrada(s)
                  </p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              {getReservationsForDate(selectedDate).length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="w-8 h-8 text-gray-400" />}
                  title="Nenhuma reserva neste dia"
                  description="Não há agendamentos para a data selecionada."
                />
              ) : (
                <div className="space-y-4">
                  {getReservationsForDate(selectedDate).map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer"
                      onClick={() => handleReservationClick(reservation)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{rooms.find(r => r.id === reservation.roomId)?.name || 'Sala desconhecida'}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                {reservation.user.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDateTime(new Date(reservation.startTime))} - {formatDateTime(new Date(reservation.endTime))}
                              </div>
                            </div>
                            {reservation.purpose && (
                              <p className="text-sm text-gray-300 mt-1">{reservation.purpose}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                            {getStatusText(reservation.status)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReservationClick(reservation);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Modal de detalhes da reserva */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes da Reserva"
      >
        {selectedReservation && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Sala</label>
                <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="text-white">{rooms.find(r => r.id === selectedReservation.roomId)?.name || 'Sala desconhecida'}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Usuário</label>
                <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                  <UserIcon className="w-4 h-4 text-green-400" />
                  <span className="text-white">{selectedReservation.user.name}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Início</label>
                <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-white">{formatDateTime(new Date(selectedReservation.startTime))}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Fim</label>
                <div className="flex items-center gap-2 p-3 bg-slate-800 rounded-lg">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span className="text-white">{formatDateTime(new Date(selectedReservation.endTime))}</span>
                </div>
              </div>
            </div>

            {selectedReservation.purpose && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Propósito</label>
                <p className="p-3 bg-slate-800 rounded-lg text-white">{selectedReservation.purpose}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReservation.status)}`}>
                {getStatusText(selectedReservation.status)}
              </span>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              {(selectedReservation.status === 'ACTIVE' || selectedReservation.status === 'APPROVED') && (
                <Button
                  variant="outline"
                  onClick={() => handleDeleteReservation(selectedReservation.id)}
                  className="flex-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Cancelar Reserva
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para criar reserva */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Reserva"
        size="lg"
      >
        <ReservationForm
          rooms={rooms}
          users={users}
          selectedDate={selectedDate}
          onSubmit={handleSubmitReservation}
          onCancel={() => setIsCreateModalOpen(false)}
          loading={createReservationLoading}
        />
      </Modal>
    </div>
  );
};

export default AgendamentosPage;
