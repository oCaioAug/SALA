'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { RoomForm } from '@/components/forms/RoomForm';
import { Room, User } from '@/lib/types';

// Dados mockados para demonstração
const mockUser: User = {
  id: '1',
  name: 'Ana Costa',
  email: 'ana.costa@universidade.edu',
  role: 'admin'
};

const mockRooms: Room[] = [
  {
    id: '1',
    name: 'Laboratório de Robótica',
    description: 'Sala equipada para projetos de alta performance.',
    status: 'em-uso',
    items: [
      { id: '1', name: 'Computador', specifications: ['Windows 11', '16GB RAM', 'Nvidia RTX 3060', 'Core i7-12700H'], quantity: 15, icon: '💻' },
      { id: '2', name: 'Projetor', specifications: ['Epson PowerLite', '4000 Lumens', 'Full HD'], quantity: 1, icon: '📽️' }
    ]
  },
  {
    id: '2',
    name: 'Sala de Reuniões',
    description: 'Ambiente para reuniões e planejamentos.',
    status: 'reservado',
    items: [
      { id: '3', name: 'Projetor', specifications: ['Epson PowerLite', '4000 Lumens', 'Full HD'], quantity: 1, icon: '📽️' },
      { id: '4', name: 'Smart TV', specifications: ['75"', '4K', 'Android TV'], quantity: 1, icon: '📺' }
    ],
    reservation: {
      id: '1',
      userId: '2',
      userName: 'Larissa Silva',
      startTime: '19:00',
      endTime: '21:00',
      purpose: 'Reunião de planejamento'
    }
  },
  {
    id: '3',
    name: 'Estúdio de Design',
    description: 'Ambiente criativo com equipamentos específicos.',
    status: 'livre',
    items: [
      { id: '5', name: 'Computador', specifications: ['Windows 11', '8GB RAM', 'GTX 1660', 'Core i5-10400'], quantity: 10, icon: '💻' },
      { id: '6', name: 'Mesa Digitalizadora', specifications: ['Wacom Intuos', 'Área ativa 8.5"', 'Pen 2048 níveis'], quantity: 10, icon: '🎨' }
    ]
  }
];

const DashboardPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [rooms, setRooms] = useState<Room[]>(mockRooms);

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.items.some(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleNotificationClick = () => {
    console.log('Notificações clicadas');
  };

  const handleAddRoom = () => {
    setIsCreateRoomModalOpen(true);
  };

  const handleCreateRoom = (roomData: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...roomData,
      id: Date.now().toString()
    };
    setRooms(prev => [...prev, newRoom]);
    setIsCreateRoomModalOpen(false);
  };

  const handleManageItems = (roomId: string) => {
    console.log('Gerenciar itens da sala:', roomId);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <div className="flex-1 flex flex-col">
        <Header user={mockUser} onNotificationClick={handleNotificationClick} />
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Visão Geral das Salas</h2>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por sala ou item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 px-4 py-2 pl-10 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <Button onClick={handleAddRoom}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                + Adicionar Nova Sala
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <StatusBadge status={room.status} />
                    {room.reservation && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs">LS</span>
                        </div>
                        <span>Para {room.reservation.userName} às {room.reservation.startTime}</span>
                      </div>
                    )}
                  </div>
                  
                  <CardTitle className="text-xl mb-2">{room.name}</CardTitle>
                  <p className="text-gray-400 text-sm mb-4">{room.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {room.items.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <span>{item.icon}</span>
                        <span className="text-gray-300">{item.quantity} {item.name}</span>
                      </div>
                    ))}
                    {room.items.length > 2 && (
                      <p className="text-gray-500 text-sm">+{room.items.length - 2} itens</p>
                    )}
                  </div>
                  
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleManageItems(room.id)}
                  >
                    Gerenciar Itens
                  </Button>
                </CardContent>
              </Card>
            ))}
            
            {/* Card para criar nova sala */}
            <Card 
              className="border-dashed border-2 border-gray-600 hover:border-gray-500 cursor-pointer transition-colors"
              onClick={handleCreateRoom}
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
        </main>
      </div>

      {/* Modal para criar sala */}
      <Modal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        title="Criar Nova Sala"
      >
        <RoomForm
          onSubmit={handleCreateRoom}
          onCancel={() => setIsCreateRoomModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default DashboardPage;
