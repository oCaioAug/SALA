'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { RoomForm } from '@/components/forms/RoomForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useApp } from '@/lib/hooks/useApp';
import { Room, User, RoomWithItems } from '@/lib/types';
import { Building2, Search, Plus, Filter, Grid, List } from 'lucide-react';

// Dados mockados para demonstração
const mockUser: User = {
  id: '1',
  name: 'Ana Costa',
  email: 'ana.costa@universidade.edu',
  role: 'ADMIN'
};

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [rooms, setRooms] = useState<RoomWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const {
    searchTerm,
    setSearchTerm,
    isCreateRoomModalOpen,
    setCreateRoomModalOpen,
    showSuccess,
    showError,
    showInfo
  } = useApp();

  // Carregar salas da API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/rooms');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setRooms(data);
        // Removida notificação de sucesso para evitar spam
      } catch (err) {
        console.error('Erro ao carregar salas:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao carregar salas';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []); // Removidas as dependências desnecessárias que causavam loop

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.items.some(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleNotificationClick = () => {
    console.log('Notificações clicadas');
  };

  const handleAddRoom = () => {
    setCreateRoomModalOpen(true);
  };

  const handleCreateRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sala');
      }

      const newRoom = await response.json();
      setRooms(prev => [...prev, newRoom]);
      setCreateRoomModalOpen(false);
      showSuccess(`Sala "${newRoom.name}" criada com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar sala';
      showError(errorMessage);
    }
  };

  const handleManageItems = (roomId: string) => {
    window.location.href = `/salas/${roomId}/itens`;
  };

  // Função de navegação
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    switch (page) {
      case 'dashboard':
        // Não navega se já estiver no dashboard
        if (currentPage !== 'dashboard') {
          router.push('/dashboard');
        }
        break;
      case 'itens':
        router.push('/itens');
        break;
      case 'configuracoes':
        router.push('/configuracoes');
        break;
      default:
        router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      
      <div className="flex-1 flex flex-col">
        <Header user={mockUser} onNotificationClick={handleNotificationClick} />
        
        <main className="flex-1 p-6">
          {/* Header melhorado */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Visão Geral das Salas</h1>
                <p className="text-gray-400">Gerencie e monitore todas as salas da instituição</p>
              </div>
              
              <Button onClick={handleAddRoom} className="px-6 py-3">
                <Plus className="w-5 h-5 mr-2" />
                Nova Sala
              </Button>
            </div>

            {/* Barra de busca e filtros melhorada */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por sala, item ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os Status</option>
                  <option value="LIVRE">Livre</option>
                  <option value="EM_USO">Em Uso</option>
                  <option value="RESERVADO">Reservado</option>
                </select>
                
                <div className="flex bg-gray-800 rounded-lg border border-gray-600">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-l-lg transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-r-lg transition-colors ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Estatísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Building2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{rooms.length}</p>
                    <p className="text-sm text-gray-400">Total de Salas</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <div className="w-5 h-5 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {rooms.filter(r => r.status === 'LIVRE').length}
                    </p>
                    <p className="text-sm text-gray-400">Disponíveis</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <div className="w-5 h-5 bg-red-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {rooms.filter(r => r.status === 'EM_USO').length}
                    </p>
                    <p className="text-sm text-gray-400">Em Uso</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {rooms.filter(r => r.status === 'RESERVADO').length}
                    </p>
                    <p className="text-sm text-gray-400">Reservadas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Carregando salas..." className="h-64" />
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Erro ao carregar salas</h3>
                <p className="text-gray-400 text-sm mb-6">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <EmptyState
              icon={
                <Building2 className="w-8 h-8 text-gray-400" />
              }
              title={searchTerm || statusFilter !== 'all' ? 'Nenhuma sala encontrada' : 'Nenhuma sala cadastrada'}
              description={
                searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca ou status para encontrar salas.'
                  : 'Comece criando sua primeira sala para gerenciar os espaços da instituição.'
              }
              action={
                searchTerm || statusFilter !== 'all' 
                  ? undefined
                  : { label: 'Criar Primeira Sala', onClick: handleAddRoom }
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <Card key={room.id} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <StatusBadge status={room.status} />
                      {room.reservations && room.reservations.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xs">LS</span>
                          </div>
                          <span>Reservada</span>
                        </div>
                      )}
                    </div>
                    
                    <CardTitle className="text-xl mb-2">{room.name}</CardTitle>
                    <p className="text-gray-400 text-sm mb-4">{room.description}</p>
                    
                    {room.capacity && (
                      <p className="text-gray-500 text-sm mb-4">Capacidade: {room.capacity} pessoas</p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      {room.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <span>{item.icon || '📦'}</span>
                          <span className="text-gray-300">{item.quantity} {item.name}</span>
                        </div>
                      ))}
                      {room.items.length > 2 && (
                        <p className="text-gray-500 text-sm">+{room.items.length - 2} itens</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/salas/${room.id}`} className="flex-1">
                        <Button variant="secondary" className="w-full">
                          Ver Detalhes
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleManageItems(room.id)}
                      >
                        Itens
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Card para criar nova sala */}
              <Card 
                className="border-dashed border-2 border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
                onClick={handleAddRoom}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-300">Criar Nova Sala</h3>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Modal para criar sala */}
      <Modal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setCreateRoomModalOpen(false)}
        title="Criar Nova Sala"
      >
        <RoomForm
          onSubmit={handleCreateRoom}
          onCancel={() => setCreateRoomModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;
