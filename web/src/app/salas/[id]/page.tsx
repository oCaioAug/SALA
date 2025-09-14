'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { RoomForm } from '@/components/forms/RoomForm';
import { Room, User, RoomWithItems, Item } from '@/lib/types';

// Dados mockados para demonstração
const mockUser: User = {
  id: '1',
  name: 'Ana Costa',
  email: 'ana.costa@universidade.edu',
  role: 'ADMIN'
};

const RoomDetailPage: React.FC = () => {
  const params = useParams();
  const roomId = params.id as string;
  
  const [currentPage, setCurrentPage] = useState('salas');
  const [room, setRoom] = useState<RoomWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando sala...</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">Erro: {error || 'Sala não encontrada'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <div className="flex-1 flex flex-col">
        <Header user={mockUser} onNotificationClick={() => {}} />
        
        <main className="flex-1 p-6">
          {/* Header da sala */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{room.name}</h1>
              <div className="flex items-center gap-4">
                <StatusBadge status={room.status} />
                {room.capacity && (
                  <span className="text-gray-400">Capacidade: {room.capacity} pessoas</span>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
              >
                Editar Sala
              </Button>
              <Button onClick={() => setIsAddItemModalOpen(true)}>
                + Adicionar Item
              </Button>
            </div>
          </div>

          {/* Descrição */}
          {room.description && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <CardTitle className="text-lg mb-2">Descrição</CardTitle>
                <p className="text-gray-300">{room.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Itens da sala */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-lg">Itens da Sala</CardTitle>
                <span className="text-gray-400">{room.items.length} itens</span>
              </div>
              
              {room.items.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>Nenhum item cadastrado nesta sala</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsAddItemModalOpen(true)}
                  >
                    Adicionar Primeiro Item
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {room.items.map((item) => (
                    <div key={item.id} className="bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.icon || '📦'}</span>
                          <h3 className="font-medium text-white">{item.name}</h3>
                        </div>
                        <span className="text-sm text-gray-400">x{item.quantity}</span>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                      )}
                      
                      {item.specifications.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 font-medium">Especificações:</p>
                          <ul className="text-xs text-gray-400 space-y-1">
                            {item.specifications.map((spec, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                                {spec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
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
      icon: formData.icon || null
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
