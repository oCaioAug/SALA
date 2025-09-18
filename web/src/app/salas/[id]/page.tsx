'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { RoomForm } from '@/components/forms/RoomForm';
import { useNavigation } from '@/lib/hooks/useNavigation';
import { Room, User, RoomWithItems, Item } from '@/lib/types';
import { Edit, Plus, Trash2, Package, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para demonstração
const mockUser: User = {
  id: '1',
  name: 'Ana Costa',
  email: 'ana.costa@universidade.edu',
  role: 'ADMIN',
  avatar: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

const RoomDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [room, setRoom] = useState<RoomWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // Hook de navegação otimizada
  const { navigate, isNavigating } = useNavigation({
    currentPage,
    onPageChange: setCurrentPage
  });

  // Carregar dados da sala
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rooms/${roomId}`);
        if (!response.ok) {
          throw new Error('Sala não encontrada');
        }
        const data = await response.json();
        setRoom(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  const handleUpdateRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar sala');
      }

      const updatedRoom = await response.json();
      setRoom(updatedRoom);
      setIsEditModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar sala');
    }
  };

  const handleAddItem = async (itemData: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...itemData,
          roomId: roomId
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao adicionar item');
      }

      const newItem = await response.json();
      setRoom(prev => prev ? {
        ...prev,
        items: [...prev.items, newItem]
      } : null);
      setIsAddItemModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir item');
      }

      setRoom(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando sala...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">Erro: {error || 'Sala não encontrada'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={navigate} isNavigating={isNavigating} />
      
      <div className="flex-1 flex flex-col">
        <Header user={mockUser} onNotificationClick={() => {}} />
        
        <main className="flex-1 p-6">
          {/* Header da sala */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{room.name}</h1>
                <div className="flex items-center gap-4">
                  <StatusBadge status={room.status} />
                  {room.capacity && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <div className="w-4 h-4 bg-slate-600 rounded-full flex items-center justify-center">
                        <span className="text-xs">👥</span>
                      </div>
                      <span>Capacidade: {room.capacity} pessoas</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/salas/${roomId}/agendamentos`)}
                  className="gap-2"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Ver Agendamentos
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Editar Sala
                </Button>
                <Button onClick={() => setIsAddItemModalOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          </div>

          {/* Descrição */}
          {room.description && (
            <Card className="mb-6">
              <CardTitle className="text-lg mb-2">Descrição</CardTitle>
              <p className="text-gray-300">{room.description}</p>
            </Card>
          )}

          {/* Itens da sala */}
          <Card variant="elevated">
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Itens da Sala</CardTitle>
                  <CardDescription>{room.items.length} itens cadastrados</CardDescription>
                </div>
              </div>
            </div>
            
            {room.items.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-600/50">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Nenhum item cadastrado</h3>
                <p className="text-slate-400 mb-6">Comece adicionando itens para esta sala</p>
                <Button
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Primeiro Item
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {room.items.map((item) => (
                  <Card key={item.id} variant="default" hover className="group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-lg">
                          {item.icon || '📦'}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors duration-300">
                            {item.name}
                          </h3>
                          <p className="text-sm text-slate-400">Qtd: {item.quantity}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-slate-400 mb-3 line-clamp-2">{item.description}</p>
                    )}
                    
                    {item.specifications.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-500">Especificações:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.specifications.slice(0, 2).map((spec, index) => (
                            <span key={index} className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                              {spec}
                            </span>
                          ))}
                          {item.specifications.length > 2 && (
                            <span className="text-xs text-slate-500">
                              +{item.specifications.length - 2} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </main>
      </div>

      {/* Modal para editar sala */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Sala"
      >
        <RoomForm
          room={room}
          onSubmit={handleUpdateRoom}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Modal para adicionar item */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Adicionar Item"
      >
        <ItemForm
          onSubmit={handleAddItem}
          onCancel={() => setIsAddItemModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

// Componente temporário para formulário de item
const ItemForm: React.FC<{
  onSubmit: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    specifications: '',
    quantity: '1',
    icon: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      description: formData.description || null,
      specifications: formData.specifications ? formData.specifications.split(',').map(s => s.trim()) : [],
      quantity: parseInt(formData.quantity),
      icon: formData.icon || null,
      roomId: null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Nome do Item
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ex: Computador"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descreva o item..."
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300 mb-2 block">
          Especificações (separadas por vírgula)
        </label>
        <input
          type="text"
          value={formData.specifications}
          onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Ex: Windows 11, 16GB RAM, Core i7"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Quantidade
          </label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            min="1"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            Ícone (emoji)
          </label>
          <input
            type="text"
            value={formData.icon}
            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="💻"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1">
          Adicionar Item
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
      </div>
    </form>
  );
};

export default RoomDetailPage;
