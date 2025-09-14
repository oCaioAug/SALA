import { useState, useEffect } from 'react';
import { User, Room, Item } from '@/lib/types';

export const useApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    const loadData = async () => {
      setIsLoading(true);
      
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados
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

      const mockItems: Item[] = [
        {
          id: '1',
          name: 'Computador de Alta Potência',
          specifications: ['Windows 11', '16GB RAM', 'Nvidia RTX 3060', 'Core i7-12700H'],
          quantity: 15,
          icon: '💻'
        },
        {
          id: '2',
          name: 'Projetor Multimídia',
          specifications: ['Epson PowerLite', '4000 Lumens', 'Full HD'],
          quantity: 1,
          icon: '📽️'
        },
        {
          id: '3',
          name: 'Ar-Condicionado',
          specifications: ['Split', '12.000 BTUs'],
          quantity: 2,
          icon: '❄️'
        }
      ];

      setUser(mockUser);
      setRooms(mockRooms);
      setItems(mockItems);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const addRoom = (room: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...room,
      id: Date.now().toString()
    };
    setRooms(prev => [...prev, newRoom]);
  };

  const updateRoom = (id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, ...updates } : room
    ));
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
  };

  const addItem = (item: Omit<Item, 'id'>) => {
    const newItem: Item = {
      ...item,
      id: Date.now().toString()
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return {
    user,
    rooms,
    items,
    isLoading,
    addRoom,
    updateRoom,
    deleteRoom,
    addItem,
    updateItem,
    deleteItem
  };
};
