'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Item } from '@/lib/types';

// Dados mockados
const mockUser: User = {
  id: '1',
  name: 'Ana Costa',
  email: 'ana.costa@universidade.edu',
  role: 'admin'
};

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

const ItemsPage: React.FC = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('itens');
  const [searchTerm, setSearchTerm] = useState('');

  const handleNotificationClick = () => {
    console.log('Notificações clicadas');
  };

  const handleAddExistingItem = () => {
    console.log('Adicionar item existente');
  };

  const handleCreateNewItem = () => {
    console.log('Criar novo tipo de item');
  };

  const handleEditItem = (itemId: string) => {
    console.log('Editar item:', itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    console.log('Excluir item:', itemId);
  };

  const filteredItems = mockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.specifications.some(spec => 
      spec.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      
      <div className="flex-1 flex flex-col">
        <Header user={mockUser} onNotificationClick={handleNotificationClick} />
        
        <main className="flex-1 p-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar para Visão Geral
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Laboratório de Robótica</h1>
            
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={handleAddExistingItem}>
                Adicionar Item Existente
              </Button>
              <Button onClick={handleCreateNewItem}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                + Criar Novo Tipo de Item
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">ITEM</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">ESPECIFICAÇÕES</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">QUANTIDADE</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-white font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.specifications.map((spec, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">{item.quantity}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditItem(item.id)}
                              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ItemsPage;
